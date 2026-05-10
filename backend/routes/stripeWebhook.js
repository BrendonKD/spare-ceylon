const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Order = require('../models/Order');
const User = require('../models/User');
const VendorListing = require('../models/VendorListing');
const PendingCheckout = require('../models/PendingCheckout');

const SubscriptionPlan = require('../models/SubscriptionPlan');
const { sendSubscriptionActivatedEmail } = require('../utils/subscriptionMail');
const VendorSubscription = require('../models/VendorSubscription');
const PendingSubscriptionCheckout = require('../models/PendingSubscriptionCheckout');
const PendingAdvertisementCheckout = require('../models/PendingAdvertisementCheckout');

const { sendCardPaymentSuccessEmail } = require('../utils/cardPaymentMail');

const Advertisement = require('../models/Advertisement');

const SHIPPING_PER_VENDOR = 900;

const addDuration = (startDate, billingCycle) => {
    const date = new Date(startDate);
    if (billingCycle === 'yearly') {
        date.setFullYear(date.getFullYear() + 1);
    } else {
        date.setMonth(date.getMonth() + 1);
    }
    return date;
};

const normalizePath = (p) => (p ? p.replace(/\\/g, '/') : null);

const getListingId = (item) => {
    return (
        item?.vendor_listing_id ||
        item?._id ||
        item?.listingId ||
        item?.id ||
        null
    );
};

const getVendorId = (item) => {
    return (
        item?.vendorId ||
        item?.vendor_id ||
        item?.vendor?._id ||
        item?.vendor?.userId ||
        null
    );
};

const groupCartItemsByVendor = (cartItems) => {
    const groups = {};

    cartItems.forEach((item) => {
        const vendorId = getVendorId(item);
        const listingId = getListingId(item);

        if (!vendorId) {
            throw new Error(`Vendor not found for item ${listingId || 'unknown'}`);
        }

        if (!listingId) {
            throw new Error('Listing ID not found in cart item');
        }

        const key = vendorId.toString();

        if (!groups[key]) {
            groups[key] = [];
        }

        groups[key].push(item);
    });

    return groups;
};

//order checkout
async function handleOrderCheckoutCompleted(session) {
    const checkoutType = session.metadata?.checkout_type || 'single';
    
    // Extract shared data for the email
    const customerEmail = session.customer_details?.email;
    const totalAmount = session.amount_total / 100; // Stripe amounts are in cents
    const currency = session.currency;

    if (checkoutType === 'cart') {
        const checkoutRef = session.metadata?.checkout_ref;
        if (!checkoutRef) throw new Error('Missing checkout_ref');

        const pendingCheckout = await PendingCheckout.findOne({
            checkout_ref: checkoutRef,
        });

        if (!pendingCheckout || pendingCheckout.status === 'completed') return;

        const existingOrders = await Order.find({ stripe_session_id: session.id });
        if (existingOrders.length > 0) {
            pendingCheckout.status = 'completed';
            await pendingCheckout.save();
            return;
        }

        pendingCheckout.status = 'processing';
        await pendingCheckout.save();

        try {
            const { customer_id, shipping_address, cartItems } = pendingCheckout;
            const grouped = groupCartItemsByVendor(cartItems);
            const vendorCount = Object.keys(grouped).length;

            for (const vendorId of Object.keys(grouped)) {
                const vendorItems = grouped[vendorId];

                // Validate stock first
                for (const item of vendorItems) {
                    const listing = await VendorListing.findById(getListingId(item));
                    if (!listing || listing.quantity_available < item.qty) {
                        throw new Error(`Insufficient stock for ${listing?.title || 'item'}`);
                    }
                }

                // Create orders
                for (let i = 0; i < vendorItems.length; i++) {
                    const item = vendorItems[i];
                    const listing = await VendorListing.findById(getListingId(item));

                    const subtotal = listing.price * item.qty;
                    const shipping_fee = i === 0 ? SHIPPING_PER_VENDOR : 0;
                    
                    const order = new Order({
                        customer_id,
                        vendor_listing_id: listing._id,
                        quantity: item.qty,
                        shipping_address,
                        payment_method: 'card',
                        subtotal,
                        shipping_fee,
                        total: subtotal + shipping_fee,
                        status: 'pending',
                        stripe_session_id: session.id,
                        stripe_payment_intent_id: session.payment_intent || null,
                    });

                    await order.save();
                    listing.quantity_available -= item.qty;
                    await listing.save();
                }
            }

            pendingCheckout.status = 'completed';
            await pendingCheckout.save();

            // --- TRIGGER EMAIL FOR CART ---
            if (customerEmail) {
                await sendCardPaymentSuccessEmail({
                    to: customerEmail,
                    amount: totalAmount,
                    currency: currency,
                    orderCount: vendorCount
                }).catch(err => console.error("Cart Email Error:", err));
            }

            return;
        } catch (err) {
            pendingCheckout.status = 'failed';
            await pendingCheckout.save();
            throw err;
        }
    }

    if (checkoutType === 'single') {
        const existingOrder = await Order.findOne({ stripe_session_id: session.id });
        if (existingOrder) return;

        const { vendor_listing_id, quantity, customer_id } = session.metadata;
        const shipping_address = JSON.parse(session.metadata.shipping_address);

        const listing = await VendorListing.findById(vendor_listing_id);
        if (!listing || listing.quantity_available < parseInt(quantity)) {
            throw new Error('Insufficient stock or listing not found');
        }

        const subtotal = listing.price * parseInt(quantity);
        const order = new Order({
            customer_id,
            vendor_listing_id,
            quantity: parseInt(quantity),
            shipping_address,
            payment_method: 'card',
            subtotal,
            shipping_fee: SHIPPING_PER_VENDOR,
            total: subtotal + SHIPPING_PER_VENDOR,
            status: 'pending',
            stripe_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent || null,
        });

        await order.save();
        listing.quantity_available -= parseInt(quantity);
        await listing.save();

        // --- TRIGGER EMAIL FOR SINGLE ITEM ---
        if (customerEmail) {
            await sendCardPaymentSuccessEmail({
                to: customerEmail,
                amount: totalAmount,
                currency: currency,
                orderCount: 1
            }).catch(err => console.error("Single Order Email Error:", err));
        }
    }
}

//subscription checkout
async function handleSubscriptionCheckoutCompleted(session) {
    if (session.metadata?.checkout_type !== 'vendor_subscription_payment') return;

    const checkoutRef = session.metadata?.checkout_ref;
    if (!checkoutRef) throw new Error('Missing checkout_ref');

    const pendingCheckout = await PendingSubscriptionCheckout.findOne({
        checkout_ref: checkoutRef,
    });

    if (!pendingCheckout) {
        throw new Error(`Pending subscription checkout not found for ${checkoutRef}`);
    }

    if (pendingCheckout.status === 'completed') return;

    pendingCheckout.status = 'processing';
    pendingCheckout.stripe_session_id = session.id;
    pendingCheckout.stripe_payment_intent_id = session.payment_intent || null;
    await pendingCheckout.save();

    const startDate = new Date();
    const endDate = addDuration(startDate, pendingCheckout.billing_cycle);

    await VendorSubscription.updateMany(
        { vendor_id: pendingCheckout.vendor_id, status: 'active' },
        { $set: { status: 'expired' } }
    );

    const subscription = await VendorSubscription.create({
        vendor_id: pendingCheckout.vendor_id,
        plan_id: pendingCheckout.plan_id,
        billing_cycle: pendingCheckout.billing_cycle,
        price_paid: pendingCheckout.amount,
        currency: pendingCheckout.currency,
        status: 'active',
        start_date: startDate,
        end_date: endDate,
        activated_by_admin: false,
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent || null,
        payment_status: 'paid',
        notes: 'Paid via Stripe one-time checkout',
    });

    const vendorUser = await User.findById(pendingCheckout.vendor_id).select('full_name email');
    const plan = await SubscriptionPlan.findById(pendingCheckout.plan_id).select('name');

    if (vendorUser?.email && plan) {
        try {
            await sendSubscriptionActivatedEmail({
                to: vendorUser.email,
                vendorName: vendorUser.full_name,
                planName: plan.name,
                billingCycle: pendingCheckout.billing_cycle,
                startDate,
                endDate,
                amount: pendingCheckout.amount,
                currency: pendingCheckout.currency,
            });
        } catch (mailErr) {
            console.error('Subscription activation email failed:', mailErr.message);
        }
    }

    pendingCheckout.status = 'completed';
    await pendingCheckout.save();

    return subscription;
}

//Advertisement checkout
async function handleAdvertisementCheckoutCompleted(session) {
    if (session.metadata?.checkout_type !== 'advertisement_payment') return;

    const checkoutRef = session.metadata?.checkout_ref;
    if (!checkoutRef) throw new Error('Missing checkout_ref');

    const pendingCheckout = await PendingAdvertisementCheckout.findOne({
        checkout_ref: checkoutRef,
    });

    if (!pendingCheckout) {
        throw new Error(`Pending advertisement checkout not found for ${checkoutRef}`);
    }

    if (pendingCheckout.status === 'completed') return;

    const exists = await Advertisement.findOne({ stripe_session_id: session.id });
    if (exists) {
        pendingCheckout.status = 'completed';
        await pendingCheckout.save();
        return;
    }

    pendingCheckout.status = 'processing';
    pendingCheckout.stripe_session_id = session.id;
    pendingCheckout.stripe_payment_intent_id = session.payment_intent || null;
    await pendingCheckout.save();

    try {
        await Advertisement.create({
            vendor_id: pendingCheckout.vendor_id,
            slot: pendingCheckout.slot,
            title: pendingCheckout.title,
            description: pendingCheckout.description,
            image_url: pendingCheckout.image_url,
            cta_label: pendingCheckout.cta_label || 'Shop Now',
            duration_days: pendingCheckout.duration_days,
            payment_amount: pendingCheckout.payment_amount,
            payment_currency: pendingCheckout.payment_currency || 'lkr',
            payment_status: 'paid',
            stripe_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent || null,
            status: 'pending',
        });

        pendingCheckout.status = 'completed';
        await pendingCheckout.save();
    } catch (err) {
        pendingCheckout.status = 'failed';
        await pendingCheckout.save();
        throw err;
    }
}

router.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Stripe webhook signature failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        console.log('Stripe event received:', event.type);

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const checkoutType = session.metadata?.checkout_type;

            console.log('Checkout type:', checkoutType);
            console.log('Session metadata:', session.metadata);

            if (checkoutType === 'cart' || checkoutType === 'single') {
                await handleOrderCheckoutCompleted(session);
            } else if (checkoutType === 'vendor_subscription_payment') {
                await handleSubscriptionCheckoutCompleted(session);
            } else if (checkoutType === 'advertisement_payment') {
                await handleAdvertisementCheckoutCompleted(session);
            } else {
                console.log('Unhandled checkout_type:', checkoutType);
            }
        }

        return res.json({ received: true });
    } catch (err) {
        console.error('Stripe webhook processing error:', err);
        return res.status(500).json({ message: err.message });
    }
});

module.exports = router;