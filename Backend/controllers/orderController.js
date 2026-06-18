const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

// =========================================================
//  CITY COORDINATES LOOKUP (Andhra Pradesh & Telangana)
// =========================================================

const CITY_COORDS = {
  // Andhra Pradesh
  "vijayawada":   { lat: 16.5062, lng: 80.6480 },
  "guntur":       { lat: 16.3067, lng: 80.4365 },
  "visakhapatnam":{ lat: 17.6868, lng: 83.2185 },
  "vizag":        { lat: 17.6868, lng: 83.2185 },
  "kakinada":     { lat: 16.9891, lng: 82.2475 },
  "nellore":      { lat: 14.4426, lng: 79.9865 },
  "kurnool":      { lat: 15.8281, lng: 78.0373 },
  "rajahmundry":  { lat: 17.0005, lng: 81.8040 },
  "tirupati":     { lat: 13.6288, lng: 79.4192 },
  "kadapa":       { lat: 14.4673, lng: 78.8242 },
  "anantapur":    { lat: 14.6819, lng: 77.6006 },
  "eluru":        { lat: 16.7107, lng: 81.0952 },
  "ongole":       { lat: 15.5057, lng: 80.0499 },
  "vizianagaram": { lat: 18.1066, lng: 83.3956 },
  "srikakulam":   { lat: 18.2949, lng: 83.8938 },
  "bhimavaram":   { lat: 16.5449, lng: 81.5212 },
  "machilipatnam":{ lat: 16.1875, lng: 81.1389 },
  "tenali":       { lat: 16.2430, lng: 80.6395 },
  "proddatur":    { lat: 14.7500, lng: 78.5500 },
  "hindupur":     { lat: 13.8290, lng: 77.4910 },
  "chittoor":     { lat: 13.2172, lng: 79.1003 },
  "amaravati":    { lat: 16.5730, lng: 80.3580 },

  // Telangana
  "hyderabad":    { lat: 17.3850, lng: 78.4867 },
  "warangal":     { lat: 17.9784, lng: 79.5941 },
  "nizamabad":    { lat: 18.6725, lng: 78.0941 },
  "karimnagar":   { lat: 18.4386, lng: 79.1288 },
  "khammam":      { lat: 17.2473, lng: 80.1514 },
  "mahbubnagar":  { lat: 16.7376, lng: 77.9870 },
  "nalgonda":     { lat: 17.0575, lng: 79.2671 },
  "adilabad":     { lat: 19.6641, lng: 78.5320 },
  "suryapet":     { lat: 17.1403, lng: 79.6219 },
  "miryalaguda":  { lat: 16.8726, lng: 79.5604 },
  "siddipet":     { lat: 18.1018, lng: 78.8521 },
  "secunderabad": { lat: 17.4399, lng: 78.4983 },

  // Karnataka
  "bangalore":    { lat: 12.9716, lng: 77.5946 },
  "bengaluru":    { lat: 12.9716, lng: 77.5946 },
  "mysore":       { lat: 12.2958, lng: 76.6394 },
  "hubli":        { lat: 15.3647, lng: 75.1240 },
  "mangalore":    { lat: 12.9141, lng: 74.8560 },

  // Tamil Nadu
  "chennai":      { lat: 13.0827, lng: 80.2707 },
  "coimbatore":   { lat: 11.0168, lng: 76.9558 },
  "madurai":      { lat: 9.9252,  lng: 78.1198 },

  // Maharashtra
  "mumbai":       { lat: 19.0760, lng: 72.8777 },
  "pune":         { lat: 18.5204, lng: 73.8567 },
  "nagpur":       { lat: 21.1458, lng: 79.0882 },
};

// =========================================================
//  HAVERSINE FORMULA — Calculate distance between 2 points
// =========================================================

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

// =========================================================
//  FEE CALCULATION
// =========================================================

function calculateFees(itemAmount, distanceKm) {
  const RATE_PER_KM = 5;
  const PLATFORM_FEE = 10;
  const COMMISSION_PERCENT = 3;

  const distanceCharge = parseFloat((distanceKm * RATE_PER_KM).toFixed(2));
  const totalAmount = parseFloat((itemAmount + distanceCharge + PLATFORM_FEE).toFixed(2));
  const commission = parseFloat(((itemAmount * COMMISSION_PERCENT) / 100).toFixed(2));
  const vendorEarnings = parseFloat((itemAmount - commission).toFixed(2));
  const deliveryEarnings = parseFloat((commission + distanceCharge).toFixed(2));
  const platformEarnings = PLATFORM_FEE;

  return {
    distanceCharge,
    platformFee: PLATFORM_FEE,
    totalAmount,
    vendorEarnings,
    deliveryEarnings,
    platformEarnings,
  };
}

// =========================================================
//  CUSTOMER ENDPOINTS
// =========================================================

exports.placeOrder = async (req, res) => {
  try {
    const { items, deliveryAddress, paymentMethod } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ msg: "No items in order" });

    if (!req.user?.id)
      return res.status(401).json({ msg: "Unauthorized" });

    const customer = await User.findById(req.user.id);
    if (!customer) return res.status(404).json({ msg: "Customer not found" });

    // Use shippingCity from request body if provided, else fall back to profile location
    const shippingCity = req.body.shippingCity?.toLowerCase().trim() || customer.location?.toLowerCase().trim() || "";
    const customerCoords = CITY_COORDS[shippingCity];

    // =========================================================
    // ✅ GROUP ITEMS BY VENDOR — Split order per vendor
    // =========================================================
    const vendorMap = {};

    for (const item of items) {
      const vid = item.vendorId?.toString() || "unknown";
      if (!vendorMap[vid]) {
        vendorMap[vid] = {
          vendorId: item.vendorId,
          vendorName: item.vendorName,
          items: [],
        };
      }
      vendorMap[vid].items.push({
  ...item,
  image: item.image || null,  // 👈 ADD
  totalPrice: item.price * item.quantity,
});
    }

    const vendorGroups = Object.values(vendorMap);
    const createdOrders = [];

    // Create one order per vendor
    for (const group of vendorGroups) {
      // Calculate item amount for this vendor's items
      const itemAmount = group.items.reduce((s, i) => s + i.totalPrice, 0);

      // Get vendor location for distance calculation
    const vendor = await User.findById(group.vendorId);
      // Use product location instead of vendor profile location
      const vendorLocation = vendor?.location?.toLowerCase().trim() || "";
      const vendorCoords = CITY_COORDS[vendorLocation];

      let distanceKm = 5; // default

      if (!vendorCoords) {
        return res.status(400).json({ 
          msg: `Vendor product city "${vendorLocation}" not found.` 
        });
      }

if (!customerCoords) {
  return res.status(400).json({ 
    msg: `Shipping city "${req.body.shippingCity || customer.location}" not found. Please select a valid city.` 
  });
}

distanceKm = getDistanceKm(
  vendorCoords.lat, vendorCoords.lng,
  customerCoords.lat, customerCoords.lng
);

if (distanceKm < 1) distanceKm = 1;

if (distanceKm > 100) {
  return res.status(400).json({ 
    msg: `Vendor is too far (${distanceKm} km). Only orders within 100 km are allowed.` 
  });
}

      // Calculate fees for this vendor's order
      const fees = calculateFees(itemAmount, distanceKm);

      // Discount fields sent from frontend
      const discountPercent = Number(req.body.discountPercent) || 0;
      const discountAmount  = Number(req.body.discountAmount)  || 0;
      const discountApplied = req.body.discountApplied === true || req.body.discountApplied === "true";
      const effectiveDiscount = discountApplied ? discountAmount : 0;

      // Final total = itemAmount - discount + distanceCharge + platformFee
      const finalTotal = parseFloat(
        (itemAmount - effectiveDiscount + fees.distanceCharge + fees.platformFee).toFixed(2)
      );

      const order = new Order({
        customerId: req.user.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        deliveryAddress,
        items: group.items,

        // Fee breakdown
        itemAmount,
        distanceKm,
        distanceCharge: fees.distanceCharge,
        platformFee: fees.platformFee,
        totalAmount: finalTotal,

        // Discount
        discountPercent: discountApplied ? discountPercent : 0,
        discountAmount:  discountApplied ? discountAmount  : 0,
        discountApplied: discountApplied,

       // Earnings breakdown
        vendorEarnings: parseFloat((fees.vendorEarnings - effectiveDiscount).toFixed(2)),
        deliveryEarnings: fees.deliveryEarnings,
        platformEarnings: fees.platformEarnings,

        paymentMethod,
        paymentStatus: paymentMethod === "COD" ? "Pending" : "Paid",
        status: "Placed",

        // ✅ Each order gets its OWN vendor
        vendorId: group.vendorId || null,
        vendorName: group.vendorName || null,
      });

      await order.save();
      createdOrders.push(order);

      // DEDUCT STOCK for this vendor's items
      for (const item of group.items) {
        if (!item.productId) continue;
        const updated = await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { quantity: -item.quantity } },
          { returnDocument: "after" }
        );
        if (!updated) continue;
        if (updated.quantity <= 0) {
          updated.quantity = 0;
          updated.stock = "Out of Stock";
          await updated.save();
        }
      }
    }

    res.status(201).json({
      msg: `${createdOrders.length} order(s) placed successfully`,
      orders: createdOrders,
      order: createdOrders[0], // for backward compatibility
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customerId: req.user.id });
    if (!order) return res.status(404).json({ msg: "Order not found" });

    if (["Delivered", "Cancelled", "Rejected"].includes(order.status))
      return res.status(400).json({ msg: "Cannot cancel this order" });

    order.status = "Cancelled";
    order.cancelReason = req.body.reason || "Cancelled by customer";
    order.cancelledAt = new Date();
    await order.save();

    // RESTORE STOCK on cancel
    for (const item of order.items) {
      if (!item.productId) continue;
      const updated = await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { quantity: item.quantity } },
        { returnDocument: "after" }
      );
      if (updated && updated.stock === "Out of Stock" && updated.quantity > 0) {
        updated.stock = "In Stock";
        await updated.save();
      }
    }

    res.json({ msg: "Order cancelled", order });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.rateOrder = async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const order = await Order.findOne({ _id: req.params.id, customerId: req.user.id });
    if (!order) return res.status(404).json({ msg: "Order not found" });
    if (order.status !== "Delivered")
      return res.status(400).json({ msg: "Can only rate delivered orders" });

    order.customerRating = rating;
    order.customerFeedback = feedback || "";
    await order.save();

    res.json({ msg: "Thank you for your feedback!", order });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// =========================================================
//  VENDOR ENDPOINTS
// =========================================================

exports.getVendorOrders = async (req, res) => {
  try {
    const orders = await Order.find({ vendorId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.vendorUpdateOrder = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findOne({ _id: req.params.id, vendorId: req.user.id });
    if (!order) return res.status(404).json({ msg: "Order not found" });

    if (!["Accepted", "Rejected", "Preparing", "Ready"].includes(status))
      return res.status(400).json({ msg: "Invalid status" });

     order.status = status;
    if (status === "Accepted") order.acceptedAt = new Date();
    if (status === "Rejected") {
      order.rejectedAt = new Date();
      order.rejectionReason = req.body.reason || "Rejected by vendor";
    }
    await order.save();

    // RESTORE STOCK if vendor rejects
    if (status === "Rejected") {
      for (const item of order.items) {
        if (!item.productId) continue;
        const updated = await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { quantity: item.quantity } },
          { returnDocument: "after" }
        );
        if (updated && updated.stock === "Out of Stock" && updated.quantity > 0) {
          updated.stock = "In Stock";
          await updated.save();
        }
      }
    }

    res.json({ msg: `Order ${status}`, order });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.assignDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.body;
    const order = await Order.findOne({ _id: req.params.id, vendorId: req.user.id });
    if (!order) return res.status(404).json({ msg: "Order not found" });

    const agent = await User.findOne({ _id: deliveryId, role: "delivery", status: "Approved" });
    if (!agent) return res.status(404).json({ msg: "Delivery agent not found" });

    order.deliveryId = deliveryId;
    order.deliveryName = agent.name;
    order.deliveryPhone = agent.phone;
    order.deliveryVehicle = agent.vehicleType;
    order.status = "Assigned";
    order.assignedAt = new Date();

    await order.save();
    res.json({ msg: "Delivery agent assigned", order });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getDeliveryAgents = async (req, res) => {
  try {
    const agents = await User.find({ role: "delivery", status: "Approved" })
      .select("name phone vehicleType location")
      .sort({ name: 1 });
    res.json(agents);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// =========================================================
//  DELIVERY ENDPOINTS
// =========================================================

exports.getDeliveryOrders = async (req, res) => {
  try {
    const orders = await Order.find({ deliveryId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.deliveryUpdateOrder = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findOne({ _id: req.params.id, deliveryId: req.user.id });
    if (!order) return res.status(404).json({ msg: "Order not found" });

    if (!["Picked", "On the way", "Delivered", "Declined"].includes(status))
      return res.status(400).json({ msg: "Invalid status" });

    order.status = status;
    if (status === "Picked") order.pickedAt = new Date();
    if (status === "Delivered") {
      order.deliveredAt = new Date();
      order.paymentStatus = "Paid";
    }

    // If declined, reset order to Ready so vendor can reassign
    if (status === "Declined") {
      order.status = "Ready";
      order.deliveryId = null;
      order.deliveryName = null;
      order.deliveryPhone = null;
      order.deliveryVehicle = null;
      order.assignedAt = null;
    }

    await order.save();
    res.json({ msg: `Order marked as ${status}`, order });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getEarnings = async (req, res) => {
  try {
    const delivered = await Order.find({ deliveryId: req.user.id, status: "Delivered" });
    const total = delivered.reduce((sum, o) => sum + (o.deliveryEarnings || 50), 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEarnings = delivered
      .filter((o) => new Date(o.deliveredAt) >= today)
      .reduce((sum, o) => sum + (o.deliveryEarnings || 50), 0);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekEarnings = delivered
      .filter((o) => new Date(o.deliveredAt) >= weekStart)
      .reduce((sum, o) => sum + (o.deliveryEarnings || 50), 0);

    res.json({
      total,
      today: todayEarnings,
      week: weekEarnings,
      count: delivered.length,
      recent: delivered.slice(0, 10),
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// =========================================================
//  ADMIN / SHARED
// =========================================================

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Admin — platform revenue summary
exports.getPlatformRevenue = async (req, res) => {
  try {
    const orders = await Order.find({ status: "Delivered" });
    const totalPlatformFee = orders.reduce((sum, o) => sum + (o.platformEarnings || 10), 0);
    const totalOrders = orders.length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayFee = orders
      .filter((o) => new Date(o.deliveredAt) >= today)
      .reduce((sum, o) => sum + (o.platformEarnings || 10), 0);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekFee = orders
      .filter((o) => new Date(o.deliveredAt) >= weekStart)
      .reduce((sum, o) => sum + (o.platformEarnings || 10), 0);

    res.json({
      totalPlatformFee,
      todayFee,
      weekFee,
      totalOrders,
      orders: orders.slice(0, 20),
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// =========================================================
//  GENERATE INVOICE — Enterprise UI (Customer + Vendor)
// =========================================================

exports.generateInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order)
      return res.status(404).json({ msg: "Order not found" });

    // =====================================================
    // ACCESS CONTROL
    // =====================================================

    const userId =
      req.user?.id?.toString() ||
      req.user?._id?.toString() ||
      "";

    const role = req.user?.role || "";

    const isCustomer =
      role === "customer" &&
      (order.customerId?.toString() || "") === userId;

    const isVendor =
      role === "vendor" &&
      (order.vendorId?.toString() || "") === userId;

    // ❌ Removed delivery + admin access

    if (!isCustomer && !isVendor) {
      return res.status(403).json({ msg: "Access denied" });
    }

    // =====================================================
    // COMMON DATA
    // =====================================================

    const date = new Date(order.createdAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const itemRows = order.items
      .map(
        (item, idx) => `
        <tr class="item-row" style="animation-delay:${idx * 0.05}s">
          <td><span class="item-name">${item.name}</span></td>
          <td class="cell-center">${item.quantity} ${item.unit}</td>
          <td class="cell-right">&#8377;${Number(item.price).toFixed(2)}</td>
          <td class="cell-right"><strong>&#8377;${Number(item.totalPrice).toFixed(2)}</strong></td>
        </tr>`
      )
      .join("");

    // =====================================================
    // CUSTOMER INVOICE
    // Design: Warm ivory luxury, Playfair serif headlines,
    //         gold accent line, editorial spacing, clean totals
    // =====================================================

    if (isCustomer) {

      const statusClass =
        order.status === "Delivered" ? "pill-green" :
        order.status === "Cancelled" ? "pill-red"   :
        order.status === "Placed"    ? "pill-amber"  : "pill-blue";

      const payClass = order.paymentStatus === "Paid" ? "pill-green" : "pill-amber";

      const customerHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Customer Invoice &middot; GramConnect</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root{
  --ivory:#faf7f2;
  --parchment:#f2ece0;
  --border:#e0d6c4;
  --gold:#c9a84c;
  --gold2:#e8d48e;
  --ink:#1c1610;
  --ink2:#5a4e3c;
  --ink3:#9a8e7e;
  --forest:#1f5c3a;
  --forest2:#2d7a52;
  --red:#b91c1c;
  --blue:#1d4ed8;
  --amber:#b45309;
  --shadow:rgba(28,22,16,0.10);
}

@keyframes riseUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes goldShimmer{
  0%{background-position:-200% center}
  100%{background-position:200% center}
}

html{font-size:15px}
body{
  font-family:'Outfit',sans-serif;
  background:var(--ivory);
  min-height:100vh;
  padding:36px 20px 64px;
  color:var(--ink);
}

/* ── ACTIONS BAR ── */
.actions{
  max-width:800px;margin:0 auto 24px;
  display:flex;justify-content:space-between;align-items:center;
  animation:fadeIn 0.4s ease both;
}
.actions-brand{
  font-family:'Cormorant Garamond',serif;
  font-size:1rem;color:var(--ink2);letter-spacing:0.05em;
}
.actions-btns{
  display:flex;align-items:center;gap:10px;
}
.btn-print{
  display:inline-flex;align-items:center;gap:8px;
  padding:10px 24px;
  background:var(--ink);color:white;border:none;border-radius:8px;
  font-family:'Outfit',sans-serif;font-size:0.85rem;font-weight:500;
  letter-spacing:0.04em;cursor:pointer;
  transition:background 0.2s,transform 0.15s,box-shadow 0.2s;
  box-shadow:0 4px 14px rgba(28,22,16,0.18);
}
.btn-print:hover{background:var(--gold);color:var(--ink);transform:translateY(-2px);box-shadow:0 6px 20px rgba(201,168,76,0.35)}
.btn-print svg{width:15px;height:15px}
.btn-close{
  display:inline-flex;align-items:center;gap:8px;
  padding:10px 20px;
  background:transparent;color:var(--ink2);
  border:1px solid var(--border);border-radius:8px;
  font-family:'Outfit',sans-serif;font-size:0.85rem;font-weight:500;
  letter-spacing:0.04em;cursor:pointer;
  transition:background 0.2s,color 0.2s,border-color 0.2s,transform 0.15s,box-shadow 0.2s;
}
.btn-close:hover{
  background:var(--red);color:white;border-color:var(--red);
  transform:translateY(-2px);box-shadow:0 6px 20px rgba(185,28,28,0.25);
}

/* ── INVOICE CARD ── */
.invoice{
  max-width:800px;margin:0 auto;
  background:white;
  border-radius:20px;
  border:1px solid var(--border);
  box-shadow:0 12px 48px var(--shadow),0 2px 8px rgba(0,0,0,0.04);
  overflow:hidden;
  animation:riseUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.05s both;
}

/* ── HEADER ── */
.inv-head{
  padding:40px 48px 36px;
  background:var(--ink);
  position:relative;overflow:hidden;
}
.inv-head::after{
  content:'';
  position:absolute;bottom:0;left:0;right:0;height:3px;
  background:linear-gradient(90deg,var(--gold),var(--gold2),var(--gold));
  background-size:200% auto;
  animation:goldShimmer 3.5s linear infinite;
}
/* decorative circle */
.inv-head::before{
  content:'';
  position:absolute;top:-80px;right:-80px;
  width:280px;height:280px;border-radius:50%;
  background:radial-gradient(circle,rgba(201,168,76,0.14) 0%,transparent 65%);
}

.head-row{display:flex;justify-content:space-between;align-items:flex-start;gap:20px}

.brand-wrap{display:flex;align-items:center;gap:16px}
.brand-icon{
  width:52px;height:52px;
  background:linear-gradient(135deg,rgba(201,168,76,0.25),rgba(201,168,76,0.08));
  border:1px solid rgba(201,168,76,0.4);
  border-radius:14px;
  display:flex;align-items:center;justify-content:center;
  font-size:24px;
}
.brand-name{
  font-family:'Cormorant Garamond',serif;
  font-size:1.7rem;font-weight:700;color:white;line-height:1;
}
.brand-tagline{
  font-size:0.72rem;letter-spacing:0.18em;text-transform:uppercase;
  color:var(--gold2);margin-top:5px;
}

.head-meta{text-align:right}
.meta-label{font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:4px}
.meta-id{
  font-family:'Cormorant Garamond',serif;
  font-size:1.15rem;font-weight:600;color:var(--gold);letter-spacing:0.06em;
}
.meta-date{font-size:0.8rem;color:rgba(255,255,255,0.45);margin-top:6px}

.head-pills{margin-top:26px;display:flex;gap:10px;flex-wrap:wrap}
.pill{
  display:inline-flex;align-items:center;gap:6px;
  padding:5px 14px;border-radius:100px;
  font-size:0.74rem;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;
  border:1px solid currentColor;
}
.pill::before{content:'';width:6px;height:6px;border-radius:50%;background:currentColor}
.pill-green{color:#4ade80;border-color:rgba(74,222,128,0.3);background:rgba(74,222,128,0.1)}
.pill-amber{color:#fbbf24;border-color:rgba(251,191,36,0.3);background:rgba(251,191,36,0.1)}
.pill-red  {color:#f87171;border-color:rgba(248,113,113,0.3);background:rgba(248,113,113,0.1)}
.pill-blue {color:#93c5fd;border-color:rgba(147,197,253,0.3);background:rgba(147,197,253,0.1)}

/* ── BODY ── */
.inv-body{padding:40px 48px}

/* info cards */
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:38px}
.info-card{
  background:var(--parchment);border:1px solid var(--border);
  border-radius:14px;padding:22px 24px;
  animation:riseUp 0.5s ease both;
}
.info-card:nth-child(2){animation-delay:0.07s}
.card-label{
  font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;
  color:var(--gold);font-weight:600;
  display:flex;align-items:center;gap:8px;margin-bottom:12px;
}
.card-label::before{content:'';width:14px;height:1px;background:var(--gold)}
.card-name{
  font-family:'Cormorant Garamond',serif;
  font-size:1.1rem;font-weight:600;color:var(--ink);margin-bottom:6px;
}
.card-line{font-size:0.84rem;color:var(--ink2);line-height:1.65}

.delivery-chip{
  margin-top:12px;display:inline-flex;align-items:center;gap:8px;
  padding:6px 14px;
  background:white;border:1px solid var(--border);border-radius:8px;
  font-size:0.8rem;color:var(--ink2);
}
.delivery-chip span{color:var(--forest2);font-weight:600}

/* section title */
.sec-title{
  font-size:0.65rem;letter-spacing:0.22em;text-transform:uppercase;
  color:var(--gold);font-weight:600;
  display:flex;align-items:center;gap:10px;margin-bottom:14px;
}
.sec-title::after{content:'';flex:1;height:1px;background:var(--border)}

/* table */
table{width:100%;border-collapse:collapse;margin-bottom:32px}
thead tr{border-bottom:2px solid var(--ink)}
th{
  font-size:0.68rem;letter-spacing:0.14em;text-transform:uppercase;
  color:var(--ink3);font-weight:600;padding:10px 14px;text-align:left;
}
.cell-right{text-align:right}
.cell-center{text-align:center}

.item-row{
  border-bottom:1px solid var(--border);
  animation:riseUp 0.4s ease both;
  transition:background 0.15s;
}
.item-row:last-child{border-bottom:none}
.item-row:hover{background:var(--parchment)}
td{padding:14px;font-size:0.88rem;color:var(--ink2);vertical-align:middle}
.item-name{font-weight:500;color:var(--ink)}

/* totals */
.totals-wrap{display:flex;justify-content:flex-end}
.totals-box{
  width:320px;
  border:1px solid var(--border);border-radius:16px;overflow:hidden;
}
.tot-row{
  display:flex;justify-content:space-between;align-items:center;
  padding:13px 22px;font-size:0.87rem;color:var(--ink2);
  border-bottom:1px solid var(--border);
}
.tot-row:last-child{border-bottom:none}
.tot-lbl{display:flex;align-items:center;gap:8px}
.tot-lbl svg{width:13px;height:13px;opacity:0.45;flex-shrink:0}
.grand-row{
  background:var(--ink);
  padding:18px 22px;
  display:flex;justify-content:space-between;align-items:center;
}
.grand-lbl{
  font-size:0.72rem;letter-spacing:0.12em;text-transform:uppercase;
  color:var(--gold2);font-weight:600;
}
.grand-val{
  font-family:'Cormorant Garamond',serif;
  font-size:1.6rem;font-weight:700;color:white;
}

/* footer */
.inv-footer{
  margin-top:44px;padding-top:24px;
  border-top:1px dashed var(--border);
  display:flex;justify-content:space-between;align-items:flex-end;
}
.footer-note{font-size:0.77rem;color:var(--ink3);line-height:1.75;max-width:320px}
.footer-note strong{display:block;color:var(--ink2);margin-bottom:3px;font-size:0.8rem}
.footer-sig{text-align:right}
.sig-name{font-family:'Cormorant Garamond',serif;font-size:1.25rem;color:var(--ink)}
.sig-sub{font-size:0.7rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink3);margin-top:3px}

@media print{
  @page{margin:0;size:A4}
  *{-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important}
  body{background:white !important;padding:20px}
  .actions{display:none !important}
  .invoice{box-shadow:none !important;border:1px solid #ccc !important;border-radius:0 !important}
  .inv-head{background:#1c1610 !important}
  .brand-name{color:#ffffff !important}
  .brand-tagline{color:#e8d48e !important}
  .meta-label{color:rgba(255,255,255,0.6) !important}
  .meta-id{color:#c9a84c !important}
  .meta-date{color:rgba(255,255,255,0.6) !important}
  .pill-green{color:#16a34a !important;border-color:#16a34a !important;background:#dcfce7 !important}
  .pill-amber{color:#b45309 !important;border-color:#b45309 !important;background:#fef3c7 !important}
  .pill-red{color:#b91c1c !important;border-color:#b91c1c !important;background:#fee2e2 !important}
  .pill-blue{color:#1d4ed8 !important;border-color:#1d4ed8 !important;background:#dbeafe !important}
  .pill::before{background:currentColor !important}
  .grand-row{background:#1c1610 !important}
  .grand-lbl{color:#e8d48e !important}
  .grand-val{color:#ffffff !important}
  .item-row,.info-card{animation:none !important}
}

@media(max-width:580px){
  .inv-head,.inv-body{padding:24px}
  .head-row{flex-direction:column}
  .head-meta{text-align:left}
  .info-grid{grid-template-columns:1fr}
  .totals-wrap{justify-content:stretch}
  .totals-box{width:100%}
  .inv-footer{flex-direction:column;gap:20px}
  .actions-btns{gap:8px}
  .btn-print,.btn-close{padding:9px 14px;font-size:0.8rem}
}
</style>
</head>
<body>

<div class="actions">
  <span class="actions-brand">&#127807; GramConnect &middot; Customer Invoice</span>
  <div class="actions-btns">
    <button class="btn-print" onclick="window.print()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
        <rect x="6" y="14" width="12" height="8"/>
      </svg>
      Print / Save PDF
    </button>
    <button class="btn-close" onclick="window.close()">&#10005; Close</button>
  </div>
</div>

<div class="invoice">

  <div class="inv-head">
    <div class="head-row">
      <div class="brand-wrap">
        <div class="brand-icon">&#127807;</div>
        <div>
          <div class="brand-name">GramConnect</div>
          <div class="brand-tagline">Farm Fresh &middot; Direct Delivery</div>
        </div>
      </div>
      <div class="head-meta">
        <div class="meta-label">Invoice Number</div>
        <div class="meta-id">#${(order.orderId || order._id.toString().slice(-8)).toUpperCase()}</div>
        <div class="meta-date">${date}</div>
      </div>
    </div>
    <div class="head-pills">
      <span class="pill ${statusClass}">${order.status}</span>
      <span class="pill ${payClass}">${order.paymentMethod} &middot; ${order.paymentStatus}</span>
    </div>
  </div>

  <div class="inv-body">

    <div class="info-grid">
      <div class="info-card">
        <div class="card-label">Billed To</div>
        <div class="card-name">${order.customerName}</div>
        <div class="card-line">${order.customerPhone}</div>
        <div class="card-line">${order.deliveryAddress}</div>
      </div>
      <div class="info-card">
        <div class="card-label">Supplied By</div>
        <div class="card-name">${order.vendorName}</div>
        <div class="card-line">Delivery distance: ${order.distanceKm} km</div>
        ${order.deliveryName
          ? `<div class="delivery-chip">&#128666; <span>${order.deliveryName}</span> &middot; ${order.deliveryPhone}</div>`
          : ""}
      </div>
    </div>

    <div class="sec-title">Order Items</div>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="cell-center">Qty</th>
          <th class="cell-right">Unit Price</th>
          <th class="cell-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <div class="totals-wrap">
      <div class="totals-box">
        <div class="tot-row">
          <span class="tot-lbl">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
            Item Subtotal
          </span>
          <span>&#8377;${Number(order.itemAmount).toFixed(2)}</span>
        </div>
        ${order.discountApplied && order.discountAmount > 0 ? `
        <div class="tot-row" style="color:#16a34a">
          <span class="tot-lbl" style="color:#16a34a">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            Discount (${order.discountPercent}% off)
          </span>
          <span>&#8722; &#8377;${Number(order.discountAmount).toFixed(2)}</span>
        </div>` : ""}
        <div class="tot-row">
          <span class="tot-lbl">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            Distance Charge (${order.distanceKm} km)
          </span>
          <span>&#8377;${Number(order.distanceCharge).toFixed(2)}</span>
        </div>
        <div class="tot-row">
          <span class="tot-lbl">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Platform Fee
          </span>
          <span>&#8377;${Number(order.platformFee).toFixed(2)}</span>
        </div>
        ${order.discountApplied && order.discountAmount > 0 ? `
        <div class="tot-row" style="color:#16a34a;font-weight:600">
          <span class="tot-lbl" style="color:#16a34a">&#127881; You saved</span>
          <span>&#8377;${Number(order.discountAmount).toFixed(2)}</span>
        </div>` : ""}
        <div class="grand-row">
          <span class="grand-lbl">Total Payable</span>
          <span class="grand-val">&#8377;${Number(order.totalAmount).toFixed(2)}</span>
        </div>
      </div>
    </div>

    <div class="inv-footer">
      <div class="footer-note">
        <strong>Thank you for your order!</strong>
        This is a computer-generated invoice and requires no physical signature.
        For support, reach us through the GramConnect app.
      </div>
      <div class="footer-sig">
        <div class="sig-name">GramConnect</div>
        <div class="sig-sub">Verified Digital Invoice</div>
      </div>
    </div>

  </div>
</div>

</body>
</html>`;

      res.setHeader("Content-Type", "text/html");
      return res.send(customerHTML);
    }

    // =====================================================
    // VENDOR INVOICE
    // Design: Same warm white luxury structure as customer
    //         but deep royal blue / indigo accent palette —
    //         Cormorant Garamond serif + Outfit body,
    //         sapphire shimmer header, blue-toned cards,
    //         earnings breakdown replacing totals box
    // =====================================================

    if (isVendor) {

      const commission = (Number(order.itemAmount) - Number(order.vendorEarnings)).toFixed(2);
      const commissionPct = ((parseFloat(commission) / Number(order.itemAmount)) * 100).toFixed(1);

      const vStatusClass =
        order.status === "Delivered" ? "pill-green" :
        order.status === "Cancelled" ? "pill-red"   :
        order.status === "Placed"    ? "pill-amber"  : "pill-blue";

      const vPayClass = order.paymentStatus === "Paid" ? "pill-green" : "pill-amber";

      const vendorHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Vendor Invoice &middot; GramConnect</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root{
  --ivory:#f7f8fc;
  --parchment:#eef0f8;
  --border:#d4d9ee;
  --sapphire:#2a52b8;
  --sapphire2:#e8ecf8;
  --ink:#111827;
  --ink2:#3d4a6b;
  --ink3:#8a93b2;
  --indigo:#3730a3;
  --indigo2:#4f46e5;
  --red:#b91c1c;
  --blue:#1d4ed8;
  --amber:#b45309;
  --shadow:rgba(17,24,39,0.10);
}

@keyframes riseUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes sapphireShimmer{
  0%{background-position:-200% center}
  100%{background-position:200% center}
}

html{font-size:15px}
body{
  font-family:'Outfit',sans-serif;
  background:var(--ivory);
  min-height:100vh;
  padding:36px 20px 64px;
  color:var(--ink);
}

/* ── ACTIONS BAR ── */
.actions{
  max-width:800px;margin:0 auto 24px;
  display:flex;justify-content:space-between;align-items:center;
  animation:fadeIn 0.4s ease both;
}
.actions-brand{
  font-family:'Cormorant Garamond',serif;
  font-size:1rem;color:var(--ink2);letter-spacing:0.05em;
}
.actions-btns{
  display:flex;align-items:center;gap:10px;
}
.btn-print{
  display:inline-flex;align-items:center;gap:8px;
  padding:10px 24px;
  background:var(--ink);color:white;border:none;border-radius:8px;
  font-family:'Outfit',sans-serif;font-size:0.85rem;font-weight:500;
  letter-spacing:0.04em;cursor:pointer;
  transition:background 0.2s,transform 0.15s,box-shadow 0.2s;
  box-shadow:0 4px 14px rgba(17,24,39,0.18);
}
.btn-print:hover{background:var(--indigo);transform:translateY(-2px);box-shadow:0 6px 20px rgba(55,48,163,0.3)}
.btn-print svg{width:15px;height:15px}
.btn-close{
  display:inline-flex;align-items:center;gap:8px;
  padding:10px 20px;
  background:transparent;color:var(--ink2);
  border:1px solid var(--border);border-radius:8px;
  font-family:'Outfit',sans-serif;font-size:0.85rem;font-weight:500;
  letter-spacing:0.04em;cursor:pointer;
  transition:background 0.2s,color 0.2s,border-color 0.2s,transform 0.15s,box-shadow 0.2s;
}
.btn-close:hover{
  background:var(--red);color:white;border-color:var(--red);
  transform:translateY(-2px);box-shadow:0 6px 20px rgba(185,28,28,0.25);
}

/* ── INVOICE CARD ── */
.invoice{
  max-width:800px;margin:0 auto;
  background:white;
  border-radius:20px;
  border:1px solid var(--border);
  box-shadow:0 12px 48px var(--shadow),0 2px 8px rgba(0,0,0,0.04);
  overflow:hidden;
  animation:riseUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.05s both;
}

/* ── HEADER ── */
.inv-head{
  padding:40px 48px 36px;
  background:var(--ink);
  position:relative;overflow:hidden;
}
.inv-head::after{
  content:'';
  position:absolute;bottom:0;left:0;right:0;height:3px;
  background:linear-gradient(90deg,var(--sapphire),var(--indigo2),#818cf8,var(--indigo2),var(--sapphire));
  background-size:200% auto;
  animation:sapphireShimmer 3.5s linear infinite;
}
.inv-head::before{
  content:'';
  position:absolute;top:-80px;right:-80px;
  width:280px;height:280px;border-radius:50%;
  background:radial-gradient(circle,rgba(79,70,229,0.18) 0%,transparent 65%);
}

.head-row{display:flex;justify-content:space-between;align-items:flex-start;gap:20px}
.brand-wrap{display:flex;align-items:center;gap:16px}
.brand-icon{
  width:52px;height:52px;
  background:linear-gradient(135deg,rgba(79,70,229,0.3),rgba(79,70,229,0.08));
  border:1px solid rgba(129,140,248,0.45);
  border-radius:14px;
  display:flex;align-items:center;justify-content:center;font-size:24px;
}
.brand-name{
  font-family:'Cormorant Garamond',serif;
  font-size:1.7rem;font-weight:700;color:white;line-height:1;
}
.brand-tagline{
  font-size:0.72rem;letter-spacing:0.18em;text-transform:uppercase;
  color:#a5b4fc;margin-top:5px;
}

.head-meta{text-align:right}
.meta-label{font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:4px}
.meta-id{
  font-family:'Cormorant Garamond',serif;
  font-size:1.15rem;font-weight:600;color:#a5b4fc;letter-spacing:0.06em;
}
.meta-date{font-size:0.8rem;color:rgba(255,255,255,0.45);margin-top:6px}

.head-pills{margin-top:26px;display:flex;gap:10px;flex-wrap:wrap}
.pill{
  display:inline-flex;align-items:center;gap:6px;
  padding:5px 14px;border-radius:100px;
  font-size:0.74rem;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;
  border:1px solid currentColor;
}
.pill::before{content:'';width:6px;height:6px;border-radius:50%;background:currentColor}
.pill-green{color:#4ade80;border-color:rgba(74,222,128,0.3);background:rgba(74,222,128,0.1)}
.pill-amber{color:#fbbf24;border-color:rgba(251,191,36,0.3);background:rgba(251,191,36,0.1)}
.pill-red  {color:#f87171;border-color:rgba(248,113,113,0.3);background:rgba(248,113,113,0.1)}
.pill-blue {color:#93c5fd;border-color:rgba(147,197,253,0.3);background:rgba(147,197,253,0.1)}

/* ── METRICS STRIP ── */
.metrics{
  display:grid;grid-template-columns:repeat(3,1fr);
  border-bottom:1px solid var(--border);
}
.metric{
  padding:20px 24px;border-right:1px solid var(--border);
  position:relative;overflow:hidden;
  animation:riseUp 0.5s ease both;
}
.metric:last-child{border-right:none}
.metric:nth-child(2){animation-delay:0.07s}
.metric:nth-child(3){animation-delay:0.14s}
.metric::before{
  content:'';position:absolute;top:0;left:0;right:0;height:3px;border-radius:0;
}
.m-earn::before {background:linear-gradient(90deg,#16a34a,transparent)}
.m-comm::before {background:linear-gradient(90deg,var(--amber),transparent)}
.m-items::before{background:linear-gradient(90deg,var(--indigo2),transparent)}
.m-key{
  font-size:0.65rem;letter-spacing:0.18em;text-transform:uppercase;
  color:var(--ink3);font-weight:600;margin-bottom:6px;
}
.m-val{
  font-family:'Cormorant Garamond',serif;
  font-size:1.75rem;font-weight:700;letter-spacing:-0.01em;line-height:1;
}
.c-green{color:#16a34a}
.c-amber{color:var(--amber)}
.c-indigo{color:var(--indigo2)}
.m-sub{font-size:0.75rem;color:var(--ink3);margin-top:5px}

/* ── BODY ── */
.inv-body{padding:40px 48px}

/* info cards */
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:38px}
.info-card{
  background:var(--parchment);border:1px solid var(--border);
  border-radius:14px;padding:22px 24px;
  animation:riseUp 0.5s ease both;
}
.info-card:nth-child(2){animation-delay:0.07s}
.card-label{
  font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;
  color:var(--indigo2);font-weight:600;
  display:flex;align-items:center;gap:8px;margin-bottom:12px;
}
.card-label::before{content:'';width:14px;height:1px;background:var(--indigo2)}
.card-name{
  font-family:'Cormorant Garamond',serif;
  font-size:1.1rem;font-weight:600;color:var(--ink);margin-bottom:6px;
}
.card-line{font-size:0.84rem;color:var(--ink2);line-height:1.65}
.delivery-chip{
  margin-top:12px;display:inline-flex;align-items:center;gap:8px;
  padding:6px 14px;
  background:white;border:1px solid var(--border);border-radius:8px;
  font-size:0.8rem;color:var(--ink2);
}
.delivery-chip span{color:var(--indigo);font-weight:600}

/* section title */
.sec-title{
  font-size:0.65rem;letter-spacing:0.22em;text-transform:uppercase;
  color:var(--indigo2);font-weight:600;
  display:flex;align-items:center;gap:10px;margin-bottom:14px;
}
.sec-title::after{content:'';flex:1;height:1px;background:var(--border)}

/* table */
table{width:100%;border-collapse:collapse;margin-bottom:32px}
thead tr{border-bottom:2px solid var(--ink)}
th{
  font-size:0.68rem;letter-spacing:0.14em;text-transform:uppercase;
  color:var(--ink3);font-weight:600;padding:10px 14px;text-align:left;
}
.cell-right{text-align:right}
.cell-center{text-align:center}
.item-row{
  border-bottom:1px solid var(--border);
  animation:riseUp 0.4s ease both;
  transition:background 0.15s;
}
.item-row:last-child{border-bottom:none}
.item-row:hover{background:var(--parchment)}
td{padding:14px;font-size:0.88rem;color:var(--ink2);vertical-align:middle}
.item-name{font-weight:500;color:var(--ink)}

/* earnings breakdown — replaces totals box */
.breakdown{
  display:flex;justify-content:flex-end;margin-bottom:0;
}
.breakdown-box{
  width:340px;
  border:1px solid var(--border);border-radius:16px;overflow:hidden;
}
.bd-row{
  display:flex;justify-content:space-between;align-items:center;
  padding:13px 22px;font-size:0.87rem;color:var(--ink2);
  border-bottom:1px solid var(--border);
}
.bd-row:last-child{border-bottom:none}
.bd-lbl{display:flex;align-items:center;gap:8px}
.bd-lbl svg{width:13px;height:13px;opacity:0.45;flex-shrink:0}
.pct-badge{
  font-size:0.68rem;padding:2px 7px;border-radius:4px;
  background:rgba(180,83,9,0.1);color:var(--amber);
  border:1px solid rgba(180,83,9,0.2);margin-left:7px;
}
.bd-val{font-weight:600}
.v-indigo{color:var(--indigo2)}
.v-amber {color:var(--amber)}
.grand-earn-row{
  background:var(--ink);
  padding:18px 22px;
  display:flex;justify-content:space-between;align-items:center;
}
.grand-earn-lbl{
  font-size:0.72rem;letter-spacing:0.12em;text-transform:uppercase;
  color:#a5b4fc;font-weight:600;
}
.grand-earn-val{
  font-family:'Cormorant Garamond',serif;
  font-size:1.6rem;font-weight:700;color:#c7d2fe;
}

/* footer */
.inv-footer{
  margin-top:44px;padding-top:24px;
  border-top:1px dashed var(--border);
  display:flex;justify-content:space-between;align-items:flex-end;
}
.footer-note{font-size:0.77rem;color:var(--ink3);line-height:1.75;max-width:320px}
.footer-note strong{display:block;color:var(--ink2);margin-bottom:3px;font-size:0.8rem}
.footer-sig{text-align:right}
.sig-name{font-family:'Cormorant Garamond',serif;font-size:1.25rem;color:var(--ink)}
.sig-sub{font-size:0.7rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink3);margin-top:3px}

@media print{
  @page{margin:0;size:A4}
  *{-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important}
  body{background:white !important;padding:20px}
  .actions{display:none !important}
  .invoice{box-shadow:none !important;border:1px solid #ccc !important;border-radius:0 !important}
  .inv-head{background:#111827 !important}
  .brand-name{color:#ffffff !important}
  .brand-tagline{color:#a5b4fc !important}
  .meta-label{color:rgba(255,255,255,0.6) !important}
  .meta-id{color:#a5b4fc !important}
  .meta-date{color:rgba(255,255,255,0.6) !important}
  .pill-green{color:#16a34a !important;border-color:#16a34a !important;background:#dcfce7 !important}
  .pill-amber{color:#b45309 !important;border-color:#b45309 !important;background:#fef3c7 !important}
  .pill-red{color:#b91c1c !important;border-color:#b91c1c !important;background:#fee2e2 !important}
  .pill-blue{color:#1d4ed8 !important;border-color:#1d4ed8 !important;background:#dbeafe !important}
  .pill::before{background:currentColor !important}
  .grand-earn-row{background:#111827 !important}
  .grand-earn-lbl{color:#a5b4fc !important}
  .grand-earn-val{color:#c7d2fe !important}
  .m-earn::before{background:linear-gradient(90deg,#16a34a,transparent) !important}
  .m-comm::before{background:linear-gradient(90deg,#b45309,transparent) !important}
  .m-items::before{background:linear-gradient(90deg,#4f46e5,transparent) !important}
  .item-row,.info-card,.metric{animation:none !important}
}
  

@media(max-width:580px){
  .inv-head,.inv-body{padding:24px}
  .head-row{flex-direction:column}
  .head-meta{text-align:left}
  .metrics{grid-template-columns:1fr}
  .metric{border-right:none;border-bottom:1px solid var(--border)}
  .metric:last-child{border-bottom:none}
  .info-grid{grid-template-columns:1fr}
  .breakdown{justify-content:stretch}
  .breakdown-box{width:100%}
  .inv-footer{flex-direction:column;gap:20px}
  .actions-btns{gap:8px}
  .btn-print,.btn-close{padding:9px 14px;font-size:0.8rem}
}
</style>
</head>
<body>

<div class="actions">
  <span class="actions-brand">&#127807; GramConnect &middot; Vendor Invoice</span>
  <div class="actions-btns">
    <button class="btn-print" onclick="window.print()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
        <rect x="6" y="14" width="12" height="8"/>
      </svg>
      Print / Save PDF
    </button>
    <button class="btn-close" onclick="window.close()">&#10005; Close</button>
  </div>
</div>

<div class="invoice">

  <div class="inv-head">
    <div class="head-row">
      <div class="brand-wrap">
        <div class="brand-icon">&#127807;</div>
        <div>
          <div class="brand-name">GramConnect</div>
          <div class="brand-tagline">Vendor Invoice &middot; Earnings Statement</div>
        </div>
      </div>
      <div class="head-meta">
        <div class="meta-label">Invoice Number</div>
        <div class="meta-id">#${(order.orderId || order._id.toString().slice(-8)).toUpperCase()}</div>
        <div class="meta-date">${date}</div>
      </div>
    </div>
    <div class="head-pills">
      <span class="pill ${vStatusClass}">${order.status}</span>
      <span class="pill ${vPayClass}">${order.paymentMethod} &middot; ${order.paymentStatus}</span>
    </div>
  </div>

  <div class="metrics">
   <div class="metric m-earn">
      <div class="m-key">Your Earnings</div>
      <div class="m-val c-green">&#8377;${Number(order.vendorEarnings).toFixed(2)}</div>
      <div class="m-sub">After commission & discount</div>
    </div>
    <div class="metric m-comm">
      <div class="m-key">Commission</div>
      <div class="m-val c-amber">&#8377;${commission}</div>
      <div class="m-sub">${commissionPct}% of subtotal</div>
    </div>
    <div class="metric m-items">
      <div class="m-key">Item Subtotal</div>
      <div class="m-val c-indigo">&#8377;${Number(order.itemAmount).toFixed(2)}</div>
      <div class="m-sub">${order.items.length} line item(s)</div>
    </div>
  </div>

  <div class="inv-body">

    <div class="info-grid">
      <div class="info-card">
        <div class="card-label">Customer</div>
        <div class="card-name">${order.customerName}</div>
        <div class="card-line">${order.customerPhone}</div>
        <div class="card-line">${order.deliveryAddress}</div>
      </div>
      <div class="info-card">
        <div class="card-label">Order Details</div>
        <div class="card-name">${order.vendorName}</div>
        <div class="card-line">Delivery distance: ${order.distanceKm} km</div>
        ${order.deliveryName
          ? `<div class="delivery-chip">&#128666; <span>${order.deliveryName}</span> &middot; ${order.deliveryPhone}</div>`
          : ""}
      </div>
    </div>

    <div class="sec-title">Ordered Items</div>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th class="cell-center">Qty</th>
          <th class="cell-right">Unit Rate</th>
          <th class="cell-right">Line Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <div class="breakdown">
      <div class="breakdown-box">
        <div class="bd-row">
          <span class="bd-lbl">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
            Item Subtotal
          </span>
          <span class="bd-val v-indigo">&#8377;${Number(order.itemAmount).toFixed(2)}</span>
        </div>
        ${order.discountAmount > 0 ? `
        <div class="bd-row">
          <span class="bd-lbl" style="color:#7c3aed">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            Discount Given (${order.discountPercent}%)
          </span>
          <span class="bd-val" style="color:#7c3aed">&minus; &#8377;${Number(order.discountAmount).toFixed(2)}</span>
        </div>` : ""}
        <div class="bd-row">
          <span class="bd-lbl">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Platform Commission
            <span class="pct-badge">${commissionPct}%</span>
          </span>
          <span class="bd-val v-amber">&minus; &#8377;${commission}</span>
        </div>
        <div class="grand-earn-row">
          <span class="grand-earn-lbl">Net Earnings</span>
          <span class="grand-earn-val">&#8377;${Number(order.vendorEarnings).toFixed(2)}</span>
        </div>
      </div>
    </div>

    <div class="inv-footer">
      <div class="footer-note">
        <strong>Earnings statement for your records.</strong>
        This is a computer-generated document and requires no physical signature.
        For disputes, reach us through the GramConnect Vendor Portal.
      </div>
      <div class="footer-sig">
        <div class="sig-name">GramConnect</div>
        <div class="sig-sub">Vendor Portal &middot; Verified</div>
      </div>
    </div>

  </div>
</div>

</body>
</html>`;

      res.setHeader("Content-Type", "text/html");
      return res.send(vendorHTML);
    }

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// =========================================================
//  CUSTOMER — Combined Delivered Orders Statement
// =========================================================

exports.generateCustomerStatement = async (req, res) => {
  try {
    const userId = req.user?.id?.toString() || "";
    const role = req.user?.role || "";

    if (role !== "customer") {
      return res.status(403).json({ msg: "Access denied" });
    }

    const orders = await Order.find({
      customerId: userId,
      status: "Delivered",
    }).sort({ createdAt: -1 });

    if (orders.length === 0) {
      return res.status(404).json({ msg: "No delivered orders found" });
    }

    const grandTotal = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
      const totalDiscountSaved = orders.reduce((s, o) => s + (o.discountApplied ? Number(o.discountAmount || 0) : 0), 0);
    const totalItems = orders.reduce((s, o) => s + o.items.length, 0);
    const generatedDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });

    const orderRows = orders.map((o, idx) => {
      const date = new Date(o.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      });
      const itemNames = o.items.map(i => `${i.name} ×${i.quantity}${i.unit}`).join(", ");
      return `
        <tr class="order-row">
          <td class="cell-num">${idx + 1}</td>
          <td>
            <div class="order-id">${o.orderId || o._id.toString().slice(-8).toUpperCase()}</div>
            <div class="order-date">${date}</div>
          </td>
          <td class="cell-vendor">${o.vendorName || "—"}</td>
          <td class="cell-items">${itemNames}</td>
          <td class="cell-right">₹${Number(o.itemAmount).toFixed(2)}</td>
          <td class="cell-right">₹${Number(o.distanceCharge || 0).toFixed(2)}</td>
          <td class="cell-right">₹${Number(o.platformFee || 10).toFixed(2)}</td>
          <td class="cell-right cell-total">₹${Number(o.totalAmount).toFixed(2)}</td>
        </tr>`;
    }).join("");

    const customerHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Purchase Statement · GramConnect</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --ivory:#faf7f2;--parchment:#f2ece0;--border:#e0d6c4;
  --gold:#c9a84c;--gold2:#e8d48e;--ink:#1c1610;--ink2:#5a4e3c;--ink3:#9a8e7e;
  --forest2:#2d7a52;--red:#b91c1c;--shadow:rgba(28,22,16,0.10);
}
html{font-size:14px}
body{font-family:'Outfit',sans-serif;background:var(--ivory);min-height:100vh;padding:32px 20px 60px;color:var(--ink)}

/* ACTIONS */
.actions{max-width:960px;margin:0 auto 20px;display:flex;justify-content:space-between;align-items:center}
.actions-brand{font-family:'Cormorant Garamond',serif;font-size:1rem;color:var(--ink2);letter-spacing:0.05em}
.actions-btns{display:flex;gap:10px}
.btn-print{display:inline-flex;align-items:center;gap:8px;padding:9px 22px;background:var(--ink);color:white;border:none;border-radius:8px;font-family:'Outfit',sans-serif;font-size:0.82rem;font-weight:500;cursor:pointer;transition:all 0.2s;box-shadow:0 4px 14px rgba(28,22,16,0.18)}
.btn-print:hover{background:var(--gold);color:var(--ink)}
.btn-close{display:inline-flex;align-items:center;gap:8px;padding:9px 18px;background:transparent;color:var(--ink2);border:1px solid var(--border);border-radius:8px;font-family:'Outfit',sans-serif;font-size:0.82rem;font-weight:500;cursor:pointer;transition:all 0.2s}
.btn-close:hover{background:var(--red);color:white;border-color:var(--red)}

/* CARD */
.statement{max-width:960px;margin:0 auto;background:white;border-radius:20px;border:1px solid var(--border);box-shadow:0 12px 48px var(--shadow);overflow:hidden}

/* HEADER */
.st-head{padding:36px 48px 32px;background:var(--ink);position:relative;overflow:hidden}
.st-head::after{content:'';position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--gold),var(--gold2),var(--gold))}
.st-head::before{content:'';position:absolute;top:-60px;right:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(201,168,76,0.12) 0%,transparent 65%)}
.head-row{display:flex;justify-content:space-between;align-items:flex-start;gap:20px}
.brand-wrap{display:flex;align-items:center;gap:14px}
.brand-icon{width:48px;height:48px;background:linear-gradient(135deg,rgba(201,168,76,0.25),rgba(201,168,76,0.08));border:1px solid rgba(201,168,76,0.4);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px}
.brand-name{font-family:'Cormorant Garamond',serif;font-size:1.6rem;font-weight:700;color:white;line-height:1}
.brand-tagline{font-size:0.68rem;letter-spacing:0.18em;text-transform:uppercase;color:var(--gold2);margin-top:4px}
.head-meta{text-align:right}
.meta-label{font-size:0.62rem;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:4px}
.meta-title{font-family:'Cormorant Garamond',serif;font-size:1.1rem;font-weight:600;color:var(--gold);letter-spacing:0.04em}
.meta-sub{font-size:0.75rem;color:rgba(255,255,255,0.4);margin-top:5px}

/* SUMMARY STRIP */
.summary-strip{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid var(--border)}
.strip-item{padding:18px 24px;border-right:1px solid var(--border)}
.strip-item:last-child{border-right:none}
.strip-label{font-size:0.62rem;letter-spacing:0.18em;text-transform:uppercase;color:var(--ink3);font-weight:600;margin-bottom:6px}
.strip-val{font-family:'Cormorant Garamond',serif;font-size:1.6rem;font-weight:700;color:var(--ink);line-height:1}
.strip-val.green{color:#16a34a}
.strip-sub{font-size:0.72rem;color:var(--ink3);margin-top:4px}

/* CUSTOMER INFO */
.cust-row{padding:20px 48px;display:flex;gap:40px;background:var(--parchment);border-bottom:1px solid var(--border)}
.cust-item{display:flex;flex-direction:column;gap:3px}
.cust-label{font-size:0.62rem;letter-spacing:0.16em;text-transform:uppercase;color:var(--gold);font-weight:600}
.cust-val{font-size:0.88rem;color:var(--ink2);font-weight:500}

/* TABLE */
.table-wrap{padding:28px 48px}
.sec-title{font-size:0.62rem;letter-spacing:0.22em;text-transform:uppercase;color:var(--gold);font-weight:600;display:flex;align-items:center;gap:10px;margin-bottom:16px}
.sec-title::after{content:'';flex:1;height:1px;background:var(--border)}
table{width:100%;border-collapse:collapse;font-size:0.82rem}
thead tr{border-bottom:2px solid var(--ink)}
th{font-size:0.62rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--ink3);font-weight:600;padding:8px 10px;text-align:left}
.cell-right{text-align:right}
.cell-num{text-align:center;width:36px;color:var(--ink3)}
.cell-vendor{min-width:100px}
.cell-items{max-width:220px;color:var(--ink3);font-size:0.76rem}
.cell-total{font-weight:700;color:var(--ink)}
.order-row{border-bottom:1px solid var(--border);transition:background 0.15s}
.order-row:last-child{border-bottom:none}
.order-row:hover{background:var(--parchment)}
td{padding:12px 10px;vertical-align:middle}
.order-id{font-weight:600;color:var(--ink);font-size:0.82rem}
.order-date{font-size:0.72rem;color:var(--ink3);margin-top:2px}

/* GRAND TOTAL */
.grand-section{padding:0 48px 36px}
.grand-box{display:flex;justify-content:flex-end}
.grand-inner{width:300px;border:1px solid var(--border);border-radius:14px;overflow:hidden}
.grand-row-item{display:flex;justify-content:space-between;padding:11px 20px;font-size:0.84rem;color:var(--ink2);border-bottom:1px solid var(--border)}
.grand-row-item:last-child{border-bottom:none}
.grand-final{background:var(--ink);padding:16px 20px;display:flex;justify-content:space-between;align-items:center}
.grand-final-lbl{font-size:0.68rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--gold2);font-weight:600}
.grand-final-val{font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:700;color:white}

/* FOOTER */
.st-footer{margin:0 48px 36px;padding-top:20px;border-top:1px dashed var(--border);display:flex;justify-content:space-between;align-items:flex-end}
.footer-note{font-size:0.74rem;color:var(--ink3);line-height:1.75;max-width:300px}
.footer-note strong{display:block;color:var(--ink2);margin-bottom:3px;font-size:0.76rem}
.footer-sig{text-align:right}
.sig-name{font-family:'Cormorant Garamond',serif;font-size:1.15rem;color:var(--ink)}
.sig-sub{font-size:0.67rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink3);margin-top:3px}

@media print{
  @page{margin:0;size:A4 landscape}
  *{-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important}
  body{background:white !important;padding:10px}
  .actions{display:none !important}
  .statement{box-shadow:none !important;border:1px solid #ccc !important;border-radius:0 !important}
  .st-head{background:#1c1610 !important}
  .brand-name{color:#ffffff !important}
  .brand-tagline{color:#e8d48e !important}
  .meta-label{color:rgba(255,255,255,0.6) !important}
  .meta-title{color:#c9a84c !important}
  .meta-sub{color:rgba(255,255,255,0.5) !important}
  .grand-final{background:#1c1610 !important}
  .grand-final-lbl{color:#e8d48e !important}
  .grand-final-val{color:#ffffff !important}
}
</style>
</head>
<body>

<div class="actions">
  <span class="actions-brand">&#127807; GramConnect · Purchase Statement</span>
  <div class="actions-btns">
    <button class="btn-print" onclick="window.print()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
        <rect x="6" y="14" width="12" height="8"/>
      </svg>
      Print / Save PDF
    </button>
    <button class="btn-close" onclick="window.close()">✕ Close</button>
  </div>
</div>

<div class="statement">

  <div class="st-head">
    <div class="head-row">
      <div class="brand-wrap">
        <div class="brand-icon">&#127807;</div>
        <div>
          <div class="brand-name">GramConnect</div>
          <div class="brand-tagline">Purchase Statement · All Delivered Orders</div>
        </div>
      </div>
      <div class="head-meta">
        <div class="meta-label">Statement For</div>
        <div class="meta-title">${orders[0]?.customerName || "Customer"}</div>
        <div class="meta-sub">Generated: ${generatedDate}</div>
      </div>
    </div>
  </div>

  <div class="summary-strip">
    <div class="strip-item">
      <div class="strip-label">Total Orders</div>
      <div class="strip-val">${orders.length}</div>
      <div class="strip-sub">Delivered successfully</div>
    </div>
    <div class="strip-item">
      <div class="strip-label">Total Items</div>
      <div class="strip-val">${totalItems}</div>
      <div class="strip-sub">Across all orders</div>
    </div>
    <div class="strip-item">
      <div class="strip-label">Total Spent</div>
      <div class="strip-val green">&#8377;${grandTotal.toFixed(2)}</div>
      <div class="strip-sub">Including all charges</div>
    </div>
    <div class="strip-item">
      <div class="strip-label">Avg Order Value</div>
      <div class="strip-val">&#8377;${(grandTotal / orders.length).toFixed(2)}</div>
      <div class="strip-sub">Per delivered order</div>
    </div>
  </div>

  <div class="cust-row">
    <div class="cust-item">
      <span class="cust-label">Customer</span>
      <span class="cust-val">${orders[0]?.customerName || "—"}</span>
    </div>
    <div class="cust-item">
      <span class="cust-label">Phone</span>
      <span class="cust-val">${orders[0]?.customerPhone || "—"}</span>
    </div>
    <div class="cust-item">
      <span class="cust-label">Delivery Location</span>
      <span class="cust-val">${orders[0]?.deliveryAddress || "—"}</span>
    </div>
    <div class="cust-item">
      <span class="cust-label">Statement Period</span>
      <span class="cust-val">${new Date(orders[orders.length - 1].createdAt).toLocaleDateString("en-IN")} — ${new Date(orders[0].createdAt).toLocaleDateString("en-IN")}</span>
    </div>
  </div>

  <div class="table-wrap">
    <div class="sec-title">Delivered Orders</div>
    <table>
      <thead>
        <tr>
          <th class="cell-num">#</th>
          <th>Order ID / Date</th>
          <th class="cell-vendor">Vendor</th>
          <th>Items</th>
          <th class="cell-right">Item Amt</th>
          <th class="cell-right">Distance</th>
          <th class="cell-right">Platform</th>
          <th class="cell-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${orderRows}
      </tbody>
    </table>
  </div>

  <div class="grand-section">
    <div class="grand-box">
      <div class="grand-inner">
        <div class="grand-row-item">
          <span>Item Subtotal</span>
          <span>&#8377;${orders.reduce((s,o) => s + Number(o.itemAmount), 0).toFixed(2)}</span>
        </div>
       <div class="grand-row-item">
          <span>Total Distance Charges</span>
          <span>&#8377;${orders.reduce((s,o) => s + Number(o.distanceCharge || 0), 0).toFixed(2)}</span>
        </div>
        <div class="grand-row-item">
          <span>Total Platform Fees</span>
          <span>&#8377;${orders.reduce((s,o) => s + Number(o.platformFee || 10), 0).toFixed(2)}</span>
        </div>
        ${totalDiscountSaved > 0 ? `
        <div class="grand-row-item" style="color:#16a34a;font-weight:600">
          <span>🎁 Total Discounts Saved</span>
          <span>&#8722; &#8377;${totalDiscountSaved.toFixed(2)}</span>
        </div>` : ""}
        <div class="grand-final">
          <span class="grand-final-lbl">Grand Total Spent</span>
          <span class="grand-final-val">&#8377;${grandTotal.toFixed(2)}</span>
        </div>
        ${totalDiscountSaved > 0 ? `
        <div style="background:#16a34a;padding:10px 20px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:0.68rem;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.85);font-weight:600">Total You Saved</span>
          <span style="font-family:'Cormorant Garamond',serif;font-size:1.3rem;font-weight:700;color:white">&#8377;${totalDiscountSaved.toFixed(2)}</span>
        </div>` : ""}
      </div>
    </div>
  </div>

  <div class="st-footer">
    <div class="footer-note">
      <strong>Official Purchase Statement</strong>
      This is a computer-generated statement of all delivered orders.
      For disputes or refunds, contact support@gramconnect.com
    </div>
    <div class="footer-sig">
      <div class="sig-name">GramConnect</div>
      <div class="sig-sub">Verified · ${generatedDate}</div>
    </div>
  </div>

</div>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    return res.send(customerHTML);

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};


// =========================================================
//  VENDOR — Combined Earnings Statement
// =========================================================

exports.generateVendorStatement = async (req, res) => {
  try {
    const userId = req.user?.id?.toString() || "";
    const role = req.user?.role || "";

    if (role !== "vendor") {
      return res.status(403).json({ msg: "Access denied" });
    }

    const orders = await Order.find({
      vendorId: userId,
      status: "Delivered",
    }).sort({ createdAt: -1 });

    if (orders.length === 0) {
      return res.status(404).json({ msg: "No delivered orders found" });
    }

     const totalItemAmount   = orders.reduce((s, o) => s + Number(o.itemAmount || 0), 0);
    const totalCommission   = orders.reduce((s, o) => s + (Number(o.itemAmount || 0) * 0.03), 0);
    const totalNetEarnings  = orders.reduce((s, o) => s + Number(o.vendorEarnings || 0), 0);
    const totalDiscounts    = orders.reduce((s, o) => s + (o.discountApplied ? Number(o.discountAmount || 0) : 0), 0);
    const generatedDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });

    const orderRows = orders.map((o, idx) => {
      const date = new Date(o.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      });
      const commission = (Number(o.itemAmount || 0) * 0.03).toFixed(2);
      const itemNames = o.items.map(i => `${i.name} ×${i.quantity}${i.unit}`).join(", ");
      return `
        <tr class="order-row">
          <td class="cell-num">${idx + 1}</td>
          <td>
            <div class="order-id">${o.orderId || o._id.toString().slice(-8).toUpperCase()}</div>
            <div class="order-date">${date}</div>
          </td>
          <td class="cell-customer">${o.customerName || "—"}</td>
          <td class="cell-items">${itemNames}</td>
          <td class="cell-right">&#8377;${Number(o.itemAmount || 0).toFixed(2)}</td>
          <td class="cell-right cell-red">− &#8377;${commission}</td>
          <td class="cell-right" style="color:#7c3aed">${o.discountApplied && o.discountAmount > 0 ? `− &#8377;${Number(o.discountAmount).toFixed(2)}` : "—"}</td>
          <td class="cell-right cell-green">&#8377;${Number(o.vendorEarnings || 0).toFixed(2)}</td>
        </tr>`;

    }).join("");

    const vendorHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Earnings Statement · GramConnect</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --ivory:#f7f8fc;--parchment:#eef0f8;--border:#d4d9ee;
  --sapphire:#2a52b8;--ink:#111827;--ink2:#3d4a6b;--ink3:#8a93b2;
  --indigo2:#4f46e5;--amber:#b45309;--red:#b91c1c;--shadow:rgba(17,24,39,0.10);
}
html{font-size:14px}
body{font-family:'Outfit',sans-serif;background:var(--ivory);min-height:100vh;padding:32px 20px 60px;color:var(--ink)}

.actions{max-width:960px;margin:0 auto 20px;display:flex;justify-content:space-between;align-items:center}
.actions-brand{font-family:'Cormorant Garamond',serif;font-size:1rem;color:var(--ink2);letter-spacing:0.05em}
.actions-btns{display:flex;gap:10px}
.btn-print{display:inline-flex;align-items:center;gap:8px;padding:9px 22px;background:var(--ink);color:white;border:none;border-radius:8px;font-family:'Outfit',sans-serif;font-size:0.82rem;font-weight:500;cursor:pointer;transition:all 0.2s}
.btn-print:hover{background:var(--indigo2)}
.btn-close{display:inline-flex;align-items:center;gap:8px;padding:9px 18px;background:transparent;color:var(--ink2);border:1px solid var(--border);border-radius:8px;font-family:'Outfit',sans-serif;font-size:0.82rem;cursor:pointer;transition:all 0.2s}
.btn-close:hover{background:var(--red);color:white;border-color:var(--red)}

.statement{max-width:960px;margin:0 auto;background:white;border-radius:20px;border:1px solid var(--border);box-shadow:0 12px 48px var(--shadow);overflow:hidden}

.st-head{padding:36px 48px 32px;background:var(--ink);position:relative;overflow:hidden}
.st-head::after{content:'';position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--sapphire),var(--indigo2),#818cf8,var(--indigo2),var(--sapphire))}
.st-head::before{content:'';position:absolute;top:-60px;right:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(79,70,229,0.15) 0%,transparent 65%)}
.head-row{display:flex;justify-content:space-between;align-items:flex-start;gap:20px}
.brand-wrap{display:flex;align-items:center;gap:14px}
.brand-icon{width:48px;height:48px;background:linear-gradient(135deg,rgba(79,70,229,0.3),rgba(79,70,229,0.08));border:1px solid rgba(129,140,248,0.45);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px}
.brand-name{font-family:'Cormorant Garamond',serif;font-size:1.6rem;font-weight:700;color:white;line-height:1}
.brand-tagline{font-size:0.68rem;letter-spacing:0.18em;text-transform:uppercase;color:#a5b4fc;margin-top:4px}
.head-meta{text-align:right}
.meta-label{font-size:0.62rem;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:4px}
.meta-title{font-family:'Cormorant Garamond',serif;font-size:1.1rem;font-weight:600;color:#a5b4fc;letter-spacing:0.04em}
.meta-sub{font-size:0.75rem;color:rgba(255,255,255,0.4);margin-top:5px}

.summary-strip{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid var(--border)}
.strip-item{padding:18px 24px;border-right:1px solid var(--border)}
.strip-item:last-child{border-right:none}
.strip-label{font-size:0.62rem;letter-spacing:0.18em;text-transform:uppercase;color:var(--ink3);font-weight:600;margin-bottom:6px}
.strip-val{font-family:'Cormorant Garamond',serif;font-size:1.6rem;font-weight:700;color:var(--ink);line-height:1}
.strip-val.green{color:#16a34a}
.strip-val.red{color:var(--red)}
.strip-val.blue{color:var(--indigo2)}
.strip-sub{font-size:0.72rem;color:var(--ink3);margin-top:4px}

.vendor-row{padding:20px 48px;display:flex;gap:40px;background:var(--parchment);border-bottom:1px solid var(--border)}
.vendor-item{display:flex;flex-direction:column;gap:3px}
.vendor-label{font-size:0.62rem;letter-spacing:0.16em;text-transform:uppercase;color:var(--indigo2);font-weight:600}
.vendor-val{font-size:0.88rem;color:var(--ink2);font-weight:500}

.table-wrap{padding:28px 48px}
.sec-title{font-size:0.62rem;letter-spacing:0.22em;text-transform:uppercase;color:var(--indigo2);font-weight:600;display:flex;align-items:center;gap:10px;margin-bottom:16px}
.sec-title::after{content:'';flex:1;height:1px;background:var(--border)}
table{width:100%;border-collapse:collapse;font-size:0.82rem}
thead tr{border-bottom:2px solid var(--ink)}
th{font-size:0.62rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--ink3);font-weight:600;padding:8px 10px;text-align:left}
.cell-right{text-align:right}
.cell-num{text-align:center;width:36px;color:var(--ink3)}
.cell-customer{min-width:100px}
.cell-items{max-width:220px;color:var(--ink3);font-size:0.76rem}
.cell-green{font-weight:700;color:#16a34a}
.cell-red{color:var(--red)}
.order-row{border-bottom:1px solid var(--border);transition:background 0.15s}
.order-row:last-child{border-bottom:none}
.order-row:hover{background:var(--parchment)}
td{padding:12px 10px;vertical-align:middle}
.order-id{font-weight:600;color:var(--ink);font-size:0.82rem}
.order-date{font-size:0.72rem;color:var(--ink3);margin-top:2px}

.grand-section{padding:0 48px 36px}
.grand-box{display:flex;justify-content:flex-end}
.grand-inner{width:300px;border:1px solid var(--border);border-radius:14px;overflow:hidden}
.grand-row-item{display:flex;justify-content:space-between;padding:11px 20px;font-size:0.84rem;color:var(--ink2);border-bottom:1px solid var(--border)}
.grand-row-item:last-child{border-bottom:none}
.grand-row-item.red span:last-child{color:var(--red);font-weight:600}
.grand-final{background:var(--ink);padding:16px 20px;display:flex;justify-content:space-between;align-items:center}
.grand-final-lbl{font-size:0.68rem;letter-spacing:0.12em;text-transform:uppercase;color:#a5b4fc;font-weight:600}
.grand-final-val{font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:700;color:#c7d2fe}

.st-footer{margin:0 48px 36px;padding-top:20px;border-top:1px dashed var(--border);display:flex;justify-content:space-between;align-items:flex-end}
.footer-note{font-size:0.74rem;color:var(--ink3);line-height:1.75;max-width:300px}
.footer-note strong{display:block;color:var(--ink2);margin-bottom:3px;font-size:0.76rem}
.footer-sig{text-align:right}
.sig-name{font-family:'Cormorant Garamond',serif;font-size:1.15rem;color:var(--ink)}
.sig-sub{font-size:0.67rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink3);margin-top:3px}

@media print{
  @page{margin:0;size:A4 landscape}
  *{-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important}
  body{background:white !important;padding:10px}
  .actions{display:none !important}
  .statement{box-shadow:none !important;border:1px solid #ccc !important;border-radius:0 !important}
  .st-head{background:#111827 !important}
  .brand-name{color:#ffffff !important}
  .brand-tagline{color:#a5b4fc !important}
  .meta-label{color:rgba(255,255,255,0.6) !important}
  .meta-title{color:#a5b4fc !important}
  .meta-sub{color:rgba(255,255,255,0.5) !important}
  .grand-final{background:#111827 !important}
  .grand-final-lbl{color:#a5b4fc !important}
  .grand-final-val{color:#c7d2fe !important}
}
</style>
</head>
<body>

<div class="actions">
  <span class="actions-brand">&#127807; GramConnect · Vendor Earnings Statement</span>
  <div class="actions-btns">
    <button class="btn-print" onclick="window.print()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
        <rect x="6" y="14" width="12" height="8"/>
      </svg>
      Print / Save PDF
    </button>
    <button class="btn-close" onclick="window.close()">✕ Close</button>
  </div>
</div>

<div class="statement">

  <div class="st-head">
    <div class="head-row">
      <div class="brand-wrap">
        <div class="brand-icon">&#127807;</div>
        <div>
          <div class="brand-name">GramConnect</div>
          <div class="brand-tagline">Vendor Earnings Statement · All Delivered Orders</div>
        </div>
      </div>
      <div class="head-meta">
        <div class="meta-label">Statement For</div>
        <div class="meta-title">${orders[0]?.vendorName || "Vendor"}</div>
        <div class="meta-sub">Generated: ${generatedDate}</div>
      </div>
    </div>
  </div>

  <div class="summary-strip">
    <div class="strip-item">
      <div class="strip-label">Total Orders</div>
      <div class="strip-val">${orders.length}</div>
      <div class="strip-sub">Delivered successfully</div>
    </div>
    <div class="strip-item">
      <div class="strip-label">Total Sales</div>
      <div class="strip-val blue">&#8377;${totalItemAmount.toFixed(2)}</div>
      <div class="strip-sub">Gross item amount</div>
    </div>
    <div class="strip-item">
      <div class="strip-label">Commission Paid</div>
      <div class="strip-val red">&#8377;${totalCommission.toFixed(2)}</div>
      <div class="strip-sub">3% per order</div>
    </div>
    <div class="strip-item">
      <div class="strip-label">Net Earnings</div>
      <div class="strip-val green">&#8377;${totalNetEarnings.toFixed(2)}</div>
      <div class="strip-sub">After commission</div>
    </div>
    ${totalDiscounts > 0 ? `
    <div class="strip-item">
      <div class="strip-label">Discounts Given</div>
      <div class="strip-val" style="color:#7c3aed">&#8377;${totalDiscounts.toFixed(2)}</div>
      <div class="strip-sub">Customer savings from your store</div>
    </div>` : ""}
  </div>

  <div class="vendor-row">
    <div class="vendor-item">
      <span class="vendor-label">Vendor</span>
      <span class="vendor-val">${orders[0]?.vendorName || "—"}</span>
    </div>
    <div class="vendor-item">
      <span class="vendor-label">Total Customers Served</span>
      <span class="vendor-val">${new Set(orders.map(o => o.customerId?.toString())).size} unique customers</span>
    </div>
    <div class="vendor-item">
      <span class="vendor-label">Statement Period</span>
      <span class="vendor-val">${new Date(orders[orders.length-1].createdAt).toLocaleDateString("en-IN")} — ${new Date(orders[0].createdAt).toLocaleDateString("en-IN")}</span>
    </div>
    <div class="vendor-item">
      <span class="vendor-label">Generated On</span>
      <span class="vendor-val">${generatedDate}</span>
    </div>
  </div>

  <div class="table-wrap">
    <div class="sec-title">Delivered Orders Breakdown</div>
    <table>
      <thead>
        <tr>
          <th class="cell-num">#</th>
          <th>Order ID / Date</th>
          <th class="cell-customer">Customer</th>
          <th>Items</th>
          <th class="cell-right">Item Amount</th>
          <th class="cell-right">Commission (3%)</th>
          <th class="cell-right" style="color:#7c3aed">Discount Given</th>
          <th class="cell-right">Net Earnings</th>
        </tr>
      </thead>
      <tbody>
        ${orderRows}
      </tbody>
    </table>
  </div>

  <div class="grand-section">
    <div class="grand-box">
      <div class="grand-inner">
        <div class="grand-row-item">
          <span>Total Item Sales</span>
          <span>&#8377;${totalItemAmount.toFixed(2)}</span>
        </div>
        <div class="grand-row-item red">
          <span>Total Commission (3%)</span>
          <span>− &#8377;${totalCommission.toFixed(2)}</span>
        </div>
        ${totalDiscounts > 0 ? `
        <div class="grand-row-item" style="color:#7c3aed">
          <span>Total Discounts Given</span>
          <span>− &#8377;${totalDiscounts.toFixed(2)}</span>
        </div>` : ""}
        <div class="grand-final">
          <span class="grand-final-lbl">Net Earnings</span>
          <span class="grand-final-val">&#8377;${totalNetEarnings.toFixed(2)}</span>
        </div>
      </div>
    </div>
  </div>

  <div class="st-footer">
    <div class="footer-note">
      <strong>Official Earnings Statement</strong>
      This is a computer-generated statement of all delivered orders.
      For disputes, contact support@gramconnect.com
    </div>
    <div class="footer-sig">
      <div class="sig-name">GramConnect</div>
      <div class="sig-sub">Vendor Portal · ${generatedDate}</div>
    </div>
  </div>

</div>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    return res.send(vendorHTML);

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};


exports.calculateFees = async (req, res) => {
  try {
    const { vendorId, shippingCity } = req.body;
    const customer = await User.findById(req.user.id);
    const vendor = await User.findById(vendorId);

    if (!customer) return res.status(404).json({ msg: "Customer not found" });
    if (!vendor) return res.status(404).json({ msg: "Vendor not found" });

    // Use shippingCity from request if provided, else fall back to profile location
    const deliveryCity = shippingCity?.toLowerCase().trim() || customer.location?.toLowerCase().trim() || "";
    const customerCoords = CITY_COORDS[deliveryCity];
    
    // Get location from vendor's products instead of profile
    const vendorLocation = vendor?.location?.toLowerCase().trim() || "";
    const vendorCoords = CITY_COORDS[vendorLocation];

    if (!vendorCoords) return res.status(400).json({ msg: `Vendor city "${vendorLocation}" not found in our supported cities` });
    if (!customerCoords) return res.status(400).json({ msg: `Shipping city "${shippingCity || customer.location}" not found in our supported cities` });

    let distanceKm = getDistanceKm(
      vendorCoords.lat, vendorCoords.lng,
      customerCoords.lat, customerCoords.lng
    );

    if (distanceKm < 1) distanceKm = 1;

    if (distanceKm > 100) {
      return res.status(400).json({ 
        msg: `Vendor is too far (${distanceKm} km). Only orders within 100 km are allowed.` 
      });
    }

    const distanceCharge = parseFloat((distanceKm * 5).toFixed(2));
    const platformFee = 10;

    res.json({ distanceKm, distanceCharge, platformFee });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
