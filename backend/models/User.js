
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    college: {
      type: String,
      trim: true,
      maxlength: 160,
      default: "",
    },

    department: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },

    academicYear: {
      type: String,
      trim: true,
      maxlength: 60,
      default: "",
    },

    graduationYear: {
      type: Number,
      min: 2000,
      max: 2100,
      default: null,
    },

    skills: {
      type: [{ type: String, trim: true, maxlength: 50 }],
      default: [],
    },

    interests: {
      type: [{ type: String, trim: true, maxlength: 80 }],
      default: [],
    },

    careerObjective: {
      type: String,
      trim: true,
      maxlength: 600,
      default: "",
    },

    profileImage: {
      type: String,
      trim: true,
      maxlength: 2048,
      default: "",
    },

    password: {
      type: String,
      required: function () {
        return this.authProvider !== "google";
      },
      select: false,
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
