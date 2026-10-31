const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Existing routes
const taskRoutes = require("./routes/taskRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const problemRoutes = require("./routes/problemRoutes");
const mockInterviewRoutes = require("./routes/mockInterviewRoutes");
const deadlineRoutes = require("./routes/deadlineRoutes");
const authRoutes = require("./routes/authRoutes");
const noteRoutes = require("./routes/noteRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const studyFileRoutes = require("./routes/studyFileRoutes");
const summaryRoutes = require("./routes/summaryRoutes");
const companyRoutes = require("./routes/companyRoutes");
const skillRoutes = require("./routes/skillRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const timelineRoutes = require("./routes/timelineRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "uploads");
const resumeUploadDir = path.join(uploadDir, "resumes");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(resumeUploadDir)) {
  fs.mkdirSync(resumeUploadDir, { recursive: true });
}

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      return callback(null, true); // Permissive for preview/testing
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use("/uploads", express.static(uploadDir));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/mock-interviews", mockInterviewRoutes);
app.use("/api/deadlines", deadlineRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/study-files", studyFileRoutes);
app.use("/api/summary", summaryRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/timeline", timelineRoutes);

// Root health check route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to PlacePrep API!",
    status: "Backend is running successfully",
    timestamp: new Date().toISOString(),
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Internal server error.",
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
});

// Connect to MongoDB and start the server
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("MongoDB connected successfully!");

      app.listen(PORT, () => {
        console.log(`PlacePrep backend running at http://localhost:${PORT}`);
      });
    })
    .catch((error) => {
      console.error("MongoDB connection failed:", error.message);
      process.exit(1);
    });
} else {
  console.warn("MONGO_URI not specified in environment.");
}

module.exports = app;
