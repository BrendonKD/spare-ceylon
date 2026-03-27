const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/uploads', express.static('uploads'));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/garage", require("./routes/garage"));

//vendor side
app.use('/api/vendor/listings', require('./routes/vendorListings'));
app.use("/api/ads", require("./routes/Advertisements"));
app.use("/api/public/listings", require("./routes/publicListings"));
app.use("/api/products", require("./routes/product"));//products to the home page
//app.use("/api/public/vendors", require("./routes/publicVendors"));

app.get('/', (req, res) => {
  res.send('Spare Ceylon API running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
