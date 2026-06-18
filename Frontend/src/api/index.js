import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("gc_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect on 401
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default API;

// ===== AUTH =====
export const login = (data) => API.post("/auth/login", data);
export const register = (data) => API.post("/auth/register", data, { headers: { "Content-Type": "multipart/form-data" } });
export const sendOtp = (data) => API.post("/auth/send-otp", data);
export const resetPassword = (data) => API.post("/auth/reset-password", data);

// ===== PRODUCTS =====
export const getProducts = (params) => API.get("/products", { params });
export const getMyProducts = () => API.get("/products/mine");
export const addProduct = (data) => API.post("/products", data, { headers: { "Content-Type": "multipart/form-data" } });
export const updateProduct = (id, data) => API.put(`/products/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } });
export const deleteProduct = (id) => API.delete(`/products/${id}`);
export const toggleStock = (id) => API.patch(`/products/${id}/stock`);

// ===== ORDERS =====
export const placeOrder = (data) => API.post("/orders", data);
export const getMyOrders = () => API.get("/orders/my");
export const cancelOrder = (id, reason) => API.patch(`/orders/${id}/cancel`, { reason });
export const rateOrder = (id, data) => API.patch(`/orders/${id}/rate`, data);

export const getVendorOrders = () => API.get("/orders/vendor");
export const vendorUpdateOrder = (id, status, reason = "") =>
  API.patch(`/orders/${id}/vendor-update`, { status, reason });
export const assignDelivery = (id, deliveryId) => API.patch(`/orders/${id}/assign-delivery`, { deliveryId });
export const getDeliveryAgents = () => API.get("/orders/delivery-agents");

export const getDeliveryOrders = () => API.get("/orders/delivery");
export const deliveryUpdateOrder = (id, status) => API.patch(`/orders/${id}/delivery-update`, { status });
export const getEarnings = () => API.get("/orders/earnings/summary");

export const getProfile = () => API.get("/auth/profile"); // ✅ FIXED
export const getUsers = () => API.get("/auth/users");
export const updateUserStatus = (id, data) => API.put(`/auth/status/${id}`, data);

export const BASE_URL = "http://localhost:5000/uploads";