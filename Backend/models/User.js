const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    location: { type: String, required: true },
    phone: { type: String, required: true },
    age: { type: Number, required: true },

    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["vendor", "customer", "delivery"],
      required: true,
    },

    // ✅ STATUS FIELD (CORE LOGIC)
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Active", "Blocked"],
      default: function () {
        // 👇 AUTO DEFAULT BASED ON ROLE
        if (this.role === "customer") return "Active";
        return "Pending"; // vendor & delivery
      },
    },

    // ✅ REASON (for block/reject messages)
    reason: {
      type: String,
      default: "",
    },

    // ================= Vendor =================
    vendorId: { type: String, default: null },

    // ================= Delivery =================
    vehicleType: {
      type: String,
      enum: ["scooty", "bike", "car", "van"],
      default: null,
    },

    deliveryId: { type: String, default: null },
    license: { type: String, default: null },

    // ================= OTP =================
    otp: { type: String, default: null },
    otpExpire: { type: Date, default: null },
  },
  { timestamps: true }
);


// ✅ OPTIONAL: CLEAN JSON RESPONSE (hide password)
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpire;
  return obj;
};


module.exports = mongoose.model("User", userSchema);
