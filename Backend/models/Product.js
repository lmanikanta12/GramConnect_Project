const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vendorName: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 0 },
    unit: { type: String, default: "kg" },
    category: {
      type: String,
      enum: ["vegetables", "fruits", "grains", "dairy", "spices", "other"],
      default: "vegetables",
    },
    image: { type: String, default: null },
    description: { type: String, default: "" },
    stock: {
      type: String,
      enum: ["In Stock", "Out of Stock"],
      default: "In Stock",
    },
    location: { type: String, default: "" },
vendorLocation: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
