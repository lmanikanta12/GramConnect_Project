import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Register from "./pages/register";
import ForgotPassword from "./pages/forgotpassword";
import AdminDashboard from "./dashboard/admindashboard";
import VendorDashboard from "./dashboard/vendordashboard";
import CustomerDashboard from "./dashboard/customerdashboard";
import DeliveryDashboard from "./dashboard/deliverydashboard";

// Auth guard — redirect to login if no token
function PrivateRoute({ children, role }) {
  const token = localStorage.getItem("gc_token");
  const storedRole = localStorage.getItem("gc_role");

  if (!token) return <Navigate to="/login" />;
  if (role && storedRole !== role) return <Navigate to="/login" />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />

          <Route
            path="/admindashboard"
            element={
              <PrivateRoute role="admin">
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/vendordashboard"
            element={
              <PrivateRoute role="vendor">
                <VendorDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/customerdashboard"
            element={
              <PrivateRoute role="customer">
                <CustomerDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/deliverydashboard"
            element={
              <PrivateRoute role="delivery">
                <DeliveryDashboard />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
