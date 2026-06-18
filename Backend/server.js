const dotenv = require("dotenv");
dotenv.config(); // ✅ MOVED TO TOP - before all other imports

const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const chatRoute = require("./routes/chat");

// Connect DB
connectDB();

const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= STATIC FILES =================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= ROUTES =================
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api", chatRoute);

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.send("🌾 GramConnect API is running...");
});

// ================= ERROR HANDLING =================
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ msg: err.message || "Server Error" });
});

// ================= SERVER =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`🚀 GramConnect Server running on port ${PORT}`)
);