const express = require("express");
const router = express.Router();
const auth = require("../controllers/authController");
const upload = require("../middleware/upload");
const { protect } = require("../middleware/auth");

// ================= REGISTER =================
router.post(
  "/register",
  upload.fields([
    { name: "vendorId", maxCount: 1 },
    { name: "deliveryId", maxCount: 1 },
    { name: "license", maxCount: 1 },
  ]),
  auth.register
);

// ================= LOGIN =================
router.post("/login", auth.login);

// ================= FORGOT PASSWORD =================
router.post("/send-otp", auth.sendOtp);
router.post("/reset-password", auth.resetPassword);

// ================= PROFILE =================
router.get("/profile", protect, auth.getProfile);


// ================= ADMIN ROUTES =================
router.get("/users", auth.getUsers);
router.put("/status/:id", auth.updateStatus);

module.exports = router;
