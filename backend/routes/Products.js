const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET products for autocomplete/search
router.get('/', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    const query = q ? {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { oem_part_number: { $regex: q, $options: 'i' } }
      ]
    } : {};

    const products = await Product.find(query)
      .limit(Number(limit))
      .select('name oem_part_number description');
    
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
