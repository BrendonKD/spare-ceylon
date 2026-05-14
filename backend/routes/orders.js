const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const VendorListing = require('../models/VendorListing');
const PendingCheckout = require('../models/PendingCheckout');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const requireAuth = require('../middleware/authmiddleware');
const { sendOrderStatusEmail } = require('../utils/mailer');

const SHIPPING_PER_VENDOR = 900;

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
    item.vendorId ||
    item.vendor_id ||
    item.vendor?._id ||
    item.vendor?.userId ||
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

// CREATE STRIPE CHECKOUT SESSION - SINGLE ITEM
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
              name: listing.title,
            },
            unit_amount: Math.round(listing.price * 100),
          },
          quantity,
        },
        {
          price_data: {
            currency: 'lkr',
            product_data: {
              name: 'Shipping Fee',
            },
            unit_amount: SHIPPING_PER_VENDOR * 100,
          },
          quantity: 1,
        },
      ],
      success_url: `http://localhost:3000/payment-success?method=card&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3000/checkout/${listingId}?payment=cancelled`,
      metadata: {
        checkout_type: 'single',
        customer_id: req.user._id.toString(),
        vendor_listing_id: listingId,
        quantity: quantity.toString(),
        shipping_address: JSON.stringify(shipping_address),
      },
    });

    res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe checkout session error:', err);
    res.status(500).json({ message: err.message });
  }
});


// CASH ON DELIVERY ORDER - SINGLE ITEM
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      vendor_listing_id,
      quantity,
      shipping_address,
      payment_method,
      subtotal,
      shipping_fee,
      total,
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
      status: 'pending',
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

// COD CART CHECKOUT
router.post('/cart', requireAuth, async (req, res) => {
  try {
    const { cartItems, shipping_address, payment_method } = req.body;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const grouped = groupCartItemsByVendor(cartItems);
    const createdOrders = [];

    for (const vendorId of Object.keys(grouped)) {
      const vendorItems = grouped[vendorId];

      for (let i = 0; i < vendorItems.length; i++) {
        const cartItem = vendorItems[i];
        const listingId = getListingId(cartItem);
        const listing = await VendorListing.findById(listingId);

        if (!listing) {
          return res.status(404).json({ message: `Listing not found: ${listingId}` });
        }

        if (listing.quantity_available < cartItem.qty) {
          return res.status(400).json({
            message: `Insufficient stock for ${listing.title}`,
          });
        }
      }

      for (let i = 0; i < vendorItems.length; i++) {
        const cartItem = vendorItems[i];
        const listingId = getListingId(cartItem);
        const listing = await VendorListing.findById(listingId);

        const subtotal = listing.price * cartItem.qty;
        const shipping_fee = i === 0 ? SHIPPING_PER_VENDOR : 0;
        const total = subtotal + shipping_fee;

        const order = new Order({
          customer_id: req.user._id,
          vendor_listing_id: listing._id,
          quantity: cartItem.qty,
          shipping_address,
          payment_method: payment_method || 'cod',
          subtotal,
          shipping_fee,
          total,
          status: 'pending',
        });

        await order.save();

        listing.quantity_available -= cartItem.qty;
        await listing.save();

        createdOrders.push(order);
      }
    }

    res.json({
      success: true,
      message: 'Cart orders placed successfully',
      orderIds: createdOrders.map((o) => o._id),
    });
  } catch (err) {
    console.error('Cart COD order save error:', err);
    res.status(400).json({ message: err.message });
  }
});

// STRIPE CART CHECKOUT SESSION
router.post('/create-cart-checkout-session', requireAuth, async (req, res) => {
  try {
    const { cartItems, shipping_address } = req.body;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    console.log('Incoming cartItems:', JSON.stringify(cartItems, null, 2));

    const grouped = groupCartItemsByVendor(cartItems);
    const line_items = [];

    for (const vendorId of Object.keys(grouped)) {
      const vendorItems = grouped[vendorId];

      for (const cartItem of vendorItems) {
        const listingId = getListingId(cartItem);
        const listing = await VendorListing.findById(listingId);

        console.log('Resolved listingId:', listingId);

        if (!listing) {
          return res.status(404).json({ message: `Listing not found: ${listingId}` });
        }

        if (listing.quantity_available < cartItem.qty) {
          return res.status(400).json({
            message: `Insufficient stock for ${listing.title}`,
          });
        }

        line_items.push({
          price_data: {
            currency: 'lkr',
            product_data: {
              name: listing.title,
            },
            unit_amount: Math.round(listing.price * 100),
          },
          quantity: cartItem.qty,
        });
      }

      line_items.push({
        price_data: {
          currency: 'lkr',
          product_data: {
            name: `Shipping Fee (${vendorId})`,
          },
          unit_amount: SHIPPING_PER_VENDOR * 100,
        },
        quantity: 1,
      });
    }

    const checkoutRef = `cart_${req.user._id}_${Date.now()}`;

    const normalizedCartItems = cartItems.map((item) => {
      const listingId =
        item.vendor_listing_id ||
        item._id ||
        item.listingId ||
        item.id ||
        null;

      const vendorId =
        item.vendorId ||
        item.vendor_id ||
        item.vendor?._id ||
        item.vendor?.userId ||
        null;

      if (!listingId) {
        console.log('Invalid cart item for PendingCheckout:', item);
        throw new Error(
          `Missing vendor_listing_id for cart item: ${item.title || item.productName || 'unknown'}`
        );
      }

      return {
        vendor_listing_id: listingId,
        qty: Number(item.qty) || 1,
        vendorId: vendorId || null,
        vendor_id: vendorId || null,
      };
    });

    console.log('normalizedCartItems:', JSON.stringify(normalizedCartItems, null, 2));

    await PendingCheckout.create({
      checkout_ref: checkoutRef,
      customer_id: req.user._id,
      shipping_address,
      cartItems: normalizedCartItems,
      status: 'pending',
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: `http://localhost:3000/payment-success?method=card&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3000/checkout/cart?payment=cancelled`,
      metadata: {
        checkout_type: 'cart',
        checkout_ref: checkoutRef,
        customer_id: req.user._id.toString(),
      },
    });

    res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe cart checkout session error:', err);
    res.status(500).json({ message: err.message });
  }
});

// retrieve recent orders to customer Dashboard
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

// Retrieve ALL orders for Customer Orders page
router.get('/my', requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ customer_id: req.user._id })
      .populate('vendor_listing_id', 'title image_url condition price')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error('Fetch all orders error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET single order with listing + vendor details
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      customer_id: req.user._id,
    }).populate('vendor_listing_id', 'title image_url condition');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    console.error('Fetch order detail error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET all orders for logged-in vendor
router.get('/vendor/my', requireAuth, async (req, res) => {
  try {
    const vendorId = req.user._id;

    const vendorListings = await VendorListing.find({ vendor_id: vendorId }).select('_id');
    const listingIds = vendorListings.map((listing) => listing._id);

    const orders = await Order.find({
      vendor_listing_id: { $in: listingIds },
    })
      .populate('vendor_listing_id', 'title image_url condition price')
      .populate('customer_id', 'full_name email')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error('Fetch vendor orders error:', err);
    res.status(500).json({ message: err.message });
  }
});

// UPDATE order status by vendor
router.patch('/vendor/:orderId/status', requireAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const vendorListings = await VendorListing.find({ vendor_id: req.user._id }).select('_id');
    const listingIds = vendorListings.map((listing) => listing._id.toString());

    const order = await Order.findById(orderId)
      .populate('vendor_listing_id', 'title price quantity_available')
      .populate('customer_id', 'full_name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!listingIds.includes(order.vendor_listing_id._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    const oldStatus = order.status;
    let refund = null;

    if (status === 'cancelled') {
      if (oldStatus === 'delivered') {
        return res.status(400).json({ message: 'Delivered orders cannot be cancelled' });
      }

      if (oldStatus === 'cancelled') {
        return res.status(400).json({ message: 'Order is already cancelled' });
      }

      if (order.payment_method === 'card') {
        if (!order.stripe_payment_intent_id) {
          return res.status(400).json({ message: 'No Stripe payment intent found for this order' });
        }

        if (order.refund_status === 'refunded' || order.stripe_refund_id) {
          return res.status(400).json({ message: 'This order has already been refunded' });
        }

        refund = await stripe.refunds.create({
          payment_intent: order.stripe_payment_intent_id,
          amount: Math.round(order.total * 100),
          reason: 'requested_by_customer',
          metadata: {
            order_id: order._id.toString(),
            cancelled_by_vendor: req.user._id.toString(),
            type: 'vendor_order_cancellation_refund'
          }
        });

        order.refund_status = 'refunded';
        order.refund_amount = order.total;
        order.refunded_at = new Date();
        order.stripe_refund_id = refund.id;
      }

      const listing = await VendorListing.findById(order.vendor_listing_id._id);
      if (listing) {
        listing.quantity_available += order.quantity;
        await listing.save();
      }
    }

    order.status = status;
    await order.save();

    if (oldStatus !== status && order.customer_id?.email) {
      try {
        await sendOrderStatusEmail({
          to: order.customer_id.email,
          customerName: order.customer_id.full_name,
          orderId: order._id.toString().slice(-6).toUpperCase(),
          productTitle: order.vendor_listing_id?.title || 'Ordered Item',
          status,
          total: order.total,
        });
      } catch (mailErr) {
        console.error('Status updated, but email failed:', mailErr);
      }
    }

    const updatedOrder = await Order.findById(orderId)
      .populate('vendor_listing_id', 'title image_url condition price')
      .populate('customer_id', 'full_name email');

    res.json({
      success: true,
      message:
        refund
          ? 'Order cancelled and customer refunded successfully'
          : 'Order status updated successfully',
      order: updatedOrder,
      refund
    });
  } catch (err) {
    console.error('Update vendor order status error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;