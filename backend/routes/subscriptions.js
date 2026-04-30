const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const SubscriptionPlan = require('../models/SubscriptionPlan');
const VendorSubscription = require('../models/VendorSubscription');
const PendingSubscriptionCheckout = require('../models/PendingSubscriptionCheckout');
const requireAuth = require('../middleware/authmiddleware');

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const requireVendor = (req, res, next) => {
  if (!req.user || req.user.role !== 'vendor') {
    return res.status(403).json({ message: 'Vendor access required' });
  }
  next();
};

const addDuration = (startDate, billingCycle) => {
  const date = new Date(startDate);
  if (billingCycle === 'yearly') {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  return date;
};

// GET all plans
router.get('/plans', requireAuth, async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ status: 'active' }).sort({ price_monthly: 1 });
    res.json(plans);
  } catch (err) {
    console.error('Fetch subscription plans error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET current vendor subscription
router.get('/my-subscription', requireAuth, requireVendor, async (req, res) => {
  try {
    const now = new Date();

    await VendorSubscription.updateMany(
      {
        vendor_id: req.user._id,
        status: 'active',
        end_date: { $lt: now },
      },
      { $set: { status: 'expired' } }
    );

    const subscription = await VendorSubscription.findOne({
      vendor_id: req.user._id,
      status: 'active',
    }).populate('plan_id');

    res.json({ subscription: subscription || null });
  } catch (err) {
    console.error('Fetch vendor subscription error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET vendor subscription history
router.get('/history', requireAuth, requireVendor, async (req, res) => {
  try {
    const subscriptions = await VendorSubscription.find({
      vendor_id: req.user._id,
    })
      .populate('plan_id')
      .sort({ createdAt: -1 });

    res.json(subscriptions);
  } catch (err) {
    console.error('Fetch subscription history error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ACTIVATE FREE PLAN
router.post('/activate-free', requireAuth, requireVendor, async (req, res) => {
  try {
    const { plan_id, billing_cycle = 'monthly' } = req.body;

    const plan = await SubscriptionPlan.findById(plan_id);
    if (!plan || plan.status !== 'active') {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    if (!plan.is_free && plan.price_monthly > 0) {
      return res.status(400).json({ message: 'This plan requires payment' });
    }

    await VendorSubscription.updateMany(
      { vendor_id: req.user._id, status: 'active' },
      { $set: { status: 'cancelled' } }
    );

    const startDate = new Date();
    const endDate = addDuration(startDate, billing_cycle);

    const subscription = new VendorSubscription({
      vendor_id: req.user._id,
      plan_id: plan._id,
      billing_cycle,
      price_paid: 0,
      currency: plan.currency || 'LKR',
      status: 'active',
      start_date: startDate,
      end_date: endDate,
      activated_by_admin: false,
      payment_status: 'paid',
      notes: 'Free plan activated',
    });

    await subscription.save();

    const populated = await VendorSubscription.findById(subscription._id).populate('plan_id');

    res.json({
      success: true,
      message: `${plan.name} plan activated successfully`,
      subscription: populated,
    });
  } catch (err) {
    console.error('Activate free subscription error:', err);
    res.status(500).json({ message: err.message });
  }
});

// CREATE STRIPE CHECKOUT SESSION FOR PAID PLAN
router.post('/create-checkout-session', requireAuth, requireVendor, async (req, res) => {
  try {
    const { plan_id, billing_cycle = 'monthly' } = req.body;

    if (!plan_id) {
      return res.status(400).json({ message: 'plan_id is required' });
    }

    if (!['monthly', 'yearly'].includes(billing_cycle)) {
      return res.status(400).json({ message: 'Invalid billing cycle' });
    }

    const plan = await SubscriptionPlan.findById(plan_id);
    if (!plan || plan.status !== 'active') {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    const amount =
      billing_cycle === 'yearly' ? plan.price_yearly : plan.price_monthly;

    if (amount <= 0) {
      return res.status(400).json({ message: 'Use free activation for free plans' });
    }

    const checkoutRef = `sub_${req.user._id}_${Date.now()}`;

    await PendingSubscriptionCheckout.create({
      checkout_ref: checkoutRef,
      vendor_id: req.user._id,
      plan_id: plan._id,
      billing_cycle,
      amount,
      currency: plan.currency || 'LKR',
      status: 'pending',
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: (plan.currency || 'LKR').toLowerCase(),
            product_data: {
              name: `${plan.name} Vendor Subscription`,
              description: `${billing_cycle} plan payment`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `http://localhost:3000/vendor/subscriptions?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3000/vendor/subscriptions?payment=cancelled`,
      metadata: {
        checkout_type: 'vendor_subscription_payment',
        checkout_ref: checkoutRef,
        vendor_id: req.user._id.toString(),
        plan_id: plan._id.toString(),
        billing_cycle,
      },
      payment_intent_data: {
        metadata: {
          checkout_type: 'vendor_subscription_payment',
          checkout_ref: checkoutRef,
          vendor_id: req.user._id.toString(),
          plan_id: plan._id.toString(),
          billing_cycle,
        },
      },
    });

    await PendingSubscriptionCheckout.findOneAndUpdate(
      { checkout_ref: checkoutRef },
      { stripe_session_id: session.id }
    );

    res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error('Create subscription checkout session error:', err);
    res.status(500).json({ message: err.message });
  }
});


//ADMIN can view both active and inacti ve plans
router.get('/admin/plans', requireAuth, requireAdmin, async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ createdAt: -1 });
    res.json(plans);
  } catch (err) {
    console.error('Fetch admin plans error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ADMIN create a plan
router.post('/plans', requireAuth, requireAdmin, async (req, res) => {
  try {
    const plan = new SubscriptionPlan(req.body);
    await plan.save();
    res.status(201).json(plan);
  } catch (err) {
    console.error('Create subscription plan error:', err);
    res.status(400).json({ message: err.message });
  }
});

// ADMIN update a plan
router.put('/plans/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const updatedPlan = await SubscriptionPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedPlan) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    res.json(updatedPlan);
  } catch (err) {
    console.error('Update subscription plan error:', err);
    res.status(400).json({ message: err.message });
  }
});

// ADMIN deactivate a plan
router.patch('/plans/:id/deactivate', requireAuth, requireAdmin, async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    plan.status = 'inactive';
    await plan.save();

    res.json({ success: true, message: 'Plan deactivated successfully', plan });
  } catch (err) {
    console.error('Deactivate subscription plan error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ADMIN permanently delete a plan
router.delete('/plans/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const deletedPlan = await SubscriptionPlan.findByIdAndDelete(req.params.id);

    if (!deletedPlan) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    res.json({ success: true, message: 'Plan deleted successfully' });
  } catch (err) {
    console.error('Delete subscription plan error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ADMIN get all vendor subscriptions
router.get('/admin/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const subscriptions = await VendorSubscription.find()
      .populate('vendor_id', 'full_name email')
      .populate('plan_id')
      .sort({ createdAt: -1 });

    res.json(subscriptions);
  } catch (err) {
    console.error('Fetch all vendor subscriptions error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ADMIN manually assign a plan to a vendor
router.post('/admin/assign', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { vendor_id, plan_id, billing_cycle = 'monthly', notes = '' } = req.body;

    if (!vendor_id || !plan_id) {
      return res.status(400).json({ message: 'vendor_id and plan_id are required' });
    }

    const plan = await SubscriptionPlan.findById(plan_id);
    if (!plan) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    await VendorSubscription.updateMany(
      {
        vendor_id,
        status: 'active',
      },
      { $set: { status: 'cancelled' } }
    );

    const startDate = new Date();
    const endDate = addDuration(startDate, billing_cycle);
    const pricePaid =
      billing_cycle === 'yearly' ? plan.price_yearly : plan.price_monthly;

    const subscription = new VendorSubscription({
      vendor_id,
      plan_id,
      billing_cycle,
      price_paid: pricePaid,
      currency: plan.currency || 'LKR',
      status: 'active',
      start_date: startDate,
      end_date: endDate,
      activated_by_admin: true,
      payment_status: 'paid',
      notes,
    });

    await subscription.save();

    const populated = await VendorSubscription.findById(subscription._id)
      .populate('vendor_id', 'full_name email')
      .populate('plan_id');

    res.status(201).json({
      success: true,
      message: 'Subscription assigned successfully',
      subscription: populated,
    });
  } catch (err) {
    console.error('Assign subscription by admin error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/debug/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const pending = await PendingSubscriptionCheckout.find().sort({ createdAt: -1 });
    const subscriptions = await VendorSubscription.find().sort({ createdAt: -1 });
    res.json({ pending, subscriptions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;