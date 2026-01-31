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
app.use('/api/vendor/listings', require('./routes/vendorListings'));
app.use('/api/products', require('./routes/products'));

app.get('/', (req, res) => {
  res.send('Spare Ceylon API running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
