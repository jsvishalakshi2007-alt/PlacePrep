const mongoose = require("mongoose");

const resumeVersionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Resume title is required"],
      trim: true,
      maxlength: 120,
    },
    version: {
      type: String,
      trim: true,
      default: "1.0",
      maxlength: 20,
    },
    targetRole: {
      type: String,
      trim: true,
      default: "Software Engineer",
      maxlength: 120,
    },
    fileUrl: {
      type: String,
      trim: true,
      default: "",
    },
    cloudinaryPublicId: {
  type: String,
  default: "",
  select: false,
},
    fileName: {
      type: String,
      trim: true,
      default: "",
    },
    originalName: {
      type: String,
      trim: true,
      default: "",
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    fileType: {
      type: String,
      trim: true,
      default: "",
    },
    filePath: {
      type: String,
      trim: true,
      default: "",
    },
    changelog: {
      type: String,
      trim: true,
      default: "",
    },
    isPrimary: {
      type: Boolean,
      default: false,
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

module.exports = mongoose.model("ResumeVersion", resumeVersionSchema);
