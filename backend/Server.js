import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import financeRoutes from "./routes/financeRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

// Load environment variables
dotenv.config();
console.log("🔄 Loading environment variables...");

// Connect to MongoDB
console.log("Connecting to MongoDB...");
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
console.log("Setting up routes...");
app.use("/api/auth", authRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/ai", aiRoutes);
console.log("Routes setup complete");

// Add a test route to verify server is running
app.get("/api/health", (req, res) => {
  console.log("Health check endpoint hit");
  res.json({ status: "ok" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ message: "Server error", error: err.message });
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
