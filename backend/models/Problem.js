const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    platform: {
      type: String,
      enum: ["LeetCode", "GeeksforGeeks", "CodeChef", "HackerRank", "Other"],
      default: "LeetCode",
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
    },
    topic: {
      type: String,
      trim: true,
      default: "General",
    },
    solved: {
      type: Boolean,
      default: true,
    },
    solvedDate: {
      type: Date,
      default: Date.now,
    },
    url: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    revisionRequired: {
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

module.exports = mongoose.model("Problem", problemSchema);
