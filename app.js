require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Import routes
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const courseRoutes = require("./routes/courseRoutes");
const progressRoutes = require("./routes/progressRoutes");
const studentRoutes = require("./routes/studentRoutes");

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api", progressRoutes); // Progress routes use /api prefix
app.use("/api/student", studentRoutes);



// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

module.exports = app;
