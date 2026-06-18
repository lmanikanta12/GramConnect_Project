const Product = require("../models/Product");
const User = require("../models/User");

// ================= GET ALL PRODUCTS (public / customer) =================
exports.getAllProducts = async (req, res) => {
  try {
    const { category, search, vendorId } = req.query;
    const filter = { isActive: true, stock: "In Stock" };

    if (category && category !== "all") filter.category = category;
    if (vendorId) filter.vendorId = vendorId;
    if (search) filter.name = { $regex: search, $options: "i" };

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ================= GET VENDOR'S OWN PRODUCTS =================
exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ vendorId: req.user.id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ================= ADD PRODUCT =================
exports.addProduct = async (req, res) => {
  try {
    const vendor = await User.findById(req.user.id);
    if (!vendor) return res.status(404).json({ msg: "Vendor not found" });

    const { name, price, quantity, unit, category, description, location, stock } = req.body;
    const image = req.file ? req.file.filename : null;

    const product = new Product({
      vendorId: req.user.id,
      vendorName: vendor.name,
      name,
      price: Number(price),
      quantity: Number(quantity),
      unit: unit || "kg",
      category: category || "vegetables",
      description,
      vendorLocation: vendor.location,
      location: vendor.location,
      image,
      stock: stock || "In Stock",
    });

    await product.save();
    res.status(201).json({ msg: "Product added successfully", product });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ================= UPDATE PRODUCT =================
// ================= UPDATE PRODUCT =================
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, vendorId: req.user.id });
    if (!product) return res.status(404).json({ msg: "Product not found" });

    const { name, price, quantity, unit, category, description, stock } = req.body;

    if (name) product.name = name;
    if (price !== undefined) product.price = Number(price);
    if (quantity !== undefined) product.quantity = Number(quantity);
    if (unit) product.unit = unit;
    if (category) product.category = category;
    if (description !== undefined) product.description = description;
    if (stock) product.stock = stock;
    if (req.file) product.image = req.file.filename;

    // ✅ Always sync vendor's registered location
    const vendor = await User.findById(req.user.id);
    if (vendor?.location) {
      product.location = vendor.location;
      product.vendorLocation = vendor.location;
    }

    await product.save();
    res.json({ msg: "Product updated", product });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ================= DELETE PRODUCT =================
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, vendorId: req.user.id });
    if (!product) return res.status(404).json({ msg: "Product not found" });
    res.json({ msg: "Product deleted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ================= TOGGLE STOCK =================
exports.toggleStock = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, vendorId: req.user.id });
    if (!product) return res.status(404).json({ msg: "Product not found" });

    product.stock = product.stock === "In Stock" ? "Out of Stock" : "In Stock";
    await product.save();
    res.json({ msg: `Stock updated to ${product.stock}`, product });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// ================= GET SINGLE PRODUCT BY ID =================
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};