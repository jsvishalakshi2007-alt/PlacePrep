const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Skill name is required"],
      trim: true,
      maxlength: 80,
    },
    category: {
      type: String,
      enum: [
        "Programming",
        "Technical",
        "Core Subjects",
        "Tools",
        "Soft Skills",
        "Language",
        "Frontend",
        "Backend",
        "Database",
        "Cloud & DevOps",
        "CS Fundamentals",
        "Other",
      ],
      default: "Programming",
    },
    proficiency: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
      default: "Intermediate",
    },
    projectsUsedIn: {
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

module.exports = mongoose.model("Skill", skillSchema);
