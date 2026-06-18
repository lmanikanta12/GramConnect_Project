import { useState, useEffect, useCallback } from "react";
import AIChatBot from "../components/AIChatBot";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  getProducts, getMyOrders, placeOrder, cancelOrder, rateOrder, getProfile, BASE_URL,
} from "../api";

const MENU = ["Dashboard", "Shop", "Cart", "Orders", "Support"];

// ── Theme tokens ──────────────────────────────────────────────
const THEMES = {
  dark: {
    bg:        "#0a0a0f",
    surface:   "#0f172a",
    surface2:  "#0a0a0f",
    border:    "#1e293b",
    border2:   "#334155",
    text:      "#e2e8f0",
    textSub:   "#94a3b8",
    textMuted: "#475569",
    inputBg:   "#0f172a",
    navActive: "#1e293b",
    navBorder: "#334155",
    tagBg:     "#1e293b",
    shimmer1:  "#111827",
    shimmer2:  "#1e293b",
    tooltipBg: "#1e293b",
    tooltipBorder: "#334155",
    successBg: "#064e3b",
    errorBg:   "#7f1d1d",
    successText:"#6ee7b7",
    errorText: "#fca5a5",
  },
  light: {
    bg:        "#f8fafc",
    surface:   "#ffffff",
    surface2:  "#f1f5f9",
    border:    "#e2e8f0",
    border2:   "#cbd5e1",
    text:      "#0f172a",
    textSub:   "#475569",
    textMuted: "#94a3b8",
    inputBg:   "#ffffff",
    navActive: "#f1f5f9",
    navBorder: "#e2e8f0",
    tagBg:     "#f1f5f9",
    shimmer1:  "#e2e8f0",
    shimmer2:  "#f1f5f9",
    tooltipBg: "#1e293b",
    tooltipBorder: "#334155",
    successBg: "#d1fae5",
    errorBg:   "#fee2e2",
    successText:"#065f46",
    errorText: "#991b1b",
  },
};

const STATUS_CONFIG = {
  Placed:      { color: "#3b82f6", bg: "rgba(59,130,246,0.1)",  dot: "#3b82f6" },
  Accepted:    { color: "#6366f1", bg: "rgba(99,102,241,0.1)",  dot: "#6366f1" },
  Preparing:   { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  dot: "#f59e0b" },
  Ready:       { color: "#eab308", bg: "rgba(234,179,8,0.1)",   dot: "#eab308" },
  Assigned:    { color: "#8b5cf6", bg: "rgba(139,92,246,0.1)",  dot: "#8b5cf6" },
  Picked:      { color: "#06b6d4", bg: "rgba(6,182,212,0.1)",   dot: "#06b6d4" },
  "On the way":{ color: "#0ea5e9", bg: "rgba(14,165,233,0.1)",  dot: "#0ea5e9" },
  Delivered:   { color: "#10b981", bg: "rgba(16,185,129,0.1)",  dot: "#10b981" },
  Cancelled:   { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   dot: "#ef4444" },
  Rejected:    { color: "#dc2626", bg: "rgba(220,38,38,0.1)",   dot: "#dc2626" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { color: "#6b7280", bg: "rgba(107,114,128,0.1)" };
  return (
    <span style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30` }}
      className="text-[11px] px-2.5 py-1 rounded-full font-semibold tracking-wide flex items-center gap-1.5 w-fit">
      <span style={{ background: cfg.dot }} className="w-1.5 h-1.5 rounded-full inline-block" />
      {status}
    </span>
  );
}

const STEPS = ["Placed", "Accepted", "Preparing", "Assigned", "On the way", "Delivered"];

function TrackingBar({ status, t }) {
  const idx = STEPS.indexOf(status);
  return (
    <div className="mt-4 px-1">
      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 right-0 top-3 h-0.5 z-0" style={{ background: t.border }} />
        <div className="absolute left-0 top-3 h-0.5 z-0 transition-all duration-700"
          style={{ width: `${(idx / (STEPS.length - 1)) * 100}%`, background: "linear-gradient(90deg,#10b981,#06b6d4)" }} />
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-col items-center z-10 gap-1.5">
            <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500"
              style={{
                borderColor: i <= idx ? (i === idx ? "#06b6d4" : "#10b981") : t.border2,
                background:  i < idx ? "#10b981" : i === idx ? "#06b6d4" : t.surface,
                boxShadow:   i === idx ? "0 0 12px rgba(6,182,212,0.5)" : "none",
              }}>
              {i < idx && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
              {i === idx && <span className="w-2 h-2 rounded-full bg-white" />}
            </div>
            <span className="text-[9px] text-center leading-tight" style={{ color: t.textMuted, maxWidth: 48 }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: "#1e293b", border: "1px solid #334155" }} className="rounded-xl px-4 py-2.5 shadow-2xl">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <p className="text-emerald-400 font-bold text-sm">{payload[0].value} delivered</p>
      </div>
    );
  }
  return null;
};

// ── Theme Toggle Button ───────────────────────────────────────
function ThemeToggle({ dark, onToggle, t }) {
  return (
    <button onClick={onToggle}
      className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300"
      style={{ background: t.navActive, border: `1px solid ${t.navBorder}` }}
      title={dark ? "Switch to Light" : "Switch to Dark"}>
      <span className="text-sm">{dark ? "🌙" : "☀️"}</span>
      {/* pill track */}
      <div className="relative w-9 h-5 rounded-full transition-all duration-300"
        style={{ background: dark ? "#10b981" : "#cbd5e1" }}>
        <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300"
          style={{ left: dark ? "calc(100% - 18px)" : "2px" }} />
      </div>
    </button>
  );
}

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [profile, setProfile]     = useState(null);
  const [dark, setDark]           = useState(true);   // ← theme state

  const t = dark ? THEMES.dark : THEMES.light;         // ← active tokens

  // Shop
  const [products, setProducts]         = useState([]);
  const [search, setSearch]             = useState("");
  const [category, setCategory]         = useState("all");
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Cart
  const [cart, setCart]       = useState([]);
  const [cartQty, setCartQty] = useState({});

  // Checkout
  const [showCheckout, setShowCheckout]   = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [upiId, setUpiId]                 = useState("");
  const [cardDetails, setCardDetails]     = useState({ number: "", expiry: "", cvv: "" });
  const [savedPayment, setSavedPayment]   = useState(false);
  const [orderSuccess, setOrderSuccess]   = useState(false);
  const [placingOrder, setPlacingOrder]   = useState(false);
 
  // Distance fee state
  const [feeData, setFeeData]         = useState(null);
  const [loadingFee, setLoadingFee]   = useState(false);
 
  // Discount state
  const [discountApplied, setDiscountApplied] = useState(true);

  // Shipping address state
  const [showAddressStep, setShowAddressStep] = useState(false);
 const [shippingCity, setShippingCity]       = useState("");
  const [cityIsOther, setCityIsOther]         = useState(false);
 const [shippingFullAddress, setShippingFullAddress] = useState("");
  const [shippingPincode, setShippingPincode]         = useState("");

  // Orders
  const [orders, setOrders]           = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ratingOrder, setRatingOrder] = useState(null);
  const [ratingVal, setRatingVal]     = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState("");
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelReason, setCancelReason]       = useState("");

  // Alerts
  const [alert, setAlert] = useState(null);

  const showAlert = (msg, type = "success") => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3500);
  };

  useEffect(() => {
    getProfile().then((r) => setProfile(r.data)).catch(() => {});
  }, []);

  const loadProducts = useCallback(() => {
    setLoadingProducts(true);
    getProducts({ search, category })
      .then((r) => setProducts(r.data))
      .catch(() => showAlert("Failed to load products", "error"))
      .finally(() => setLoadingProducts(false));
  }, [search, category]);

  useEffect(() => {
    if (activeTab === "Shop") loadProducts();
  }, [activeTab, loadProducts]);

  const loadOrders = useCallback(() => {
    setLoadingOrders(true);
    getMyOrders()
      .then((r) => setOrders(r.data))
      .catch(() => showAlert("Failed to load orders", "error"))
      .finally(() => setLoadingOrders(false));
  }, []);

  useEffect(() => {
    if (activeTab === "Orders" || activeTab === "Dashboard") loadOrders();
  }, [activeTab, loadOrders]);

  const totalCartItems = cart.reduce((s, i) => s + i.quantity, 0);
const uniqueVendors = [...new Set(cart.map(i => i.vendorId).filter(Boolean))];
const isMultiVendor = uniqueVendors.length > 1;

 const addToCart = (product) => {
    const qty = cartQty[product._id] || 1;
    setCart((prev) => {
      const exists = prev.find((i) => i._id === product._id);
      if (exists)
        return prev.map((i) =>
          i._id === product._id
            ? { ...i, quantity: i.quantity + qty, totalPrice: (i.quantity + qty) * i.price }
            : i
        );
      return [...prev, { ...product, quantity: qty, totalPrice: qty * product.price }];
    });
    setCartQty((prev) => { const u = { ...prev }; delete u[product._id]; return u; });
    // Reset checkout state so adding new item doesn't skip to payment
    setShowCheckout(false);
    setShowAddressStep(false);
    setFeeData(null);
    setSavedPayment(false);
    setPaymentMethod("");
    showAlert(`${product.name} added to cart`);
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((i) => i._id !== id));


  // Step 1: Show address form
  const handleProceedToCheckout = () => {
    if (cart.length === 0) return;
    setShippingCity("");
    setShippingFullAddress("");
    setShippingPincode("");
    setCityIsOther(false);
    setShowAddressStep(true);
    setFeeData(null);
    setDiscountApplied(true); // reset to auto-apply
  };

  // Step 2: Calculate fee using selected shipping address
  const calculateFee = async () => {
    if (!shippingCity.trim()) return showAlert("Please select a city", "error");
    if (!shippingFullAddress.trim()) return showAlert("Please enter your street address", "error");
    if (shippingPincode.length !== 6) return showAlert("Please enter a valid 6-digit PIN code", "error");

    const vendorIds = [...new Set(cart.map(i => i.vendorId).filter(Boolean))];
    if (vendorIds.length === 0) return showAlert("Vendor info missing", "error");

    setLoadingFee(true);
    try {
      const token = localStorage.getItem("gc_token");
      const res = await fetch("http://localhost:5000/api/orders/calculate-fees", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ vendorId: vendorIds[0], shippingCity: shippingCity.trim() }),
      });
      const data = await res.json();
      if (!res.ok) return showAlert(data.msg || "Failed to calculate fee", "error");
      setFeeData(data);
      setShowAddressStep(false);
      setShowCheckout(true);
    } catch {
      showAlert("Failed to calculate fee", "error");
    } finally {
      setLoadingFee(false);
    }
  };

 const PLATFORM_FEE = 10;
  const itemTotal = cart.reduce((s, i) => s + i.totalPrice, 0);

  // Discount logic based on itemTotal
  const getDiscountInfo = (total) => {
    if (total >= 1000) return { percent: 20, amount: parseFloat((total * 0.20).toFixed(2)) };
    if (total >= 500)  return { percent: 15, amount: parseFloat((total * 0.15).toFixed(2)) };
    if (total >= 300)  return { percent: 10, amount: parseFloat((total * 0.10).toFixed(2)) };
    return { percent: 0, amount: 0 };
  };
  const discountInfo = getDiscountInfo(itemTotal);
  const hasDiscount = discountInfo.percent > 0;
  const effectiveDiscount = hasDiscount && discountApplied ? discountInfo.amount : 0;
  const cartTotal = parseFloat((itemTotal - effectiveDiscount + PLATFORM_FEE + (feeData?.distanceCharge || 0)).toFixed(2));


  const handlePlaceOrder = async () => {
    if (!paymentMethod) return showAlert("Select a payment method", "error");
    setPlacingOrder(true);
    try {
      const items = cart.map((i) => ({
  productId: i._id, name: i.name, price: i.price, quantity: i.quantity,
  unit: i.unit || "kg", totalPrice: i.totalPrice, vendorId: i.vendorId, vendorName: i.vendorName,
  image: i.image || "",  // 👈 ADD THIS LINE
}));
     await placeOrder({
        items,
        deliveryAddress: `${shippingFullAddress}, ${shippingCity}, ${shippingPincode}` || profile?.location || "Home",
        shippingCity: shippingCity,
        paymentMethod,
        totalAmount: cartTotal,
        discountPercent: hasDiscount && discountApplied ? discountInfo.percent : 0,
        discountAmount:  hasDiscount && discountApplied ? discountInfo.amount  : 0,
        discountApplied: hasDiscount && discountApplied,
      });
      setOrderSuccess(true); setCart([]); setShowCheckout(false);
      setSavedPayment(false); setPaymentMethod(""); loadOrders();
    } catch (err) {
      showAlert(err.response?.data?.msg || "Failed to place order", "error");
    } finally { setPlacingOrder(false); }
  };

  const handleCancel = async (id, reason) => {
    if (!reason || !reason.trim()) return showAlert("Please enter a cancellation reason", "error");
    try {
      await cancelOrder(id, reason.trim());
      showAlert("Order cancelled");
      setCancellingOrder(null);
      setCancelReason("");
      loadOrders();
    } catch (err) { showAlert(err.response?.data?.msg || "Cannot cancel", "error"); }
  };

  const handleRate = async (id) => {
    try {
      await rateOrder(id, { rating: ratingVal, feedback: ratingFeedback });
      showAlert("Thank you for your feedback!"); setRatingOrder(null); loadOrders();
    } catch (err) { showAlert("Failed to submit rating", "error"); }
  };

  const logout = () => { localStorage.clear(); navigate("/login"); };

  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
    delivered: orders.filter((o) => o.status === "Delivered" && new Date(o.createdAt).getMonth() === i).length,
  }));

  const stats = [
    { label: "Total Orders", value: orders.filter(o => !["Cancelled","Rejected"].includes(o.status)).length, icon: "📦", accent: "#10b981", sub: "All time" },
    { label: "Delivered",    value: orders.filter(o => o.status === "Delivered").length,  icon: "✅", accent: "#06b6d4", sub: "Successfully done" },
    { label: "Pending",      value: orders.filter(o => !["Delivered","Cancelled","Rejected"].includes(o.status)).length, icon: "⏳", accent: "#f59e0b", sub: "In progress" },
    { label: "Total Spent", value: `₹${orders.filter(o => o.status === "Delivered").reduce((s,o) => s + o.totalAmount, 0).toFixed(2)}`, icon: "💰", accent: "#8b5cf6", sub: "On delivered orders" },
  ];

  // ── Shared style helpers ──────────────────────────────────────
  const card   = { background: t.surface,  border: `1px solid ${t.border}` };
  const card2  = { background: t.surface2, border: `1px solid ${t.border}` };
  const input  = { background: t.inputBg,  border: `1px solid ${t.border}`, color: t.text, outline: "none" };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: t.bg, minHeight: "100vh", color: t.text, transition: "background 0.3s, color 0.3s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        .nav-btn  { transition: all 0.2s; }
        .card-hover { transition: all 0.25s cubic-bezier(.4,0,.2,1); }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
        .pill-btn { transition: all 0.2s; }
        .pill-btn:hover { opacity: 0.88; transform: scale(0.98); }
        .glow-green { box-shadow: 0 0 20px rgba(16,185,129,0.25); }
        .product-img { transition: transform 0.4s ease; }
        .card-hover:hover .product-img { transform: scale(1.05); }
        .fade-in { animation: fadeIn 0.35s ease; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .alert-in { animation: alertIn 0.3s cubic-bezier(.175,.885,.32,1.275); }
        @keyframes alertIn { from { opacity:0; transform:translateX(20px) scale(0.95); } to { opacity:1; transform:translateX(0) scale(1); } }
        .shimmer { animation: shimmer 1.5s infinite; }
        @keyframes shimmer { 0% { opacity:0.6; } 50% { opacity:1; } 100% { opacity:0.6; } }
      `}</style>

      {/* ALERT */}
      {alert && (
        <div className="alert-in fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-medium"
          style={{ background: alert.type === "error" ? t.errorBg : t.successBg, color: alert.type === "error" ? t.errorText : t.successText, border: `1px solid ${alert.type === "error" ? "#ef444430" : "#10b98130"}` }}>
          <span>{alert.type === "error" ? "⚠️" : "✓"}</span>{alert.msg}
        </div>
      )}

      {/* HEADER */}
      <header style={{ background: dark ? "rgba(10,10,15,0.95)" : "rgba(255,255,255,0.95)", borderBottom: `1px solid ${t.border}`, backdropFilter: "blur(20px)", transition: "all 0.3s" }}
        className="sticky top-0 z-40 px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-3 mr-auto">
          <div style={{ background: "linear-gradient(135deg,#10b981,#06b6d4)", borderRadius: 10 }} className="w-8 h-8 flex items-center justify-center text-sm font-bold text-white">G</div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15 }} className={dark ? "text-white" : "text-gray-900"}>GramConnect</span>
          <span style={{ background: "#10b98120", color: "#10b981", fontSize: 10, border: "1px solid #10b98130" }} className="px-2 py-0.5 rounded-full font-semibold tracking-wider">CUSTOMER</span>
        </div>

        <nav className="flex gap-1">
          {MENU.map((m) => (
            <button key={m} onClick={() => { setActiveTab(m); setOrderSuccess(false); }}
              className="nav-btn px-4 py-2 rounded-xl text-xs font-medium"
              style={{ color: activeTab === m ? t.text : t.textMuted, background: activeTab === m ? t.navActive : "transparent", border: activeTab === m ? `1px solid ${t.navBorder}` : "1px solid transparent" }}>
              {m === "Cart" && totalCartItems > 0
                ? <span>Cart <span style={{ background: "#10b981", color: "#fff" }} className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full">{totalCartItems}</span></span>
                : m}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3 ml-2">
          {/* ── THEME TOGGLE ── */}
          <ThemeToggle dark={dark} onToggle={() => setDark(d => !d)} t={t} />

          {profile && (
            <div className="flex items-center gap-2">
              <div style={{ background: "linear-gradient(135deg,#10b981,#06b6d4)" }} className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white">
                {profile.name?.[0]?.toUpperCase()}
              </div>
              <span className="text-xs" style={{ color: t.textSub }}>{profile.name}</span>
            </div>
          )}
          <button onClick={logout} className="pill-btn px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: dark ? "#7f1d1d20" : "#fee2e2", color: dark ? "#fca5a5" : "#991b1b", border: `1px solid ${dark ? "#7f1d1d40" : "#fecaca"}` }}>
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* ========== DASHBOARD ========== */}
        {activeTab === "Dashboard" && (
          <div className="fade-in space-y-8">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: t.textMuted }}>Overview</p>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 28, color: t.text }}>
                  Welcome back{profile ? `, ${profile.name.split(" ")[0]}` : ""} 👋
                </h2>
                <p className="text-sm mt-1" style={{ color: t.textSub }}>Here's what's happening with your orders today.</p>
              </div>
              <button onClick={() => setActiveTab("Shop")} className="pill-btn px-5 py-2.5 rounded-xl text-sm font-semibold glow-green"
                style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff" }}>
                + New Order
              </button>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="card-hover rounded-2xl p-5" style={card}>
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-xs font-medium uppercase tracking-widest" style={{ color: t.textMuted }}>{s.label}</p>
                    <span className="text-lg">{s.icon}</span>
                  </div>
                  <p className="text-3xl font-bold mb-1" style={{ color: s.accent, fontFamily: "'Syne',sans-serif" }}>{s.value}</p>
                  <p className="text-xs" style={{ color: t.textMuted }}>{s.sub}</p>
                  <div className="mt-3 h-0.5 rounded-full" style={{ background: `${s.accent}25` }}>
                    <div className="h-full rounded-full" style={{ background: s.accent, width: "60%" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* CHART */}
            <div className="rounded-2xl p-6" style={card}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: t.textMuted }}>Analytics</p>
                  <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: t.text }}>Monthly Deliveries</h3>
                </div>
                <span style={{ background: "#10b98115", color: "#10b981", border: "1px solid #10b98130" }} className="text-xs px-3 py-1 rounded-full font-medium">2026</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData} barSize={24}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: t.textMuted }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: t.textMuted }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                  <Bar dataKey="delivered" radius={[6,6,0,0]}>
                    {monthlyData.map((entry, index) => (
                      <Cell key={index} fill={entry.delivered > 0 ? "url(#greenGrad)" : t.border} />
                    ))}
                  </Bar>
                  <defs>
                    <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* RECENT ORDERS */}
            <div className="rounded-2xl" style={card}>
              <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${t.border}` }}>
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: t.text }}>Recent Orders</h3>
                <button onClick={() => setActiveTab("Orders")} className="text-xs text-emerald-500 hover:text-emerald-400 transition">View all →</button>
              </div>
              {orders.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-4xl mb-3">🛒</p>
                  <p className="text-sm" style={{ color: t.textSub }}>No orders yet.</p>
                  <button onClick={() => setActiveTab("Shop")} className="mt-3 text-emerald-500 text-sm underline">Start shopping →</button>
                </div>
              ) : (
                orders.slice(0, 5).map((o, i) => (
                  <div key={o._id} className="px-6 py-4 flex items-center justify-between hover:opacity-80 transition"
                    style={{ borderBottom: i < Math.min(orders.length,5)-1 ? `1px solid ${t.border}` : "none" }}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: t.tagBg }}>📦</div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: t.text }}>{o.orderId}</p>
                        <p className="text-xs mt-0.5" style={{ color: t.textSub }}>{o.items?.[0]?.name}{o.items?.length > 1 ? ` +${o.items.length-1} more` : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                     <span className="font-bold text-emerald-500">₹{Number(o.totalAmount).toFixed(2)}</span>
                      <StatusBadge status={o.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========== SHOP ========== */}
        {activeTab === "Shop" && (
          <div className="fade-in space-y-6">
            <div>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: t.textMuted }}>Marketplace</p>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 28, color: t.text }}>Fresh Market</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex items-center gap-3 rounded-xl px-4 py-2.5" style={input}>
                <span style={{ color: t.textMuted }}>🔍</span>
                <input placeholder="Search products..." value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadProducts()}
                  style={{ background: "transparent", color: t.text, outline: "none", border: "none", flex: 1, fontSize: 14 }}
                  className="placeholder-gray-400" />
              </div>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="rounded-xl px-4 py-2.5 text-sm" style={input}>
                <option value="all">All Categories</option>
                <option value="vegetables">Vegetables</option>
                <option value="fruits">Fruits</option>
                <option value="grains">Grains</option>
                <option value="dairy">Dairy</option>
                <option value="spices">Spices</option>
                <option value="other">Other</option>
              </select>
              <button onClick={loadProducts} className="pill-btn px-6 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff" }}>Search</button>
            </div>

            {loadingProducts ? (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden" style={card}>
                    <div className="shimmer h-44 w-full" style={{ background: t.tagBg }} />
                    <div className="p-4 space-y-2">
                      <div className="shimmer h-4 rounded-lg w-3/4" style={{ background: t.tagBg }} />
                      <div className="shimmer h-3 rounded-lg w-1/2" style={{ background: t.tagBg }} />
                      <div className="shimmer h-8 rounded-lg w-full mt-3" style={{ background: t.tagBg }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-5xl mb-4">🌾</p>
                <p style={{ color: t.textSub }}>No products found</p>
                <p className="text-sm mt-1" style={{ color: t.textMuted }}>Try a different search or category</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p) => {
                  const qty = cartQty[p._id] || 0;
                  const inCart = cart.find((i) => i._id === p._id);
                  return (
                    <div key={p._id} className="card-hover rounded-2xl overflow-hidden" style={card}>
                      <div className="overflow-hidden h-44 relative">
                        <img src={p.image ? `${BASE_URL}/${p.image}` : `https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&q=80`}
                          alt={p.name} className="product-img h-full w-full object-cover"
                          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80"; }} />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(0,0,0,0.4),transparent)" }} />
                        <span className="absolute top-3 right-3 text-[10px] px-2 py-1 rounded-full font-semibold capitalize"
                          style={{ background: "#10b98125", color: "#10b981", border: "1px solid #10b98135", backdropFilter: "blur(8px)" }}>
                          {p.category}
                        </span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-sm" style={{ color: t.text }}>{p.name}</h3>
                        <div className="flex flex-col gap-0.5 mt-1">
                        <span className="text-xs flex items-center gap-1" style={{ color: t.textMuted }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          <span style={{ color: t.textMuted }}>Vendor Name:</span>
                          <span style={{ color: t.text, fontWeight: 300 }}>{p.vendorName}</span>
                        </span>
                        <span className="text-xs flex items-center gap-1" style={{ color: t.textMuted }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          <span style={{ color: t.textMuted }}>Ships from:</span>
                          <span style={{ color: t.text, fontWeight: 300, textTransform: "capitalize" }}>{p.vendorLocation || "Not set"}</span>
                        </span>
                      </div>
                                              {/* vendor location  came form backend from venodr registration */}
                        <p className="text-lg font-bold mt-2" style={{ color: "#10b981", fontFamily: "'Syne',sans-serif" }}>₹{p.price}<span className="text-xs font-normal" style={{ color: t.textMuted }}>/{p.unit}</span></p>
                        <p className="text-[10px]" style={{ color: t.textMuted }}>Stock: {p.quantity} {p.unit}</p>
                        {inCart ? (
  <div className="mt-3 space-y-2">
    <div className="flex items-center rounded-xl overflow-hidden" style={{ border: "1px solid #10b98150" }}>
      <button onClick={() => {
        if (inCart.quantity <= 1) removeFromCart(p._id);
        else setCart(prev => prev.map(i => i._id === p._id ? { ...i, quantity: i.quantity - 1, totalPrice: (i.quantity - 1) * i.price } : i));
      }} className="px-4 py-2 font-bold text-lg transition" style={{ background: "#10b98120", color: "#10b981" }}>−</button>
      <span className="flex-1 text-center text-sm font-semibold" style={{ color: t.text }}>{inCart.quantity}</span>
      <button onClick={() => setCart(prev => prev.map(i => i._id === p._id ? { ...i, quantity: i.quantity + 1, totalPrice: (i.quantity + 1) * i.price } : i))}
        className="px-4 py-2 font-bold text-lg transition" style={{ background: "#10b98120", color: "#10b981" }}>+</button>
    </div>
         <div className="flex gap-2">
  <button onClick={() => setActiveTab("Cart")} className="pill-btn flex-1 py-2.5 rounded-xl text-sm font-semibold"
    style={{ background: "#0ea5e9", color: "#fff" }}>
    🛒 Go to Cart · ₹{inCart.totalPrice}
  </button>
  <button onClick={() => removeFromCart(p._id)} className="pill-btn px-3 py-2.5 rounded-xl text-sm"
    style={{ background: "#ef444420", color: "#ef4444", border: "1px solid #ef444430" }}>
  <i className="ti ti-trash" style={{ fontSize: 16 }} />
</button>
</div>
  </div>
) : (
  <div className="mt-3">
    <button onClick={() => addToCart(p)} className="pill-btn w-full py-2.5 rounded-xl text-sm font-semibold"
      style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff" }}>
      Add to Cart · ₹{(cartQty[p._id] || 1) * p.price}
    </button>
  </div>
)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========== CART ========== */}
        {activeTab === "Cart" && (
          <div className="fade-in max-w-2xl mx-auto space-y-5">
            <div>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: t.textMuted }}>Checkout</p>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 28, color: t.text }}>Your Cart</h2>
            </div>

            {orderSuccess ? (
              <div className="rounded-2xl p-12 text-center" style={{ ...card, border: "1px solid #10b98130" }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl glow-green"
                  style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>🎉</div>
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24, color: t.text }}>Order Placed!</h3>
                <p className="mt-2 text-sm" style={{ color: t.textSub }}>Your fresh produce is being prepared for delivery.</p>
                <button onClick={() => { setOrderSuccess(false); setActiveTab("Shop"); }}
                  className="pill-btn mt-6 px-8 py-3 rounded-xl font-semibold glow-green"
                  style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff" }}>
                  Continue Shopping
                </button>
              </div>
            ) : cart.length === 0 ? (
              <div className="rounded-2xl p-16 text-center" style={card}>
                <p className="text-5xl mb-4">🛒</p>
                <p style={{ color: t.textSub }}>Your cart is empty</p>
                <button onClick={() => setActiveTab("Shop")} className="mt-4 text-emerald-500 text-sm underline">Browse products →</button>
              </div>
           ) : showAddressStep ? (
  <div className="rounded-2xl p-6 space-y-5" style={card}>
    <div className="text-center space-y-1">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3"
        style={{ background: "linear-gradient(135deg,#10b98120,#06b6d420)", border: "1px solid #10b98130" }}>📍</div>
      <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: t.text }}>Delivery Address</h3>
      <p className="text-sm" style={{ color: t.textSub }}>Where should we deliver your order?</p>
    </div>
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: t.textMuted }}>Delivery City</label>
      <select value={cityIsOther ? "others" : shippingCity}
        onChange={(e) => {
          if (e.target.value === "others") { setCityIsOther(true); setShippingCity(""); }
          else { setCityIsOther(false); setShippingCity(e.target.value); }
        }}
       className="w-full rounded-xl px-4 py-3 text-sm" style={input}>
        <option value="">— Select your city —</option>
        {["vijayawada","guntur","visakhapatnam","kakinada","nellore","kurnool","rajahmundry","tirupati","kadapa","anantapur","eluru","ongole","vizianagaram","srikakulam","bhimavaram","machilipatnam","tenali","proddatur","hindupur","chittoor","amaravati","hyderabad","warangal","nizamabad","karimnagar","khammam","mahbubnagar","nalgonda","adilabad","suryapet","miryalaguda","siddipet","secunderabad","bangalore","mysore","hubli","mangalore","chennai","coimbatore","madurai","mumbai","pune","nagpur"].map((city) => (
          <option key={city} value={city}>{city.charAt(0).toUpperCase() + city.slice(1)}</option>
        ))}
        <option value="others">Others (Type manually)</option>
      </select>
     {cityIsOther && (
        <input placeholder="Type your city name..."
          value={shippingCity} onChange={(e) => setShippingCity(e.target.value.toLowerCase().trim())}
          className="w-full rounded-xl px-4 py-3 text-sm mt-2" style={input} />
      )}
    </div>
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: t.textMuted }}>Street / Area</label>
      <input placeholder="House No., Street, Landmark"
        value={shippingFullAddress} onChange={(e) => setShippingFullAddress(e.target.value)}
        className="w-full rounded-xl px-4 py-3 text-sm" style={input} />
    </div>
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: t.textMuted }}>PIN Code</label>
      <input placeholder="e.g. 533001" maxLength={6}
        value={shippingPincode} onChange={(e) => setShippingPincode(e.target.value.replace(/\D/g, ""))}
        className="w-full rounded-xl px-4 py-3 text-sm" style={input} />
    </div>
    
    <div className="rounded-xl p-3 text-xs flex items-start gap-2"
      style={{ background: "#f59e0b10", border: "1px solid #f59e0b30", color: "#fbbf24" }}>
      <span>💡</span>
      <span>Distance charge is calculated from the vendor's location to your selected city. Clicking <strong>"Calculate & Continue"</strong> will show the exact fee.</span>
    </div>
    <div className="flex gap-3">
      <button onClick={() => setShowAddressStep(false)}
        className="pill-btn flex-1 py-3 rounded-xl text-sm font-medium"
        style={{ background: t.tagBg, color: t.textSub, border: `1px solid ${t.border}` }}>← Back to Cart</button>
      <button onClick={calculateFee} disabled={loadingFee}
        className="pill-btn flex-1 py-3 rounded-xl font-bold disabled:opacity-50"
        style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff" }}>
        {loadingFee ? "Calculating..." : "Calculate & Continue →"}
      </button>
    </div>
  </div>
) : !showCheckout ? (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item._id} className="rounded-2xl p-4 flex items-center gap-4" style={card}>
                    <img src={item.image ? `${BASE_URL}/${item.image}` : "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100&q=80"}
                      alt={item.name} className="w-14 h-14 rounded-xl object-cover"
                      onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100&q=80"; }} />
                    <div className="flex-1">
                      <p className="font-semibold text-sm" style={{ color: t.text }}>{item.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: t.textSub }}>{item.quantity} {item.unit} × ₹{item.price}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-500">₹{item.totalPrice}</p>
                      <button onClick={() => removeFromCart(item._id)} className="text-xs text-red-400 hover:text-red-300 mt-1 transition">Remove</button>
                    </div>
                  </div>
                ))}
              <div className="rounded-2xl p-5 space-y-3" style={card}>
                  <p className="font-semibold text-sm" style={{ color: t.text }}>Price Breakdown</p>

                  {/* Item Total */}
                  <div className="flex justify-between text-sm">
                    <span style={{ color: t.textSub }}>Item Total</span>
                    <span style={{ color: t.text }}>₹{itemTotal.toFixed(2)}</span>
                  </div>

                  {/* Discount section */}
                  {!hasDiscount && itemTotal > 0 && (
                    <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "#f59e0b10", border: "1px solid #f59e0b30", color: "#fbbf24" }}>
                      💡 Add ₹{(300 - itemTotal).toFixed(2)} more to unlock 10% off!
                    </div>
                  )}
                  {hasDiscount && (
                    <div className="rounded-xl px-3 py-2.5 space-y-1.5" style={{ background: "#10b98110", border: "1px solid #10b98130" }}>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold" style={{ color: "#10b981" }}>
                          🎉 {discountInfo.percent}% Discount Applied
                        </span>
                        {discountApplied ? (
                          <button
                            onClick={() => setDiscountApplied(false)}
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: "#ef444420", color: "#ef4444", border: "1px solid #ef444430" }}>
                            ✕ Remove
                          </button>
                        ) : (
                          <button
                            onClick={() => setDiscountApplied(true)}
                            className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: "#10b98120", color: "#10b981", border: "1px solid #10b98130" }}>
                            Apply
                          </button>
                        )}
                      </div>
                      {discountApplied && (
                        <div className="flex justify-between text-xs">
                          <span style={{ color: "#6ee7b7" }}>Discount (−{discountInfo.percent}%)</span>
                          <span style={{ color: "#10b981", fontWeight: 600 }}>− ₹{discountInfo.amount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Distance charge */}
                  <div className="flex justify-between text-sm">
                    <span style={{ color: t.textSub }}>
                      🚴 Distance Charge{feeData ? ` (${feeData.distanceKm} km × ₹5)` : ""}
                    </span>
                    <span style={{ color: "#f59e0b" }}>
                      {feeData ? `+ ₹${feeData.distanceCharge}` : "Click checkout to calculate"}
                    </span>
                  </div>

                  {/* Platform fee */}
                  <div className="flex justify-between text-sm">
                    <span style={{ color: t.textSub }}>🏷️ Platform Fee</span>
                    <span style={{ color: "#60a5fa" }}>+ ₹{PLATFORM_FEE}</span>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between font-bold pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
                    <span style={{ color: t.text }}>{feeData ? "Total" : "Estimated Total"}</span>
                    <span style={{ color: "#10b981" }}>₹{cartTotal.toFixed(2)}{!feeData && "*"}</span>
                  </div>
                  {hasDiscount && discountApplied && (
                    <p className="text-xs text-center font-semibold" style={{ color: "#10b981" }}>
                      🎁 You're saving ₹{discountInfo.amount.toFixed(2)} on this order!
                    </p>
                  )}
                  {!feeData && <p className="text-[10px]" style={{ color: t.textMuted }}>* Click checkout to see exact distance charge</p>}
                </div>
                {isMultiVendor ? (
  <div className="rounded-2xl p-5 space-y-3" style={{ background: "#7f1d1d20", border: "1px solid #ef444440" }}>
    <div className="flex items-start gap-3">
      <span className="text-xl">⚠️</span>
      <div>
        <p className="font-bold text-sm" style={{ color: "#fca5a5" }}>Multiple vendors detected</p>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: "#fca5a5", opacity: 0.8 }}>
          Your cart has items from <strong>{uniqueVendors.length} different vendors</strong>.
          Please keep only one vendor's products at a time. Remove items from other vendors to continue.
        </p>
      </div>
    </div>
    <div className="space-y-2">
      {[...new Set(cart.map(i => i.vendorId).filter(Boolean))].map(vid => {
        const vendorItems = cart.filter(i => i.vendorId === vid);
        const vendorName = vendorItems[0]?.vendorName || "Unknown Vendor";
        return (
          <div key={vid} className="flex items-center justify-between rounded-xl px-4 py-2.5"
            style={{ background: "#7f1d1d30", border: "1px solid #ef444430" }}>
            <div>
              <p className="text-xs font-semibold" style={{ color: "#fca5a5" }}>🏪 {vendorName}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "#fca5a5", opacity: 0.7 }}>
                {vendorItems.length} item(s) · ₹{vendorItems.reduce((s, i) => s + i.totalPrice, 0)}
              </p>
            </div>
            <button
              onClick={() => vendorItems.forEach(i => removeFromCart(i._id))}
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: "#ef444420", color: "#fca5a5", border: "1px solid #ef444440" }}>
              Remove all
            </button>
          </div>
        );
      })}
    </div>
    <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs"
      style={{ background: "#0f172a40", border: "1px solid #1e293b", color: "#475569" }}>
      🔒 Checkout disabled until cart has only one vendor's items
    </div>
  </div>
) : (
  <button onClick={handleProceedToCheckout} className="pill-btn w-full py-3.5 rounded-xl font-bold text-base glow-green"
    style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff" }}>
    Proceed to Checkout →
  </button>
)}
              </div>
            ) : (
              <div className="rounded-2xl p-6 space-y-5" style={card}>
                <h3 className="font-bold text-center" style={{ fontFamily: "'Syne',sans-serif", color: t.text }}>Payment</h3>
                <div className="rounded-xl p-4 space-y-2 text-sm" style={card2}>
                  <p className="font-semibold mb-2" style={{ color: t.text }}>Order Summary</p>
                  {cart.map((i) => (
                    <div key={i._id} className="flex justify-between" style={{ color: t.textSub }}>
                      <span>{i.name} ({i.quantity} {i.unit})</span><span>₹{i.totalPrice}</span>
                    </div>
                  ))}
                   <div className="pt-2 space-y-1.5" style={{ borderTop: `1px solid ${t.border}` }}>
                    <div className="flex justify-between" style={{ color: t.textSub }}><span>Item Total</span><span>₹{itemTotal.toFixed(2)}</span></div>
                    {hasDiscount && discountApplied && (
                      <div className="flex justify-between font-semibold" style={{ color: "#10b981" }}>
                        <span>🎉 Discount ({discountInfo.percent}% off)</span>
                        <span>− ₹{discountInfo.amount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between" style={{ color: "#f59e0b" }}>
                      <span>🚴 Distance Charge {feeData ? `(${feeData.distanceKm} km)` : ""}</span>
                      <span>{feeData ? `+ ₹${feeData.distanceCharge}` : "Calculating..."}</span>
                    </div>
                    <div className="flex justify-between" style={{ color: "#60a5fa" }}><span>🏷️ Platform Fee</span><span>+ ₹{PLATFORM_FEE.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold pt-2" style={{ borderTop: `1px solid ${t.border}` }}>
                      <span style={{ color: t.text }}>Total</span>
                      <span style={{ color: "#10b981" }}>₹{cartTotal.toFixed(2)}</span>
                    </div>
                    {hasDiscount && discountApplied && (
                      <p className="text-xs text-center font-semibold" style={{ color: "#10b981" }}>
                        🎁 You're saving ₹{discountInfo.amount.toFixed(2)} on this order!
                      </p>
                    )}
                  </div>
                  
                </div>
                <div className="flex items-center gap-2 rounded-xl p-3 text-sm flex-wrap"
  style={{ background: "#10b98110", border: "1px solid #10b98130", color: "#6ee7b7" }}>
  📍 Delivery to:
  <span className="font-semibold ml-1">{shippingFullAddress || profile?.location || "Your location"}</span>
  <button onClick={() => { setShowCheckout(false); setShowAddressStep(true); }}
    className="ml-auto text-[10px] underline opacity-70 hover:opacity-100 transition"
    style={{ color: "#6ee7b7" }}>Change</button>
</div>
                <div className="space-y-2">
                  {["COD","UPI","Card"].map((method) => (
                    <label key={method} className="flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all"
                      style={{ border: `1px solid ${paymentMethod===method ? "#10b981" : t.border}`, background: paymentMethod===method ? "#10b98110" : "transparent" }}>
                      <span className="font-medium text-sm" style={{ color: t.text }}>
                        {method==="COD" ? "💵 Cash on Delivery" : method==="UPI" ? "📲 UPI Payment" : "💳 Card Payment"}
                      </span>
                      <input type="radio" checked={paymentMethod===method}
                        onChange={() => { setPaymentMethod(method); setSavedPayment(method==="COD"); }}
                        className="accent-emerald-500" />
                    </label>
                  ))}
                </div>
                {paymentMethod==="UPI" && !savedPayment && (
                  <div className="space-y-3">
                    <input placeholder="Enter UPI ID (e.g. name@upi)" value={upiId} onChange={(e) => setUpiId(e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-sm" style={input} />
                    <button onClick={() => upiId.trim() && setSavedPayment(true)} className="pill-btn w-full py-2.5 rounded-xl text-sm font-semibold"
                      style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff" }}>Verify UPI</button>
                  </div>
                )}
                {paymentMethod==="Card" && !savedPayment && (
                  <div className="space-y-3">
                    <input placeholder="Card Number" value={cardDetails.number} onChange={(e) => setCardDetails({...cardDetails,number:e.target.value})}
                      className="w-full rounded-xl px-4 py-3 text-sm" style={input} />
                    <div className="flex gap-3">
                      <input placeholder="MM/YY" value={cardDetails.expiry} onChange={(e) => setCardDetails({...cardDetails,expiry:e.target.value})}
                        className="flex-1 rounded-xl px-4 py-3 text-sm" style={input} />
                      <input placeholder="CVV" value={cardDetails.cvv} onChange={(e) => setCardDetails({...cardDetails,cvv:e.target.value})}
                        className="w-24 rounded-xl px-4 py-3 text-sm" style={input} />
                    </div>
                    <button onClick={() => cardDetails.number && cardDetails.expiry && cardDetails.cvv && setSavedPayment(true)}
                      className="pill-btn w-full py-2.5 rounded-xl text-sm font-semibold"
                      style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff" }}>Save Card</button>
                  </div>
                )}
                {savedPayment && (
                  <div className="flex items-center gap-2 rounded-xl p-3 text-sm" style={{ background: "#10b98110", border: "1px solid #10b98130", color: "#6ee7b7" }}>
                    ✅ {paymentMethod==="COD" ? "Cash on delivery selected" : paymentMethod==="UPI" ? `UPI: ${upiId}` : "Card details saved"}
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => { setShowCheckout(false); setSavedPayment(false); setPaymentMethod(""); setFeeData(null); }}
                    className="pill-btn flex-1 py-3 rounded-xl text-sm font-medium"
                    style={{ background: t.tagBg, color: t.textSub, border: `1px solid ${t.border}` }}>← Back</button>
                  {savedPayment && (
                    <button onClick={handlePlaceOrder} disabled={placingOrder} className="pill-btn flex-1 py-3 rounded-xl font-bold glow-green disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff" }}>
                      {placingOrder ? "Placing..." : "🚀 Place Order"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========== ORDERS ========== */}
        {activeTab === "Orders" && (
          <div className="fade-in space-y-5">
           <div className="flex items-end justify-between">
  <div>
    <p className="text-xs uppercase tracking-widest mb-1" style={{ color: t.textMuted }}>History</p>
    <div className="flex items-center gap-3 flex-wrap">
      <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 28, color: t.text }}>My Orders</h2>
      {orders.some(o => o.status === "Delivered") && (
        <button
          onClick={() => {
            const token = localStorage.getItem("gc_token");
            window.open(`http://localhost:5000/api/orders/invoice/all-delivered?token=${token}`, "_blank");
          }}
          className="pill-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
          style={{ background: "linear-gradient(135deg,#c9a84c,#e8d48e)", color: "#1c1610" }}
        >
          📋 Purchase Delivered Statement
        </button>
      )}
    </div>
  </div>
  <button onClick={loadOrders} className="text-xs text-emerald-500 hover:text-emerald-400 transition">
    {loadingOrders ? "Loading..." : "↻ Refresh"}
  </button>
</div>

            {orders.length === 0 ? (
              <div className="rounded-2xl py-16 text-center" style={card}>
                <p className="text-4xl mb-3">📦</p>
                <p style={{ color: t.textSub }}>No orders yet</p>
                <button onClick={() => setActiveTab("Shop")} className="mt-3 text-emerald-500 text-sm underline">Shop now →</button>
              </div>
            ) : (
              orders.map((o) => (
                <div key={o._id} className="card-hover rounded-2xl" style={card}>
                  <div className="px-5 py-4 flex justify-between items-start flex-wrap gap-2" style={{ borderBottom: `1px solid ${t.border}` }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: t.tagBg }}>📦</div>
                      <div>
                        <p className="font-bold text-sm" style={{ color: t.text }}>{o.orderId}</p>
                        <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>{new Date(o.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={o.status} />
                   <span className="font-bold text-emerald-500">₹{Number(o.totalAmount).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="px-5 py-4 space-y-4">
                    <div className="space-y-1.5">
                      {o.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span style={{ color: t.textSub }}>· {item.name} × {item.quantity} {item.unit}</span>
                          <span style={{ color: t.text }}>₹{item.totalPrice}</span>
                        </div>
                      ))}
                    </div>

                  <div className="rounded-xl p-3 text-xs space-y-1.5" style={card2}>
                      <div className="flex justify-between" style={{ color: t.textSub }}><span>Item Amount</span><span>₹{Number(o.itemAmount || o.totalAmount).toFixed(2)}</span></div>
                      {o.discountAmount > 0 && (
                        <div className="flex justify-between font-semibold" style={{ color: "#10b981" }}>
                          <span>🎉 Discount ({o.discountPercent}% off)</span>
                          <span>− ₹{Number(o.discountAmount).toFixed(2)}</span>
                        </div>
                      )}
                      {o.distanceKm > 0 && (
                        <div className="flex justify-between" style={{ color: "#f59e0b" }}>
                          <span>🚴 Distance Charge ({o.distanceKm} km × ₹5)</span><span>+ ₹{Number(o.distanceCharge).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between" style={{ color: "#60a5fa" }}><span>🏷️ Platform Fee</span><span>+ ₹{Number(o.platformFee || 10).toFixed(2)}</span></div>
                      <div className="flex justify-between font-bold pt-1" style={{ borderTop: `1px solid ${t.border}`, color: t.text }}>
                        <span>Total Paid</span><span>₹{Number(o.totalAmount).toFixed(2)}</span>
                      </div>
                      {o.discountAmount > 0 && (
                        <p className="text-center font-semibold" style={{ color: "#10b981" }}>
                          🎁 You saved ₹{Number(o.discountAmount).toFixed(2)} on this order!
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs" style={{ color: t.textMuted }}>
                      <span className="px-2.5 py-1 rounded-lg" style={{ background: t.tagBg }}>💳 {o.paymentMethod}</span>
                      {o.deliveryName && <span className="px-2.5 py-1 rounded-lg" style={{ background: t.tagBg }}>🚴 {o.deliveryName}</span>}
                      {o.deliveryAddress && <span className="px-2.5 py-1 rounded-lg" style={{ background: t.tagBg }}>📍 {o.deliveryAddress}</span>}
                    </div>

                    {!["Cancelled","Rejected"].includes(o.status) && <TrackingBar status={o.status} t={t} />}
                    {o.status === "Cancelled" && o.cancelReason && (
                      <div className="rounded-xl px-4 py-3 text-xs mt-2"
                        style={{ background: dark ? "#7f1d1d20" : "#fee2e2", border: `1px solid ${dark ? "#7f1d1d40" : "#fecaca"}` }}>
                        <span className="font-semibold" style={{ color: dark ? "#fca5a5" : "#991b1b" }}>Cancellation Reason: </span>
                        <span style={{ color: t.textSub }}>{o.cancelReason}</span>
                      </div>
                    )}
                    {o.status === "Rejected" && o.rejectionReason && (
                      <div className="rounded-xl px-4 py-3 text-xs mt-2"
                        style={{ background: dark ? "#7f1d1d20" : "#fee2e2", border: `1px solid ${dark ? "#7f1d1d40" : "#fecaca"}` }}>
                        <span className="font-semibold" style={{ color: dark ? "#fca5a5" : "#991b1b" }}>Rejection Reason by Vendor: </span>
                        <span style={{ color: t.textSub }}>{o.rejectionReason}</span>
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap pt-1">
                      {o.status === "Placed" && (
                        cancellingOrder === o._id ? (
                          <div className="w-full rounded-xl p-4 space-y-3"
                            style={{ background: dark ? "#7f1d1d20" : "#fee2e2", border: `1px solid ${dark ? "#7f1d1d40" : "#fecaca"}` }}>
                            <p className="text-xs font-semibold" style={{ color: dark ? "#fca5a5" : "#991b1b" }}>
                              Reason for Cancellation
                            </p>
                            <input
                              placeholder="e.g. Changed my mind, ordered by mistake..."
                              value={cancelReason}
                              onChange={(e) => setCancelReason(e.target.value)}
                              className="w-full rounded-lg px-3 py-2 text-xs"
                              style={input}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleCancel(o._id, cancelReason)}
                                className="pill-btn flex-1 py-2 rounded-lg text-xs font-semibold"
                                style={{ background: dark ? "#7f1d1d" : "#dc2626", color: "#fff" }}>
                                Confirm Cancel
                              </button>
                              <button
                                onClick={() => { setCancellingOrder(null); setCancelReason(""); }}
                                className="pill-btn flex-1 py-2 rounded-lg text-xs"
                                style={{ background: t.tagBg, color: t.textSub, border: `1px solid ${t.border}` }}>
                                Go Back
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setCancellingOrder(o._id)} className="pill-btn text-xs px-4 py-2 rounded-lg"
                            style={{ background: dark ? "#7f1d1d20" : "#fee2e2", color: dark ? "#fca5a5" : "#991b1b", border: `1px solid ${dark ? "#7f1d1d40" : "#fecaca"}` }}>
                            Cancel Order
                          </button>
                        )
                      )}
                      {o.status === "Delivered" && !o.customerRating && (
                        <button onClick={() => setRatingOrder(o._id)} className="pill-btn text-xs px-4 py-2 rounded-lg"
                          style={{ background: "#78350f20", color: "#fcd34d", border: "1px solid #78350f40" }}>
                          ⭐ Rate Order
                        </button>
                      )}
                      {o.customerRating && (
                        <span className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "#78350f15", color: "#fcd34d" }}>
                          {"⭐".repeat(o.customerRating)} Rated
                        </span>
                      )}
                      {o.status === "Delivered" && (
                        <button onClick={async () => {
  try {
    const token = localStorage.getItem("gc_token");
    // Fetch live prices for all products in this order
    const updatedItems = await Promise.all(
      o.items.map(async (i) => {
        try {
          const res = await fetch(`http://localhost:5000/api/products/${i.productId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          // Use live price if product exists, else fall back to saved price
          const livePrice = data?.price || i.price;
          const liveImage = data?.image || i.image || null;
          return {
            ...i,
            _id: i.productId,
            price: livePrice,
            image: liveImage,
            totalPrice: livePrice * i.quantity,
          };
        } catch {
          return { ...i, _id: i.productId, image: i.image || null, totalPrice: i.price * i.quantity };
        }
      })
    );
    setCart(updatedItems);
    setActiveTab("Cart");
    showAlert("Cart updated with latest prices!");
  } catch {
    showAlert("Failed to load latest prices", "error");
  }
}}
                          className="pill-btn text-xs px-4 py-2 rounded-lg"
                          style={{ background: "#1e3a5f20", color: "#93c5fd", border: "1px solid #1e3a5f40" }}>
                          🔄 Reorder
                        </button>
                      )}
                      {/* ── INVOICE BUTTON ── */}
                      <button
                        onClick={() => {
                          const token = localStorage.getItem("gc_token");
                          window.open(`http://localhost:5000/api/orders/${o._id}/invoice?token=${token}`, "_blank");
                        }}
                        className="pill-btn text-xs px-4 py-2 rounded-lg"
                        style={{ background: "#16423120", color: "#34d399", border: "1px solid #16423140" }}>
                        🧾 Invoice
                      </button>
                    </div>

                    {ratingOrder === o._id && (
                      <div className="rounded-xl p-4 space-y-3" style={{ background: t.surface2, border: "1px solid #78350f40" }}>
                        <p className="font-semibold text-sm" style={{ color: t.text }}>Rate your experience</p>
                        <div className="flex gap-2">
                          {[1,2,3,4,5].map((s) => (
                            <button key={s} onClick={() => setRatingVal(s)} className="text-2xl transition-transform hover:scale-110"
                              style={{ color: s <= ratingVal ? "#fbbf24" : t.border2 }}>★</button>
                          ))}
                        </div>
                        <textarea placeholder="Share your feedback (optional)" value={ratingFeedback}
                          onChange={(e) => setRatingFeedback(e.target.value)}
                          className="w-full rounded-xl p-3 text-sm resize-none" style={input} rows={2} />
                        <div className="flex gap-2">
                          <button onClick={() => handleRate(o._id)} className="pill-btn flex-1 py-2 rounded-lg text-sm font-semibold"
                            style={{ background: "linear-gradient(135deg,#d97706,#b45309)", color: "#fff" }}>Submit</button>
                          <button onClick={() => setRatingOrder(null)} className="pill-btn flex-1 py-2 rounded-lg text-sm"
                            style={{ background: t.tagBg, color: t.textSub }}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

       
        {/* ========== SUPPORT ========== */}
{activeTab === "Support" && (
  <div className="fade-in space-y-5">
    <div>
      <p className="text-xs uppercase tracking-widest mb-1" style={{ color: t.textMuted }}>Help Center</p>
      <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 28, color: t.text }}>Help & Support</h2>
    </div>

    <div className="grid md:grid-cols-2 gap-4">
      {[
        {
          icon: "📌",
          title: "About GramConnect",
          content: "GramConnect is a hyperlocal farm-to-door platform that connects customers directly with local farmers and vendors for fresh, quality produce at fair prices. By eliminating middlemen, we ensure farmers earn more while customers pay less. Our platform supports rural communities, promotes sustainable farming practices, and helps preserve traditional agricultural livelihoods across India.",
          tags: ["Farm-to-Door", "No Middlemen", "Rural Support"],
        },
        {
          icon: "📦",
          title: "How to Order",
          content: "Ordering is simple and takes just a few steps. Go to Shop → Browse or search for products → Select quantity and Add to Cart → Head to Cart and review your items → Click Proceed to Checkout → Choose your preferred payment method → Place your order. Once placed, you'll receive real-time status updates from confirmation all the way to delivery.",
          tags: ["Shop", "Cart", "Checkout", "Track"],
        },
        {
          icon: "🚚",
          title: "Delivery Info",
          content: "All deliveries are handled by verified local delivery agents who are trained and background-checked. Once your order is accepted and prepared, it gets assigned to a nearby agent for pickup and delivery. You can track your order live through every stage — Placed, Accepted, Preparing, Assigned, On the way, and Delivered — directly from the Orders tab in real time.",
          tags: ["Live Tracking", "Verified Agents", "Real-time Updates"],
        },
        {
          icon: "💰",
          title: "Fee Breakdown",
          content: "We believe in complete pricing transparency. Your total includes: Item Amount (price of products you select) + Distance Charge (₹5 per km calculated from the vendor's location to your delivery address) + Platform Fee (a flat ₹10 to maintain the platform). All charges are clearly shown before you confirm your order at checkout — no hidden fees, ever.",
          tags: ["Transparent Pricing", "₹5/km", "₹10 Platform Fee"],
        },
        {
          icon: "🎁",
          title: "Discounts & Offers",
          content: "GramConnect rewards you the more you shop! Discounts are automatically applied at checkout based on your cart total — no coupon codes needed. Spend ₹300–₹499 and get 10% off, ₹500–₹999 and enjoy 15% off, or spend ₹1000 and above for a flat 20% discount. You can also choose to remove the discount if you prefer. Savings are shown clearly in your price breakdown before placing the order.",
          tags: ["10% off ₹300+", "15% off ₹500+", "20% off ₹1000+"],
        },
        {
          icon: "⭐",
          title: "Ratings & Feedback",
          content: "After every successful delivery, you can rate your experience with 1–5 stars and leave optional written feedback. Your ratings help us maintain quality, reward top-performing vendors and delivery agents, and continuously improve the platform. Honest feedback directly impacts the farmers and agents who serve you — we read every review.",
          tags: ["1–5 Stars", "Vendor Quality", "Agent Performance"],
        },
      ].map((item) => (
        <div key={item.title} className="card-hover rounded-2xl p-5 flex gap-4" style={card}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: t.tagBg }}>{item.icon}</div>
          <div className="flex-1">
            <h3 className="font-bold text-sm mb-1.5" style={{ fontFamily: "'Syne',sans-serif", color: t.text }}>{item.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: t.textSub }}>{item.content}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {item.tags.map((tag) => (
                <span key={tag} className="text-[10px] px-2.5 py-1 rounded-full font-medium"
                  style={{ background: "#10b98115", color: "#10b981", border: "1px solid #10b98125" }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>

    <div className="rounded-2xl p-6 grid md:grid-cols-3 gap-6" style={{ background: "linear-gradient(135deg,#10b98115,#06b6d415)", border: "1px solid #10b98130" }}>
      <div>
        <h3 className="font-bold text-sm mb-3" style={{ fontFamily: "'Syne',sans-serif", color: t.text }}>📞 Contact Support</h3>
        <p className="text-sm" style={{ color: t.textSub }}>📧 support@gramconnect.com</p>
        <p className="text-sm mt-1" style={{ color: t.textSub }}>📱 +91 98765 43210</p>
        <p className="text-xs mt-2" style={{ color: t.textMuted }}>Available 9 AM – 8 PM, Mon–Sat</p>
      </div>
      <div>
        <h3 className="font-bold text-sm mb-3" style={{ fontFamily: "'Syne',sans-serif", color: t.text }}>⚡ Quick Links</h3>
        <p className="text-sm" style={{ color: t.textSub }}>🛒 <button onClick={() => setActiveTab("Shop")} className="underline hover:text-emerald-500 transition">Browse Products</button></p>
        <p className="text-sm mt-1" style={{ color: t.textSub }}>📦 <button onClick={() => setActiveTab("Orders")} className="underline hover:text-emerald-500 transition">Track My Orders</button></p>
        <p className="text-sm mt-1" style={{ color: t.textSub }}>🏠 <button onClick={() => setActiveTab("Dashboard")} className="underline hover:text-emerald-500 transition">Go to Dashboard</button></p>
      </div>
      <div>
        <h3 className="font-bold text-sm mb-3" style={{ fontFamily: "'Syne',sans-serif", color: t.text }}>🕐 Response Times</h3>
        <p className="text-sm" style={{ color: t.textSub }}>Email: within 4–6 hours</p>
        <p className="text-sm mt-1" style={{ color: t.textSub }}>Phone: immediate during hours</p>
        <p className="text-sm mt-1" style={{ color: t.textSub }}>Refunds: 3–5 business days</p>
      </div>
    </div>
  </div>
)}
      </main>

      {/* FOOTER */}
      <footer style={{ background: dark ? "#0a0a0f" : t.surface, borderTop: `1px solid ${t.border}`, transition: "all 0.3s" }} className="px-8 py-10 mt-12">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div style={{ background: "linear-gradient(135deg,#10b981,#06b6d4)", borderRadius: 8 }} className="w-7 h-7 flex items-center justify-center text-sm font-bold text-white">G</div>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: t.text }}>GramConnect</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: t.textMuted }}>Fresh produce direct from farmers. Fair prices, sustainable farming.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-xs uppercase tracking-widest" style={{ color: t.textSub }}>Navigation</h4>
            {MENU.map((m) => (
              <p key={m} className="mb-1"><button onClick={() => setActiveTab(m)} className="text-xs transition hover:text-emerald-500" style={{ color: t.textMuted }}>{m}</button></p>
            ))}
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-xs uppercase tracking-widest" style={{ color: t.textSub }}>Legal</h4>
            <p className="text-xs mb-1" style={{ color: t.textMuted }}>Terms & Conditions</p>
            <p className="text-xs mb-1" style={{ color: t.textMuted }}>Privacy Policy</p>
            <p className="text-xs" style={{ color: t.textMuted }}>Refund Policy</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-xs uppercase tracking-widest" style={{ color: t.textSub }}>Follow Us</h4>
            <p className="text-xs mb-1" style={{ color: t.textMuted }}>Facebook · Instagram</p>
            <p className="text-xs" style={{ color: t.textMuted }}>Twitter · YouTube</p>
          </div>
        </div>
        <div className="text-center text-xs mt-8 pt-6" style={{ borderTop: `1px solid ${t.border}`, color: t.textMuted }}>
          © 2026 GramConnect. All rights reserved.
        </div>
      </footer>
       <AIChatBot role="customer" darkMode={dark} />  {/* ← ADD THIS LINE */}
    </div>
  );
}
