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
import OrderTracking from "./pages/OrderTracking";
import CustomerOrders from './pages/CustomerOrders';
import PartsPage from "./pages/Parts";
import CartDrawer from "./components/CartDrawer";
import CartCheckout from "./pages/CartCheckout";
import Vendors from "./pages/Vendors";
import VendorDetails from "./pages/VendorDetails";
import Messages from "./pages/Messages";
import CustomerMessages from './pages/CustomerMessages';
import VendorSubscriptions from './pages/VendorSubscriptions';

//admin pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import AdminVendorsList from "./pages/admin/AdminVendorsList";
import AdminVendorDetail from "./pages/admin/AdminVendorDetails";
import AdminManageAds from './pages/admin/AdminManageAds';
import AdminManageUser from './pages/admin/AdminManageUser';

//vendor pages
import VendorDashboard from "./pages/VendorDashboard";
import VendorListProducts from './pages/VendorListProducts';
import AboutUs from './pages/AboutUs'
import VendorAdvertiseForm from "./pages/VendorAdvertiseForm1";
import VendorMessages from "./pages/VendorMessages";
import VendorOrders from './pages/VendorOrders';
import VendorPayments from './pages/VendorPayments';
import VendorProfileSettings from "./pages/VendorProfileSettings";

function App() {
  return (
    <Router>
      <CartDrawer />
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
        <Route path="/customer/orders/:orderId" element={<OrderTracking />} />
        <Route path="/customer/orders" element={<CustomerOrders />} />
        <Route path="/parts" element={<PartsPage />} />
        <Route path="/checkout/cart" element={<CartCheckout />} />
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/vendors/:id" element={<VendorDetails />} />
        {/* navigate customer to relevant seller chat + previous */}
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:vendorId" element={<Messages />} />
        {/* navigate customer to relevant customer Dashboard chat + previous */}
        <Route path="/customer/messages" element={<CustomerMessages />} />
        <Route path="/customer/messages/:vendorId" element={<CustomerMessages />} />
        <Route path="/vendor/subscriptions" element={<VendorSubscriptions />} />

        {/* Vendor Routes */}
        <Route path="/vendor/dashboard" element={<VendorDashboard />} />
        <Route path="/vendor/list-products" element={<VendorListProducts />} />
        <Route path="/vendor/advertise" element={<VendorAdvertiseForm />} />
        {/*<Route path="/vendor/:vendorId" element={<VendorProfile />} /> -not developed yet*/}
        <Route path="/vendor/profile-settings" element={<VendorProfileSettings />} />
        <Route path="/vendor/messages" element={<VendorMessages />} />
        <Route path="/vendor/messages/:customerId" element={<VendorMessages />} />
        <Route path="/vendor/orders" element={<VendorOrders />} />
        <Route path="/vendor/payments" element={<VendorPayments />} />

        {/* admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
        <Route path="/admin/vendors" element={<AdminVendorsList />} />
        <Route path="/admin/vendors/:vendorId" element={<AdminVendorDetail />} />
        <Route path="/admin/ads" element={<AdminManageAds />} />
        <Route path="/admin/users" element={<AdminManageUser />} />
      </Routes>

    </Router>
  );
}

export default App;
