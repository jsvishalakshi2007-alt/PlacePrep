
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { OAuth2Client } = require("google-auth-library");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET must be configured with at least 32 characters."
    );
  }

  return secret;
};

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "name email authProvider createdAt college department academicYear graduationYear skills interests careerObjective profileImage"
    );

    if (!user) {
      return res.status(404).json({ message: "Account not found." });
    }

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        authProvider: user.authProvider,
        createdAt: user.createdAt,
        college: user.college || "",
        department: user.department || "",
        academicYear: user.academicYear || "",
        graduationYear: user.graduationYear || null,
        skills: user.skills || [],
        interests: user.interests || [],
        careerObjective: user.careerObjective || "",
        profileImage: user.profileImage || "",
      },
    });
  } catch (error) {
    console.error("Profile load error:", error.message);
    return res.status(500).json({ message: "Unable to load your profile." });
  }
});

router.patch("/profile", authMiddleware, async (req, res) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ message: "Profile details must be an object." });
  }

  const allowedFields = new Set([
    "name",
    "email",
    "college",
    "department",
    "academicYear",
    "graduationYear",
    "skills",
    "interests",
    "careerObjective",
    "profileImage",
  ]);
  const requestedFields = Object.keys(req.body);
  const unsupportedField = requestedFields.find(
    (field) => !allowedFields.has(field)
  );

  if (unsupportedField) {
    return res.status(400).json({
      message: `${unsupportedField} cannot be updated here.`,
    });
  }

  if (requestedFields.length === 0) {
    return res.status(400).json({
      message: "Enter at least one profile detail to update.",
    });
  }

  const updates = {};
  const stringLimits = {
    name: 100,
    email: 254,
    college: 160,
    department: 120,
    academicYear: 60,
    careerObjective: 600,
    profileImage: 2048,
  };

  for (const [field, maxLength] of Object.entries(stringLimits)) {
    if (req.body[field] === undefined) continue;

    if (
      typeof req.body[field] !== "string" ||
      req.body[field].trim().length > maxLength ||
      (["name", "email"].includes(field) && !req.body[field].trim())
    ) {
      return res.status(400).json({
        message: `${field === "name" ? "Name" : field} must be ${
          field === "name" ? "between 1 and" : "no more than"
        } ${maxLength} characters.`,
      });
    }

    updates[field] =
      field === "email"
        ? req.body[field].trim().toLowerCase()
        : req.body[field].trim();
  }

  if (
    updates.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)
  ) {
    return res.status(400).json({
      message: "Enter a valid email address.",
    });
  }

  if (updates.profileImage) {
    try {
      const imageUrl = new URL(updates.profileImage);
      if (imageUrl.protocol !== "https:") {
        throw new Error("Unsupported image URL protocol.");
      }
    } catch {
      return res.status(400).json({
        message: "Profile image must be a valid HTTPS URL.",
      });
    }
  }

  if (req.body.graduationYear !== undefined) {
    const graduationYear = req.body.graduationYear;
    if (
      graduationYear !== null &&
      graduationYear !== "" &&
      (!Number.isInteger(Number(graduationYear)) ||
        Number(graduationYear) < 2000 ||
        Number(graduationYear) > 2100)
    ) {
      return res.status(400).json({
        message: "Graduation year must be between 2000 and 2100.",
      });
    }
    updates.graduationYear =
      graduationYear === null || graduationYear === ""
        ? null
        : Number(graduationYear);
  }

  for (const field of ["skills", "interests"]) {
    if (req.body[field] === undefined) continue;
    if (
      !Array.isArray(req.body[field]) ||
      req.body[field].length > 30 ||
      req.body[field].some(
        (value) =>
          typeof value !== "string" ||
          !value.trim() ||
          value.trim().length > (field === "skills" ? 50 : 80)
      )
    ) {
      return res.status(400).json({
        message: `${field} must contain up to 30 non-empty values.`,
      });
    }
    updates[field] = [...new Set(req.body[field].map((value) => value.trim()))];
  }

  try {
    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select(
      "name email authProvider createdAt college department academicYear graduationYear skills interests careerObjective profileImage"
    );

    if (!user) {
      return res.status(404).json({ message: "Account not found." });
    }

    return res.json({
      message: "Profile updated.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        authProvider: user.authProvider,
        createdAt: user.createdAt,
        college: user.college || "",
        department: user.department || "",
        academicYear: user.academicYear || "",
        graduationYear: user.graduationYear || null,
        skills: user.skills || [],
        interests: user.interests || [],
        careerObjective: user.careerObjective || "",
        profileImage: user.profileImage || "",
      },
    });
  } catch (error) {
    console.error("Profile update error:", error.message);
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(409).json({
        message: "An account with this email address already exists.",
      });
    }
    return res.status(500).json({ message: "Unable to update your profile." });
  }
});

// Register using email and password
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 128
    ) {
      return res.status(400).json({
        message:
          "Enter your name, a valid email, and a password between 8 and 128 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists. Please log in.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      authProvider: "local",
    });

    return res.status(201).json({
      message: "Registration successful.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        authProvider: user.authProvider,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      message: "Unable to register. Please try again.",
    });
  }
});

// Set a PlacePrep password for an authenticated Google account
router.post("/set-password", authMiddleware, async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Please log in again.",
      });
    }

    if (
      typeof password !== "string" ||
      typeof confirmPassword !== "string"
    ) {
      return res.status(400).json({
        message: "Please enter and confirm your password.",
      });
    }

    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({
        message: "Password must be between 8 and 128 characters.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match.",
      });
    }

    const user = await User.findById(userId).select("+password");

    if (!user) {
      return res.status(404).json({
        message: "Account not found.",
      });
    }

    if (user.authProvider !== "google") {
      return res.status(403).json({
        message: "This feature is only for Google-registered accounts.",
      });
    }

    if (user.password) {
      return res.status(409).json({
        message: "A PlacePrep password has already been set.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Atomic update prevents a second request from overwriting the password.
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: userId,
        authProvider: "google",
        $or: [
          { password: { $exists: false } },
          { password: null },
          { password: "" },
        ],
      },
      {
        $set: { password: hashedPassword },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("name email authProvider");

    if (!updatedUser) {
      return res.status(409).json({
        message: "A password may already have been set. Please log in.",
      });
    }

    return res.status(200).json({
      message:
        "PlacePrep password set successfully. You can now use either login method.",
    });
  } catch (error) {
    console.error("Set password error:", error.message);

    return res.status(500).json({
      message: "Unable to set your password right now.",
    });
  }
});

// Login using email and PlacePrep password
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message: "Enter your email and password.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Google users without a PlacePrep password must use Google sign-in first.
    // This check prevents bcrypt.compare() from receiving undefined.
    if (!user.password) {
      return res.status(401).json({
        message:
          "No PlacePrep password is set for this account. Sign in with Google, then set a PlacePrep password.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      getJwtSecret(),
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        authProvider: user.authProvider,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Unable to log in. Please try again.",
    });
  }
});

// Login or register using Google
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!credential) {
      return res.status(400).json({
        message: "Google credential is missing.",
      });
    }

    if (!clientId) {
      return res.status(500).json({
        message: "Google authentication is not configured on the server.",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });

    const payload = ticket.getPayload();

    if (
      !payload ||
      !payload.email ||
      !payload.sub ||
      payload.email_verified !== true
    ) {
      return res.status(401).json({
        message: "Unable to verify your Google account.",
      });
    }

    const email = payload.email.trim().toLowerCase();

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: payload.name || email.split("@")[0],
        email,
        authProvider: "google",
      });
    }

    // Never change an existing account's password or authProvider here.
    const token = jwt.sign(
      { userId: user._id.toString() },
      getJwtSecret(),
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Google sign-in successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        authProvider: user.authProvider,
      },
    });
  } catch (error) {
    console.error("Google authentication error:", error.message);

    return res.status(401).json({
      message: "Google sign-in failed. Please try again.",
    });
  }
});

module.exports = router;
