const mongoose = require("mongoose");

const mockInterviewSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
      default: "General Practice",
    },
    topic: {
      type: String,
      trim: true,
      default: "General",
    },
    duration: {
      type: Number,
      default: 30,
      min: 1,
    },
    status: {
      type: String,
      enum: ["Scheduled", "Completed", "Cancelled"],
      default: "Scheduled",
    },
    interviewDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    interviewTime: {
      type: String,
      trim: true,
      default: "10:00",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    feedback: {
      type: String,
      trim: true,
      default: "",
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    technicalScore: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    communicationScore: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    problemSolvingScore: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    interviewerName: {
      type: String,
      trim: true,
      default: "Self / Peer",
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
    strengths: {
      type: String,
      trim: true,
      default: "",
    },
    areasForImprovement: {
      type: String,
      trim: true,
      default: "",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "MockInterview",
  mockInterviewSchema
);
