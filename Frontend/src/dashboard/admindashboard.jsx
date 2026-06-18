import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AIChatBot from "../components/AIChatBot";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import axios from "axios";

// ─── THEME TOKENS ───────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg: "#08090d",
    surface: "#0f1117",
    surfaceAlt: "#14161f",
    card: "#1a1d28",
    cardBorder: "#252836",
    sidebar: "#0c0e16",
    sidebarBorder: "#1e2130",
    text: "#e8eaf0",
    textMuted: "#6b7280",
    textSub: "#9ca3af",
    accent: "#00e5a0",
    accentGlow: "rgba(0,229,160,0.18)",
    accentDim: "#00c48a",
    blue: "#3b82f6",
    blueGlow: "rgba(59,130,246,0.18)",
    yellow: "#f59e0b",
    yellowGlow: "rgba(245,158,11,0.18)",
    red: "#ef4444",
    redGlow: "rgba(239,68,68,0.15)",
    purple: "#a78bfa",
    purpleGlow: "rgba(167,139,250,0.18)",
    divider: "#1e2130",
    tooltipBg: "#1a1d28",
    scrollbar: "#252836",
    activeNavBg: "rgba(0,229,160,0.12)",
    activeNavBorder: "#00e5a0",
    shimmer1: "#1a1d28",
    shimmer2: "#252836",
    chartBar: "#00e5a0",
  },
  light: {
    bg: "#f1f4f9",
    surface: "#ffffff",
    surfaceAlt: "#f8fafc",
    card: "#ffffff",
    cardBorder: "#e2e8f0",
    sidebar: "#0f172a",
    sidebarBorder: "#1e293b",
    text: "#0f172a",
    textMuted: "#94a3b8",
    textSub: "#64748b",
    accent: "#059669",
    accentGlow: "rgba(5,150,105,0.12)",
    accentDim: "#047857",
    blue: "#2563eb",
    blueGlow: "rgba(37,99,235,0.12)",
    yellow: "#d97706",
    yellowGlow: "rgba(217,119,6,0.12)",
    red: "#dc2626",
    redGlow: "rgba(220,38,38,0.1)",
    purple: "#7c3aed",
    purpleGlow: "rgba(124,58,237,0.12)",
    divider: "#e2e8f0",
    tooltipBg: "#1e293b",
    scrollbar: "#cbd5e1",
    activeNavBg: "rgba(5,150,105,0.08)",
    activeNavBorder: "#059669",
    shimmer1: "#f1f5f9",
    shimmer2: "#e2e8f0",
    chartBar: "#059669",
  },
};

// ─── NAV ITEMS ───────────────────────────────────────────────────────────────
const NAV = [
  { key: "Dashboard", icon: "◈", label: "Dashboard" },
  { key: "Vendors",   icon: "⬡", label: "Vendors" },
  { key: "Customers", icon: "◉", label: "Customers" },
  { key: "Delivery",  icon: "◎", label: "Delivery" },
  { key: "Revenue",   icon: "◆", label: "Revenue" },
];

// ─── CUSTOM TOOLTIP ──────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, t }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: t.tooltipBg, border: `1px solid ${t.cardBorder}`,
      borderRadius: 10, padding: "10px 14px", fontSize: 12,
      color: t.text, boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    }}>
      <p style={{ color: t.textMuted, marginBottom: 4 }}>{label}</p>
      <p style={{ color: t.accent, fontWeight: 700, fontSize: 15 }}>
       {payload[0].name === "revenue"
  ? `₹${Number(payload[0].value).toFixed(2)}`
  : payload[0].value}
      </p>

    </div>
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
function Badge({ status, t }) {
  const map = {
    Approved: { color: t.accent, bg: t.accentGlow },
    Active:   { color: t.accent, bg: t.accentGlow },
    Rejected: { color: t.red,    bg: t.redGlow },
    Blocked:  { color: t.red,    bg: t.redGlow },
    Pending:  { color: t.yellow, bg: t.yellowGlow },
  };
  const s = map[status] || { color: t.textMuted, bg: "transparent" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: s.bg, color: s.color,
      border: `1px solid ${s.color}30`,
      borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: s.color, boxShadow: `0 0 6px ${s.color}`,
        display: "inline-block",
      }} />
      {status}
    </span>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, glow, icon, t }) {
  return (
    <div style={{
      background: t.card, border: `1px solid ${t.cardBorder}`,
      borderRadius: 16, padding: "22px 24px",
      position: "relative", overflow: "hidden",
      transition: "box-shadow 0.3s",
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 0 1px ${color}40, 0 8px 32px ${glow}`}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      <div style={{ position: "absolute", top: -20, right: -20, fontSize: 72, opacity: 0.06, color }}>{icon}</div>
      <p style={{ color: t.textMuted, fontSize: 12, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>{label}</p>
      <p style={{ color, fontSize: 32, fontWeight: 800, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ color: t.textSub, fontSize: 11, marginTop: 6 }}>{sub}</p>}
      <div style={{ height: 3, borderRadius: 2, background: `${color}20`, marginTop: 16 }}>
        <div style={{ height: "100%", width: "60%", borderRadius: 2, background: color, boxShadow: `0 0 8px ${color}` }} />
      </div>
    </div>
  );
}

// ─── SECTION HEADER ──────────────────────────────────────────────────────────
function SectionHeader({ title, sub, t }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ color: t.text, fontSize: 22, fontWeight: 800, fontFamily: "'Syne', sans-serif", margin: 0 }}>{title}</h2>
      {sub && <p style={{ color: t.textSub, fontSize: 13, marginTop: 8, lineHeight: 1.7, maxWidth: 640 }}>{sub}</p>}
    </div>
  );
}

// ─── TABLE WRAPPER ────────────────────────────────────────────────────────────
function TableWrap({ children, t }) {
  return (
    <div style={{
      background: t.card, border: `1px solid ${t.cardBorder}`,
      borderRadius: 16, overflow: "hidden",
    }}>
      <div style={{ overflowX: "auto" }}>{children}</div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(true);
  const t = dark ? THEMES.dark : THEMES.light;

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  const [users, setUsers] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [orders, setOrders] = useState([]);

  const API = "http://localhost:5000/api/auth";
  const ORDER_API = "http://localhost:5000/api/orders";
  const BASE = "http://localhost:5000/uploads";

  const fetchUsers = async () => {
    try { const res = await axios.get(`${API}/users`); setUsers(res.data); } catch (err) { console.error(err); }
  };
  const fetchRevenue = async () => {
    try {
      const token = localStorage.getItem("gc_token");
      const res = await axios.get(`${ORDER_API}/platform-revenue`, { headers: { Authorization: `Bearer ${token}` } });
      setRevenue(res.data); setOrders(res.data.orders || []);
    } catch (err) { console.error(err); }
  };
  const fetchAllOrders = async () => {
    try {
      const token = localStorage.getItem("gc_token");
      const res = await axios.get(`${ORDER_API}/all`, { headers: { Authorization: `Bearer ${token}` } });
      setOrders(res.data);
    } catch (err) { console.error(err); }
  };
  useEffect(() => { fetchUsers(); fetchRevenue(); fetchAllOrders(); }, []);
  useEffect(() => { if (activeTab === "Revenue") fetchRevenue(); }, [activeTab]);

  const updateStatus = async (id, status, reason = "") => {
    try { await axios.put(`${API}/status/${id}`, { status, reason }); fetchUsers(); } catch (err) { console.error(err); }
  };

  const vendors = users.filter(u => u.role === "vendor");
  const customers = users.filter(u => u.role === "customer");
  const delivery = users.filter(u => u.role === "delivery");

  const totalPlatformFee = revenue?.totalPlatformFee || 0;
  const todayFee = revenue?.todayFee || 0;
  const weekFee = revenue?.weekFee || 0;
  const totalDeliveredOrders = revenue?.totalOrders || 0;

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthlyRevenue = Array.from({ length: 12 }, (_, i) => ({
    month: MONTHS[i],
    revenue: orders
      .filter(o => o.status === "Delivered" && new Date(o.deliveredAt).getMonth() === i)
      .reduce((s, o) => s + (o.platformEarnings || 10), 0),
  }));

  const thStyle = {
    padding: "12px 16px", color: t.textMuted, fontSize: 11,
    fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em",
    background: t.surfaceAlt, borderBottom: `1px solid ${t.divider}`,
    textAlign: "left", whiteSpace: "nowrap",
  };
  const tdStyle = {
    padding: "14px 16px", color: t.textSub, fontSize: 13,
    borderBottom: `1px solid ${t.divider}40`,
  };

  const ActionBtn = ({ onClick, color, glow, children }) => (
    <button onClick={onClick} style={{
      background: `${color}18`, color, border: `1px solid ${color}40`,
      borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 600,
      cursor: "pointer", transition: "all 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.background = color; e.currentTarget.style.color = "#fff"; e.currentTarget.style.boxShadow = `0 0 12px ${glow}`; }}
      onMouseLeave={e => { e.currentTarget.style.background = `${color}18`; e.currentTarget.style.color = color; e.currentTarget.style.boxShadow = "none"; }}
    >{children}</button>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${t.bg}; transition: background 0.3s; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${t.scrollbar}; border-radius: 10px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        .tab-content { animation: fadeUp 0.35s ease; }
        .nav-item:hover { background: ${t.activeNavBg} !important; }
        .row-hover:hover { background: ${t.surfaceAlt} !important; }
      `}</style>

      <div style={{
        display: "flex", minHeight: "100vh",
        background: t.bg, fontFamily: "'DM Sans', sans-serif",
        color: t.text, transition: "background 0.3s, color 0.3s",
      }}>

        {/* ── SIDEBAR ─────────────────────────────────────────── */}
        <aside style={{
          width: 256, minHeight: "100vh", background: t.sidebar,
          borderRight: `1px solid ${t.sidebarBorder}`,
          display: "flex", flexDirection: "column", padding: "28px 0",
          position: "sticky", top: 0, flexShrink: 0,
          transition: "background 0.3s",
        }}>
          {/* Brand */}
          <div style={{ padding: "0 24px 28px", borderBottom: `1px solid ${t.sidebarBorder}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `linear-gradient(135deg, ${t.accent}, ${t.accentDim})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, boxShadow: `0 0 20px ${t.accentGlow}`,
              }}>🌾</div>
              <div>
                <p style={{ color: "#fff", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, lineHeight: 1 }}>GramConnect</p>
                <p style={{ color: t.textMuted, fontSize: 10, marginTop: 2, letterSpacing: "0.08em" }}>ADMIN CONSOLE</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "20px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
            {NAV.map(({ key, icon, label }) => {
              const active = activeTab === key;
              return (
                <div key={key} className="nav-item" onClick={() => setActiveTab(key)} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 14px", borderRadius: 12, cursor: "pointer",
                  background: active ? t.activeNavBg : "transparent",
                  borderLeft: active ? `2px solid ${t.activeNavBorder}` : "2px solid transparent",
                  transition: "all 0.2s",
                }}>
                  <span style={{ color: active ? t.accent : t.textMuted, fontSize: 16 }}>{icon}</span>
                  <span style={{
                    color: active ? t.accent : t.textSub,
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    fontFamily: active ? "'Syne', sans-serif" : "'DM Sans', sans-serif",
                  }}>{label}</span>
                  {active && <span style={{
                    marginLeft: "auto", width: 6, height: 6, borderRadius: "50%",
                    background: t.accent, boxShadow: `0 0 8px ${t.accent}`,
                    animation: "pulse-dot 2s ease infinite",
                  }} />}
                </div>
              );
            })}
          </nav>

          {/* Bottom */}
          <div style={{ padding: "20px 12px 0", borderTop: `1px solid ${t.sidebarBorder}` }}>
            {/* Theme toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px", marginBottom: 12 }}>
              <span style={{ color: t.textMuted, fontSize: 12 }}>{dark ? "Dark Mode" : "Light Mode"}</span>
              <button onClick={() => setDark(d => !d)} style={{
                width: 46, height: 26, borderRadius: 13,
                background: dark ? t.accent : t.scrollbar,
                border: "none", cursor: "pointer",
                position: "relative", transition: "background 0.3s",
              }}>
                <span style={{
                  position: "absolute", top: 3, left: dark ? 22 : 3,
                  width: 20, height: 20, borderRadius: "50%",
                  background: "#fff", transition: "left 0.3s",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11,
                }}>{dark ? "🌙" : "☀️"}</span>
              </button>
            </div>
            <button onClick={() => navigate("/login")} style={{
              width: "100%", padding: "10px", borderRadius: 10,
              background: `${t.red}15`, color: t.red,
              border: `1px solid ${t.red}30`, cursor: "pointer",
              fontSize: 13, fontWeight: 600, transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = t.red; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = `${t.red}15`; e.currentTarget.style.color = t.red; }}
            >↩ Sign Out</button>
          </div>
        </aside>

        {/* ── MAIN ────────────────────────────────────────────── */}
        <main style={{ flex: 1, padding: "32px 36px", overflowX: "hidden", minWidth: 0 }}>

          {/* ════ DASHBOARD ════ */}
          {activeTab === "Dashboard" && (
            <div className="tab-content" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <SectionHeader t={t}
                title="Dashboard Overview"
sub="Centralized control over all platform activities — monitor customers, vendors, deliveries, orders, and performance insights in real time with seamless operational visibility."
/>



              {/* User summary */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                {[
                  {
                    label: "Customers", color: t.yellow, glow: t.yellowGlow,
                    rows: [
                      { k: "Active", v: customers.filter(c => c.status === "Active" && new Date(c.createdAt).getFullYear() === +selectedYear).length, c: t.accent },
                      { k: "Blocked", v: customers.filter(c => c.status === "Blocked" && new Date(c.createdAt).getFullYear() === +selectedYear).length, c: t.red },
                    ],
                    total: customers.filter(c => new Date(c.createdAt).getFullYear() === +selectedYear).length,
                  },
                  {
                    label: "Vendors", color: t.accent, glow: t.accentGlow,
                    rows: [
                      { k: "Approved", v: vendors.filter(v => v.status === "Approved" && new Date(v.createdAt).getFullYear() === +selectedYear).length, c: t.accent },
                      { k: "Rejected", v: vendors.filter(v => v.status === "Rejected" && new Date(v.createdAt).getFullYear() === +selectedYear).length, c: t.red },
                      { k: "Pending",  v: vendors.filter(v => v.status === "Pending"  && new Date(v.createdAt).getFullYear() === +selectedYear).length, c: t.yellow },
                    ],
                    total: vendors.filter(v => new Date(v.createdAt).getFullYear() === +selectedYear).length,
                  },
                  {
                    label: "Delivery", color: t.blue, glow: t.blueGlow,
                    rows: [
                      { k: "Approved", v: delivery.filter(d => d.status === "Approved" && new Date(d.createdAt).getFullYear() === +selectedYear).length, c: t.accent },
                      { k: "Rejected", v: delivery.filter(d => d.status === "Rejected" && new Date(d.createdAt).getFullYear() === +selectedYear).length, c: t.red },
                      { k: "Pending",  v: delivery.filter(d => d.status === "Pending"  && new Date(d.createdAt).getFullYear() === +selectedYear).length, c: t.yellow },
                    ],
                    total: delivery.filter(d => new Date(d.createdAt).getFullYear() === +selectedYear).length,
                  },
                ].map(({ label, color, glow, rows, total }) => (
                  <div key={label} style={{
                    background: t.card, border: `1px solid ${t.cardBorder}`,
                    borderRadius: 16, padding: "22px 24px",
                    transition: "box-shadow 0.3s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 0 1px ${color}40, 0 8px 32px ${glow}`}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <p style={{ color: t.textMuted, fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
                      <span style={{ color, fontSize: 26, fontWeight: 800, fontFamily: "'Syne', sans-serif" }}>{total}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {rows.map(({ k, v, c }) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: t.textSub, fontSize: 12 }}>{k}</span>
                          <span style={{
                            background: `${c}18`, color: c, border: `1px solid ${c}30`,
                            borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700,
                          }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bar chart */}
              <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 16, padding: "24px 28px" }}>
                <p style={{ color: t.text, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Platform Performance Overview</p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={[
                    { name: "Active Customers", value: customers.filter(c => c.status === "Active" && new Date(c.createdAt).getFullYear() === +selectedYear).length },
                    { name: "Approved Vendors", value: vendors.filter(v => v.status === "Approved" && new Date(v.createdAt).getFullYear() === +selectedYear).length },
                    { name: "Approved Delivery", value: delivery.filter(d => d.status === "Approved" && new Date(d.createdAt).getFullYear() === +selectedYear).length },
                  ]} barSize={48}>
                    <XAxis dataKey="name" tick={{ fill: t.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: t.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip t={t} />} cursor={{ fill: `${t.accent}08` }} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                     {[t.accent, t.blue, "#f97316"].map((c, i) => <Cell key={i} fill={c} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Live activity */}
              <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 16, padding: "24px 28px" }}>
                <p style={{ color: t.text, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 24 }}>
                  Live Activity Timeline
                  <span style={{
                    marginLeft: 10, display: "inline-flex", alignItems: "center", gap: 5,
                    background: `${t.accent}15`, color: t.accent,
                    border: `1px solid ${t.accent}30`, borderRadius: 20,
                    padding: "2px 10px", fontSize: 10, fontWeight: 600, verticalAlign: "middle",
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: t.accent, animation: "pulse-dot 1.5s ease infinite", display: "inline-block" }} />
                    LIVE
                  </span>
                </p>
                <div style={{ position: "relative", borderLeft: `1px solid ${t.divider}`, marginLeft: 8 }}>
                  {users.length === 0 ? (
                    <p style={{ color: t.textMuted, fontSize: 13, marginLeft: 24 }}>No activity yet</p>
                  ) : users.slice().sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)).slice(0, 10).map(u => (
                    <div key={u._id} style={{ marginBottom: 20, marginLeft: 28, position: "relative" }}>
                      <span style={{
                        position: "absolute", left: -36, top: 14,
                        width: 14, height: 14, borderRadius: "50%",
                        background: t.card, border: `2px solid ${t.purple}`,
                        boxShadow: `0 0 8px ${t.purpleGlow}`,
                      }} />
                      <div style={{
                        background: t.surfaceAlt, border: `1px solid ${t.divider}`,
                        borderRadius: 12, padding: "12px 16px",
                        transition: "border-color 0.2s",
                      }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = t.cardBorder}
                        onMouseLeave={e => e.currentTarget.style.borderColor = t.divider}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                              <span style={{
                                background: `${t.purple}15`, color: t.purple,
                                border: `1px solid ${t.purple}30`,
                                borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 600,
                              }}>
                                {u.role === "customer" ? "CUSTOMER" : u.role === "vendor" ? "VENDOR" : "DELIVERY"}
                              </span>
                              <span style={{ color: t.text, fontSize: 13, fontWeight: 600 }}>{u.name}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <Badge status={u.status} t={t} />
                              <span style={{ color: t.textMuted, fontSize: 11 }}>•</span>
                              <span style={{ color: t.textMuted, fontSize: 11 }}>{u.email}</span>
                            </div>
                          </div>
                          <span style={{ color: t.textMuted, fontSize: 10, whiteSpace: "nowrap", marginLeft: 16 }}>
                            {new Date(u.updatedAt || u.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════ VENDORS ════ */}
          {activeTab === "Vendors" && (
            <div className="tab-content" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <SectionHeader t={t} title="Vendor Management"
                sub="Review business details, identity documents, and uploaded proofs before approving or rejecting vendors. Ensure only verified vendors are listed."
              />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {[
                  { label: "Approved", value: vendors.filter(v => v.status === "Approved").length, color: t.accent, glow: t.accentGlow },
                  { label: "Rejected", value: vendors.filter(v => v.status === "Rejected").length, color: t.red, glow: t.redGlow },
                  { label: "Pending",  value: vendors.filter(v => v.status === "Pending").length,  color: t.yellow, glow: t.yellowGlow },
                ].map(({ label, value, color, glow }) => (
                  <StatCard key={label} t={t} label={label} value={value} color={color} glow={glow} icon="⬡" />
                ))}
              </div>
              <p style={{ color: t.text, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }}>Vendor Directory</p>
              <TableWrap t={t}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Name","Email","Location","Age","Phone","ID Proof","Status","Action"].map(h => (
                        <th key={h} style={{ ...thStyle, textAlign: h === "Age" || h === "ID Proof" || h === "Status" || h === "Action" ? "center" : "left" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map((v, i) => {
                      const isManaging = selectedVendor === i;
                      return (
                        <tr key={v._id} className="row-hover" style={{ transition: "background 0.15s" }}>
                          <td style={{ ...tdStyle, color: t.text, fontWeight: 600 }}>{v.name}</td>
                          <td style={tdStyle}>{v.email}</td>
                          <td style={tdStyle}>{v.location}</td>
                          <td style={{ ...tdStyle, textAlign: "center" }}>{v.age}</td>
                          <td style={tdStyle}>{v.phone}</td>
                          <td style={{ ...tdStyle, textAlign: "center" }}>
                            {v.vendorId
                              ? <a href={`${BASE}/${encodeURIComponent(v.vendorId)}`} target="_blank" rel="noreferrer" style={{ color: t.blue, textDecoration: "none", fontWeight: 600, fontSize: 12 }}>View ↗</a>
                              : <span style={{ color: t.textMuted, fontSize: 12 }}>None</span>}
                          </td>
                          <td style={{ ...tdStyle, textAlign: "center" }}><Badge status={v.status} t={t} /></td>
                          <td style={{ ...tdStyle, textAlign: "center" }}>
                            {!isManaging && (
                              <ActionBtn onClick={() => setSelectedVendor(i)} color={t.blue} glow={t.blueGlow}>Manage</ActionBtn>
                            )}
                            {isManaging && (
                              <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                                <ActionBtn onClick={() => { if (v.status === "Approved") { alert("Vendor already approved"); return; } updateStatus(v._id, "Approved"); setSelectedVendor(null); }} color={t.accent} glow={t.accentGlow}>Approve</ActionBtn>
                                <ActionBtn onClick={() => { if (v.status === "Rejected") { alert("Vendor already rejected"); return; } updateStatus(v._id, "Rejected"); setSelectedVendor(null); }} color={t.red} glow={t.redGlow}>Reject</ActionBtn>
                                <ActionBtn onClick={() => setSelectedVendor(null)} color={t.textMuted} glow="transparent">Cancel</ActionBtn>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </TableWrap>
            </div>
          )}

          {/* ════ CUSTOMERS ════ */}
          {activeTab === "Customers" && (
            <div className="tab-content" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <SectionHeader t={t} title="Customer Directory"
                sub="View customer details, contact information, and activity status. Monitor active, blocked, and pending users to maintain platform safety."
              />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
                {customers.map((c, i) => {
                  const isManaging = selectedCustomer?.editIndex === i;
                  return (
                    <div key={c._id} style={{
                      background: t.card, border: `1px solid ${t.cardBorder}`,
                      borderRadius: 16, padding: "20px 22px",
                      transition: "box-shadow 0.3s",
                    }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 24px ${t.accentGlow}`}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: 12,
                            background: `linear-gradient(135deg, ${t.yellow}30, ${t.yellow}10)`,
                            border: `1px solid ${t.yellow}30`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 18,
                          }}>👤</div>
                          <div>
                            <p style={{ color: t.text, fontWeight: 700, fontSize: 14 }}>{c.name}</p>
                            <p style={{ color: t.textMuted, fontSize: 11 }}>{c.email}</p>
                          </div>
                        </div>
                        <Badge status={c.status} t={t} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                        {[
                          { k: "Location", v: c.location },
                          { k: "Age",      v: c.age },
                          { k: "Phone",    v: c.phone },
                        ].map(({ k, v }) => (
                          <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: t.textMuted, fontSize: 12 }}>{k}</span>
                            <span style={{ color: t.textSub, fontSize: 12 }}>{v || "—"}</span>
                          </div>
                        ))}
                      </div>
                      {c.status === "Blocked" && c.reason && (
                        <div style={{
                          background: `${t.red}10`, border: `1px solid ${t.red}20`,
                          borderRadius: 8, padding: "8px 12px",
                          color: t.red, fontSize: 11, marginBottom: 12,
                        }}>⚠ Block Reason: {c.reason}</div>
                      )}
                      {!isManaging && (
                        <ActionBtn onClick={() => setSelectedCustomer({ editIndex: i })} color={t.blue} glow={t.blueGlow}>Manage</ActionBtn>
                      )}
                      {isManaging && (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <ActionBtn onClick={() => { if (c.status === "Active") { alert("Customer already active"); return; } updateStatus(c._id, "Active"); setSelectedCustomer(null); }} color={t.accent} glow={t.accentGlow}>Activate</ActionBtn>
                          <ActionBtn onClick={() => { if (c.status === "Blocked") { alert("Customer already blocked"); return; } const reason = prompt("Enter reason for blocking:"); if (!reason) return; updateStatus(c._id, "Blocked", reason); setSelectedCustomer(null); }} color={t.red} glow={t.redGlow}>Block</ActionBtn>
                          <ActionBtn onClick={() => setSelectedCustomer(null)} color={t.textMuted} glow="transparent">Cancel</ActionBtn>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════ DELIVERY ════ */}
          {activeTab === "Delivery" && (
            <div className="tab-content" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <SectionHeader t={t} title="Delivery Partners"
                sub="Review identity proofs, driving license, and vehicle details before approving or rejecting. Ensure only verified agents are active."
              />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {[
                  { label: "Approved", value: delivery.filter(d => d.status === "Approved").length, color: t.accent, glow: t.accentGlow },
                  { label: "Rejected", value: delivery.filter(d => d.status === "Rejected").length, color: t.red,   glow: t.redGlow },
                  { label: "Pending",  value: delivery.filter(d => d.status === "Pending").length,  color: t.yellow, glow: t.yellowGlow },
                ].map(({ label, value, color, glow }) => (
                  <StatCard key={label} t={t} label={label} value={value} color={color} glow={glow} icon="◎" />
                ))}
              </div>
              <p style={{ color: t.text, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }}>Partner Directory</p>
              <TableWrap t={t}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Name","Email","Location","Age","Phone","Vehicle","ID","License","Status","Action"].map(h => (
                        <th key={h} style={{ ...thStyle, textAlign: ["Age","ID","License","Status","Action"].includes(h) ? "center" : "left" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {delivery.map((d, i) => {
                      const isManaging = selectedDelivery === i;
                      return (
                        <tr key={d._id} className="row-hover" style={{ transition: "background 0.15s" }}>
                          <td style={{ ...tdStyle, color: t.text, fontWeight: 600 }}>{d.name}</td>
                          <td style={tdStyle}>{d.email}</td>
                          <td style={tdStyle}>{d.location}</td>
                          <td style={{ ...tdStyle, textAlign: "center" }}>{d.age}</td>
                          <td style={tdStyle}>{d.phone}</td>
                          <td style={tdStyle}>{d.vehicleType}</td>
                          <td style={{ ...tdStyle, textAlign: "center" }}>
                            {d.deliveryId
                              ? <a href={`${BASE}/${encodeURIComponent(d.deliveryId)}`} target="_blank" rel="noreferrer" style={{ color: t.blue, textDecoration: "none", fontWeight: 600, fontSize: 12 }}>View ↗</a>
                              : <span style={{ color: t.textMuted, fontSize: 12 }}>None</span>}
                          </td>
                          <td style={{ ...tdStyle, textAlign: "center" }}>
                            {d.license
                              ? <a href={`${BASE}/${encodeURIComponent(d.license)}`} target="_blank" rel="noreferrer" style={{ color: t.blue, textDecoration: "none", fontWeight: 600, fontSize: 12 }}>View ↗</a>
                              : <span style={{ color: t.textMuted, fontSize: 12 }}>None</span>}
                          </td>
                          <td style={{ ...tdStyle, textAlign: "center" }}><Badge status={d.status} t={t} /></td>
                          <td style={{ ...tdStyle, textAlign: "center" }}>
                            {!isManaging && (
                              <ActionBtn onClick={() => setSelectedDelivery(i)} color={t.blue} glow={t.blueGlow}>Manage</ActionBtn>
                            )}
                            {isManaging && (
                              <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                                <ActionBtn onClick={() => { if (d.status === "Approved") { alert("Already approved"); return; } updateStatus(d._id, "Approved"); setSelectedDelivery(null); }} color={t.accent} glow={t.accentGlow}>Approve</ActionBtn>
                                <ActionBtn onClick={() => { if (d.status === "Rejected") { alert("Already rejected"); return; } updateStatus(d._id, "Rejected"); setSelectedDelivery(null); }} color={t.red} glow={t.redGlow}>Reject</ActionBtn>
                                <ActionBtn onClick={() => setSelectedDelivery(null)} color={t.textMuted} glow="transparent">Cancel</ActionBtn>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </TableWrap>
            </div>
          )}

          {/* ════ REVENUE ════ */}
          {activeTab === "Revenue" && (
            <div className="tab-content" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <SectionHeader t={t} title="Revenue Analytics"
                sub="Track all platform fee earnings collected from customer orders. GramConnect earns ₹10 per delivered order."
              />

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
                <StatCard t={t} label="Total Revenue" value={`₹${Number(totalPlatformFee).toFixed(2)}`} sub="All time" color={t.accent} glow={t.accentGlow} icon="₹" />
                <StatCard t={t} label="Today" value={`₹${Number(todayFee).toFixed(2)}`} color={t.blue} glow={t.blueGlow} icon="📅" />
                <StatCard t={t} label="This Week" value={`₹${Number(weekFee).toFixed(2)}`} color={t.purple} glow={t.purpleGlow} icon="📆" />
                <StatCard t={t} label="Delivered Orders" value={totalDeliveredOrders} color={t.yellow} glow={t.yellowGlow} icon="📦" />
              </div>

              {/* Revenue model */}
              <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 16, padding: "24px 28px" }}>
                <p style={{ color: t.text, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Revenue Model</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
                  {[
                    { icon: "🛒", label: "Customer Pays", sub: "Item + Distance + ₹10 Fee", color: t.blue },
                    { icon: "🏪", label: "Vendor Gets", sub: "Item amount − 3% commission", color: t.accent },
                    { icon: "🚴", label: "Delivery Gets", sub: "3% commission + Distance", color: t.yellow },
                    { icon: "🌾", label: "GramConnect", sub: "₹10 Platform Fee / order", color: t.purple },
                  ].map(({ icon, label, sub, color }) => (
                    <div key={label} style={{
                      background: `${color}08`, border: `1px solid ${color}20`,
                      borderRadius: 14, padding: "18px 16px", textAlign: "center",
                    }}>
                      <p style={{ fontSize: 26, marginBottom: 8 }}>{icon}</p>
                      <p style={{ color, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{label}</p>
                      <p style={{ color: t.textMuted, fontSize: 11 }}>{sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly chart */}
              <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 16, padding: "24px 28px" }}>
                <p style={{ color: t.text, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Monthly Platform Revenue</p>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={monthlyRevenue} barSize={28}>
                    <XAxis dataKey="month" tick={{ fill: t.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: t.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip t={t} />} cursor={{ fill: `${t.accent}08` }} />
                    <Bar dataKey="revenue" fill={t.chartBar} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Recent delivered orders */}
              <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 16, padding: "24px 28px" }}>
                <p style={{ color: t.text, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Recent Delivered Orders</p>
                {orders.filter(o => o.status === "Delivered").length === 0 ? (
                  <p style={{ color: t.textMuted, fontSize: 13, textAlign: "center", padding: "24px 0" }}>No delivered orders yet</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          {["Order ID","Customer","Item Amt","Distance","Platform Fee","Total","Date"].map((h, idx) => (
                            <th key={h} style={{ ...thStyle, textAlign: idx >= 2 && idx <= 5 ? "right" : "left" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {orders.filter(o => o.status === "Delivered")
  .sort((a, b) => new Date(b.deliveredAt) - new Date(a.deliveredAt))
  .slice(0, 20).map(o => (
                          <tr key={o._id} className="row-hover" style={{ transition: "background 0.15s" }}>
                            <td style={{ ...tdStyle, color: t.text, fontWeight: 600 }}>{o.orderId}</td>
                            <td style={tdStyle}>{o.customerName}</td>
                           <td style={{ ...tdStyle, textAlign: "right" }}>₹{Number(o.itemAmount || 0).toFixed(2)}</td>
                            <td style={{ ...tdStyle, textAlign: "right", color: t.yellow }}>₹{Number(o.distanceCharge || 0).toFixed(2)} <span style={{ color: t.textMuted, fontSize: 10 }}>({Number(o.distanceKm || 0).toFixed(1)}km)</span></td>
                            <td style={{ ...tdStyle, textAlign: "right", color: t.accent, fontWeight: 700 }}>₹{Number(o.platformEarnings || 10).toFixed(2)}</td>
                            <td style={{ ...tdStyle, textAlign: "right", color: t.text, fontWeight: 700 }}>₹{Number(o.totalAmount).toFixed(2)}</td>
                            <td style={{ ...tdStyle, fontSize: 11, color: t.textMuted }}>{o.deliveredAt ? new Date(o.deliveredAt).toLocaleString() : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>
       <AIChatBot role="admin" darkMode={dark} />  {/* ← add this line */}
    </>
  );
}
