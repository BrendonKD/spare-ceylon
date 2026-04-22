const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customer_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  vendor_listing_id: {  // ← Changed to VendorListing (not Product)
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'VendorListing', 
    required: true 
  },
  quantity: { type: Number, required: true, min: 1 },
  shipping_address: {
    fullName: String,
    address: String,
    city: String,
    phone: String
  },
  payment_method: { type: String, enum: ['card', 'cod'], required: true },
  subtotal: { type: Number, required: true },
  shipping_fee: { type: Number, required: true },
  total: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], 
    default: 'pending' 
  },

  stripe_session_id: {
  type: String,
  default: null
},
stripe_payment_intent_id: {
  type: String,
  default: null
}

}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);