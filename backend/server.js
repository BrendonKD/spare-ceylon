const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
const publicListingsRoutes = require('./routes/publicListings');
const publicVendor = require("./routes/publicVendor");
const messageRoute = require("./routes/messageRoute");
const subscriptionRoutes = require('./routes/subscriptions');
const vendorRoutes = require("./routes/vendor");
const adminVendorRoutes = require("./routes/adminVendorRoute");
const vendorDocumentRoutes = require("./routes/vendorDocumentRoute"); //used for hide certificate for verified vendor
const adminRoutes = require('./routes/admin');
const adminInquiryRoutes = require("./routes/adminInquiries");
const communityForum = require("./routes/communityForum");

const stripeWebhookRoutes = require('./routes/stripeWebhook');
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

//app.use('/api/orders/webhook', express.raw({ type: 'application/json' }));
//app.use('/api/subscriptions/webhook', express.raw({ type: 'application/json' }));

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static('uploads'));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/garage", require("./routes/garage"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/cart", require("./routes/Cart"));
app.use("/api/reviews", require("./routes/reviews"));
app.use('/api/public', publicListingsRoutes);
app.use("/api/public", publicVendor);
app.use("/api/messages", messageRoute);
app.use('/api/subscriptions', subscriptionRoutes);
app.use("/api/community-forum", communityForum);



// vendor side
app.use('/api/vendor/listings', require('./routes/vendorListings'));
app.use("/api/ads", require("./routes/Advertisements"));
app.use("/api/public/listings", require("./routes/publicListings"));
app.use("/api/products", require("./routes/product"));
app.use("/api/product-requests", require("./routes/productRequests")); //product req by vendors
app.use("/api/vendors", vendorRoutes);
const path = require("path");

//admin
app.use("/api/admin/vendors", adminVendorRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/vendor-documents", vendorDocumentRoutes);
app.use("/api/admin", adminRoutes); 
app.use("/api/inquiries", adminInquiryRoutes);

app.use('/api/stripe', stripeWebhookRoutes);


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