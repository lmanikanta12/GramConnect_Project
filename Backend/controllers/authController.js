const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");


// ================= EMAIL TEMPLATES =================

const userRegistrationEmail = (user) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Welcome to GramConnect</title>
  </head>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

            <!-- HEADER -->
            <tr>
              <td style="background:#059669;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
                <p style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:1px;">🌿 GramConnect</p>
                <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Fresh produce, direct from farmers</p>
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td style="background:#ffffff;padding:40px 40px 32px;">

                <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">
                  Welcome aboard, ${user.name}! 🎉
                </h2>
                <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.7;">
                  Thank you for registering on <strong style="color:#0f172a;">GramConnect</strong>. We're excited to have you join our community of farmers, customers, and delivery partners.
                </p>

                <!-- ACCOUNT DETAILS BOX -->
                <div style="background:#f0fdf4;border:2px solid #10b981;border-radius:12px;padding:24px;margin:24px 0;">
                  <p style="margin:0 0 14px;font-size:13px;text-transform:uppercase;letter-spacing:2px;color:#10b981;font-weight:600;">Your Account Details</p>
                  <table cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#64748b;width:120px;">Full Name</td>
                      <td style="padding:6px 0;font-size:13px;font-weight:600;color:#0f172a;">${user.name}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#64748b;">Email</td>
                      <td style="padding:6px 0;font-size:13px;font-weight:600;color:#0f172a;">${user.email}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#64748b;">Role</td>
                      <td style="padding:6px 0;font-size:13px;font-weight:600;color:#0f172a;text-transform:capitalize;">${user.role}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#64748b;">Location</td>
                      <td style="padding:6px 0;font-size:13px;font-weight:600;color:#0f172a;">${user.location || "—"}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#64748b;">Status</td>
                      <td style="padding:6px 0;">
                        <span style="display:inline-block;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:600;
                          background:${user.role === "customer" ? "#dcfce7" : "#fef9c3"};
                          color:${user.role === "customer" ? "#166534" : "#854d0e"};">
                          ${user.role === "customer" ? "Active" : "Pending Approval"}
                        </span>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- STATUS NOTE -->
                ${user.role === "customer" ? `
                <table cellpadding="0" cellspacing="0" width="100%" style="background:#eff6ff;border-radius:10px;border:1px solid #bfdbfe;margin-bottom:24px;">
                  <tr>
                    <td style="padding:16px 20px;">
                      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#1d4ed8;">✅ Account Activated</p>
                      <p style="margin:0;font-size:13px;color:#3b82f6;line-height:1.7;">
                        Your customer account is active. You can now log in and start exploring fresh produce directly from local farmers.
                      </p>
                    </td>
                  </tr>
                </table>
                ` : `
                <table cellpadding="0" cellspacing="0" width="100%" style="background:#fff7ed;border-radius:10px;border:1px solid #fed7aa;margin-bottom:24px;">
                  <tr>
                    <td style="padding:16px 20px;">
                      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#9a3412;">⏳ Pending Admin Approval</p>
                      <p style="margin:0;font-size:13px;color:#c2410c;line-height:1.7;">
                        Your <strong>${user.role}</strong> account is under review. Our admin team will verify your documents and approve your account shortly. You'll receive an email once approved.
                      </p>
                    </td>
                  </tr>
                </table>
                `}

                <p style="font-size:13px;color:#94a3b8;line-height:1.7;margin:0;">
                  If you have any questions, feel free to reach out at
                  <a href="mailto:support@gramconnect.com" style="color:#10b981;text-decoration:none;">support@gramconnect.com</a>.
                </p>

              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="background:#f8fafc;border-radius:0 0 16px 16px;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
                <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;">© 2026 GramConnect. All rights reserved.</p>
                <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;">
                  <a href="#" style="color:#10b981;text-decoration:none;">Privacy Policy</a> &nbsp;·&nbsp;
                  <a href="#" style="color:#10b981;text-decoration:none;">Terms of Service</a> &nbsp;·&nbsp;
                  <a href="#" style="color:#10b981;text-decoration:none;">Support</a>
                </p>
                <p style="margin:0;font-size:11px;color:#cbd5e1;">This is an automated email. Please do not reply directly to this message.</p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>

  </body>
</html>
`;

const adminRegistrationEmail = (user) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>New User Registration</title>
  </head>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

            <!-- HEADER -->
            <tr>
              <td style="background:#1e293b;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
                <p style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:1px;">🌿 GramConnect</p>
                <p style="margin:8px 0 0;color:rgba(255,255,255,0.6);font-size:13px;">Admin Notification System</p>
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td style="background:#ffffff;padding:40px 40px 32px;">

                <div style="display:inline-block;padding:4px 14px;background:#fef9c3;border-radius:20px;margin-bottom:16px;">
                  <span style="font-size:12px;font-weight:600;color:#854d0e;text-transform:uppercase;letter-spacing:1px;">New Registration Alert</span>
                </div>

                <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">
                  A new user has registered 👤
                </h2>
                <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.7;">
                  A new <strong style="color:#0f172a;text-transform:capitalize;">${user.role}</strong> has signed up on GramConnect.
                  ${user.role !== "customer" ? "Their account is <strong style=\"color:#0f172a;\">pending your approval</strong>. Please review their submitted documents." : "Their account has been automatically activated."}
                </p>

                <!-- USER DETAILS BOX -->
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin:24px 0;">
                  <p style="margin:0 0 14px;font-size:13px;text-transform:uppercase;letter-spacing:2px;color:#64748b;font-weight:600;">Registered User Details</p>
                  <table cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="padding:7px 0;font-size:13px;color:#94a3b8;width:130px;border-bottom:1px solid #f1f5f9;">Full Name</td>
                      <td style="padding:7px 0;font-size:13px;font-weight:600;color:#0f172a;border-bottom:1px solid #f1f5f9;">${user.name}</td>
                    </tr>
                    <tr>
                      <td style="padding:7px 0;font-size:13px;color:#94a3b8;border-bottom:1px solid #f1f5f9;">Email</td>
                      <td style="padding:7px 0;font-size:13px;font-weight:600;color:#0f172a;border-bottom:1px solid #f1f5f9;">${user.email}</td>
                    </tr>
                    <tr>
                      <td style="padding:7px 0;font-size:13px;color:#94a3b8;border-bottom:1px solid #f1f5f9;">Phone</td>
                      <td style="padding:7px 0;font-size:13px;font-weight:600;color:#0f172a;border-bottom:1px solid #f1f5f9;">${user.phone || "—"}</td>
                    </tr>
                    <tr>
                      <td style="padding:7px 0;font-size:13px;color:#94a3b8;border-bottom:1px solid #f1f5f9;">Role</td>
                      <td style="padding:7px 0;">
                        <span style="display:inline-block;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:600;
                          background:${user.role === "vendor" ? "#ede9fe" : user.role === "delivery" ? "#dbeafe" : "#dcfce7"};
                          color:${user.role === "vendor" ? "#5b21b6" : user.role === "delivery" ? "#1d4ed8" : "#166534"};
                          text-transform:capitalize;border-bottom:1px solid #f1f5f9;">
                          ${user.role}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:7px 0;font-size:13px;color:#94a3b8;border-bottom:1px solid #f1f5f9;">Location</td>
                      <td style="padding:7px 0;font-size:13px;font-weight:600;color:#0f172a;border-bottom:1px solid #f1f5f9;">${user.location || "—"}</td>
                    </tr>
                    <tr>
                      <td style="padding:7px 0;font-size:13px;color:#94a3b8;">Age</td>
                      <td style="padding:7px 0;font-size:13px;font-weight:600;color:#0f172a;">${user.age || "—"}</td>
                    </tr>
                  </table>
                </div>

                <!-- ACTION NOTE -->
                ${user.role !== "customer" ? `
                <table cellpadding="0" cellspacing="0" width="100%" style="background:#fff7ed;border-radius:10px;border:1px solid #fed7aa;margin-bottom:24px;">
                  <tr>
                    <td style="padding:16px 20px;">
                      <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#9a3412;">⚠️ Action Required</p>
                      <ul style="margin:0;padding-left:18px;font-size:13px;color:#c2410c;line-height:1.9;">
                        <li>Review the submitted ID proof and documents</li>
                        <li>Approve or reject the account from the admin dashboard</li>
                        <li>The user will be notified once a decision is made</li>
                      </ul>
                    </td>
                  </tr>
                </table>
                ` : `
                <table cellpadding="0" cellspacing="0" width="100%" style="background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;margin-bottom:24px;">
                  <tr>
                    <td style="padding:16px 20px;">
                      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#166534;">✅ No Action Needed</p>
                      <p style="margin:0;font-size:13px;color:#16a34a;line-height:1.7;">
                        Customer accounts are activated automatically. No approval is required.
                      </p>
                    </td>
                  </tr>
                </table>
                `}

                <p style="font-size:13px;color:#94a3b8;line-height:1.7;margin:0;">
                  Log in to the admin dashboard to manage this account.
                </p>

              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="background:#f8fafc;border-radius:0 0 16px 16px;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
                <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;">© 2026 GramConnect. All rights reserved.</p>
                <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;">
                  <a href="#" style="color:#10b981;text-decoration:none;">Admin Dashboard</a> &nbsp;·&nbsp;
                  <a href="#" style="color:#10b981;text-decoration:none;">Privacy Policy</a> &nbsp;·&nbsp;
                  <a href="#" style="color:#10b981;text-decoration:none;">Support</a>
                </p>
                <p style="margin:0;font-size:11px;color:#cbd5e1;">This is an automated admin notification. Do not reply to this email.</p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>

  </body>
</html>
`;


// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    const data = req.body;

    const existing = await User.findOne({ email: data.email });
    if (existing) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashed = await bcrypt.hash(data.password, 10);

    const user = new User({
      ...data,
      password: hashed,

      // SAVE FILES
      vendorId: req.files?.vendorId?.[0]?.filename || null,
      deliveryId: req.files?.deliveryId?.[0]?.filename || null,
      license: req.files?.license?.[0]?.filename || null,
    });

    await user.save();

    // ── Send registration emails (non-blocking) ──
    const adminEmail = process.env.ADMIN_EMAIL || "manilanka150@gmail.com";

    // Email to user
    sendEmail(
      user.email,
      "Welcome to GramConnect – Registration Successful 🌿",
      `Hi ${user.name}, your GramConnect account has been registered successfully. Role: ${user.role}.`,
      userRegistrationEmail(user)
    ).catch((err) => console.error("User registration email failed:", err));

    // Email to admin
    sendEmail(
      adminEmail,
      `New ${user.role} Registration – ${user.name}`,
      `New user registered: ${user.name} (${user.email}) as ${user.role}.`,
      adminRegistrationEmail(user)
    ).catch((err) => console.error("Admin registration email failed:", err));

    res.json({ msg: "Registered successfully" });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};


// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ================= ADMIN LOGIN =================
    if (email === "admin@gmail.com" && password === "12345678") {
      const token = jwt.sign(
        { role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      return res.json({
        token,
        role: "admin",
        status: "Active",

      });
    }

    // ================= NORMAL USER LOGIN =================
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid email" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Invalid password" });

    // ================= STATUS CONTROL =================

    // 🚫 Pending (Vendor / Delivery)
    if (user.status === "Pending") {
      return res.status(403).json({
        msg: "Your account is pending admin approval. Please wait.",
      });
    }

    // 🚫 Rejected
    if (user.status === "Rejected") {
      return res.status(403).json({
        msg: "Your registration was not approved by admin. Please contact support.",
      });
    }

    // 🚫 Blocked (Customer or anyone)
    if (user.status === "Blocked") {
      return res.status(403).json({
        msg: `Your account has been blocked by admin. Reason: ${user.reason || "Not specified"}`,
      });
    }

    // ✅ Allowed
    if (user.status === "Approved" || user.status === "Active") {
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      return res.json({
        token,
        role: user.role,
        status: user.status,

      });
    }

    // fallback
    return res.status(403).json({
      msg: "Access denied. Contact admin.",
    });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};


// ================= GET ALL USERS =================
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};


// ================= UPDATE STATUS =================
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      {
        status,
        reason: status === "Blocked" ? reason : "",
      },
      { new: true }
    );

    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};


// ================= GET PROFILE =================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};


// ================= SEND OTP =================
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpire = Date.now() + 5 * 60 * 1000;

    await user.save();

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Password Reset OTP</title>
      </head>
      <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

                <!-- HEADER -->
                <tr>
                  <td style="background:#059669;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
                    <p style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:1px;">🌿 GramConnect</p>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Fresh produce, direct from farmers</p>
                  </td>
                </tr>

                <!-- BODY -->
                <tr>
                  <td style="background:#ffffff;padding:40px 40px 32px;">

                    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">Password Reset Request</h2>
                    <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.7;">
                      Hi <strong style="color:#0f172a;">${user.name}</strong>, we received a request to reset the password for your GramConnect account associated with <strong style="color:#0f172a;">${email}</strong>.
                    </p>

                    <p style="margin:0 0 12px;font-size:14px;color:#64748b;">Use the OTP below to proceed. This code is valid for <strong style="color:#0f172a;">5 minutes</strong> only.</p>

                    <!-- OTP BOX -->
                    <div style="background:#f0fdf4;border:2px dashed #10b981;border-radius:12px;padding:28px;text-align:center;margin:24px 0;">
                      <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:2px;color:#10b981;font-weight:600;">Your One-Time Password</p>
                      <p style="margin:0;font-size:42px;font-weight:800;letter-spacing:10px;color:#065f46;">${otp}</p>
                    </div>

                    <!-- WARNING BOX -->
                    <table cellpadding="0" cellspacing="0" width="100%" style="background:#fff7ed;border-radius:10px;border:1px solid #fed7aa;margin-bottom:24px;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#9a3412;">⚠️ Important Notes</p>
                          <ul style="margin:0;padding-left:18px;font-size:13px;color:#c2410c;line-height:1.9;">
                            <li>This OTP expires in <strong>5 minutes</strong></li>
                            <li>Do not share this OTP with anyone</li>
                            <li>GramConnect will never ask for your OTP</li>
                            <li>If you did not request this, please ignore this email</li>
                          </ul>
                        </td>
                      </tr>
                    </table>

                    <p style="font-size:13px;color:#94a3b8;line-height:1.7;margin:0;">
                      If you didn't request a password reset, no action is needed. Your account remains secure. If you're having trouble, contact us at
                      <a href="mailto:support@gramconnect.com" style="color:#10b981;text-decoration:none;">support@gramconnect.com</a>.
                    </p>

                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td style="background:#f8fafc;border-radius:0 0 16px 16px;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
                    <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;">© 2026 GramConnect. All rights reserved.</p>
                    <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;">
                      <a href="#" style="color:#10b981;text-decoration:none;">Privacy Policy</a> &nbsp;·&nbsp;
                      <a href="#" style="color:#10b981;text-decoration:none;">Terms of Service</a> &nbsp;·&nbsp;
                      <a href="#" style="color:#10b981;text-decoration:none;">Support</a>
                    </p>
                    <p style="margin:0;font-size:11px;color:#cbd5e1;">This is an automated email. Please do not reply directly to this message.</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>

      </body>
    </html>
    `;

    await sendEmail(
      email,
      "Your GramConnect Password Reset OTP",
      `Your OTP is ${otp}. Valid for 5 minutes.`,
      html
    );

    res.json({ msg: "OTP sent" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};


// ================= RESET PASSWORD =================
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    if (user.otp !== otp || user.otpExpire < Date.now()) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    const hashed = await bcrypt.hash(password, 10);

    user.password = hashed;
    user.otp = null;
    user.otpExpire = null;

    await user.save();

    res.json({ msg: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};


