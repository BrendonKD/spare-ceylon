import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from "./pages/Home";
import LoginPage from "./pages/loginPage";
import CustomerRegisterPage from './pages/CustomerRegisterPage';
import VendorRegisterPage from "./pages/VendorRegisterPage";
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerGarage from "./pages/CustomerGarage";
import VendorDashboard from "./pages/VendorDashboard";
//import VendorSidebar from './components/VendorSidebar';
import VendorListProducts from './pages/VendorListProducts';

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
      {/* Vendor Routes */}
        <Route path="/vendor/dashboard" element={<VendorDashboard />} />
        <Route path="/vendor/list-products" element={<VendorListProducts />} />
        

      </Routes>

  </Router>
  );
}

export default App;
