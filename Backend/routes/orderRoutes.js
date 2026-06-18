const express = require("express");
const router = express.Router();
const oc = require("../controllers/orderController");
const { protect } = require("../middleware/auth");

// ===== PROFILE =====
router.get("/profile", protect, oc.getProfile);

// ===== CUSTOMER =====
router.post("/", protect, oc.placeOrder);
router.get("/my", protect, oc.getMyOrders);
router.patch("/:id/cancel", protect, oc.cancelOrder);
router.patch("/:id/rate", protect, oc.rateOrder);

// ===== VENDOR =====
router.get("/vendor", protect, oc.getVendorOrders);
router.patch("/:id/vendor-update", protect, oc.vendorUpdateOrder);
router.patch("/:id/assign-delivery", protect, oc.assignDelivery);
router.get("/delivery-agents", protect, oc.getDeliveryAgents);

// ===== DELIVERY =====
router.get("/delivery", protect, oc.getDeliveryOrders);
router.patch("/:id/delivery-update", protect, oc.deliveryUpdateOrder);
router.get("/earnings/summary", protect, oc.getEarnings);

// ===== ADMIN =====
router.get("/all", protect, oc.getAllOrders);
router.get("/platform-revenue", protect, oc.getPlatformRevenue);

// ===== COMBINED STATEMENTS — must be BEFORE /:id/invoice =====
router.get("/invoice/all-delivered", protect, oc.generateCustomerStatement);
router.get("/invoice/vendor-statement", protect, oc.generateVendorStatement);

router.post("/calculate-fees", protect, oc.calculateFees);

// ===== SINGLE ORDER INVOICE =====
router.get("/:id/invoice", protect, oc.generateInvoice);

module.exports = router;