const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const VendorListing = require('../models/VendorListing');
const Product = require('../models/Product');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/listings/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.use(auth); // All routes require auth

// GET vendor's listings
router.get('/', async (req, res) => {
  try {
    if (req.user.role !== 'vendor') return res.status(403).json({ message: 'Vendor only' });
    
    const listings = await VendorListing.find({ vendor_id: req.user._id })
      .populate('product_id', 'name oem_part_number')
      .sort({ createdAt: -1 });
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new listing
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (req.user.role !== 'vendor') return res.status(403).json({ message: 'Vendor only' });
    
    const listing = new VendorListing({
      vendor_id: req.user._id,
      product_id: req.body.product_id,
      title: req.body.title,
      description: req.body.description,
      condition: req.body.condition,
      price: req.body.price,
      quantity_available: req.body.quantity_available,
      location: req.body.location,
      image_url: req.file ? req.file.path : null
    });
    
    await listing.save();
    const populated = await VendorListing.findById(listing._id).populate('product_id');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// update listing
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const listing = await VendorListing.findOne({ 
      _id: req.params.id, 
      vendor_id: req.user._id 
    });
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    
    Object.assign(listing, req.body);
    if (req.file) listing.image_url = req.file.path;
    await listing.save();
    
    const populated = await VendorListing.findById(listing._id).populate('product_id');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE listing
router.delete('/:id', async (req, res) => {
  try {
    const listing = await VendorListing.findOneAndDelete({
      _id: req.params.id,
      vendor_id: req.user._id
    });
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
