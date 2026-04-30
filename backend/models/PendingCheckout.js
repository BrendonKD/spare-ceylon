const mongoose = require('mongoose');

const pendingCartItemSchema = new mongoose.Schema(
    {
        vendor_listing_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'VendorListing',
            required: true,
        },
        qty: {
            type: Number,
            required: true,
            min: 1,
        },
        vendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        vendor_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    { _id: false }
);

const pendingCheckoutSchema = new mongoose.Schema(
    {
        checkout_ref: {
            type: String,
            required: true,
            unique: true,
        },
        customer_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        shipping_address: {
            fullName: String,
            address: String,
            city: String,
            phone: String,
        },
        cartItems: {
            type: [pendingCartItemSchema],
            required: true,
        },
        checkout_type: {
            type: String,
            enum: ['cart'],
            default: 'cart',
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: 'pending',
        },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 1000 * 60 * 60),
        },
    },
    { timestamps: true }
);

pendingCheckoutSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PendingCheckout', pendingCheckoutSchema);