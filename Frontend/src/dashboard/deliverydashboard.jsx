import { useState, useEffect, useCallback } from "react";
import AIChatBot from "../components/AIChatBot";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { getDeliveryOrders, deliveryUpdateOrder, getEarnings, getProfile } from "../api";

const MENU = ["Dashboard", "Deliveries", "Earnings", "Support"];
const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];
const STEPS = ["Assigned", "Picked", "On the way", "Delivered"];

/* ─── Inject global styles ─────────────────────────────────────────────── */
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  :root {
    --bg-base: #f8f9fb;
    --bg-surface: #ffffff;
    --bg-surface-2: #f1f3f6;
    --bg-surface-3: #e8eaee;
    --border: rgba(0,0,0,0.08);
    --border-strong: rgba(0,0,0,0.14);
    --text-primary: #0d1117;
    --text-secondary: #5a6278;
    --text-muted: #9aa0b2;
    --accent: #059669;
    --accent-dim: rgba(5,150,105,0.1);
    --accent-border: rgba(5,150,105,0.3);
    --blue: #2563eb;
    --blue-dim: rgba(37,99,235,0.1);
    --amber: #d97706;
    --amber-dim: rgba(217,119,6,0.1);
    --red: #dc2626;
    --red-dim: rgba(220,38,38,0.1);
    --purple: #7c3aed;
    --purple-dim: rgba(124,58,237,0.1);
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    --shadow-md: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 20px;
    --font: 'DM Sans', sans-serif;
    --mono: 'DM Mono', monospace;
    --nav-w: 220px;
  }

  [data-theme="dark"] {
    --bg-base: #0c0e14;
    --bg-surface: #131720;
    --bg-surface-2: #1a1f2e;
    --bg-surface-3: #222840;
    --border: rgba(255,255,255,0.06);
    --border-strong: rgba(255,255,255,0.12);
    --text-primary: #e8ecf2;
    --text-secondary: #8892a8;
    --text-muted: #505a72;
    --accent: #10b981;
    --accent-dim: rgba(16,185,129,0.12);
    --accent-border: rgba(16,185,129,0.25);
    --blue: #60a5fa;
    --blue-dim: rgba(96,165,250,0.12);
    --amber: #fbbf24;
    --amber-dim: rgba(251,191,36,0.12);
    --red: #f87171;
    --red-dim: rgba(248,113,113,0.12);
    --purple: #a78bfa;
    --purple-dim: rgba(167,139,250,0.12);
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.4);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: var(--font); background: var(--bg-base); color: var(--text-primary); transition: background 0.2s, color 0.2s; }

  .delivery-root {
    min-height: 100vh;
    display: flex;
    font-family: var(--font);
    background: var(--bg-base);
    color: var(--text-primary);
  }

  /* Sidebar */
  .sidebar {
    width: var(--nav-w);
    background: var(--bg-surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0; left: 0; bottom: 0;
    z-index: 50;
    transition: background 0.2s, border-color 0.2s;
  }
  .sidebar-logo {
    padding: 24px 20px 20px;
    border-bottom: 1px solid var(--border);
  }
  .sidebar-logo-mark {
    display: flex; align-items: center; gap: 10px;
  }
  .logo-icon {
    width: 36px; height: 36px; border-radius: 10px;
    background: var(--accent);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
  }
  .logo-text { font-size: 15px; font-weight: 600; letter-spacing: -0.3px; }
  .logo-sub { font-size: 11px; color: var(--text-muted); margin-top: 1px; font-family: var(--mono); text-transform: uppercase; letter-spacing: 0.5px; }

  .sidebar-nav { flex: 1; padding: 16px 12px; display: flex; flex-direction: column; gap: 3px; }
  .nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px; border-radius: var(--radius-sm);
    font-size: 14px; font-weight: 400; cursor: pointer;
    color: var(--text-secondary); transition: all 0.15s;
    border: none; background: none; width: 100%; text-align: left;
    position: relative;
  }
  .nav-item:hover { background: var(--bg-surface-2); color: var(--text-primary); }
  .nav-item.active { background: var(--accent-dim); color: var(--accent); font-weight: 500; }
  .nav-badge {
    margin-left: auto; background: var(--accent); color: #fff;
    font-size: 10px; font-weight: 600; padding: 2px 6px;
    border-radius: 20px; font-family: var(--mono);
  }
  .nav-icon { font-size: 16px; width: 20px; text-align: center; }

  .sidebar-footer {
    padding: 16px 12px;
    border-top: 1px solid var(--border);
    display: flex; flex-direction: column; gap: 8px;
  }
  .profile-row {
    display: flex; align-items: center; gap: 10px; padding: 8px 4px;
  }
  .avatar {
    width: 32px; height: 32px; border-radius: 50%;
    background: var(--accent-dim); border: 1px solid var(--accent-border);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 600; color: var(--accent);
  }
  .profile-info { flex: 1; min-width: 0; }
  .profile-name { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .profile-role { font-size: 11px; color: var(--text-muted); }

  .theme-toggle {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 12px; border-radius: var(--radius-sm);
    background: var(--bg-surface-2); border: 1px solid var(--border);
    font-size: 13px; color: var(--text-secondary); cursor: pointer;
  }
  .toggle-track {
    width: 36px; height: 20px; border-radius: 10px;
    background: var(--bg-surface-3); border: 1px solid var(--border-strong);
    position: relative; cursor: pointer; transition: background 0.2s;
  }
  .toggle-track.on { background: var(--accent); border-color: var(--accent); }
  .toggle-thumb {
    width: 14px; height: 14px; border-radius: 50%; background: #fff;
    position: absolute; top: 2px; left: 3px;
    transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  .toggle-track.on .toggle-thumb { transform: translateX(16px); }

  .logout-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px; border-radius: var(--radius-sm);
    background: none; border: 1px solid var(--border);
    color: var(--red); font-size: 13px; cursor: pointer;
    transition: all 0.15s; width: 100%;
    font-family: var(--font); font-weight: 400;
  }
  .logout-btn:hover { background: var(--red-dim); border-color: var(--red); }

  /* Main */
  .main-content {
    margin-left: var(--nav-w);
    flex: 1; display: flex; flex-direction: column;
    min-height: 100vh;
  }
  .topbar {
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border);
    padding: 0 32px;
    height: 60px;
    display: flex; align-items: center; justify-content: space-between;
    position: sticky; top: 0; z-index: 40;
  }
  .topbar-title { font-size: 15px; font-weight: 500; color: var(--text-primary); }
  .topbar-right { display: flex; align-items: center; gap: 12px; }
  .topbar-time {
    font-size: 12px; color: var(--text-muted); font-family: var(--mono);
  }

  /* Alert */
  .alert-toast {
    position: fixed; top: 20px; right: 20px; z-index: 100;
    padding: 12px 18px; border-radius: var(--radius-md);
    font-size: 13px; font-weight: 500;
    box-shadow: var(--shadow-md);
    display: flex; align-items: center; gap: 8px;
    animation: slideIn 0.2s ease;
  }
  .alert-success { background: var(--accent); color: #fff; }
  .alert-error { background: var(--red); color: #fff; }
  @keyframes slideIn { from { opacity:0; transform: translateX(16px); } to { opacity:1; transform: translateX(0); } }

  /* Page content */
  .page { padding: 32px; flex: 1; }
  .page-header { margin-bottom: 28px; }
  .page-title { font-size: 22px; font-weight: 600; letter-spacing: -0.5px; }
  .page-sub { font-size: 13px; color: var(--text-muted); margin-top: 4px; }

  /* KPI grid */
  .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap: 16px; margin-bottom: 24px; }
  .kpi-card {
    background: var(--bg-surface); border: 1px solid var(--border);
    border-radius: var(--radius-lg); padding: 20px;
    box-shadow: var(--shadow-sm); transition: box-shadow 0.2s;
  }
  .kpi-card:hover { box-shadow: var(--shadow-md); }
  .kpi-card.accent-card { background: var(--accent); border-color: var(--accent); }
  .kpi-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; color: var(--text-muted); font-family: var(--mono); }
  .kpi-card.accent-card .kpi-label { color: rgba(255,255,255,0.7); }
  .kpi-value { font-size: 28px; font-weight: 600; letter-spacing: -1px; margin-top: 6px; line-height: 1; font-family: var(--mono); }
  .kpi-card.accent-card .kpi-value { color: #fff; }
  .kpi-icon { font-size: 20px; margin-bottom: 8px; }

  /* Section card */
  .section-card {
    background: var(--bg-surface); border: 1px solid var(--border);
    border-radius: var(--radius-lg); box-shadow: var(--shadow-sm);
    margin-bottom: 20px; overflow: hidden;
  }
  .section-header {
    padding: 18px 22px 14px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .section-title { font-size: 14px; font-weight: 500; }
  .section-body { padding: 20px 22px; }

  /* Breakdown mini grid */
  .breakdown-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
  .breakdown-item {
    padding: 14px 16px; border-radius: var(--radius-md);
    border: 1px solid var(--border); background: var(--bg-surface-2);
  }
  .breakdown-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-family: var(--mono); }
  .breakdown-value { font-size: 20px; font-weight: 600; font-family: var(--mono); margin-top: 4px; letter-spacing: -0.5px; }
  .breakdown-item.blue .breakdown-label { color: var(--blue); }
  .breakdown-item.blue .breakdown-value { color: var(--blue); }
  .breakdown-item.amber .breakdown-label { color: var(--amber); }
  .breakdown-item.amber .breakdown-value { color: var(--amber); }
  .breakdown-item.green .breakdown-label { color: var(--accent); }
  .breakdown-item.green .breakdown-value { color: var(--accent); }

  /* Status badge */
  .badge {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11px; font-weight: 500; padding: 3px 8px;
    border-radius: 20px; font-family: var(--mono);
    letter-spacing: 0.2px;
  }
  .badge::before { content:''; width:5px; height:5px; border-radius:50%; display:inline-block; }
  .badge-assigned { background: var(--amber-dim); color: var(--amber); }
  .badge-assigned::before { background: var(--amber); }
  .badge-picked { background: var(--blue-dim); color: var(--blue); }
  .badge-picked::before { background: var(--blue); }
  .badge-onway { background: var(--purple-dim); color: var(--purple); }
  .badge-onway::before { background: var(--purple); }
  .badge-delivered { background: var(--accent-dim); color: var(--accent); }
  .badge-delivered::before { background: var(--accent); }
  .badge-declined { background: var(--red-dim); color: var(--red); }
  .badge-declined::before { background: var(--red); }

  /* Delivery card */
  .delivery-card {
    background: var(--bg-surface); border: 1px solid var(--border);
    border-radius: var(--radius-lg); box-shadow: var(--shadow-sm);
    margin-bottom: 14px; overflow: hidden;
    transition: box-shadow 0.2s, border-color 0.2s;
  }
  .delivery-card:hover { box-shadow: var(--shadow-md); border-color: var(--border-strong); }
  .delivery-card-accent { height: 3px; }
  .delivery-card-accent.assigned { background: var(--amber); }
  .delivery-card-accent.picked { background: var(--blue); }
  .delivery-card-accent.onway { background: var(--purple); }
  .delivery-card-accent.delivered { background: var(--accent); }
  .delivery-card-accent.declined { background: var(--red); }
  .delivery-card-body { padding: 18px 20px; }

  .delivery-meta {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 14px;
  }
  .order-id { font-size: 14px; font-weight: 600; font-family: var(--mono); letter-spacing: 0.3px; }
  .order-time { font-size: 11px; color: var(--text-muted); margin-top: 3px; }

  .earnings-pill {
    background: var(--accent-dim); border: 1px solid var(--accent-border);
    border-radius: var(--radius-md); padding: 10px 14px;
    margin-bottom: 14px; display: flex; flex-direction: column; gap: 6px;
  }
  .earnings-pill-title { font-size: 11px; color: var(--accent); font-family: var(--mono); text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 2px; }
  .earnings-row { display: flex; justify-content: space-between; font-size: 12px; }
  .earnings-row span:first-child { color: var(--text-secondary); }
  .earnings-total { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; font-family: var(--mono); border-top: 1px solid var(--accent-border); padding-top: 6px; margin-top: 2px; }

  .delivery-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
  .delivery-info-box {
    background: var(--bg-surface-2); border-radius: var(--radius-sm);
    padding: 10px 12px; border: 1px solid var(--border);
  }
  .info-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); font-family: var(--mono); margin-bottom: 4px; }
  .info-value { font-size: 13px; font-weight: 500; }
  .info-phone { font-size: 12px; color: var(--blue); margin-top: 2px; display: flex; align-items: center; gap: 4px; text-decoration: none; }

  .items-section { margin-bottom: 14px; }
  .items-wrap { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
  .item-chip {
    font-size: 11px; padding: 4px 10px; border-radius: 20px;
    background: var(--bg-surface-2); border: 1px solid var(--border);
    color: var(--text-secondary); font-family: var(--mono);
  }

  /* Step progress */
  .step-track { display: flex; align-items: center; margin-bottom: 6px; }
  .step-dot {
    width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
    border: 2px solid var(--border-strong); background: var(--bg-surface);
    transition: all 0.2s;
  }
  .step-dot.done { background: var(--accent); border-color: var(--accent); }
  .step-line { flex: 1; height: 2px; background: var(--bg-surface-3); }
  .step-line.done { background: var(--accent); }
  .step-labels { display: flex; justify-content: space-between; }
  .step-label { font-size: 10px; color: var(--text-muted); font-family: var(--mono); text-align: center; flex: 1; }
  .step-label.active { color: var(--accent); font-weight: 500; }

  /* Action buttons */
  .action-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border); }
  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: var(--radius-sm);
    font-size: 13px; font-weight: 500; cursor: pointer;
    border: 1px solid transparent; transition: all 0.15s;
    font-family: var(--font);
  }
  .btn-accept { background: var(--blue); color: #fff; }
  .btn-accept:hover { opacity: 0.88; }
  .btn-start { background: var(--purple); color: #fff; }
  .btn-start:hover { opacity: 0.88; }
  .btn-deliver { background: var(--accent); color: #fff; }
  .btn-deliver:hover { opacity: 0.88; }
  .btn-decline { background: none; border-color: var(--red); color: var(--red); }
  .btn-decline:hover { background: var(--red-dim); }
  .btn-ghost { background: var(--bg-surface-2); border-color: var(--border); color: var(--text-secondary); }
  .btn-ghost:hover { border-color: var(--border-strong); color: var(--text-primary); }
  .delivered-tag { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--accent); }
  .delivered-time { font-size: 11px; color: var(--text-muted); font-family: var(--mono); }

  /* Filter tabs */
  .filter-bar { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 20px; }
  .filter-chip {
    font-size: 12px; padding: 5px 12px; border-radius: 20px;
    background: var(--bg-surface); border: 1px solid var(--border);
    color: var(--text-secondary); cursor: pointer; transition: all 0.15s;
    font-family: var(--mono);
  }
  .filter-chip:hover { border-color: var(--accent); color: var(--accent); }

  /* Refresh btn */
  .refresh-btn {
    font-size: 12px; color: var(--accent); background: none; border: none;
    cursor: pointer; font-family: var(--mono); padding: 4px 8px;
    border-radius: 6px; transition: background 0.15s;
  }
  .refresh-btn:hover { background: var(--accent-dim); }

  /* Empty state */
  .empty-state {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 60px 20px; gap: 10px;
  }
  .empty-icon { font-size: 40px; }
  .empty-title { font-size: 15px; font-weight: 500; }
  .empty-sub { font-size: 13px; color: var(--text-muted); text-align: center; }

  /* Notification items */
  .notif-item {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 10px 0; border-bottom: 1px solid var(--border);
    font-size: 13px;
  }
  .notif-item:last-child { border-bottom: none; }
  .notif-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }

  /* Earnings page */
  .earnings-hero {
    background: var(--accent); border-radius: var(--radius-xl);
    padding: 28px 28px; margin-bottom: 20px; position: relative; overflow: hidden;
  }
  .earnings-hero::before {
    content: ''; position: absolute; top: -40px; right: -40px;
    width: 180px; height: 180px; border-radius: 50%;
    background: rgba(255,255,255,0.07);
  }
  .earnings-hero::after {
    content: ''; position: absolute; bottom: -60px; right: 60px;
    width: 120px; height: 120px; border-radius: 50%;
    background: rgba(255,255,255,0.05);
  }
  .hero-label { font-size: 12px; color: rgba(255,255,255,0.75); font-family: var(--mono); text-transform: uppercase; letter-spacing: 0.5px; }
  .hero-amount { font-size: 44px; font-weight: 700; color: #fff; font-family: var(--mono); letter-spacing: -2px; margin-top: 4px; }
  .hero-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px; }
  .hero-pill { background: rgba(255,255,255,0.18); color: #fff; font-size: 12px; font-family: var(--mono); padding: 5px 12px; border-radius: 20px; }

  /* Completed list */
  .completed-row { padding: 14px 0; border-bottom: 1px solid var(--border); }
  .completed-row:last-child { border-bottom: none; }
  .completed-header { display: flex; justify-content: space-between; align-items: flex-start; }
  .completed-id { font-size: 13px; font-weight: 600; font-family: var(--mono); }
  .completed-sub { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
  .completed-earn { font-size: 14px; font-weight: 700; color: var(--accent); font-family: var(--mono); }
  .completed-breakdown { display: flex; gap: 16px; margin-top: 8px; font-size: 11px; color: var(--text-muted); font-family: var(--mono); }

  /* Support */
  .support-step-flow { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
  .support-step { background: var(--bg-surface-2); border: 1px solid var(--border); padding: 7px 14px; border-radius: var(--radius-sm); font-size: 13px; }
  .support-arrow { color: var(--text-muted); font-size: 14px; }
  .support-qa { margin-top: 0; }
  .support-qa-title { font-size: 14px; font-weight: 500; margin-bottom: 8px; }
  .support-qa-body { font-size: 13px; color: var(--text-secondary); line-height: 1.7; }

  /* Active delivery mini row */
  .active-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 12px; border-radius: var(--radius-sm);
    background: var(--bg-surface-2); border: 1px solid var(--border);
    margin-bottom: 8px;
  }
  .active-row-id { font-size: 13px; font-weight: 600; font-family: var(--mono); }
  .active-row-sub { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
  .active-earn { font-size: 14px; font-weight: 700; color: var(--accent); font-family: var(--mono); }
  .active-earn-label { font-size: 10px; color: var(--text-muted); text-align: right; }

  /* Recharts custom tooltip */
  .custom-tooltip {
    background: var(--bg-surface); border: 1px solid var(--border);
    border-radius: var(--radius-sm); padding: 8px 12px;
    font-size: 12px; font-family: var(--mono);
  }

  /* Analytics mini */
  .analytics-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
  .analytic-card {
    background: var(--bg-surface); border: 1px solid var(--border);
    border-radius: var(--radius-md); padding: 16px;
    box-shadow: var(--shadow-sm);
  }
  .analytic-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); font-family: var(--mono); }
  .analytic-value { font-size: 22px; font-weight: 600; font-family: var(--mono); margin-top: 6px; letter-spacing: -0.5px; }

  footer.dv-footer {
    background: var(--bg-surface);
    border-top: 1px solid var(--border);
    padding: 16px 32px;
    font-size: 11px;
    color: var(--text-muted);
    font-family: var(--mono);
    text-align: center;
  }
`;

function injectStyles(id, css) {
  if (typeof document === "undefined") return;
  let el = document.getElementById(id);
  if (!el) { el = document.createElement("style"); el.id = id; document.head.appendChild(el); }
  el.textContent = css;
}

function BadgeStatus({ status }) {
  const map = {
    Assigned: "badge-assigned",
    Picked: "badge-picked",
    "On the way": "badge-onway",
    Delivered: "badge-delivered",
    Declined: "badge-declined",
  };
  return <span className={`badge ${map[status] || "badge-assigned"}`}>{status}</span>;
}

function AccentBar({ status }) {
  const map = { Assigned: "assigned", Picked: "picked", "On the way": "onway", Delivered: "delivered", Declined: "declined" };
  return <div className={`delivery-card-accent ${map[status] || "assigned"}`} />;
}

function NavIcon({ tab }) {
  const icons = {
    Dashboard: "▦",
    Deliveries: "⬡",
    Earnings: "◈",
    Support: "◎",
  };
  return <span className="nav-icon">{icons[tab] || "•"}</span>;
}

export default function DeliveryDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [profile, setProfile] = useState(null);
  const [alert, setAlert] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("dv-theme") || "light");

  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [earnings, setEarnings] = useState(null);

  // Inject styles + theme
  useEffect(() => { injectStyles("dv-styles", GLOBAL_STYLES); }, []);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("dv-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "light" ? "dark" : "light");

  const showAlert = (msg, type = "success") => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3500);
  };

  useEffect(() => { getProfile().then((r) => setProfile(r.data)).catch(() => {}); }, []);

  const loadDeliveries = useCallback(() => {
    setLoading(true);
    getDeliveryOrders()
      .then((r) => setDeliveries(r.data))
      .catch(() => showAlert("Failed to load deliveries", "error"))
      .finally(() => setLoading(false));
  }, []);

  const loadEarnings = useCallback(() => {
    getEarnings().then((r) => setEarnings(r.data)).catch(() => {});
  }, []);

  useEffect(() => { loadDeliveries(); loadEarnings(); }, [loadDeliveries, loadEarnings]);
  useEffect(() => { if (activeTab === "Earnings") loadEarnings(); }, [activeTab, loadEarnings]);

  const handleUpdate = async (id, status) => {
    try {
      await deliveryUpdateOrder(id, status);
      showAlert(`Order marked as ${status}`);
      loadDeliveries();
      loadEarnings();
    } catch (err) {
      showAlert(err.response?.data?.msg || "Failed to update", "error");
    }
  };

  const logout = () => { localStorage.clear(); navigate("/login"); };

  // Stats
  const totalEarnings = earnings?.total || 0;
  const completed = deliveries.filter((d) => d.status === "Delivered").length;
  const active = deliveries.filter((d) => ["Assigned", "Picked", "On the way"].includes(d.status)).length;
  const totalOrders = deliveries.filter((d) => ["Assigned", "Delivered"].includes(d.status)).length;
  const deliveredList = deliveries.filter((d) => d.status === "Delivered");
  const totalCommission = deliveredList.reduce((s, d) => s + ((d.itemAmount || 0) * 0.03), 0);
  const totalDistanceCharge = deliveredList.reduce((s, d) => s + (d.distanceCharge || 0), 0);

  const pieData = [
    { name: "Delivered", value: completed },
    { name: "Picked", value: deliveries.filter((d) => d.status === "Picked").length },
    { name: "Assigned", value: deliveries.filter((d) => d.status === "Assigned").length },
  ].filter((d) => d.value > 0);

  const initials = profile?.name ? profile.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "DP";

  const PAGE_TITLES = {
    Dashboard: "Overview",
    Deliveries: "Delivery Pipeline",
    Earnings: "Earnings & Payouts",
    Support: "Help & Support",
  };

  return (
    <div className="delivery-root">
      {/* ALERT */}
      {alert && (
        <div className={`alert-toast ${alert.type === "error" ? "alert-error" : "alert-success"}`}>
          {alert.type === "error" ? "✕" : "✓"} {alert.msg}
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">
            <div className="logo-icon">🚚</div>
            <div>
              <div className="logo-text">GramConnect</div>
              <div className="logo-sub">Delivery Partner</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {MENU.map((m) => (
            <button key={m} className={`nav-item ${activeTab === m ? "active" : ""}`} onClick={() => setActiveTab(m)}>
              <NavIcon tab={m} />
              {m}
              {m === "Deliveries" && active > 0 && <span className="nav-badge">{active}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="profile-row">
            <div className="avatar">{initials}</div>
            <div className="profile-info">
              <div className="profile-name">{profile?.name || "Delivery Partner"}</div>
              <div className="profile-role">Active</div>
            </div>
          </div>

          {/* Theme toggle */}
          <div className="theme-toggle" onClick={toggleTheme} style={{ cursor: "pointer" }}>
            <span>{theme === "dark" ? "🌙 Dark" : "☀️ Light"}</span>
            <div className={`toggle-track ${theme === "dark" ? "on" : ""}`}>
              <div className="toggle-thumb" />
            </div>
          </div>

          <button className="logout-btn" onClick={logout}>
            ⎋ Sign out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main-content">
        {/* Topbar */}
        <div className="topbar">
          <span className="topbar-title">{PAGE_TITLES[activeTab]}</span>
          <div className="topbar-right">
            <span className="topbar-time">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>

        {/* ═══════════════ DASHBOARD ═══════════════ */}
        {activeTab === "Dashboard" && (
          <div className="page">
            <div className="page-header">
              <div className="page-title">Welcome back, {profile?.name?.split(" ")[0] || "Partner"} 👋</div>
              <div className="page-sub">Here's your delivery performance at a glance</div>
            </div>

            {/* KPIs */}
            <div className="kpi-grid">
              <div className="kpi-card accent-card">
                <div className="kpi-label">Total Earnings</div>
                <div className="kpi-value">₹{Number(totalEarnings).toFixed(2)}</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Completed</div>
                <div className="kpi-value" style={{ color: "var(--accent)" }}>{completed}</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Active</div>
                <div className="kpi-value" style={{ color: "var(--blue)" }}>{active}</div>
              </div>
              <div className="kpi-card">
            <div className="kpi-label">Total Orders</div>
            <div
                className="kpi-value"
              style={{ color: "var(--text-secondary)" }}
              >
              {totalOrders}
            </div>
            </div>
            </div>

            {/* Breakdown */}
            <div className="section-card">
              <div className="section-header">
                <span className="section-title">Earnings Breakdown</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--mono)" }}>3% commission + ₹5/km</span>
              </div>
              <div className="section-body">
                <div className="breakdown-grid">
                  <div className="breakdown-item blue">
                    <div className="breakdown-label">Commission (3%)</div>
                    <div className="breakdown-value">₹{totalCommission.toFixed(2)}</div>
                  </div>
                  <div className="breakdown-item amber">
                    <div className="breakdown-label">Distance Charge</div>
                    <div className="breakdown-value">₹{totalDistanceCharge.toFixed(2)}</div>
                  </div>
                  <div className="breakdown-item green">
                    <div className="breakdown-label">Net Earned</div>
                    <div className="breakdown-value">₹{Number(totalEarnings).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pie chart */}
            <div className="section-card">
              <div className="section-header"><span className="section-title">Status Distribution</span></div>
              <div className="section-body">
                {pieData.length === 0 ? (
                  <div className="empty-state" style={{ padding: "32px 20px" }}>
                    <div className="empty-icon">📊</div>
                    <div className="empty-sub">No delivery data yet</div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={{ stroke: "var(--text-muted)" }}>
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, fontFamily: "var(--mono)", fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Active deliveries */}
            <div className="section-card">
              <div className="section-header"><span className="section-title">Active Deliveries</span></div>
              <div className="section-body" style={{ padding: "14px 22px" }}>
                {deliveries.filter(d => !["Delivered", "Declined"].includes(d.status)).length === 0 ? (
                  <div style={{ padding: "18px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No active deliveries right now</div>
                ) : (
                  deliveries.filter(d => !["Delivered", "Declined"].includes(d.status)).map(d => (
                    <div key={d._id} className="active-row">
                      <div>
                        <div className="active-row-id">{d.orderId}</div>
                        <div className="active-row-sub">👤 {d.customerName} · {d.deliveryAddress}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div>
                          <div className="active-earn">₹{Number(d.deliveryEarnings || 0).toFixed(2)}</div>
                          <div className="active-earn-label">you earn</div>
                        </div>
                        <BadgeStatus status={d.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Notifications */}
            <div className="section-card">
              <div className="section-header"><span className="section-title">Notifications</span></div>
              <div className="section-body" style={{ padding: "8px 22px" }}>
                {active === 0 && completed === 0 ? (
                  <div style={{ padding: "16px 0", color: "var(--text-muted)", fontSize: 13 }}>No new notifications</div>
                ) : (
                  <>
                    {active > 0 && (
                      <div className="notif-item">
                        <div className="notif-dot" style={{ background: "var(--blue)" }} />
                        <span style={{ fontSize: 13 }}>{active} active delivery{active > 1 ? "ies" : ""} in progress</span>
                      </div>
                    )}
                    {completed > 0 && (
                      <div className="notif-item">
                        <div className="notif-dot" style={{ background: "var(--accent)" }} />
                        <span style={{ fontSize: 13 }}>{completed} deliveries completed — great work!</span>
                      </div>
                    )}
                    {totalEarnings > 0 && (
                      <div className="notif-item">
                        <div className="notif-dot" style={{ background: "var(--amber)" }} />
                       <span style={{ fontSize: 13 }}>Total earnings: <strong style={{ fontFamily: "var(--mono)" }}>₹{Number(totalEarnings).toFixed(2)}</strong></span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ DELIVERIES ═══════════════ */}
        {activeTab === "Deliveries" && (
          <div className="page">
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <div className="page-title">Delivery Pipeline</div>
                <div className="page-sub">Manage assigned orders step by step</div>
              </div>
              <button className="refresh-btn" onClick={loadDeliveries}>{loading ? "Loading…" : "↻ Refresh"}</button>
            </div>

            <div className="filter-bar">
              {["All", "Assigned", "Picked", "On the way", "Delivered"].map((f) => {
                const count = f === "All" ? deliveries.length : deliveries.filter(d => d.status === f).length;
                return <span key={f} className="filter-chip">{f} ({count})</span>;
              })}
            </div>

            {deliveries.length === 0 ? (
              <div className="section-card">
                <div className="empty-state">
                  <div className="empty-icon">🚚</div>
                  <div className="empty-title">No deliveries yet</div>
                  <div className="empty-sub">New orders assigned by vendors will appear here</div>
                </div>
              </div>
            ) : (
              deliveries.map(d => {
                const current = STEPS.indexOf(d.status);
                return (
                  <div key={d._id} className="delivery-card">
                    <AccentBar status={d.status} />
                    <div className="delivery-card-body">
                      {/* Header */}
                      <div className="delivery-meta">
                        <div>
                          <div className="order-id">{d.orderId}</div>
                          <div className="order-time">{new Date(d.createdAt).toLocaleString()}</div>
                        </div>
                        <BadgeStatus status={d.status} />
                      </div>

                      {/* Earnings */}
                      <div className="earnings-pill">
                        <div className="earnings-pill-title">Your Earnings</div>
                        <div className="earnings-row">
                          <span>Commission (3% of ₹{d.itemAmount || 0})</span>
                          <span style={{ color: "var(--blue)", fontFamily: "var(--mono)" }}>+₹{((d.itemAmount || 0) * 0.03).toFixed(2)}</span>
                        </div>
                        <div className="earnings-row">
                          <span>Distance ({d.distanceKm || 0} km × ₹5)</span>
                          <span style={{ color: "var(--amber)", fontFamily: "var(--mono)" }}>+₹{d.distanceCharge || 0}</span>
                        </div>
                        <div className="earnings-total">
                          <span>Total</span>
                          <span>₹{Number(d.deliveryEarnings || 0).toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Customer / address */}
                      <div className="delivery-info-grid">
                        <div className="delivery-info-box">
                          <div className="info-label">Customer</div>
                          <div className="info-value">{d.customerName}</div>
                          {d.customerPhone && (
                            <a href={`tel:${d.customerPhone}`} className="info-phone">📞 {d.customerPhone}</a>
                          )}
                        </div>
                        <div className="delivery-info-box">
                          <div className="info-label">Delivery Address</div>
                          <div className="info-value">{d.deliveryAddress}</div>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="items-section">
                        <div className="info-label">Order Items</div>
                        <div className="items-wrap">
                          {d.items.map((item, idx) => (
                            <span key={idx} className="item-chip">{item.name} × {item.quantity}{item.unit}</span>
                          ))}
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="step-track">
                        {STEPS.map((step, idx) => (
                          <div key={step} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                            <div className={`step-dot ${current >= idx ? "done" : ""}`} />
                            {idx < STEPS.length - 1 && <div className={`step-line ${current > idx ? "done" : ""}`} />}
                          </div>
                        ))}
                      </div>
                      <div className="step-labels">
                        {STEPS.map(s => (
                          <span key={s} className={`step-label ${d.status === s ? "active" : ""}`}>{s}</span>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="action-bar">
                        {d.status === "Assigned" && (
                          <>
                            <button className="btn btn-accept" onClick={() => handleUpdate(d._id, "Picked")}>✓ Accept & Pickup</button>
                            <button className="btn btn-decline" onClick={() => handleUpdate(d._id, "Declined")}>✕ Decline</button>
                          </>
                        )}
                        {d.status === "Picked" && (
                          <button className="btn btn-start" onClick={() => handleUpdate(d._id, "On the way")}>🚚 Start Delivery</button>
                        )}
                        {d.status === "On the way" && (
                          <button className="btn btn-deliver" onClick={() => handleUpdate(d._id, "Delivered")}>✓ Mark Delivered</button>
                        )}
                        {d.status === "Delivered" && (
                          <div className="delivered-tag">
                            ✓ Delivered successfully
                            {d.deliveredAt && <span className="delivered-time">at {new Date(d.deliveredAt).toLocaleTimeString()}</span>}
                          </div>
                        )}
                        {!["Delivered", "Declined"].includes(d.status) && d.customerPhone && (
                          <a href={`tel:${d.customerPhone}`} className="btn btn-ghost">📞 Call Customer</a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ═══════════════ EARNINGS ═══════════════ */}
        {activeTab === "Earnings" && (
          <div className="page">
            <div className="earnings-hero">
              <div className="hero-label">Total Lifetime Earnings</div>
              <div className="hero-amount">₹{Number(totalEarnings).toFixed(2)}</div>
              <div className="hero-pills">
                <span className="hero-pill">Today · ₹{Number(earnings?.today || 0).toFixed(2)}</span>
                <span className="hero-pill">This week · ₹{Number(earnings?.week || 0).toFixed(2)}</span>
                <span className="hero-pill">{completed} deliveries</span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="section-card">
              <div className="section-header"><span className="section-title">Earnings Breakdown</span></div>
              <div className="section-body">
                <div className="breakdown-grid">
                  <div className="breakdown-item blue">
                    <div className="breakdown-label">Commission (3%)</div>
                    <div className="breakdown-value">₹{totalCommission.toFixed(2)}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--mono)", marginTop: 4 }}>from item amount</div>
                  </div>
                  <div className="breakdown-item amber">
                    <div className="breakdown-label">Distance Charges</div>
                    <div className="breakdown-value">₹{totalDistanceCharge.toFixed(2)}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--mono)", marginTop: 4 }}>₹5 per km</div>
                  </div>
                  <div className="breakdown-item green">
                    <div className="breakdown-label">Net Total</div>
                    <div className="breakdown-value">₹{Number(totalEarnings).toFixed(2)}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--mono)", marginTop: 4 }}>commission + distance</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics */}
            <div className="analytics-grid" style={{ marginBottom: 20 }}>
              <div className="analytic-card">
                <div className="analytic-label">Avg / Delivery</div>
                <div className="analytic-value">₹{completed ? Math.round(totalEarnings / completed) : 0}</div>
              </div>
              <div className="analytic-card">
                <div className="analytic-label">Today</div>
                <div className="analytic-value">₹{Number(earnings?.today || 0).toFixed(2)}</div>
              </div>
              <div className="analytic-card">
                <div className="analytic-label">This Week</div>
                <div className="analytic-value">₹{Number(earnings?.week || 0).toFixed(2)}</div>
              </div>
            </div>

            {/* Completed list */}
            <div className="section-card">
              <div className="section-header"><span className="section-title">Completed Deliveries</span></div>
              <div className="section-body" style={{ padding: "8px 22px" }}>
                {deliveredList.length === 0 ? (
                  <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No completed deliveries yet</div>
                ) : (
                  deliveredList.map(d => (
                    <div key={d._id} className="completed-row">
                      <div className="completed-header">
                        <div>
                          <div className="completed-id">{d.orderId}</div>
                          <div className="completed-sub">{d.customerName} · {d.items?.[0]?.name}</div>
                          {d.deliveredAt && <div className="completed-sub">{new Date(d.deliveredAt).toLocaleString()}</div>}
                        </div>
                        <div>
                          <div className="completed-earn">+₹{Number(d.deliveryEarnings || 0).toFixed(2)}</div>
                          <div style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "right", fontFamily: "var(--mono)" }}>paid</div>
                        </div>
                      </div>
                      <div className="completed-breakdown">
                        <span>Commission: <span style={{ color: "var(--blue)" }}>₹{Number((d.itemAmount || 0) * 0.03).toFixed(2)}</span></span>
                        <span>Distance ({Number(d.distanceKm || 0).toFixed(1)}km): <span style={{ color: "var(--amber)" }}>₹{Number(d.distanceCharge || 0).toFixed(2)}</span></span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ SUPPORT ═══════════════ */}
        {activeTab === "Support" && (
          <div className="page">
            <div className="page-header">
              <div className="page-title">Help & Support</div>
              <div className="page-sub">Everything you need to know about delivering with GramConnect</div>
            </div>

            {/* Workflow banner — full width */}
            <div className="section-card" style={{ marginBottom: 24 }}>
              <div className="section-header">
                <span className="section-title">Delivery Workflow</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--mono)" }}>5 steps from assignment to payout</span>
              </div>
              <div className="section-body">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
                  {[
                    { icon: "📥", step: "01", label: "Assigned", desc: "Vendor assigns the order to you. Check your Deliveries tab." },
                    { icon: "✅", step: "02", label: "Accept & Pickup", desc: "Tap 'Accept & Pickup' to confirm. Head to the vendor location." },
                    { icon: "🚚", step: "03", label: "Start Delivery", desc: "Once you've collected the items, tap 'Start Delivery'." },
                    { icon: "🏠", step: "04", label: "Mark Delivered", desc: "Hand over to the customer and tap 'Mark Delivered'." },
                    { icon: "₹", step: "05", label: "Earnings Credited", desc: "Commission + distance charge instantly credited to your account." },
                  ].map((s, i, arr) => (
                    <div key={s.step} style={{ position: "relative" }}>
                      <div style={{
                        background: "var(--bg-surface-2)", border: "1px solid var(--border)",
                        borderRadius: "var(--radius-md)", padding: "16px 14px", height: "100%",
                        borderTop: "3px solid var(--accent)",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <span style={{ fontSize: 22 }}>{s.icon}</span>
                          <span style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--text-muted)", background: "var(--bg-surface-3)", padding: "2px 6px", borderRadius: 20 }}>{s.step}</span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--text-primary)" }}>{s.label}</div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{s.desc}</div>
                      </div>
                      {i < arr.length - 1 && (
                        <div style={{
                          position: "absolute", top: "50%", right: -8,
                          transform: "translateY(-50%)",
                          fontSize: 14, color: "var(--accent)", zIndex: 1, fontWeight: 700,
                        }}>›</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* FAQ grid — 2 columns */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              {[
                {
                  icon: "₹",
                  title: "How You Earn",
                  color: "var(--accent)",
                  colorDim: "var(--accent-dim)",
                  content: "You earn two components per delivery. First, a 3% commission calculated from the total item amount of the order. Second, a distance charge of ₹5 per km measured from the vendor's location to the customer's delivery address. Both amounts are combined and credited to your account the moment you tap 'Mark Delivered' — no waiting, no delays.",
                },
                {
                  icon: "📦",
                  title: "How Orders are Assigned",
                  color: "var(--blue)",
                  colorDim: "var(--blue-dim)",
                  content: "Vendors browse available delivery partners and assign orders directly to you based on proximity and availability. When a new order is assigned, it appears instantly in your Deliveries tab with the status 'Assigned'. Accepting quickly improves your response score, which influences how often vendors choose you for future orders. Keep the app open during active hours for best results.",
                },
                {
                  icon: "📞",
                  title: "Customer Not Reachable",
                  color: "var(--amber)",
                  colorDim: "var(--amber-dim)",
                  content: "If the customer doesn't answer, attempt the call 2–3 times with a 2-minute gap between each try. Proceed to the delivery address and wait up to 10 minutes. If still unreachable, do not leave the package unattended. Contact our support team immediately with the order ID so we can coordinate with the customer and guide you on next steps.",
                },
                {
                  icon: "✕",
                  title: "Declining Orders",
                  color: "var(--red)",
                  colorDim: "var(--red-dim)",
                  content: "You may decline an order only before you have accepted pickup. Once declined, the order is reassigned to another partner. We understand emergencies happen, but frequent declines negatively impact your performance score, which may reduce the number of orders assigned to you. If you foresee unavailability, mark yourself as inactive from your profile to pause incoming assignments.",
                },
                {
                  icon: "⭐",
                  title: "Performance & Ratings",
                  color: "var(--purple)",
                  colorDim: "var(--purple-dim)",
                  content: "Your performance score is calculated from on-time deliveries, acceptance rate, and customer feedback. A higher score means more frequent order assignments, priority routing during peak hours, and eligibility for bonus incentive programs. You can view your score breakdown by contacting our support team. Aim for at least a 4.5 rating to qualify for weekly bonuses.",
                },
                {
                  icon: "🔔",
                  title: "Staying Updated",
                  color: "var(--text-secondary)",
                  colorDim: "var(--bg-surface-2)",
                  content: "Make sure your browser or app notifications are enabled to receive instant order assignment alerts. The Deliveries tab shows live status across all your orders and auto-refreshes when you hit the Refresh button. If you notice any discrepancy in earnings or order status, take a screenshot and reach out to our support team with the order ID for quick resolution.",
                },
              ].map(item => (
                <div key={item.title} className="section-card" style={{ marginBottom: 0 }}>
                  <div className="section-header" style={{ gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "var(--radius-sm)",
                        background: item.colorDim, display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 15, flexShrink: 0,
                        border: `1px solid ${item.color}33`,
                      }}>{item.icon}</div>
                      <span className="section-title">{item.title}</span>
                    </div>
                  </div>
                  <div className="section-body">
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.75 }}>{item.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Contact support — full width */}
            <div className="section-card">
              <div className="section-header">
                <span className="section-title">Contact Support</span>
                <span style={{ fontSize: 11, color: "var(--accent)", fontFamily: "var(--mono)" }}>Mon–Sat · 9 AM – 8 PM IST</span>
              </div>
              <div className="section-body">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                  {[
                    { icon: "📧", label: "Email", value: "support@gramconnect.com", sub: "Reply within 2 hours", color: "var(--blue)" },
                    { icon: "📱", label: "Phone", value: "+91 98765 43210", sub: "Direct call support", color: "var(--accent)" },
                    { icon: "🕐", label: "Hours", value: "9 AM – 8 PM", sub: "Monday to Saturday", color: "var(--amber)" },
                  ].map(c => (
                    <div key={c.label} style={{
                      background: "var(--bg-surface-2)", border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)", padding: "16px 18px",
                      display: "flex", alignItems: "flex-start", gap: 12,
                    }}>
                      <div style={{
                        fontSize: 20, width: 40, height: 40, borderRadius: "var(--radius-sm)",
                        background: "var(--bg-surface-3)", display: "flex",
                        alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>{c.icon}</div>
                      <div>
                        <div style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{c.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: c.color, fontFamily: "var(--mono)" }}>{c.value}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{c.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="dv-footer">
          © 2026 GramConnect Delivery Partner System · Ensuring timely, reliable deliveries
        </footer>
        <AIChatBot role="delivery" darkMode={theme === "dark"} />
      </div>
    </div>
  );
}
