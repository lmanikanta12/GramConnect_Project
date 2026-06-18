import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Store, User, Bike } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// These MUST live outside Register so React never re-creates
// them as new component types on re-render (which unmounts the
// input and drops focus after every keystroke).
// ─────────────────────────────────────────────────────────────

const SvgIcon = ({ children }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);

function Field({ label, icon, children, fullWidth, labelSt, t }) {
  return (
    <div style={{ gridColumn: fullWidth ? "1 / -1" : "span 1" }}>
      <label style={labelSt}>{label}</label>
      <div style={{ position: "relative" }}>
        {icon && (
          <span style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            pointerEvents: "none", color: t.textDim, display: "flex",
          }}>
            {icon}
          </span>
        )}
        {children}
      </div>
    </div>
  );
}

function FileField({ label, name, fullWidth, labelSt, t, fileValue, onFileChange }) {
  return (
    <div style={{ gridColumn: fullWidth ? "1 / -1" : "span 1" }}>
      <label style={labelSt}>{label}</label>
      <label style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 12px", borderRadius: 10, cursor: "pointer", height: 42,
        border: `0.5px dashed ${t.fileBorder}`, background: t.inputBg,
        transition: "border-color 0.2s", boxSizing: "border-box",
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.textDim}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <span style={{ fontSize: 12, color: fileValue ? t.accent : t.textDim }}>
          {fileValue ? fileValue.name : "Choose file"}
        </span>
        <input type="file" name={name} onChange={onFileChange} required style={{ display: "none" }} />
      </label>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

const defaultForm = {
  name: "", email: "", location: "", phone: "",
  age: "", password: "", vehicleType: "",
  vendorId: null, deliveryId: null, license: null,
};

export default function Register() {
  const [role, setRole]                 = useState("vendor");
  const [form, setForm]                 = useState(defaultForm);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [dark, setDark]                 = useState(true);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleFileChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.files[0] }));
  };

  const handleRoleSwitch = (newRole) => {
    setRole(newRole);
    setForm((prev) => ({
      ...defaultForm,
      name: prev.name, email: prev.email, location: prev.location,
      phone: prev.phone, age: prev.age, password: prev.password,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("role", role);
      Object.keys(form).forEach((key) => {
        if (form[key] !== null && form[key] !== "") formData.append(key, form[key]);
      });
      const res  = await fetch("http://localhost:5000/api/auth/register", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setError(data.msg || "Registration failed"); return; }
      alert("Registered successfully!");
      navigate("/login");
    } catch (err) {
      console.error(err);
      setError("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── theme tokens ──────────────────────────────────────────
  const t = dark ? {
    bg: "#050505", panelL: "#111", panelR: "#0a0a0a",
    border: "rgba(255,255,255,0.06)", borderInner: "rgba(255,255,255,0.05)",
    textPrimary: "#f0f0f0", textMuted: "#555", textFaint: "#2d2d2d", textDim: "#444",
    accent: "#18e96e", accentText: "#0a2e1a", accentHover: "#0fd460",
    accentRing: "rgba(24,233,110,0.1)", accentSubtle: "rgba(24,233,110,0.08)",
    accentSubtleBorder: "rgba(24,233,110,0.2)",
    inputBg: "#161616", inputBorder: "rgba(255,255,255,0.08)",
    errBg: "rgba(226,75,74,0.08)", errBorder: "rgba(226,75,74,0.25)", errText: "#e24b4a",
    roleBg: "#0d0d0d", roleBorder: "rgba(255,255,255,0.05)",
    btnOutline: "rgba(255,255,255,0.08)", btnOutlineHov: "rgba(255,255,255,0.18)",
    toggleBg: "#1a1a1a", toggleBorder: "rgba(255,255,255,0.1)", fileBorder: "rgba(255,255,255,0.1)",
  } : {
    bg: "#f0efe9", panelL: "#fff", panelR: "#fafaf8",
    border: "rgba(0,0,0,0.08)", borderInner: "rgba(0,0,0,0.06)",
    textPrimary: "#111", textMuted: "#777", textFaint: "#bbb", textDim: "#888",
    accent: "#1a7a4a", accentText: "#fff", accentHover: "#166040",
    accentRing: "rgba(26,122,74,0.12)", accentSubtle: "rgba(26,122,74,0.06)",
    accentSubtleBorder: "rgba(26,122,74,0.18)",
    inputBg: "#f5f4f0", inputBorder: "rgba(0,0,0,0.1)",
    errBg: "#fff0ef", errBorder: "#f5c6c3", errText: "#c0392b",
    roleBg: "#f7f6f2", roleBorder: "rgba(0,0,0,0.06)",
    btnOutline: "rgba(0,0,0,0.1)", btnOutlineHov: "rgba(0,0,0,0.18)",
    toggleBg: "#eeecea", toggleBorder: "rgba(0,0,0,0.1)", fileBorder: "rgba(0,0,0,0.15)",
  };

  const inputBase = {
    width: "100%", height: 42, background: t.inputBg,
    border: `0.5px solid ${t.inputBorder}`, borderRadius: 10, fontSize: 13,
    fontFamily: "'Inter', sans-serif", color: t.textPrimary, outline: "none",
    paddingLeft: 38, paddingRight: 12,
    transition: "border-color 0.2s, box-shadow 0.2s", boxSizing: "border-box",
  };

  const focusInput = (e) => { e.target.style.borderColor = t.accent; e.target.style.boxShadow = `0 0 0 3px ${t.accentRing}`; };
  const blurInput  = (e) => { e.target.style.borderColor = t.inputBorder; e.target.style.boxShadow = "none"; };

  const labelSt = {
    display: "block", fontSize: 10, fontWeight: 500, color: t.textDim,
    letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6,
  };

  const grid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" };

  const roles = [
    { key: "vendor",   label: "Vendor",   Icon: Store },
    { key: "customer", label: "Customer", Icon: User  },
    { key: "delivery", label: "Delivery", Icon: Bike  },
  ];

  const trustBadges = ["SOC 2 compliant", "GDPR ready", "Zero-log"];

  const NavItem = ({ icon, label, active, onClick }) => (
    <div onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
      borderRadius: 9, cursor: "pointer",
      background: active ? t.accentSubtle : "transparent",
      border: active ? `0.5px solid ${t.accentSubtleBorder}` : "0.5px solid transparent",
      transition: "all 0.2s",
    }}>
      {icon}
      <span style={{ fontSize: 13, color: active ? t.accent : t.textDim, fontWeight: active ? 500 : 400 }}>{label}</span>
    </div>
  );

  // shared props passed down to Field / FileField
  const fp = { labelSt, t };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "stretch", justifyContent: "center",
      background: t.bg, fontFamily: "'Inter', sans-serif", transition: "background 0.3s",
    }}>
      <div style={{
        width: "100%", maxWidth: 1200, display: "flex",
        margin: "0 auto", padding: "2rem 2rem", alignItems: "center",
      }}>
        <div style={{
          width: "100%", display: "flex", borderRadius: 20, overflow: "hidden",
          border: `0.5px solid ${t.border}`, minHeight: 620, transition: "all 0.3s",
        }}>

          {/* ── LEFT PANEL ── */}
          <div style={{
            width: 260, flexShrink: 0, background: t.panelL,
            borderRight: `0.5px solid ${t.border}`, padding: "2rem 1.5rem",
            display: "flex", flexDirection: "column", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "2rem" }}>
                <div style={{ width: 34, height: 34, background: t.accent, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.accentText} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: t.textPrimary, letterSpacing: "-0.02em" }}>GramConnect</span>
              </div>

              <p style={{ fontSize: 10, fontWeight: 500, color: t.textDim, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Platform</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <NavItem label="Sign in" onClick={() => navigate("/login")}
                  icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={t.textDim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>}
                />
                <NavItem active label="Register"
                  icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>}
                />
                <NavItem label="Forgot Password" onClick={() => navigate("/forgotpassword")}
                  icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={t.textDim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
                />
              </div>

              <div style={{ background: t.roleBg, border: `0.5px solid ${t.roleBorder}`, borderRadius: 12, padding: "12px 14px", marginTop: "1.25rem" }}>
                <p style={{ fontSize: 10, fontWeight: 500, color: t.textDim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Role access</p>
                {["Vendor", "Customer", "Delivery", "Admin"].map((r, i) => (
                  <div key={r} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0" }}>
                    <span style={{ fontSize: 12, color: t.textDim }}>{r}</span>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: t.accent, display: "inline-block", animation: `pulse 2.5s ease-in-out ${i * 0.4}s infinite` }} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <button onClick={() => setDark(!dark)} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                borderRadius: 9, cursor: "pointer", background: t.toggleBg,
                border: `0.5px solid ${t.toggleBorder}`, width: "100%", marginBottom: 10,
                transition: "all 0.2s", fontFamily: "'Inter', sans-serif",
              }}>
                {dark ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                )}
                <span style={{ fontSize: 13, color: t.textMuted }}>{dark ? "Light mode" : "Dark mode"}</span>
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 7, paddingTop: 10, borderTop: `0.5px solid ${t.borderInner}` }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={t.textFaint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span style={{ fontSize: 11, color: t.textFaint }}>256-bit TLS encrypted</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div style={{
            flex: 1, background: t.panelR, display: "flex", flexDirection: "column",
            justifyContent: "center", alignItems: "center",
            padding: "2rem 3rem", transition: "background 0.3s",
          }}>
            <div style={{ width: "100%", maxWidth: 680 }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: t.accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>New account</p>
              <h1 style={{ fontSize: 26, fontWeight: 600, color: t.textPrimary, lineHeight: 1.2, letterSpacing: "-0.03em", marginBottom: 6 }}>Create account</h1>
              <p style={{ fontSize: 13, color: t.textMuted, lineHeight: 1.6, marginBottom: "1.25rem" }}>Join our community and continue the journey</p>

              {error && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, fontSize: 13,
                  marginBottom: "1rem", padding: "10px 14px", borderRadius: 10,
                  background: t.errBg, border: `0.5px solid ${t.errBorder}`, color: t.errText,
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              {/* Role switcher */}
              <div style={{
                display: "flex", gap: 6, marginBottom: "1.25rem",
                background: t.roleBg, border: `0.5px solid ${t.roleBorder}`,
                borderRadius: 12, padding: 5,
              }}>
                {roles.map(({ key, label, Icon: RIcon }) => (
                  <button key={key} type="button" onClick={() => handleRoleSwitch(key)} style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
                    fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: role === key ? 500 : 400,
                    background: role === key ? t.accent : "transparent",
                    color: role === key ? t.accentText : t.textDim, transition: "all 0.2s",
                  }}>
                    <RIcon size={14} />{label}
                  </button>
                ))}
              </div>

              {/* ── FORM ── */}
              <form onSubmit={handleSubmit}>
                <div style={grid}>

                  <Field {...fp} label="Full name" icon={<SvgIcon><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></SvgIcon>}>
                    <input name="name" placeholder="Full name" value={form.name}
                      onChange={handleChange} required style={inputBase} onFocus={focusInput} onBlur={blurInput} />
                  </Field>

                  <Field {...fp} label="Email address" icon={<SvgIcon><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></SvgIcon>}>
                    <input name="email" type="email" placeholder="you@gmail.com" value={form.email}
                      onChange={handleChange} required style={inputBase} onFocus={focusInput} onBlur={blurInput} />
                  </Field>

                  <Field {...fp} label="Location" icon={<SvgIcon><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></SvgIcon>}>
                    <input name="location" placeholder="City / area" value={form.location}
                      onChange={handleChange} required style={inputBase} onFocus={focusInput} onBlur={blurInput} />
                  </Field>

                  <Field {...fp} label="Phone" icon={<SvgIcon><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.07 3.38 2 2 0 0 1 3 1.17h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z"/></SvgIcon>}>
                    <input name="phone" placeholder="Phone number" value={form.phone}
                      onChange={handleChange} required style={inputBase} onFocus={focusInput} onBlur={blurInput} />
                  </Field>

                  <Field {...fp} label="Age" icon={<SvgIcon><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></SvgIcon>}>
                    <input name="age" type="number" placeholder="Your age" value={form.age}
                      onChange={handleChange} required style={inputBase} onFocus={focusInput} onBlur={blurInput} />
                  </Field>

                  {/* Password — inline because of the show/hide toggle referencing showPassword state */}
                  <div style={{ gridColumn: "span 1" }}>
                    <label style={labelSt}>Password</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: t.textDim, display: "flex" }}>
                        <SvgIcon><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></SvgIcon>
                      </span>
                      <input type={showPassword ? "text" : "password"} name="password"
                        placeholder="••••••••••" value={form.password}
                        onChange={handleChange} required
                        style={{ ...inputBase, paddingRight: 40 }} onFocus={focusInput} onBlur={blurInput} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                        position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                        background: "none", border: "none", cursor: "pointer", color: t.textDim,
                        display: "flex", alignItems: "center", transition: "color 0.2s", padding: 0,
                      }}
                        onMouseOver={e => e.currentTarget.style.color = t.accent}
                        onMouseOut={e => e.currentTarget.style.color = t.textDim}>
                        {showPassword ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Vendor extras */}
                  {role === "vendor" && (
                    <FileField {...fp} label="ID proof" name="vendorId"
                      fileValue={form.vendorId} onFileChange={handleFileChange} />
                  )}

                  {/* Delivery extras */}
                  {role === "delivery" && (
                    <>
                      <Field {...fp} label="Vehicle type" icon={<Bike size={14} />}>
                        <select name="vehicleType" value={form.vehicleType} onChange={handleChange} required
                          style={{ ...inputBase, appearance: "none", paddingRight: 32 }}
                          onFocus={focusInput} onBlur={blurInput}>
                          <option value="">Select vehicle</option>
                          <option value="bike">Bike</option>
                          <option value="scooty">Scooty</option>
                          <option value="car">Car</option>
                        </select>
                        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: t.textDim, display: "flex" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                        </span>
                      </Field>
                      <FileField {...fp} label="ID proof" name="deliveryId"
                        fileValue={form.deliveryId} onFileChange={handleFileChange} />
                      <FileField {...fp} label="Driving license" name="license"
                        fileValue={form.license} onFileChange={handleFileChange} />
                    </>
                  )}

                </div>

                {/* Submit */}
                <button type="submit" disabled={loading} style={{
                  width: "100%", height: 46, background: t.accent, color: t.accentText,
                  border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600,
                  fontFamily: "'Inter', sans-serif", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  marginTop: "1.25rem", letterSpacing: "0.01em",
                  transition: "background 0.2s, transform 0.15s", opacity: loading ? 0.75 : 1,
                }}
                  onMouseOver={e => { if (!loading) { e.currentTarget.style.background = t.accentHover; e.currentTarget.style.transform = "translateY(-1px)"; }}}
                  onMouseOut={e => { e.currentTarget.style.background = t.accent; e.currentTarget.style.transform = "none"; }}
                  onMouseDown={e => e.currentTarget.style.transform = "scale(0.99)"}
                  onMouseUp={e => e.currentTarget.style.transform = "none"}>
                  {loading ? (
                    <svg style={{ animation: "spin 0.7s linear infinite" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                  ) : (
                    <>
                      Create account
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </>
                  )}
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "1rem 0" }}>
                  <div style={{ flex: 1, height: "0.5px", background: t.border }} />
                  <span style={{ fontSize: 10, color: t.textFaint, letterSpacing: "0.08em", textTransform: "uppercase" }}>already have an account?</span>
                  <div style={{ flex: 1, height: "0.5px", background: t.border }} />
                </div>

                <button type="button" onClick={() => navigate("/login")} style={{
                  width: "100%", height: 42, background: "transparent", color: t.textMuted,
                  border: `0.5px solid ${t.btnOutline}`, borderRadius: 10, fontSize: 14,
                  fontFamily: "'Inter', sans-serif", cursor: "pointer", transition: "all 0.2s",
                }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = t.btnOutlineHov; e.currentTarget.style.color = t.textPrimary; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = t.btnOutline; e.currentTarget.style.color = t.textMuted; }}>
                  Sign in instead
                </button>
              </form>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: "1rem" }}>
                {trustBadges.map((label, i) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 10, color: t.textFaint }}>{label}</span>
                    {i < trustBadges.length - 1 && <span style={{ width: 3, height: 3, borderRadius: "50%", background: t.textFaint }} />}
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
