const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, default: "kg" },
  totalPrice: { type: Number, required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  vendorName: { type: String },
image: { type: String, default: null },  // 👈 ADD
});

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true },

    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    customerName: { type: String },
    customerPhone: { type: String },
    deliveryAddress: { type: String, required: true },

    items: [orderItemSchema],

    // ========== AMOUNT BREAKDOWN ==========
    itemAmount: { type: Number, default: 0 },         // pure item total
    distanceKm: { type: Number, default: 0 },          // calculated distance
    distanceCharge: { type: Number, default: 0 },      // distanceKm * 5
    platformFee: { type: Number, default: 10 },        // fixed ₹10
    totalAmount: { type: Number, required: true },     // itemAmount + distanceCharge + platformFee

    // ========== EARNINGS BREAKDOWN ==========
    vendorEarnings: { type: Number, default: 0 },      // itemAmount - 3% commission
    deliveryEarnings: { type: Number, default: 0 },    // 3% commission + distanceCharge
    platformEarnings: { type: Number, default: 10 },   // platformFee (₹10)
    
    // ========== DISCOUNT ==========
    discountPercent: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    discountApplied: { type: Boolean, default: false },
    
    // ========== PAYMENT ==========
    paymentMethod: { type: String, enum: ["COD", "UPI", "Card"], required: true },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },

    // ========== STATUS ==========
    status: {
      type: String,
      enum: [
        "Placed", "Accepted", "Preparing", "Ready",
        "Assigned", "Picked", "On the way",
        "Delivered", "Cancelled", "Rejected", "Declined",
      ],
      default: "Placed",
    },

    // ========== VENDOR ==========
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    vendorName: { type: String },

    // ========== DELIVERY ==========
    deliveryId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    deliveryName: { type: String, default: null },
    deliveryPhone: { type: String, default: null },
    deliveryVehicle: { type: String, default: null },

    // ========== TIMESTAMPS ==========
    acceptedAt: { type: Date },
    assignedAt: { type: Date },
    pickedAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String, default: "" },

    // ========== REJECTION ==========
    rejectedAt: { type: Date },
    rejectionReason: { type: String, default: "" },

    // ========== RATING ==========
    customerRating: { type: Number, min: 1, max: 5, default: null },
    customerFeedback: { type: String, default: "" },
  },
  { timestamps: true }
);

// Auto-generate orderId
orderSchema.pre("save", function () {
  if (!this.orderId) {
    this.orderId = "ORD" + Date.now();
  }
});

module.exports = mongoose.model("Order", orderSchema);