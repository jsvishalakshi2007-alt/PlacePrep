const mongoose = require("mongoose");

const deadlineSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      default: "",
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "Application",
        "Online Test",
        "Interview",
        "Assignment",
        "Other",
      ],
      default: "Other",
    },
    dueDate: {
      type: Date,
      required: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    completed: {
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

module.exports = mongoose.model("Deadline", deadlineSchema);
