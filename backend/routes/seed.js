const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

router.post('/products', async (req, res) => {
  try {
    const products = [
      { name: 'Toyota CHR Front Brake Pads', oem_part_number: '04465-47020' },
      { name: 'Honda Civic Rear Brake Disc', oem_part_number: '42510-TBA-A01' },
      { name: 'Suzuki Alto Headlight', oem_part_number: '95151-M68-003' },
      { name: 'Nissan Caravan Break Light', oem_part_number: '26120-89900' }
    ];
    
    await Product.deleteMany({});
    await Product.insertMany(products);
    res.json({ message: 'Seeded 4 test products' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
