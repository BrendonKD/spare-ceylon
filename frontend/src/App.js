import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from "./pages/Home";
import LoginPage from "./pages/loginPage";
import CustomerRegisterPage from './pages/CustomerRegisterPage';
import VendorRegisterPage from "./pages/VendorRegisterPage";
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerGarage from "./pages/CustomerGarage";
import ListingDetail from "./pages/ListingDetail"; //product detail page
import Checkout from './pages/Checkout';
import PaymentSuccess from "./pages/PaymentSuccess";

//admin pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";


//vendor pages
import VendorDashboard from "./pages/VendorDashboard";
import VendorListProducts from './pages/VendorListProducts';
import AboutUs from './pages/AboutUs'
import VendorAdvertiseForm from "./pages/VendorAdvertiseForm1";

function App() {
  return(
  <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register/customer" element={<CustomerRegisterPage />} />
        <Route path="/register/vendor" element={<VendorRegisterPage />} />
        <Route path="/customer/dashboard" element={<CustomerDashboard />} />
        <Route path="/customer/garage" element={<CustomerGarage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/listings/:id" element={<ListingDetail />} />
        <Route path="/checkout/:listingId" element={<Checkout />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />

      {/* Vendor Routes */}
        <Route path="/vendor/dashboard" element={<VendorDashboard />} />
        <Route path="/vendor/list-products" element={<VendorListProducts />} />
        <Route path="/vendor/advertise" element={<VendorAdvertiseForm />} />
        {/*<Route path="/vendor/:vendorId" element={<VendorProfile />} /> -not developed yet*/} 

      {/* admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/products" element={<AdminProducts />} />
      </Routes>

  </Router>
  );
}

export default App;
