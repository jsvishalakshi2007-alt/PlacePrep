const mongoose = require("mongoose");

const targetCompanySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: 120,
    },
    role: {
      type: String,
      trim: true,
      default: "Software Development Engineer",
      maxlength: 120,
    },
    status: {
      type: String,
      enum: [
        "Targeting",
        "Applied",
        "Shortlisted",
        "Online Assessment",
        "Technical Round 1",
        "Technical Round 2",
        "HR Round",
        "Interviewing",
        "Offered",
        "Rejected",
      ],
      default: "Targeting",
    },
    priority: {
      type: String,
      enum: ["Dream", "Target", "Safety"],
      default: "Target",
    },
    package: {
      type: String,
      trim: true,
      default: "",
      maxlength: 60,
    },
    location: {
      type: String,
      trim: true,
      default: "",
      maxlength: 120,
    },
    website: {
      type: String,
      trim: true,
      default: "",
    },
    requiredSkills: {
      type: [{ type: String, trim: true }],
      default: [],
    },
    expectedRounds: {
      type: [
        {
          name: { type: String, trim: true },
          roundType: { type: String, trim: true, default: "Technical" },
          description: { type: String, trim: true, default: "" },
          completed: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
    dsaTopics: {
      type: [{ type: String, trim: true }],
      default: [],
    },
    aptitudeNotes: {
      type: String,
      trim: true,
      default: "",
    },
    experienceNotes: {
      type: String,
      trim: true,
      default: "",
    },
    checklist: {
      type: [
        {
          task: { type: String, trim: true },
          completed: { type: Boolean, default: false },
        },
      ],
      default: [],
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

module.exports = mongoose.model("TargetCompany", targetCompanySchema);
