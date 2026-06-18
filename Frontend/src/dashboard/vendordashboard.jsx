import { useState, useEffect, useCallback } from "react";
import AIChatBot from "../components/AIChatBot";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  getMyProducts, addProduct, updateProduct, deleteProduct, toggleStock,
  getVendorOrders, vendorUpdateOrder, assignDelivery, getDeliveryAgents, getProfile, BASE_URL,
} from "../api";

// ─── SVG ICON COMPONENTS ────────────────────────────────────────────────────
const Icon = ({ d, size = 16, stroke = "currentColor", fill = "none", strokeWidth = 1.75, viewBox = "0 0 24 24", style }) => (
  <svg width={size} height={size} viewBox={viewBox} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {Array.isArray(d) ? d.map((path, i) => <path key={i} d={path} />) : <path d={d} />}
  </svg>
);

const Icons = {
  Dashboard: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  Products: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  Orders: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  ),
  Delivery: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
      <path d="M8 17.5H14.5M15 10l3 3h3" />
      <path d="M3 17.5H1V7a2 2 0 0 1 2-2h13v7.5" />
      <path d="M15 5h4l2 5" />
    </svg>
  ),
  Support: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5" />
    </svg>
  ),
  Leaf: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 4 13c0-4 4-9 9-9 4 0 8 4 8 8a7 7 0 0 1-7 7h-3z" />
      <path d="M4 13c4-1 8 1 9 7" />
    </svg>
  ),
  Check: ({ size = 16 }) => <Icon size={size} d="M20 6L9 17l-5-5" />,
  Box: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  ),
  Clock: ({ size = 16 }) => <Icon size={size} d={["M12 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2z", "M12 6v6l4 2"]} />,
  Currency: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9.4A4 4 0 0 0 8 12a4 4 0 0 0 7 2.6" />
      <line x1="12" y1="7" x2="12" y2="9" />
      <line x1="12" y1="15" x2="12" y2="17" />
    </svg>
  ),
  BarChart2: ({ size = 16 }) => <Icon size={size} d={["M18 20V10", "M12 20V4", "M6 20v-6"]} />,
  PieChart: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  ),
  Pin: ({ size = 16 }) => <Icon size={size} d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z M12 10a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />,
  Plus: ({ size = 16 }) => <Icon size={size} d={["M12 5v14", "M5 12h14"]} />,
  Edit: ({ size = 16 }) => <Icon size={size} d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />,
  Trash: ({ size = 16 }) => <Icon size={size} d={["M3 6h18", "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6", "M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"]} />,
  X: ({ size = 16 }) => <Icon size={size} d={["M18 6L6 18", "M6 6l12 12"]} />,
  Bike: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="18.5" cy="17.5" r="3.5" />
      <path d="M15 6h-3L9.5 14H14l1.5-4.5" />
      <path d="M15 6l3 5" />
      <path d="M5.5 14l3-8" />
    </svg>
  ),
  User: ({ size = 16 }) => <Icon size={size} d={["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M12 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"]} />,
  Phone: ({ size = 16 }) => <Icon size={size} d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.08 3.39 2 2 0 0 1 3.05 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.91A16 16 0 0 0 15.1 16.9l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />,
  MapPin: ({ size = 16 }) => <Icon size={size} d={["M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z", "M12 7a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"]} />,
  CreditCard: ({ size = 16 }) => <Icon size={size} d={["M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z", "M1 10h22"]} />,
  RefreshCw: ({ size = 16 }) => <Icon size={size} d={["M23 4v6h-6", "M1 20v-6h6", "M3.51 9a9 9 0 0 1 14.85-3.36L23 10 M1 14l4.64 4.36A9 9 0 0 0 20.49 15"]} />,
  Sun: ({ size = 16 }) => <Icon size={size} d={["M12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10z", "M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"]} />,
  Moon: ({ size = 16 }) => <Icon size={size} d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  LogOut: ({ size = 16 }) => <Icon size={size} d={["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"]} />,
  Inbox: ({ size = 16 }) => <Icon size={size} d={["M22 12h-6l-2 3h-4l-2-3H2", "M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"]} />,
  Truck: ({ size = 16 }) => <Icon size={size} d={["M1 3h15v13H1z", "M16 8h4l3 4v5h-7V8z", "M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z", "M18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"]} />,
  Mail: ({ size = 16 }) => <Icon size={size} d={["M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z", "M22 6l-10 7L2 6"]} />,
  HelpCircle: ({ size = 16 }) => <Icon size={size} d={["M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20z", "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3", "M12 17h.01"]} />,
  Package: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  Dot: ({ size = 8 }) => (
    <svg width={size} height={size} viewBox="0 0 8 8" fill="currentColor">
      <circle cx="4" cy="4" r="3" />
    </svg>
  ),
  Arrow: ({ size = 14 }) => <Icon size={size} d="M5 12h14M13 6l6 6-6 6" strokeWidth={1.5} />,
};

// ─── MENU ────────────────────────────────────────────────────────────────────
const MENU = [
  { id: "Dashboard", Icon: Icons.Dashboard },
  { id: "Products", Icon: Icons.Products },
  { id: "Orders", Icon: Icons.Orders },
  { id: "Delivery", Icon: Icons.Delivery },
  { id: "Support", Icon: Icons.Support },
];

const PIE_COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#14b8a6"];

// ─── INITIALS AVATAR ─────────────────────────────────────────────────────────
function Avatar({ name, size = 36 }) {
  const initials = (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      fontWeight: 700, fontSize: size * 0.36,
      color: "#fff", letterSpacing: "0.03em",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {initials || "V"}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    Placed: "badge-blue",
    Accepted: "badge-indigo",
    Preparing: "badge-orange",
    Ready: "badge-yellow",
    Assigned: "badge-purple",
    Picked: "badge-cyan",
    "On the way": "badge-sky",
    Delivered: "badge-green",
    Cancelled: "badge-red",
    Rejected: "badge-rose",
  };
  return (
    <span className={`gc-badge ${map[status] || "badge-gray"}`}>
      {status}
    </span>
  );
}

const EMPTY_FORM = {
  name: "", price: "", quantity: "", unit: "kg",
  category: "vegetables", description: "", stock: "In Stock", image: null,
};

export default function VendorDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [profile, setProfile] = useState(null);
  const [alert, setAlert] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("gc-theme") === "dark" ||
        (!localStorage.getItem("gc-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    return false;
  });

  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [agents, setAgents] = useState([]);
  const [assigningOrder, setAssigningOrder] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  const [rejectingOrder, setRejectingOrder] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [cancellingOrder, setCancellingOrder] = useState(null);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.setAttribute("data-theme", "dark");
      localStorage.setItem("gc-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
      localStorage.setItem("gc-theme", "light");
    }
  }, [darkMode]);

  const showAlert = (msg, type = "success") => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3500);
  };

  useEffect(() => {
    getProfile().then((r) => setProfile(r.data)).catch(() => {});
  }, []);

  const loadProducts = useCallback(() => {
    getMyProducts()
      .then((r) => setProducts(r.data))
      .catch(() => showAlert("Failed to load products", "error"));
  }, []);

  useEffect(() => {
    if (activeTab === "Products" || activeTab === "Dashboard") loadProducts();
  }, [activeTab, loadProducts]);

  const loadOrders = useCallback(() => {
    setLoadingOrders(true);
    getVendorOrders()
      .then((r) => setOrders(r.data))
      .catch(() => showAlert("Failed to load orders", "error"))
      .finally(() => setLoadingOrders(false));
  }, []);

  useEffect(() => {
    if (activeTab === "Orders" || activeTab === "Delivery" || activeTab === "Dashboard") loadOrders();
  }, [activeTab, loadOrders]);

  const loadAgents = useCallback(() => {
    getDeliveryAgents().then((r) => setAgents(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === "Delivery") loadAgents();
  }, [activeTab, loadAgents]);

  const handleSaveProduct = async () => {
    if (!form.name || !form.price || !form.quantity)
      return showAlert("Fill name, price, and quantity", "error");
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== null) fd.append(k, v); });
      if (imageFile) fd.append("image", imageFile);
      if (editId) {
        await updateProduct(editId, fd);
        showAlert("Product updated!");
      } else {
        await addProduct(fd);
        showAlert("Product added!");
      }
      setForm(EMPTY_FORM);
      setEditId(null);
      setShowForm(false);
      setImageFile(null);
      loadProducts();
    } catch (err) {
      showAlert(err.response?.data?.msg || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (p) => {
  setForm({
    name: p.name, price: p.price, quantity: p.quantity,
    unit: p.unit, category: p.category, description: p.description,
    stock: p.stock, image: null,
  });
    setEditId(p._id);
    setShowForm(true);
    setImageFile(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      showAlert("Product deleted");
      loadProducts();
    } catch {
      showAlert("Failed to delete", "error");
    }
  };

  const handleToggleStock = async (id) => {
    try {
      await toggleStock(id);
      loadProducts();
    } catch {
      showAlert("Failed to update stock", "error");
    }
  };

  const handleOrderAction = async (id, status, reason = "") => {
    try {
      await vendorUpdateOrder(id, status, reason);

      showAlert(`Order ${status.toLowerCase()}`);
      loadOrders();
      loadProducts();
    } catch (err) {
      showAlert(err.response?.data?.msg || "Failed", "error");
    }
  };

  const handleAssign = async () => {
    if (!selectedAgent) return showAlert("Select a delivery agent", "error");
    try {
      await assignDelivery(assigningOrder, selectedAgent);
      showAlert("Delivery agent assigned!");
      setAssigningOrder(null);
      setSelectedAgent("");
      loadOrders();
    } catch (err) {
      showAlert(err.response?.data?.msg || "Failed to assign", "error");
    }
  };

  const logout = () => { localStorage.clear(); navigate("/login"); };

  const deliveredOrders = orders.filter((o) => o.status === "Delivered");
  const totalRevenue = deliveredOrders.reduce((s, o) => s + (o.vendorEarnings || o.totalAmount), 0);
  const totalItemAmount = deliveredOrders.reduce((s, o) => s + (o.itemAmount || o.totalAmount), 0);
    const totalCommissionPaid = deliveredOrders.reduce((s, o) => s + ((o.itemAmount || 0) * 0.03), 0);
    const totalDiscountsGiven = deliveredOrders.reduce((s, o) => s + (o.discountApplied ? (o.discountAmount || 0) : 0), 0);
  const pending = orders.filter((o) => o.status === "Placed").length;
  const delivered = deliveredOrders.length;
  const inStock = products.filter((p) => p.stock === "In Stock").length;
  const filteredOrders = orderFilter === "all" ? orders : orders.filter((o) => o.status === orderFilter);

  const DAY_MAP = [
    { label: "Mon", day: 1 }, { label: "Tue", day: 2 }, { label: "Wed", day: 3 },
    { label: "Thu", day: 4 }, { label: "Fri", day: 5 }, { label: "Sat", day: 6 }, { label: "Sun", day: 0 },
  ];
  const now = new Date();
  const currentDayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  const diffToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  startOfWeek.setDate(now.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);
  const weeklyData = DAY_MAP.map(({ label, day }) => {
    const count = orders.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= startOfWeek && d.getDay() === day;
    }).length;
    return { day: label, orders: count };
  });

  const statusList = ["Placed", "Accepted", "Preparing", "Ready", "Assigned", "On the way", "Delivered", "Cancelled", "Rejected"];
  const pieData = statusList
    .map((s) => ({ name: s, value: orders.filter((o) => o.status === s).length }))
    .filter((d) => d.value > 0);

  const tooltipStyle = {
    backgroundColor: darkMode ? "#1e293b" : "#fff",
    border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
    borderRadius: "8px",
    color: darkMode ? "#f1f5f9" : "#1e293b",
    fontSize: "12px",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

        :root {
          --gc-bg: #f0fdf4;
          --gc-surface: #ffffff;
          --gc-surface-2: #f8fafc;
          --gc-border: #e2e8f0;
          --gc-border-strong: #cbd5e1;
          --gc-text: #0f172a;
          --gc-text-2: #475569;
          --gc-text-3: #94a3b8;
          --gc-primary: #059669;
          --gc-primary-dark: #047857;
          --gc-primary-light: #d1fae5;
          --gc-sidebar: #052e16;
          --gc-sidebar-accent: #065f46;
          --gc-sidebar-text: #a7f3d0;
          --gc-sidebar-active: #10b981;
          --gc-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
          --gc-shadow-md: 0 4px 12px rgba(0,0,0,0.08);
          --gc-radius: 12px;
          --gc-radius-sm: 8px;
          --gc-sidebar-w: 260px;
          --font-main: 'DM Sans', 'IBM Plex Sans', system-ui, sans-serif;
        }
        [data-theme="dark"] {
          --gc-bg: #030712;
          --gc-surface: #0f172a;
          --gc-surface-2: #1e293b;
          --gc-border: #1e293b;
          --gc-border-strong: #334155;
          --gc-text: #f1f5f9;
          --gc-text-2: #94a3b8;
          --gc-text-3: #475569;
          --gc-primary: #10b981;
          --gc-primary-dark: #059669;
          --gc-primary-light: #022c22;
          --gc-sidebar: #000000;
          --gc-sidebar-accent: #052e16;
          --gc-sidebar-text: #6ee7b7;
          --gc-sidebar-active: #10b981;
          --gc-shadow: 0 1px 3px rgba(0,0,0,0.4);
          --gc-shadow-md: 0 4px 16px rgba(0,0,0,0.4);
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--gc-bg); color: var(--gc-text); font-family: var(--font-main); }
        .gc-layout { display: flex; min-height: 100vh; background: var(--gc-bg); }

        /* SIDEBAR */
        .gc-sidebar {
          width: var(--gc-sidebar-w);
          position: fixed; top: 0; left: 0; bottom: 0;
          background: var(--gc-sidebar);
          display: flex; flex-direction: column;
          z-index: 40; overflow: hidden;
          border-right: 1px solid rgba(255,255,255,0.04);
        }
        .gc-sidebar-header {
          padding: 24px 20px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .gc-logo-row { display: flex; align-items: center; gap: 10px; }
        .gc-logo-icon { color: #10b981; flex-shrink: 0; }
        .gc-logo { font-size: 17px; font-weight: 800; color: #fff; letter-spacing: -0.5px; font-family: var(--font-main); }
        .gc-logo-sub { font-size: 10.5px; color: var(--gc-sidebar-text); margin-top: 3px; letter-spacing: 0.6px; text-transform: uppercase; font-weight: 500; }

        /* PROFILE CARD — initials + name only */
        .gc-profile-card {
          margin: 14px 16px 0;
          background: rgba(255,255,255,0.06);
          border-radius: var(--gc-radius-sm);
          padding: 11px 14px;
          border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; gap: 10px;
        }
        .gc-profile-name { font-size: 13px; font-weight: 600; color: #fff; font-family: var(--font-main); }

        .gc-nav { flex: 1; padding: 16px 12px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
        .gc-nav-btn {
          width: 100%; display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: var(--gc-radius-sm);
          border: none; cursor: pointer; font-size: 13px; font-weight: 500;
          background: transparent; color: rgba(255,255,255,0.6);
          transition: all 0.15s ease; text-align: left;
          font-family: var(--font-main);
        }
        .gc-nav-btn:hover { background: rgba(255,255,255,0.07); color: #fff; }
        .gc-nav-btn.active { background: var(--gc-sidebar-active); color: #fff; }
        .gc-nav-icon { width: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .gc-sidebar-footer { padding: 16px; border-top: 1px solid rgba(255,255,255,0.06); }
        .gc-logout-btn {
          width: 100%; padding: 10px; border-radius: var(--gc-radius-sm);
          background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.22);
          color: #fca5a5; font-size: 13px; font-weight: 600; cursor: pointer;
          transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px;
          font-family: var(--font-main);
        }
        .gc-logout-btn:hover { background: rgba(239,68,68,0.22); }

        /* MAIN */
        .gc-main {
          margin-left: var(--gc-sidebar-w);
          flex: 1; display: flex; flex-direction: column; min-height: 100vh;
        }
        .gc-topbar {
          position: sticky; top: 0; z-index: 30;
          background: var(--gc-surface);
          border-bottom: 1px solid var(--gc-border);
          padding: 0 32px;
          height: 60px; display: flex; align-items: center; justify-content: space-between;
        }
        .gc-topbar-title { font-size: 20px; font-weight: 700; color: var(--gc-text); font-family: var(--font-main); }
        .gc-topbar-right { display: flex; align-items: center; gap: 12px; }
        .gc-theme-btn {
          width: 40px; height: 22px; border-radius: 11px;
          background: var(--gc-border-strong);
          border: none; cursor: pointer; position: relative;
          transition: background 0.2s;
        }
        .gc-theme-btn.dark { background: var(--gc-primary); }
        .gc-theme-thumb {
          position: absolute; top: 3px; left: 3px;
          width: 16px; height: 16px; border-radius: 50%;
          background: #fff; transition: transform 0.2s;
          display: flex; align-items: center; justify-content: center;
        }
        .gc-theme-btn.dark .gc-theme-thumb { transform: translateX(18px); }
        .gc-content { padding: 28px 32px; flex: 1; }

        /* ALERT */
        .gc-alert {
          position: fixed; top: 20px; right: 20px; z-index: 9999;
          padding: 12px 20px; border-radius: var(--gc-radius-sm);
          font-size: 13px; font-weight: 600; color: #fff;
          box-shadow: var(--gc-shadow-md);
          animation: slideIn 0.2s ease;
          font-family: var(--font-main);
        }
        .gc-alert.success { background: #059669; }
        .gc-alert.error { background: #dc2626; }
        @keyframes slideIn { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

        /* CARDS */
        .gc-card {
          background: var(--gc-surface);
          border: 1px solid var(--gc-border);
          border-radius: var(--gc-radius);
          box-shadow: var(--gc-shadow);
        }
        .gc-card-p { padding: 24px; }

        /* KPI */
        .gc-kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
        .gc-kpi {
          background: var(--gc-surface);
          border: 1px solid var(--gc-border);
          border-radius: var(--gc-radius);
          padding: 20px 24px;
          box-shadow: var(--gc-shadow);
        }
        .gc-kpi-label { font-size: 11.5px; font-weight: 600; color: var(--gc-text-2); text-transform: uppercase; letter-spacing: 0.5px; font-family: var(--font-main); }
        .gc-kpi-value { font-size: 28px; font-weight: 800; margin-top: 6px; font-family: var(--font-main); letter-spacing: -0.5px; }
        .gc-kpi-icon { margin-bottom: 10px; display: block; color: var(--gc-primary); }
        .c-emerald { color: #059669; }
        .c-blue { color: #2563eb; }
        .c-yellow { color: #d97706; }
        .c-green { color: #16a34a; }
        .c-red { color: #dc2626; }
        

        /* SECTION HEADER */
        .gc-section-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 20px;
        }
        .gc-section-title { font-size: 15px; font-weight: 700; color: var(--gc-text); font-family: var(--font-main); display: flex; align-items: center; gap: 8px; }
        .gc-section-sub { font-size: 12px; color: var(--gc-text-3); margin-top: 3px; }

        /* EARNINGS BREAKDOWN */
        .gc-earn-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .gc-earn-card { border-radius: var(--gc-radius-sm); padding: 20px; }
        .gc-earn-green { background: #f0fdf4; border: 1px solid #bbf7d0; }
        .gc-earn-red { background: #fff1f2; border: 1px solid #fecdd3; }
        .gc-earn-blue { background: #eff6ff; border: 1px solid #bfdbfe; }
        [data-theme="dark"] .gc-earn-green { background: #022c22; border-color: #065f46; }
        [data-theme="dark"] .gc-earn-red { background: #1f0a0a; border-color: #7f1d1d; }
        [data-theme="dark"] .gc-earn-blue { background: #0a1628; border-color: #1e3a5f; }
        .gc-earn-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; font-family: var(--font-main); }
        .gc-earn-label-green { color: #059669; }
        .gc-earn-label-red { color: #dc2626; }
        .gc-earn-label-blue { color: #2563eb; }
        .gc-earn-amount { font-size: 26px; font-weight: 800; font-family: var(--font-main); letter-spacing: -0.5px; }
        .gc-earn-amount-green { color: #047857; }
        .gc-earn-amount-red { color: #b91c1c; }
        .gc-earn-amount-blue { color: #1d4ed8; }
        [data-theme="dark"] .gc-earn-amount-green { color: #34d399; }
        [data-theme="dark"] .gc-earn-amount-red { color: #f87171; }
        [data-theme="dark"] .gc-earn-amount-blue { color: #60a5fa; }

        /* BADGE */
        .gc-badge {
          display: inline-flex; align-items: center;
          font-size: 11px; font-weight: 700; padding: 3px 10px;
          border-radius: 99px; white-space: nowrap;
          font-family: var(--font-main);
        }
        .badge-blue { background: #dbeafe; color: #1d4ed8; }
        .badge-indigo { background: #e0e7ff; color: #4338ca; }
        .badge-orange { background: #ffedd5; color: #c2410c; }
        .badge-yellow { background: #fef9c3; color: #a16207; }
        .badge-purple { background: #f3e8ff; color: #7e22ce; }
        .badge-cyan { background: #cffafe; color: #0e7490; }
        .badge-sky { background: #e0f2fe; color: #0369a1; }
        .badge-green { background: #dcfce7; color: #15803d; }
        .badge-red { background: #fee2e2; color: #b91c1c; }
        .badge-rose { background: #ffe4e6; color: #be123c; }
        .badge-gray { background: #f1f5f9; color: #475569; }
        [data-theme="dark"] .badge-blue { background: #1e3a5f; color: #93c5fd; }
        [data-theme="dark"] .badge-indigo { background: #1e1b4b; color: #a5b4fc; }
        [data-theme="dark"] .badge-orange { background: #431407; color: #fb923c; }
        [data-theme="dark"] .badge-yellow { background: #422006; color: #fbbf24; }
        [data-theme="dark"] .badge-purple { background: #2e1065; color: #c084fc; }
        [data-theme="dark"] .badge-cyan { background: #083344; color: #22d3ee; }
        [data-theme="dark"] .badge-sky { background: #082f49; color: #38bdf8; }
        [data-theme="dark"] .badge-green { background: #052e16; color: #4ade80; }
        [data-theme="dark"] .badge-red { background: #450a0a; color: #f87171; }
        [data-theme="dark"] .badge-rose { background: #4c0519; color: #fb7185; }
        [data-theme="dark"] .badge-gray { background: #1e293b; color: #94a3b8; }

        /* FORM */
        .gc-form-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .gc-form-grid .span-2 { grid-column: span 2; }
        .gc-label { font-size: 11px; font-weight: 700; color: var(--gc-text-2); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: block; font-family: var(--font-main); }
        .gc-input, .gc-select {
          width: 100%; padding: 10px 12px; font-size: 14px;
          background: var(--gc-surface-2); color: var(--gc-text);
          border: 1px solid var(--gc-border); border-radius: var(--gc-radius-sm);
          outline: none; transition: border-color 0.15s, box-shadow 0.15s;
          font-family: var(--font-main);
        }
        .gc-input:focus, .gc-select:focus {
          border-color: var(--gc-primary);
          box-shadow: 0 0 0 3px rgba(16,185,129,0.15);
        }
        .gc-form-actions { display: flex; gap: 12px; margin-top: 20px; }

        /* BUTTONS */
        .gc-btn {
          padding: 10px 22px; border-radius: var(--gc-radius-sm);
          font-size: 13px; font-weight: 600; cursor: pointer;
          border: none; transition: all 0.15s; display: inline-flex; align-items: center; gap: 6px;
          font-family: var(--font-main);
        }
        .gc-btn-primary { background: var(--gc-primary); color: #fff; }
        .gc-btn-primary:hover { background: var(--gc-primary-dark); }
        .gc-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .gc-btn-ghost {
          background: transparent; color: var(--gc-text-2);
          border: 1px solid var(--gc-border);
        }
        .gc-btn-ghost:hover { background: var(--gc-surface-2); }
        .gc-btn-sm { padding: 7px 14px; font-size: 12px; }
        .gc-btn-danger { background: #dc2626; color: #fff; }
        .gc-btn-danger:hover { background: #b91c1c; }
        .gc-btn-edit { background: #2563eb; color: #fff; }
        .gc-btn-edit:hover { background: #1d4ed8; }
        .gc-btn-green { background: #16a34a; color: #fff; }
        .gc-btn-green:hover { background: #15803d; }
        .gc-btn-orange { background: #ea580c; color: #fff; }
        .gc-btn-orange:hover { background: #c2410c; }
        .gc-btn-amber { background: #d97706; color: #fff; }
        .gc-btn-amber:hover { background: #b45309; }
        .gc-btn-purple { background: #7c3aed; color: #fff; }
        .gc-btn-purple:hover { background: #6d28d9; }

        /* PRODUCTS GRID */
        .gc-products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
        .gc-product-card {
          background: var(--gc-surface);
          border: 1px solid var(--gc-border);
          border-radius: var(--gc-radius);
          overflow: hidden;
          transition: box-shadow 0.2s, transform 0.2s;
          box-shadow: var(--gc-shadow);
        }
        .gc-product-card:hover { box-shadow: var(--gc-shadow-md); transform: translateY(-1px); }
        .gc-product-img { width: 100%; height: 160px; object-fit: cover; }
        .gc-product-body { padding: 16px; }
        .gc-product-name { font-size: 15px; font-weight: 700; color: var(--gc-text); font-family: var(--font-main); }
        .gc-product-meta { font-size: 11px; color: var(--gc-text-3); margin-top: 2px; text-transform: capitalize; }
        .gc-stock-btn {
          font-size: 11px; padding: 4px 10px; border-radius: 99px;
          font-weight: 700; cursor: pointer; border: none; font-family: var(--font-main);
        }
        .gc-stock-in { background: #dcfce7; color: #15803d; }
        .gc-stock-out { background: #fee2e2; color: #b91c1c; }
        [data-theme="dark"] .gc-stock-in { background: #052e16; color: #4ade80; }
        [data-theme="dark"] .gc-stock-out { background: #450a0a; color: #f87171; }
        .gc-product-price { font-size: 18px; font-weight: 800; color: var(--gc-primary); font-family: var(--font-main); }
        .gc-product-qty { font-size: 12px; color: var(--gc-text-3); }
        .gc-product-actions { display: flex; gap: 8px; margin-top: 14px; }

        /* ORDER FILTER */
        .gc-filter-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
        .gc-filter-btn {
          padding: 6px 14px; border-radius: 99px; font-size: 12px; font-weight: 600;
          border: 1px solid var(--gc-border); background: var(--gc-surface);
          color: var(--gc-text-2); cursor: pointer; transition: all 0.15s;
          font-family: var(--font-main);
        }
        .gc-filter-btn:hover { border-color: var(--gc-primary); color: var(--gc-primary); }
        .gc-filter-btn.active { background: var(--gc-primary); color: #fff; border-color: var(--gc-primary); }

        /* ORDER CARD */
        .gc-order-card {
          background: var(--gc-surface);
          border: 1px solid var(--gc-border);
          border-radius: var(--gc-radius);
          padding: 20px 24px;
          box-shadow: var(--gc-shadow);
          margin-bottom: 14px;
        }
        .gc-order-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
        .gc-order-id { font-size: 15px; font-weight: 700; color: var(--gc-text); font-family: var(--font-main); }
        .gc-order-meta { font-size: 12px; color: var(--gc-text-3); margin-top: 3px; display: flex; align-items: center; gap: 6px; }
        .gc-order-amount { font-size: 18px; font-weight: 800; color: var(--gc-primary); font-family: var(--font-main); }
        .gc-order-items { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--gc-border); }
        .gc-order-item { font-size: 13px; color: var(--gc-text-2); padding: 3px 0; display: flex; align-items: center; gap: 6px; }
        .gc-fee-box {
          margin-top: 14px; background: var(--gc-surface-2);
          border: 1px solid var(--gc-border); border-radius: var(--gc-radius-sm);
          overflow: hidden;
        }
        .gc-fee-row { display: flex; justify-content: space-between; padding: 8px 14px; font-size: 13px; }
        .gc-fee-row:not(:last-child) { border-bottom: 1px solid var(--gc-border); }
        .gc-fee-total { font-weight: 700; color: var(--gc-primary); }
        .gc-order-info { margin-top: 10px; display: flex; gap: 16px; flex-wrap: wrap; }
        .gc-order-info-item { font-size: 12px; color: var(--gc-text-3); display: flex; align-items: center; gap: 5px; }
        .gc-flow-track { display: flex; align-items: center; gap: 0; margin-top: 16px; overflow-x: auto; padding: 10px 0; }
        .gc-flow-step { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
        .gc-flow-label { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 99px; font-family: var(--font-main); }
        .gc-flow-label.done { background: var(--gc-primary-light); color: var(--gc-primary-dark); }
        .gc-flow-label.current { background: var(--gc-primary); color: #fff; }
        .gc-flow-label.future { background: var(--gc-surface-2); color: var(--gc-text-3); }
        [data-theme="dark"] .gc-flow-label.done { background: #052e16; color: #34d399; }
        .gc-flow-arrow { color: var(--gc-text-3); font-size: 12px; margin: 0 2px; display: flex; align-items: center; }
        .gc-order-actions { margin-top: 16px; display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        .gc-assign-box {
          margin-top: 16px; padding: 16px;
          background: var(--gc-surface-2); border: 1px solid var(--gc-border);
          border-radius: var(--gc-radius-sm);
        }

        /* DELIVERY */
        .gc-agents-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
        .gc-agent-card {
          background: var(--gc-surface-2);
          border: 1px solid var(--gc-border);
          border-radius: var(--gc-radius-sm);
          padding: 16px;
        }
        .gc-agent-name { font-size: 16px; font-weight: 700; color: var(--gc-text); font-family: var(--font-main); }
        .gc-agent-meta { font-size: 12px; color: var(--gc-text-3); margin-top: 5px; display: flex; align-items: center; gap: 5px; }
        .gc-delivery-card {
          background: var(--gc-surface);
          border: 1px solid var(--gc-border);
          border-radius: var(--gc-radius);
          padding: 20px 24px;
          box-shadow: var(--gc-shadow);
          margin-bottom: 14px;
        }
        .gc-progress-bar { display: flex; align-items: center; margin-top: 16px; }
        .gc-progress-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .gc-progress-line { flex: 1; height: 2px; }
        .gc-prog-active { background: var(--gc-primary); }
        .gc-prog-inactive { background: var(--gc-border-strong); }
        .gc-prog-step { display: flex; align-items: center; flex: 1; }

        /* SUPPORT */
        .gc-support-header {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          border-radius: var(--gc-radius);
          padding: 32px 36px; color: #fff; margin-bottom: 24px;
        }
        [data-theme="dark"] .gc-support-header {
          background: linear-gradient(135deg, #065f46 0%, #052e16 100%);
        }
        .gc-support-title { font-size: 26px; font-weight: 800; font-family: var(--font-main); }
        .gc-support-sub { font-size: 14px; opacity: 0.85; margin-top: 6px; line-height: 1.5; }
        .gc-help-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px; }
        .gc-help-card {
          background: var(--gc-surface);
          border: 1px solid var(--gc-border);
          border-radius: var(--gc-radius);
          padding: 24px 28px;
          box-shadow: var(--gc-shadow);
        }
        .gc-help-icon { margin-bottom: 14px; display: block; color: var(--gc-primary); }
        .gc-help-title { font-size: 16px; font-weight: 700; color: var(--gc-text); margin-bottom: 10px; font-family: var(--font-main); }
        .gc-help-text { font-size: 14px; color: var(--gc-text-2); line-height: 1.7; }
        .gc-contact-card {
          background: var(--gc-surface);
          border: 1px solid var(--gc-border);
          border-radius: var(--gc-radius);
          padding: 28px 32px;
          box-shadow: var(--gc-shadow);
        }
        .gc-contact-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 16px; }
        .gc-contact-item { display: flex; flex-direction: column; gap: 4px; }
        .gc-contact-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--gc-text-3); font-family: var(--font-main); }
        .gc-contact-value { font-size: 14px; font-weight: 600; color: var(--gc-text); display: flex; align-items: center; gap: 6px; }
        .gc-contact-hours { font-size: 12px; color: var(--gc-text-3); }
        .gc-divider { height: 1px; background: var(--gc-border); margin: 24px 0; }

        /* RECENT ORDERS */
        .gc-recent-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 16px; border-radius: var(--gc-radius-sm);
          background: var(--gc-surface-2);
          border: 1px solid var(--gc-border);
          margin-bottom: 8px;
        }
        .gc-recent-id { font-size: 13px; font-weight: 700; color: var(--gc-text); font-family: var(--font-main); }
        .gc-recent-meta { font-size: 12px; color: var(--gc-text-3); margin-top: 2px; }

        /* EMPTY STATE */
        .gc-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 60px 20px; color: var(--gc-text-3);
          gap: 12px;
        }
        .gc-empty-icon { color: var(--gc-text-3); }
        .gc-empty-text { font-size: 14px; font-family: var(--font-main); }

        /* CHARTS */
        .gc-charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

        /* REFRESH */
        .gc-refresh {
          font-size: 13px; color: var(--gc-primary); cursor: pointer; font-weight: 600;
          background: none; border: none; display: flex; align-items: center; gap: 5px;
          font-family: var(--font-main);
        }
        .gc-sep { font-size: 20px; color: var(--gc-border-strong); }
        .gc-theme-label { font-size: 12px; color: var(--gc-text-3); font-weight: 500; font-family: var(--font-main); }

        @media (max-width: 1024px) {
          .gc-help-grid { grid-template-columns: 1fr; }
          .gc-charts-grid { grid-template-columns: 1fr; }
          .gc-earn-grid { grid-template-columns: 1fr; }
          .gc-contact-grid { grid-template-columns: 1fr 1fr; }
          .gc-form-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          :root { --gc-sidebar-w: 0px; }
          .gc-content { padding: 16px; }
          .gc-topbar { padding: 0 16px; }
          .gc-form-grid { grid-template-columns: 1fr; }
          .gc-form-grid .span-2 { grid-column: span 1; }
        }
      `}</style>

      <div className="gc-layout" data-theme={darkMode ? "dark" : undefined}>
        {alert && (
          <div className={`gc-alert ${alert.type}`}>{alert.msg}</div>
        )}

        {/* SIDEBAR */}
        <aside className="gc-sidebar">
          <div className="gc-sidebar-header">
            <div className="gc-logo-row">
              <span className="gc-logo-icon"><Icons.Leaf size={20} /></span>
              <div>
                <div className="gc-logo">GramConnect</div>
                <div className="gc-logo-sub">Vendor Panel</div>
              </div>
            </div>
          </div>

          {profile && (
            <div className="gc-profile-card">
              <Avatar name={profile.name} size={34} />
              <div className="gc-profile-name">{profile.name}</div>
            </div>
          )}

         <nav className="gc-nav">
  {MENU.map(({ id, Icon: NavIcon }) => (
    <button
      key={id}
      onClick={() => setActiveTab(id)}
      className={`gc-nav-btn ${activeTab === id ? "active" : ""}`}
    >
      <span className="gc-nav-icon"><NavIcon size={16} /></span>
      <span style={{ flex: 1 }}>{id}</span>
      {id === "Orders" && pending > 0 && (
        <span style={{
          background: "#ef4444",
          color: "#fff",
          fontSize: "10px",
          fontWeight: 700,
          borderRadius: "99px",
          padding: "2px 7px",
        }}>
          {pending}
        </span>
      )}
    </button>
  ))}
</nav>
          <div className="gc-sidebar-footer">
            <button onClick={logout} className="gc-logout-btn">
              <Icons.LogOut size={14} /> Sign Out
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="gc-main">
          <div className="gc-topbar">
            <div className="gc-topbar-title">{activeTab}</div>
            <div className="gc-topbar-right">
              <span className="gc-theme-label">{darkMode ? "Dark" : "Light"}</span>
              <button
                className={`gc-theme-btn ${darkMode ? "dark" : ""}`}
                onClick={() => setDarkMode(!darkMode)}
                aria-label="Toggle theme"
              >
                <div className="gc-theme-thumb" />
              </button>
              {activeTab === "Orders" && (
                
                <>
                  <span className="gc-sep">|</span>
                  <button onClick={loadOrders} className="gc-refresh">
                    <Icons.RefreshCw size={13} />
                    {loadingOrders ? "Loading…" : "Refresh"}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="gc-content">

            {/* ========== DASHBOARD ========== */}
            {activeTab === "Dashboard" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div className="gc-kpi-grid">
                  {[
                    { title: "Total Products", value: products.length, Icon: Icons.Products, cls: "c-emerald" },
{ title: "In Stock", value: inStock, Icon: Icons.Check, cls: "c-green" },
{ title: "Total Orders", value: orders.filter(o => !["Cancelled","Rejected"].includes(o.status)).length, Icon: Icons.Box, cls: "c-blue" },
{ title: "Pending", value: pending, Icon: Icons.Clock, cls: "c-yellow" },
{ title: "Delivered", value: delivered, Icon: Icons.Truck, cls: "c-green" },
{ title: "Net Earnings", value: `₹${totalRevenue.toFixed(2)}`, Icon: Icons.Currency, cls: "c-emerald" },
{ title: "Discounts Given", value: `₹${totalDiscountsGiven.toFixed(2)}`, Icon: Icons.Package, cls: "c-blue", sub: "Customer savings from your store" },
{ 
  title: "Rejected / Cancelled", 
  value: orders.filter(o => ["Rejected","Cancelled"].includes(o.status)).length, 
  Icon: Icons.X, 
  cls: "c-red",
  wide: true,
  sub: `Rejected by you: ${orders.filter(o => o.status === "Rejected").length}  ·  Cancelled by Customer: ${orders.filter(o => o.status === "Cancelled").length}`
},
                  ].map((s) => (
                   <div key={s.title} className="gc-kpi" style={s.wide ? { minWidth: "300px" } : {}}>
  <span className="gc-kpi-icon"><s.Icon size={20} /></span>
  <div className="gc-kpi-label">{s.title}</div>
  <div className={`gc-kpi-value ${s.cls}`}>{s.value}</div>
  {s.sub && <div style={{ fontSize: "11px", color: "var(--gc-text-3)", marginTop: "4px" }}>{s.sub}</div>}
</div>
                  ))}
                </div>

                <div className="gc-card gc-card-p">
                  <div className="gc-section-header">
                    <div>
                      <div className="gc-section-title">
                        <Icons.Currency size={16} /> Earnings Breakdown
                      </div>
                      <div className="gc-section-sub">Based on delivered orders only</div>
                    </div>
                  </div>
                  <div className="gc-earn-grid">
                    <div className="gc-earn-card gc-earn-green">
                      <div className="gc-earn-label gc-earn-label-green">Total Item Sales</div>
                      <div className="gc-earn-amount gc-earn-amount-green">₹{totalItemAmount.toFixed(2)}</div>
                    </div>
                    <div className="gc-earn-card gc-earn-red">
                      <div className="gc-earn-label gc-earn-label-red">Commission Paid (3%)</div>
                      <div className="gc-earn-amount gc-earn-amount-red">− ₹{totalCommissionPaid.toFixed(2)}</div>
                    </div>
                    <div className="gc-earn-card gc-earn-blue">
                      <div className="gc-earn-label gc-earn-label-blue">Net Earnings</div>
                      <div className="gc-earn-amount gc-earn-amount-blue">₹{totalRevenue.toFixed(2)}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--gc-text-3)" }}>
                    * 3% commission per delivered order goes to delivery partner
                  </div>
                </div>

                <div className="gc-charts-grid">
                  <div className="gc-card gc-card-p">
                    <div className="gc-section-title" style={{ marginBottom: "4px" }}>
                      <Icons.BarChart2 size={16} /> This Week's Orders
                    </div>
                    <div className="gc-section-sub" style={{ marginBottom: "20px" }}>Mon – Sun (current week)</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                        <XAxis dataKey="day" tick={{ fontSize: 11, fill: darkMode ? "#94a3b8" : "#64748b" }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: darkMode ? "#94a3b8" : "#64748b" }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="orders" fill="#10b981" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="gc-card gc-card-p">
                    <div className="gc-section-title" style={{ marginBottom: "4px" }}>
                      <Icons.PieChart size={16} /> Order Status Distribution
                    </div>
                    <div className="gc-section-sub" style={{ marginBottom: "20px" }}>All orders by current status</div>
                    {pieData.length === 0 ? (
                      <div className="gc-empty">
                        <span className="gc-empty-icon"><Icons.Inbox size={36} /></span>
                        <span className="gc-empty-text">No orders yet</span>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                            {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                          <Legend wrapperStyle={{ fontSize: "11px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="gc-card gc-card-p">
                  <div className="gc-section-header">
                    <div>
                      <div className="gc-section-title">
                        <Icons.Pin size={16} /> Recent Orders
                      </div>
                      <div className="gc-section-sub">Latest 6 orders at a glance</div>
                    </div>
                  </div>
                  {orders.length === 0 ? (
                    <div className="gc-empty">
                      <span className="gc-empty-icon"><Icons.Inbox size={36} /></span>
                      <span className="gc-empty-text">No orders yet</span>
                    </div>
                  ) : (
                    orders.slice(0, 6).map((o) => (
                      <div key={o._id} className="gc-recent-row">
                        <div>
                          <div className="gc-recent-id">{o.orderId}</div>
                          <div className="gc-recent-meta">
                            {o.customerName} &nbsp;•&nbsp; Item ₹{Number(o.itemAmount || o.totalAmount).toFixed(2)} → You get ₹{Number(o.vendorEarnings || o.totalAmount).toFixed(2)}
                          </div>
                        </div>
                        <StatusBadge status={o.status} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ========== PRODUCTS ========== */}
            {activeTab === "Products" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "14px", color: "var(--gc-text-2)" }}>
                    {products.length} products total &nbsp;•&nbsp; {inStock} in stock
                  </div>
                  <button
                    onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(!showForm); setImageFile(null); }}
                    className="gc-btn gc-btn-primary"
                  >
                    {showForm ? <><Icons.X size={14} /> Cancel</> : <><Icons.Plus size={14} /> Add Product</>}
                  </button>
                </div>

                {showForm && (
                  <div className="gc-card gc-card-p">
                    <div style={{ fontSize: "17px", fontWeight: 700, marginBottom: "20px", color: "var(--gc-text)", display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-main)" }}>
                      {editId ? <><Icons.Edit size={16} /> Edit Product</> : <><Icons.Plus size={16} /> New Product</>}
                    </div>
                    <div className="gc-form-grid">
                      {[
                        { key: "name", label: "Product Name", type: "text" },
                        { key: "price", label: "Price (₹)", type: "number" },
                        { key: "quantity", label: "Quantity", type: "number" },
                      ].map(({ key, label, type }) => (
                        <div key={key}>
                          <label className="gc-label">{label}</label>
                          <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="gc-input" placeholder={label} />
                        </div>
                      ))}
                      <div>
                        <label className="gc-label">Unit</label>
                        <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="gc-select">
                          {["kg", "g", "lit", "piece", "dozen", "bundle"].map((u) => <option key={u}>{u}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="gc-label">Category</label>
                        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="gc-select">
                          {["vegetables", "fruits", "grains", "dairy", "spices", "other"].map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="gc-label">Stock Status</label>
                        <select value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="gc-select">
                          <option>In Stock</option>
                          <option>Out of Stock</option>
                        </select>
                      </div>
                      
                      <div className="span-2">
                        <label className="gc-label">Description</label>
                        <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="gc-input" placeholder="Short product description" />
                      </div>
                      <div>
                        <label className="gc-label">Product Image</label>
                        <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="gc-input" style={{ padding: "8px 12px" }} />
                      </div>
                    </div>
                    <div className="gc-form-actions">
                      <button onClick={handleSaveProduct} disabled={saving} className="gc-btn gc-btn-primary">
                        {saving ? "Saving…" : editId ? "Update Product" : "Add Product"}
                      </button>
                      <button onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); setImageFile(null); }} className="gc-btn gc-btn-ghost">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {products.length === 0 ? (
                  <div className="gc-card">
                    <div className="gc-empty">
                      <span className="gc-empty-icon"><Icons.Products size={40} /></span>
                      <span className="gc-empty-text">No products yet. Add your first product!</span>
                    </div>
                  </div>
                ) : (
                  <div className="gc-products-grid">
                    {products.map((p) => (
                      <div key={p._id} className="gc-product-card">
                        <img
                          src={p.image ? `${BASE_URL}/${p.image}` : "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80"}
                          alt={p.name}
                          className="gc-product-img"
                          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80"; }}
                        />
                        <div className="gc-product-body">
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <div className="gc-product-name">{p.name}</div>
                              <div className="gc-product-meta">{p.category} • {p.vendorLocation}</div>
                            </div>
                            <button
                              onClick={() => handleToggleStock(p._id)}
                              className={`gc-stock-btn ${p.stock === "In Stock" ? "gc-stock-in" : "gc-stock-out"}`}
                            >
                              {p.stock}
                            </button>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                            <div className="gc-product-price">₹{p.price}/{p.unit}</div>
                            <div className="gc-product-qty">{p.quantity} {p.unit} avail.</div>
                          </div>
                          <div className="gc-product-actions">
                            <button onClick={() => handleEdit(p)} className="gc-btn gc-btn-sm gc-btn-edit" style={{ flex: 1 }}>
                              <Icons.Edit size={13} /> Edit
                            </button>
                            <button onClick={() => handleDelete(p._id)} className="gc-btn gc-btn-sm gc-btn-danger" style={{ flex: 1 }}>
                              <Icons.Trash size={13} /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========== ORDERS ========== */}
            {activeTab === "Orders" && (
              <div>
                {/* ── EARNINGS STATEMENT ── */}
    {orders.some(o => o.status === "Delivered") && (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
  <button
    onClick={() => {
      const token = localStorage.getItem("gc_token");
      window.open(
        `http://localhost:5000/api/orders/invoice/vendor-statement?token=${token}`,
        "_blank"
      );
    }}
    className="pill-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
    style={{
      background: "linear-gradient(135deg,#ea580c,#fb923c)",
      color: "#fff",
      boxShadow: "0 3px 10px rgba(234,88,12,0.22)",
      transition: "all 0.18s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-1px)";
      e.currentTarget.style.boxShadow =
        "0 5px 14px rgba(234,88,12,0.30)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow =
        "0 3px 10px rgba(234,88,12,0.22)";
    }}
  >
    🧾 Delivered Orders Statement
  </button>
</div>
    )}
                <div className="gc-filter-bar">
                  {["all", "Placed", "Accepted", "Preparing", "Ready", "Delivered", "Rejected", "Cancelled"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setOrderFilter(f)}
                      className={`gc-filter-btn ${orderFilter === f ? "active" : ""}`}
                    >
                      {f === "all" ? "All" : f} ({f === "all" ? orders.length : orders.filter((o) => o.status === f).length})
                    </button>
                  ))}
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="gc-card">
                    <div className="gc-empty">
                      <span className="gc-empty-icon"><Icons.Inbox size={36} /></span>
                      <span className="gc-empty-text">No orders to show</span>
                    </div>
                  </div>
                ) : (
                  filteredOrders.map((o) => (
                    <div key={o._id} className="gc-order-card">
                      <div className="gc-order-header">
                        <div>
                          <div className="gc-order-id">{o.orderId}</div>
                          <div className="gc-order-meta">
                            <Icons.User size={12} /> {o.customerName} &nbsp;•&nbsp; {new Date(o.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <StatusBadge status={o.status} />
                          <div style={{ textAlign: "right" }}>
                            <div className="gc-order-amount">₹{Number(o.totalAmount).toFixed(2)}</div>
                            <div style={{ fontSize: "10px", color: "var(--gc-text-3)", marginTop: "1px" }}>customer paid</div>
                            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--gc-primary)", marginTop: "2px" }}>₹{Number(o.vendorEarnings || o.totalAmount).toFixed(2)} your earnings</div>
                          </div>
                        </div>
                      </div>

                      <div className="gc-order-items">
                        {o.items.map((item, idx) => (
                          <div key={idx} className="gc-order-item">
                            <Icons.Dot size={6} /> {item.name} × {item.quantity} {item.unit}
                          </div>
                        ))}
                      </div>

                    <div className="gc-fee-box">
                        {/* ── Section 1: Customer paid ── */}
                        <div className="gc-fee-row" style={{ background: "var(--gc-primary-light)" }}>
                          <span style={{ color: "var(--gc-primary-dark)", fontWeight: 700 }}>💳 Customer Paid</span>
                          <span style={{ color: "var(--gc-primary-dark)", fontWeight: 700 }}>₹{Number(o.totalAmount).toFixed(2)}</span>
                        </div>

                        {/* ── Section 2: Breakdown of customer payment ── */}
                        <div className="gc-fee-row" style={{ fontSize: "11px" }}>
                          <span style={{ color: "var(--gc-text-3)" }}>Item Amount</span>
                          <span style={{ color: "var(--gc-text-3)" }}>₹{Number(o.itemAmount || o.totalAmount).toFixed(2)}</span>
                        </div>
                        {o.discountAmount > 0 && (
                          <div className="gc-fee-row" style={{ fontSize: "11px" }}>
                            <span style={{ color: "#7c3aed" }}>🎁 Discount ({o.discountPercent}% off)</span>
                            <span style={{ color: "#7c3aed" }}>− ₹{Number(o.discountAmount).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="gc-fee-row" style={{ fontSize: "11px" }}>
                          <span style={{ color: "var(--gc-text-3)" }}>🚴 Distance Charge</span>
                          <span style={{ color: "var(--gc-text-3)" }}>+ ₹{Number(o.distanceCharge || 0).toFixed(2)}</span>
                        </div>
                        <div className="gc-fee-row" style={{ fontSize: "11px", borderBottom: "2px solid var(--gc-border-strong)" }}>
                          <span style={{ color: "var(--gc-text-3)" }}>🏷️ Platform Fee</span>
                          <span style={{ color: "var(--gc-text-3)" }}>+ ₹{Number(o.platformFee || 10).toFixed(2)}</span>
                        </div>

                        {/* ── Section 3: Deductions from customer payment ── */}
                       <div className="gc-fee-row" style={{ fontSize: "11px", background: "#f1f5f9" }}>
  <span style={{ color: "#0d9488" }}>🏷️ Platform Fee (to admin after delivery)</span>
  <span style={{ color: "#0d9488" }}>− ₹{Number(o.platformFee || 10).toFixed(2)}</span>
</div>
                     <div className="gc-fee-row" style={{ fontSize: "11px" }}>
  <span style={{ color: "#ea580c" }}>🚴 Distance Fee (to delivery agent)</span>
  <span style={{ color: "#ea580c" }}>− ₹{Number(o.distanceCharge || 0).toFixed(2)}</span>
</div>
<div className="gc-fee-row" style={{ fontSize: "11px" }}>
  <span style={{ color: "#2563eb" }}>📊 3% Commission (to delivery agent)</span>
  <span style={{ color: "#2563eb" }}>− ₹{((Number(o.itemAmount || 0)) * 0.03).toFixed(2)}</span>
</div>

                        {/* ── Section 4: Your net earnings ── */}
                        <div className="gc-fee-row gc-fee-total" style={{ borderTop: "2px solid var(--gc-border-strong)", background: "#f0fdf4", padding: "12px 14px" }}>
  <span style={{ color: "#059669", display: "flex", alignItems: "center", gap: "8px", fontSize: "15px", fontWeight: 700 }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2z"/>
      <path d="M8 12l3 3 5-6"/>
    </svg>
    Your Net Earnings
  </span>
  <span style={{ color: "#059669", fontSize: "17px", fontWeight: 800 }}>₹{Number(o.vendorEarnings || o.totalAmount).toFixed(2)}</span>
</div>
                      </div>


                      <div className="gc-order-info">
                        <span className="gc-order-info-item"><Icons.CreditCard size={12} /> {o.paymentMethod}</span>
                        {o.customerPhone && <span className="gc-order-info-item"><Icons.Phone size={12} /> {o.customerPhone}</span>}
                        {o.deliveryAddress && <span className="gc-order-info-item"><Icons.MapPin size={12} /> {o.deliveryAddress}</span>}
                      </div>

                      <div className="gc-flow-track">
                        {["Placed", "Accepted", "Preparing", "Ready", "Assigned", "Delivered"].map((step, i, arr) => {
                          const steps = ["Placed", "Accepted", "Preparing", "Ready", "Assigned", "Delivered"];
                          const curIdx = steps.indexOf(o.status);
                          const stepIdx = i;
                          const cls = o.status === step ? "current" : curIdx > stepIdx ? "done" : "future";
                          return (
                            <div key={step} className="gc-flow-step">
                              <span className={`gc-flow-label ${cls}`}>{step}</span>
                              {i < arr.length - 1 && <span className="gc-flow-arrow"><Icons.Arrow size={12} /></span>}
                            </div>
                          );
                        })}
                      </div>

                      <div className="gc-order-actions">
                         {o.status === "Placed" && (
                          <>
                            <button onClick={() => handleOrderAction(o._id, "Accepted")} className="gc-btn gc-btn-sm gc-btn-green">
                              <Icons.Check size={13} /> Accept
                            </button>
                            <button
                              onClick={() => setRejectingOrder(rejectingOrder === o._id ? null : o._id)}
                              className="gc-btn gc-btn-sm gc-btn-danger">
                              <Icons.X size={13} /> Reject
                            </button>
                          </>
                        )}
                        {rejectingOrder === o._id && (
                          <div className="gc-assign-box" style={{ width: "100%", marginTop: "12px" }}>
                            <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px", color: "var(--gc-text)" }}>
                              Reason for Rejection
                            </div>
                            <input
                              className="gc-input"
                              placeholder="e.g. Out of stock, cannot fulfil order..."
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              style={{ marginBottom: "10px" }}
                            />
                            <div style={{ display: "flex", gap: "10px" }}>
                              <button
                                onClick={async () => {
                                  if (!rejectionReason.trim()) return showAlert("Please enter a rejection reason", "error");
                                  try {
                                    await vendorUpdateOrder(o._id, "Rejected", rejectionReason.trim());
                                    showAlert("Order rejected");
                                    setRejectingOrder(null);
                                    setRejectionReason("");
                                    loadOrders();
                                    loadProducts();
                                  } catch (err) {
                                    showAlert(err.response?.data?.msg || "Failed", "error");
                                  }
                                }}
                                className="gc-btn gc-btn-sm gc-btn-danger" style={{ flex: 1 }}>
                                Confirm Reject
                              </button>
                              <button
                                onClick={() => { setRejectingOrder(null); setRejectionReason(""); }}
                                className="gc-btn gc-btn-sm gc-btn-ghost" style={{ flex: 1 }}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                        {o.status === "Accepted" && (
                          <button onClick={() => handleOrderAction(o._id, "Preparing")} className="gc-btn gc-btn-sm gc-btn-orange">
                            <Icons.Box size={13} /> Mark Preparing
                          </button>
                        )}
                        {o.status === "Preparing" && (
                          <button onClick={() => handleOrderAction(o._id, "Ready")} className="gc-btn gc-btn-sm gc-btn-amber">
                            <Icons.Check size={13} /> Mark Ready
                          </button>
                        )}
                        {o.status === "Ready" && (
                          <button onClick={() => { setAssigningOrder(o._id); loadAgents(); }} className="gc-btn gc-btn-sm gc-btn-purple">
                            <Icons.Bike size={13} /> Assign Delivery
                          </button>
                        )}
                        {o.deliveryName && (
                          <span style={{ fontSize: "13px", color: "#7c3aed", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
                            <Icons.Bike size={13} /> {o.deliveryName}
                          </span>
                        )}
                        {o.status === "Rejected" && o.rejectionReason && (
                          <div style={{
                            width: "100%", marginTop: "8px", padding: "10px 14px",
                            background: "var(--gc-earn-red, #fff1f2)", border: "1px solid #fecdd3",
                            borderRadius: "8px", fontSize: "13px",
                          }}>
                            <span style={{ fontWeight: 700, color: "#b91c1c" }}>Rejection Reason: </span>
                            <span style={{ color: "var(--gc-text-2)" }}>{o.rejectionReason}</span>
                          </div>
                        )}
                        {o.status === "Cancelled" && o.cancelReason && (
                          <div style={{
                            width: "100%", marginTop: "8px", padding: "10px 14px",
                            background: "#fff7ed", border: "1px solid #fed7aa",
                            borderRadius: "8px", fontSize: "13px",
                          }}>
                            <span style={{ fontWeight: 700, color: "#c2410c" }}>Cancellation Reason by Customer: </span>
                            <span style={{ color: "var(--gc-text-2)" }}>{o.cancelReason}</span>
                          </div>
                        )}
                        {/* ── INVOICE BUTTON ── */}
                        <button
                          onClick={() => {
                            const token = localStorage.getItem("gc_token");
                            window.open(`http://localhost:5000/api/orders/${o._id}/invoice?token=${token}`, "_blank");
                          }}
                          className="gc-btn gc-btn-sm"
                          style={{ background: "#05966910", color: "#059669", border: "1px solid #05966930" }}>
                          🧾 Invoice
                        </button>
                      </div>

                      {assigningOrder === o._id && (
                        <div className="gc-assign-box">
                          <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px", color: "var(--gc-text)", fontFamily: "var(--font-main)" }}>Select Delivery Agent</div>
                          {agents.length === 0 ? (
                            <div style={{ fontSize: "13px", color: "var(--gc-text-3)" }}>No available agents</div>
                          ) : (
                            <select value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)} className="gc-select" style={{ marginBottom: "12px" }}>
                              <option value="">— Select Agent —</option>
                              {agents.map((a) => (
                                <option key={a._id} value={a._id}>{a.name} • {a.vehicleType} </option>
                              ))}
                            </select>
                          )}
                          <div style={{ display: "flex", gap: "10px" }}>
                            <button onClick={handleAssign} className="gc-btn gc-btn-purple" style={{ flex: 1 }}>Assign</button>
                            <button onClick={() => { setAssigningOrder(null); setSelectedAgent(""); }} className="gc-btn gc-btn-ghost" style={{ flex: 1 }}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ========== DELIVERY ========== */}
            {activeTab === "Delivery" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div className="gc-card gc-card-p">
                  <div className="gc-section-header">
                    <div>
                      <div className="gc-section-title">
                        <Icons.Bike size={16} /> Available Delivery Agents
                      </div>
                      <div className="gc-section-sub">{agents.length} approved agents</div>
                      <div style={{fontSize:"12px", color:"#f59e0b", marginTop:"3px", display:"flex", alignItems:"center", gap:"3px"}}>
  ⚠️ Hometown — not current delivery location
</div>
                    </div>

                  </div>
                  {agents.length === 0 ? (
                    <div className="gc-empty" style={{ padding: "30px" }}>
                      <span className="gc-empty-icon"><Icons.Bike size={36} /></span>
                      <span className="gc-empty-text">No approved delivery agents found</span>
                    </div>
                  ) : (
                    <div className="gc-agents-grid">
                      {agents.map((a) => (
                        <div key={a._id} className="gc-agent-card">
                          <div className="gc-agent-name">{a.name}</div>
                          <div className="gc-agent-meta"><Icons.Phone size={12} /> {a.phone}</div>
                          <div className="gc-agent-meta"><Icons.Truck size={12} /> {a.vehicleType} &nbsp;•&nbsp; <Icons.MapPin size={12} /> {a.location}</div>
                          </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--gc-text)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-main)" }}>
                    <Icons.Package size={16} /> Active Deliveries
                  </div>
                  {orders.filter((o) => ["Assigned", "Picked", "On the way"].includes(o.status)).length === 0 ? (
                    <div className="gc-card">
                      <div className="gc-empty">
                        <span className="gc-empty-icon"><Icons.Truck size={36} /></span>
                        <span className="gc-empty-text">No active deliveries</span>
                      </div>
                    </div>
                  ) : (
                    orders.filter((o) => ["Assigned", "Picked", "On the way"].includes(o.status)).map((o) => (
                      <div key={o._id} className="gc-delivery-card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--gc-text)", fontFamily: "var(--font-main)" }}>{o.orderId}</div>
                            <div style={{ fontSize: "13px", color: "var(--gc-text-2)", marginTop: "3px", display: "flex", alignItems: "center", gap: "6px" }}>
                              <Icons.User size={12} /> {o.customerName} &nbsp;•&nbsp; <Icons.MapPin size={12} /> {o.deliveryAddress}
                            </div>
                          </div>
                          <StatusBadge status={o.status} />
                        </div>
                        <div style={{ marginTop: "10px", fontSize: "13px", color: "var(--gc-text-2)" }}>
                          {o.items.map((i, idx) => <span key={idx}>• {i.name} {i.quantity}{i.unit} </span>)}
                        </div>
                        {o.deliveryName && (
                          <div style={{ marginTop: "8px", fontSize: "13px", color: "#7c3aed", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                            <Icons.Bike size={13} /> Agent: {o.deliveryName} &nbsp;•&nbsp; {o.deliveryPhone}
                          </div>
                        )}
                        <div className="gc-progress-bar">
                          {["Assigned", "Picked", "On the way", "Delivered"].map((step, i, arr) => {
                            const steps = ["Assigned", "Picked", "On the way", "Delivered"];
                            const active = steps.indexOf(o.status) >= i;
                            return (
                              <div key={step} className="gc-prog-step">
                                <div className={`gc-progress-dot ${active ? "gc-prog-active" : "gc-prog-inactive"}`} />
                                {i < arr.length - 1 && (
                                  <div className={`gc-progress-line ${steps.indexOf(o.status) > i ? "gc-prog-active" : "gc-prog-inactive"}`} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ========== SUPPORT ========== */}
            {activeTab === "Support" && (
              <div>
                <div className="gc-support-header">
                  <div className="gc-support-title">Help & Support Center</div>
                  <div className="gc-support-sub">
                    Everything you need to run your vendor business on GramConnect — from adding products
                    to managing orders, assigning deliveries, and understanding your earnings.
                  </div>
                </div>

                <div className="gc-help-grid">
                  {[
                    {
                      Icon: Icons.Plus,
                      title: "Adding & Managing Products",
                      text: "Navigate to the Products tab and click '+ Add Product'. Fill in the product name, price per unit, available quantity, category (vegetables, fruits, grains, dairy, spices, or other), and your pickup location. Upload a clear product image for better visibility in the customer shop. Once saved, the product appears instantly. You can edit details, toggle stock status between In Stock and Out of Stock, or delete a product at any time.",
                    },
                    {
                      Icon: Icons.Package,
                      title: "Managing Incoming Orders",
                      text: "All new orders appear in the Orders tab with a 'Placed' status. You have a short window to Accept or Reject each order — accepted orders should be acknowledged promptly to maintain your vendor rating. After accepting, update the status to Preparing once you begin packing, then mark it Ready when the order is packed and waiting for pickup. Use the filter bar at the top to sort orders by status for quick action.",
                    },
                    {
                      Icon: Icons.Bike,
                      title: "Assigning Delivery Agents",
                      text: "Once an order is marked Ready, the 'Assign Delivery' button becomes active. Click it to see the list of available and approved delivery agents along with their vehicle type and current location. Select the most suitable agent and confirm. The agent receives the task instantly on their app and will proceed to pick up the order. You can track active deliveries in real time from the Delivery tab.",
                    },
                    {
                      Icon: Icons.Currency,
                      title: "Understanding Your Earnings",
                      text: "Your earnings are calculated per delivered order. The full item amount is credited to you, minus a 3% commission that goes to the delivery partner as part of GramConnect's delivery incentive program. A separate platform fee of ₹10 is collected directly from the customer and does not affect your payout. Your net earnings are visible in the Dashboard under the Earnings Breakdown section, updated in real time as orders are delivered.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="gc-help-card">
                      <span className="gc-help-icon"><item.Icon size={28} /></span>
                      <div className="gc-help-title">{item.title}</div>
                      <div className="gc-help-text">{item.text}</div>
                    </div>
                  ))}
                </div>

                <div className="gc-contact-card">
                  <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--gc-text)", display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-main)" }}>
                    <Icons.Phone size={16} /> Contact Support
                  </div>
                  <div className="gc-divider" style={{ margin: "14px 0" }} />
                  <div className="gc-contact-grid">
                    <div className="gc-contact-item">
                      <span className="gc-contact-label">Email</span>
                      <span className="gc-contact-value"><Icons.Mail size={14} /> support@gramconnect.com</span>
                      <span className="gc-contact-hours">Typically replies within 2 hours</span>
                    </div>
                    <div className="gc-contact-item">
                      <span className="gc-contact-label">Phone / WhatsApp</span>
                      <span className="gc-contact-value"><Icons.Phone size={14} /> +91 98765 43210</span>
                      <span className="gc-contact-hours">Mon – Sat, 9 AM – 8 PM IST</span>
                    </div>
                    <div className="gc-contact-item">
                      <span className="gc-contact-label">Operating Hours</span>
                      <span className="gc-contact-value">Monday – Saturday</span>
                      <span className="gc-contact-hours">9:00 AM – 8:00 PM IST</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
        <AIChatBot role="vendor" darkMode={darkMode} />
      </div>
    </>
  );
}
