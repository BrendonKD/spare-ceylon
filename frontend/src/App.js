import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from "./pages/Home";
import LoginPage from "./pages/loginPage";
import CustomerRegisterPage from './pages/CustomerRegisterPage';


function App() {
  return(
  <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
      <Route path="/register/customer" element={<CustomerRegisterPage />} />
      </Routes>

  </Router>
  );
}

export default App;
