
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

// Import routes
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

// CORS
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        process.env.NODE_ENV !== "production"
      ) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Root and API health check
app.get(["/", "/api"], (req, res) => {
  res.json({
    message: "Welcome to PlacePrep API!",
    status: "Backend is running successfully",
    timestamp: new Date().toISOString(),
  });
});

// MongoDB connection cache for serverless requests
let mongoConnectionPromise;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI environment variable is missing");
  }

  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose
      .connect(process.env.MONGO_URI)
      .catch((error) => {
        mongoConnectionPromise = null;
        throw error;
      });
  }

  await mongoConnectionPromise;
}

// Connect before handling API requests
app.use("/api", async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message || error);
    if (!process.env.MONGO_URI) {
      return res.status(503).json({
        message: "Database connection failed: MONGO_URI is missing from environment variables. Please add MONGO_URI in your Vercel Project Settings.",
      });
    }
    next(error);
  }
});

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

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);

  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development"
      ? { stack: err.stack }
      : {}),
  });
});

// Local development only. Vercel imports the app without listening on a port.
if (require.main === module) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`PlacePrep backend running on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error("MongoDB connection failed:", error);
      process.exit(1);
    });
}

module.exports = app;
