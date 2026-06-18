const express = require("express");
const router = express.Router();
const pc = require("../controllers/productController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Public — customers can browse
router.get("/", pc.getAllProducts);

// Vendor — protected
router.get("/mine", protect, pc.getMyProducts);

// Public — get single product by ID
router.get("/:id", pc.getProductById);

router.post("/", protect, upload.single("image"), pc.addProduct);
router.put("/:id", protect, upload.single("image"), pc.updateProduct);
router.delete("/:id", protect, pc.deleteProduct);
router.patch("/:id/stock", protect, pc.toggleStock);

module.exports = router;
