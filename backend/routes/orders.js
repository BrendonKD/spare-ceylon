const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const VendorListing = require('../models/VendorListing');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const requireAuth = require('../middleware/authmiddleware');

// GET listing - PUBLIC NO AUTH
router.get('/vendor/listings/:id', async (req, res) => {
  try {
    const listing = await VendorListing.findById(req.params.id)
      .populate('product_id', 'name oem_part_number');

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json(listing);
  } catch (err) {
    console.error('Listing error:', err);
    res.status(500).json({ message: err.message });
  }
});

// CREATE STRIPE CHECKOUT SESSION
router.post('/create-checkout-session', requireAuth, async (req, res) => {
  try {
    const { listingId, quantity, shipping_address } = req.body;

    const listing = await VendorListing.findById(listingId);
    if (!listing || listing.quantity_available < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'lkr',
            product_data: {
              name: listing.title
            },
            unit_amount: Math.round(listing.price * 100)
          },
          quantity
        },
        {
          price_data: {
            currency: 'lkr',
            product_data: {
              name: 'Shipping Fee'
            },
            unit_amount: 900 * 100
          },
          quantity: 1
        }
      ],
      success_url: `http://localhost:3000/payment-success?method=card&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3000/checkout/${listingId}?payment=cancelled`,
      metadata: {
        customer_id: req.user._id.toString(),
        vendor_listing_id: listingId,
        quantity: quantity.toString(),
        shipping_address: JSON.stringify(shipping_address)
      }
    });

    res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe checkout session error:', err);
    res.status(500).json({ message: err.message });
  }
});

// STRIPE WEBHOOK - SAVE PAID ORDER TO DB
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      const existingOrder = await Order.findOne({ stripe_session_id: session.id });
      if (existingOrder) {
        return res.json({ received: true, message: 'Order already saved' });
      }

      const listingId = session.metadata.vendor_listing_id;
      const quantity = parseInt(session.metadata.quantity, 10);
      const shipping_address = JSON.parse(session.metadata.shipping_address);
      const customer_id = session.metadata.customer_id;

      const listing = await VendorListing.findById(listingId);
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }

      const subtotal = listing.price * quantity;
      const shipping_fee = 900;
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
        stripe_payment_intent_id: session.payment_intent || null
      });

      await order.save();

      listing.quantity_available -= quantity;
      await listing.save();

      console.log('Paid order saved to MongoDB:', order._id);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook DB save error:', err);
    res.status(500).json({ message: err.message });
  }
});

// CASH ON DELIVERY ORDER
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      vendor_listing_id,
      quantity,
      shipping_address,
      payment_method,
      subtotal,
      shipping_fee,
      total
    } = req.body;

    const listing = await VendorListing.findById(vendor_listing_id);
    if (!listing || listing.quantity_available < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    const order = new Order({
      customer_id: req.user._id,
      vendor_listing_id,
      quantity,
      shipping_address,
      payment_method,
      subtotal,
      shipping_fee,
      total,
      status: 'pending'
    });

    await order.save();

    listing.quantity_available -= quantity;
    await listing.save();

    res.json({ success: true, orderId: order._id });
  } catch (err) {
    console.error('COD order save error:', err);
    res.status(400).json({ message: err.message });
  }
});

//retrive orders to customer Dashboard
router.get('/my-recent', requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ customer_id: req.user._id })
      .populate('vendor_listing_id', 'title image_url condition')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json(orders);
  } catch (err) {
    console.error('Fetch recent orders error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;