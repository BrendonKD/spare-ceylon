const mongoose = require('mongoose');

const vendorListingSchema = new mongoose.Schema({
  vendor_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  product_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  title: { type: String, required: true },
  description: String,
  condition: { type: String, enum: ['new', 'used'], required: true },
  price: { type: Number, required: true },
  quantity_available: { type: Number, required: true, min: 0 },
  location: String,
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  image_url: String, // multer upload path
  views: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('VendorListing', vendorListingSchema);
