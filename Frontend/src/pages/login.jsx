import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm]           = useState({ email: "", password: "" });
  const [error, setError]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [dark, setDark]           = useState(true);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.msg || "Login failed"); return; }

      const { role, status, token } = data;

      if (status === "Pending")  { setError("Your account is pending admin approval. Please wait."); return; }
      if (status === "Rejected") { setError("Your registration was not approved by admin. Please contact support."); return; }
      if (status === "Blocked")  { setError("Your account has been blocked by admin. Please contact support."); return; }

      localStorage.setItem("gc_token", token);
      localStorage.setItem("gc_role", role);

      if (role === "vendor")        navigate("/vendordashboard");
      else if (role === "customer") navigate("/customerdashboard");
      else if (role === "delivery") navigate("/deliverydashboard");
      else if (role === "admin")    navigate("/admindashboard");
      else navigate("/");
    } catch (err) {
      console.error(err);
      setError("Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  // ── theme tokens ──────────────────────────────────────────
  const t = dark ? {
    bg:           "#050505",
    panelL:       "#111",
    panelR:       "#0a0a0a",
    border:       "rgba(255,255,255,0.06)",
    borderInner:  "rgba(255,255,255,0.05)",
    textPrimary:  "#f0f0f0",
    textMuted:    "#555",
    textFaint:    "#2d2d2d",
    textDim:      "#444",
    accent:       "#18e96e",
    accentText:   "#0a2e1a",
    accentHover:  "#0fd460",
    accentRing:   "rgba(24,233,110,0.1)",
    accentSubtle: "rgba(24,233,110,0.08)",
    accentSubtleBorder: "rgba(24,233,110,0.2)",
    inputBg:      "#161616",
    inputBorder:  "rgba(255,255,255,0.08)",
    errBg:        "rgba(226,75,74,0.08)",
    errBorder:    "rgba(226,75,74,0.25)",
    errText:      "#e24b4a",
    roleBg:       "#0d0d0d",
    roleBorder:   "rgba(255,255,255,0.05)",
    btnOutline:   "rgba(255,255,255,0.08)",
    btnOutlineHov:"rgba(255,255,255,0.18)",
    toggleBg:     "#1a1a1a",
    toggleBorder: "rgba(255,255,255,0.1)",
  } : {
    bg:           "#f0efe9",
    panelL:       "#fff",
    panelR:       "#fafaf8",
    border:       "rgba(0,0,0,0.08)",
    borderInner:  "rgba(0,0,0,0.06)",
    textPrimary:  "#111",
    textMuted:    "#777",
    textFaint:    "#bbb",
    textDim:      "#888",
    accent:       "#1a7a4a",
    accentText:   "#fff",
    accentHover:  "#166040",
    accentRing:   "rgba(26,122,74,0.12)",
    accentSubtle: "rgba(26,122,74,0.06)",
    accentSubtleBorder: "rgba(26,122,74,0.18)",
    inputBg:      "#f5f4f0",
    inputBorder:  "rgba(0,0,0,0.1)",
    errBg:        "#fff0ef",
    errBorder:    "#f5c6c3",
    errText:      "#c0392b",
    roleBg:       "#f7f6f2",
    roleBorder:   "rgba(0,0,0,0.06)",
    btnOutline:   "rgba(0,0,0,0.1)",
    btnOutlineHov:"rgba(0,0,0,0.18)",
    toggleBg:     "#eeecea",
    toggleBorder: "rgba(0,0,0,0.1)",
  };

  const inputStyle = {
    width: "100%", height: 48,
    background: t.inputBg,
    border: `0.5px solid ${t.inputBorder}`,
    borderRadius: 10,
    fontSize: 14,
    fontFamily: "'Inter', sans-serif",
    color: t.textPrimary,
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const NavItem = ({ icon, label, active, onClick }) => (
    <div onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "9px 12px", borderRadius: 9, cursor: "pointer",
        background: active ? t.accentSubtle : "transparent",
        border: active ? `0.5px solid ${t.accentSubtleBorder}` : "0.5px solid transparent",
        transition: "all 0.2s",
      }}>
      {icon}
      <span style={{ fontSize: 13, color: active ? t.accent : t.textDim, fontWeight: active ? 500 : 400 }}>{label}</span>
    </div>
  );

  const trustBadges = ["SOC 2 compliant", "GDPR ready", "Zero-log"];

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "stretch",
      justifyContent: "center",
      background: t.bg,
      fontFamily: "'Inter', sans-serif",
      transition: "background 0.3s",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 1100,
        display: "flex",
        margin: "0 auto",
        padding: "2.5rem 2rem",
        alignItems: "center",
      }}>
        {/* ── CARD ── */}
        <div style={{
          width: "100%",
          display: "flex",
          borderRadius: 20,
          overflow: "hidden",
          border: `0.5px solid ${t.border}`,
          minHeight: 620,
          transition: "all 0.3s",
        }}>

          {/* ── LEFT PANEL ── */}
          <div style={{
            width: 280,
            flexShrink: 0,
            background: t.panelL,
            borderRight: `0.5px solid ${t.border}`,
            padding: "2.5rem 1.75rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            transition: "all 0.3s",
          }}>
            <div>
              {/* Brand */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "2.5rem" }}>
                <div style={{
                  width: 36, height: 36, background: t.accent, borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  transition: "background 0.3s",
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke={t.accentText} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: t.textPrimary, letterSpacing: "-0.02em", transition: "color 0.3s" }}>
                  GramConnect
                </span>
              </div>

              {/* Nav */}
              <p style={{
                fontSize: 10, fontWeight: 500, color: t.textDim, letterSpacing: "0.1em",
                textTransform: "uppercase", marginBottom: 10, transition: "color 0.3s",
              }}>Platform</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <NavItem active label="Sign in"
                  icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>}
                />
                <NavItem label="Register" onClick={() => navigate("/register")}
                  icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={t.textDim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>}
                />
                <NavItem label="Forgot Password" onClick={() => navigate("/forgotpassword")}
                  icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={t.textDim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
                />
              </div>

              {/* Role status */}
              <div style={{
                background: t.roleBg, border: `0.5px solid ${t.roleBorder}`,
                borderRadius: 12, padding: "14px 14px", marginTop: "1.5rem", transition: "all 0.3s",
              }}>
                <p style={{
                  fontSize: 10, fontWeight: 500, color: t.textDim, letterSpacing: "0.08em",
                  textTransform: "uppercase", marginBottom: 10, transition: "color 0.3s",
                }}>Role access</p>
                {["Vendor", "Customer", "Delivery", "Admin"].map((r, i) => (
                  <div key={r} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0" }}>
                    <span style={{ fontSize: 12, color: t.textDim, transition: "color 0.3s" }}>{r}</span>
                    <span style={{
                      width: 7, height: 7, borderRadius: "50%", background: t.accent,
                      display: "inline-block", animation: `pulse ${2.5}s ease-in-out ${i * 0.4}s infinite`,
                    }} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              {/* Theme toggle */}
              <button onClick={() => setDark(!dark)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                  borderRadius: 9, cursor: "pointer", background: t.toggleBg,
                  border: `0.5px solid ${t.toggleBorder}`, width: "100%", marginBottom: 10,
                  transition: "all 0.2s", fontFamily: "'Inter', sans-serif",
                }}>
                {dark ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                )}
                <span style={{ fontSize: 13, color: t.textMuted }}>{dark ? "Light mode" : "Dark mode"}</span>
              </button>

              {/* TLS */}
              <div style={{ display: "flex", alignItems: "center", gap: 7, paddingTop: 10, borderTop: `0.5px solid ${t.borderInner}` }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={t.textFaint}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span style={{ fontSize: 11, color: t.textFaint, transition: "color 0.3s" }}>256-bit TLS encrypted</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div style={{
            flex: 1,
            background: t.panelR,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "3rem 3.5rem",
            transition: "background 0.3s",
          }}>
            <div style={{ maxWidth: 420, width: "100%" }}>

              <p style={{
                fontSize: 11, fontWeight: 500, color: t.accent, letterSpacing: "0.1em",
                textTransform: "uppercase", marginBottom: 8, transition: "color 0.3s",
              }}>Secure portal</p>
              <h1 style={{
                fontSize: 30, fontWeight: 600, color: t.textPrimary, lineHeight: 1.2,
                letterSpacing: "-0.03em", marginBottom: 8, transition: "color 0.3s",
              }}>Welcome back</h1>
              <p style={{ fontSize: 14, color: t.textMuted, lineHeight: 1.6, marginBottom: "2rem", transition: "color 0.3s" }}>
                Sign in to access your GramConnect dashboard
              </p>

              {error && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, fontSize: 13,
                  marginBottom: "1.25rem", padding: "12px 14px", borderRadius: 10,
                  background: t.errBg, border: `0.5px solid ${t.errBorder}`, color: t.errText,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Email */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{
                    display: "block", fontSize: 10, fontWeight: 500, color: t.textDim,
                    letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8, transition: "color 0.3s",
                  }}>
                    Email address
                  </label>
                  <div style={{ position: "relative" }}>
                    <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: t.textDim }}
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                    <input type="email" name="email" placeholder="you@gmail.com"
                      value={form.email} onChange={handleChange} required
                      style={{ ...inputStyle, paddingLeft: 42, paddingRight: 14 }}
                      onFocus={e => { e.target.style.borderColor = t.accent; e.target.style.boxShadow = `0 0 0 3px ${t.accentRing}`; }}
                      onBlur={e => { e.target.style.borderColor = t.inputBorder; e.target.style.boxShadow = "none"; }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div style={{ marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <label style={{
                      fontSize: 10, fontWeight: 500, color: t.textDim,
                      letterSpacing: "0.1em", textTransform: "uppercase", transition: "color 0.3s",
                    }}>Password</label>
                    <span onClick={() => navigate("/forgotpassword")}
                      style={{ fontSize: 12, color: t.accent, cursor: "pointer", fontWeight: 500, transition: "opacity 0.2s" }}
                      onMouseOver={e => e.target.style.opacity = 0.7}
                      onMouseOut={e => e.target.style.opacity = 1}>
                      Forgot password?
                    </span>
                  </div>
                  <div style={{ position: "relative" }}>
                    <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: t.textDim }}
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <input type={showPassword ? "text" : "password"} name="password"
                      placeholder="••••••••••" value={form.password} onChange={handleChange} required
                      style={{ ...inputStyle, paddingLeft: 42, paddingRight: 48 }}
                      onFocus={e => { e.target.style.borderColor = t.accent; e.target.style.boxShadow = `0 0 0 3px ${t.accentRing}`; }}
                      onBlur={e => { e.target.style.borderColor = t.inputBorder; e.target.style.boxShadow = "none"; }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                        background: "none", border: "none", cursor: "pointer", color: t.textDim,
                        fontSize: 16, display: "flex", alignItems: "center", transition: "color 0.2s",
                      }}
                      onMouseOver={e => e.currentTarget.style.color = t.accent}
                      onMouseOut={e => e.currentTarget.style.color = t.textDim}>
                      {showPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading}
                  style={{
                    width: "100%", height: 50, background: t.accent, color: t.accentText,
                    border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600,
                    fontFamily: "'Inter', sans-serif", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    marginTop: "1.4rem", letterSpacing: "0.01em", transition: "background 0.2s, transform 0.15s",
                    opacity: loading ? 0.75 : 1,
                  }}
                  onMouseOver={e => { if (!loading) { e.currentTarget.style.background = t.accentHover; e.currentTarget.style.transform = "translateY(-1px)"; }}}
                  onMouseOut={e => { e.currentTarget.style.background = t.accent; e.currentTarget.style.transform = "none"; }}
                  onMouseDown={e => e.currentTarget.style.transform = "scale(0.99)"}
                  onMouseUp={e => e.currentTarget.style.transform = "none"}>
                  {loading ? (
                    <svg style={{ animation: "spin 0.7s linear infinite" }} width="16" height="16"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                  ) : (
                    <>
                      Sign in to dashboard
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "1.4rem 0" }}>
                <div style={{ flex: 1, height: "0.5px", background: t.border }} />
                <span style={{ fontSize: 10, color: t.textFaint, letterSpacing: "0.08em", textTransform: "uppercase" }}>new here?</span>
                <div style={{ flex: 1, height: "0.5px", background: t.border }} />
              </div>

              <button onClick={() => navigate("/register")}
                style={{
                  width: "100%", height: 46, background: "transparent", color: t.textMuted,
                  border: `0.5px solid ${t.btnOutline}`, borderRadius: 10, fontSize: 14,
                  fontFamily: "'Inter', sans-serif", cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = t.btnOutlineHov; e.currentTarget.style.color = t.textPrimary; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = t.btnOutline; e.currentTarget.style.color = t.textMuted; }}>
                Create an account
              </button>

              {/* ── Trust badges — FIXED ── */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: "1.5rem" }}>
                {trustBadges.map((label, i) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 10, color: t.textFaint, transition: "color 0.3s" }}>{label}</span>
                    {i < trustBadges.length - 1 && (
                      <span style={{ width: 3, height: 3, borderRadius: "50%", background: t.textFaint }} />
                    )}
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
