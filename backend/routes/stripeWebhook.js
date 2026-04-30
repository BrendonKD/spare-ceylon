const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Order = require('../models/Order');
const VendorListing = require('../models/VendorListing');
const PendingCheckout = require('../models/PendingCheckout');

const SubscriptionPlan = require('../models/SubscriptionPlan');
const VendorSubscription = require('../models/VendorSubscription');
const PendingSubscriptionCheckout = require('../models/PendingSubscriptionCheckout');
const PendingAdvertisementCheckout = require('../models/PendingAdvertisementCheckout');

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

    if (checkoutType === 'cart') {
        const checkoutRef = session.metadata?.checkout_ref;
        if (!checkoutRef) throw new Error('Missing checkout_ref');

        const pendingCheckout = await PendingCheckout.findOne({
            checkout_ref: checkoutRef,
        });

        if (!pendingCheckout) {
            throw new Error(`Pending cart checkout not found for ref: ${checkoutRef}`);
        }

        if (pendingCheckout.status === 'completed') {
            return;
        }

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

            for (const vendorId of Object.keys(grouped)) {
                const vendorItems = grouped[vendorId];

                for (let i = 0; i < vendorItems.length; i++) {
                    const item = vendorItems[i];
                    const listingId = getListingId(item);
                    const listing = await VendorListing.findById(listingId);

                    if (!listing) {
                        throw new Error(`Listing not found: ${listingId}`);
                    }

                    if (listing.quantity_available < item.qty) {
                        throw new Error(`Insufficient stock for ${listing.title}`);
                    }
                }

                for (let i = 0; i < vendorItems.length; i++) {
                    const item = vendorItems[i];
                    const listingId = getListingId(item);
                    const listing = await VendorListing.findById(listingId);

                    const subtotal = listing.price * item.qty;
                    const shipping_fee = i === 0 ? SHIPPING_PER_VENDOR : 0;
                    const total = subtotal + shipping_fee;

                    const order = new Order({
                        customer_id,
                        vendor_listing_id: listing._id,
                        quantity: item.qty,
                        shipping_address,
                        payment_method: 'card',
                        subtotal,
                        shipping_fee,
                        total,
                        status: 'confirmed',
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

        const listingId = session.metadata.vendor_listing_id;
        const quantity = parseInt(session.metadata.quantity, 10);
        const shipping_address = JSON.parse(session.metadata.shipping_address);
        const customer_id = session.metadata.customer_id;

        const listing = await VendorListing.findById(listingId);
        if (!listing) throw new Error('Listing not found');
        if (listing.quantity_available < quantity) {
            throw new Error('Insufficient stock');
        }

        const subtotal = listing.price * quantity;
        const shipping_fee = SHIPPING_PER_VENDOR;
        const total = subtotal + shipping_fee;

        const order = new Order({
            customer_id,
            vendor_listing_id: listingId,
            quantity,
            shipping_address,
            payment_method: 'card',
            subtotal,
            shipping_fee,
            total,
            status: 'confirmed',
            stripe_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent || null,
        });

        await order.save();

        listing.quantity_available -= quantity;
        await listing.save();
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
    const endDate = addDuration(startDate, pendingCheckout.billingCycle);

    await VendorSubscription.updateMany(
        { vendorId: pendingCheckout.vendorId, status: 'active' },
        { $set: { status: 'expired' } }
    );

    await VendorSubscription.create({
        vendorId: pendingCheckout.vendorId,
        planId: pendingCheckout.planId,
        billingCycle: pendingCheckout.billingCycle,
        pricePaid: pendingCheckout.amount,
        currency: pendingCheckout.currency,
        status: 'active',
        startDate,
        endDate,
        activatedByAdmin: false,
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent || null,
        paymentStatus: 'paid',
        notes: 'Paid via Stripe one-time checkout',
    });

    pendingCheckout.status = 'completed';
    await pendingCheckout.save();
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