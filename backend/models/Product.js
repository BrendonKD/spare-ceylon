const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  oem_part_number: String
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
