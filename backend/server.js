const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use('/api/orders/webhook', express.raw({ type: 'application/json' }));

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static('uploads'));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/garage", require("./routes/garage"));
app.use("/api/orders", require("./routes/orders"));

// vendor side
app.use('/api/vendor/listings', require('./routes/vendorListings'));
app.use("/api/ads", require("./routes/Advertisements"));
app.use("/api/public/listings", require("./routes/publicListings"));
app.use("/api/products", require("./routes/product"));

app.get('/', (req, res) => {
  res.send('Spare Ceylon API running');
});

app.get('/api/public/listing/:id', async (req, res) => {
  try {
    const VendorListing = require('./models/VendorListing');
    const listing = await VendorListing.findById(req.params.id)
      .populate('product_id', 'name oem_part_number');

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));