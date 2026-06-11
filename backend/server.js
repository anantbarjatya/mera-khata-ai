const adminRoutes = require("./routes/admin");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const { initDB } = require("./db/database");
const inventoryRoutes = require("./routes/inventory");
const transactionRoutes = require("./routes/transactions");
const customerRoutes = require("./routes/customers");
const sarvamRoutes = require("./routes/sarvam");

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://mera-khata-ai.vercel.app"
    ]
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (invoice images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use("/api/inventory", inventoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/sarvam", sarvamRoutes);   // All Sarvam AI proxy routes
app.use("/api/admin", adminRoutes);

// Health check
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", mock: process.env.USE_MOCK_APIS === "true" })

);

// ── Boot ───────────────────────────────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => {
 console.log(`✅ Mera Khata backend running on http://localhost:${PORT}`);
    console.log(`🔧 Mock APIs: ${process.env.USE_MOCK_APIS === "true" ? "ON" : "OFF"}`);
  });
}).catch(err => {
  console.error("Failed to init DB:", err);
  process.exit(1);
});
console.log("KEY LOADED:", !!process.env.SARVAM_API_KEY);