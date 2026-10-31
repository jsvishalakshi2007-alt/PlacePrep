
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const mongoose = require("mongoose");

const StudyFile = require("../models/StudyFile");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const allowedTypes = new Map([
  [".pdf", "application/pdf"],
  [".doc", "application/msword"],
  [
    ".docx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  [".txt", "text/plain"],
]);

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDir);
  },

  filename: (req, file, callback) => {
    callback(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase());
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const expectedMime = allowedTypes.get(ext);

    if (!expectedMime || file.mimetype !== expectedMime) {
      return callback(
        new Error("Only PDF, DOC, DOCX, and TXT files are allowed.")
      );
    }

    callback(null, true);
  },
});

router.use(authMiddleware);

// Upload one study file
router.post("/", (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        message: error.message || "File upload failed.",
      });
    }

    next();
  });
}, async (req, res) => {
  let uploadedPath;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "Select a file to upload." });
    }

    uploadedPath = req.file.path;

    const savedFile = await StudyFile.create({
      originalName: path.basename(req.file.originalname).slice(0, 255),
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      userId: req.user.id,
    });

    res.status(201).json(savedFile);
  } catch (error) {
    if (uploadedPath) {
      await fs.promises.unlink(uploadedPath).catch(() => {});
    }

    res.status(500).json({ message: "Could not save the uploaded file." });
  }
});

// List the logged-in user's files
router.get("/", async (req, res) => {
  try {
    const files = await StudyFile.find({ userId: req.user.id })
      .select("-storedName")
      .sort({ createdAt: -1 });

    res.json(files);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch study files." });
  }
});

// Download a file owned by the logged-in user
router.get("/:id/download", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid file ID." });
    }

    const file = await StudyFile.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!file) {
      return res.status(404).json({ message: "Study file not found." });
    }

    const filePath = path.join(uploadDir, file.storedName);

    return res.download(filePath, file.originalName, (error) => {
      if (error && !res.headersSent) {
        res.status(404).json({ message: "File is unavailable." });
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Could not download the file." });
  }
});

// Delete a file owned by the logged-in user
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid file ID." });
    }

    const file = await StudyFile.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!file) {
      return res.status(404).json({ message: "Study file not found." });
    }

    await fs.promises
      .unlink(path.join(uploadDir, file.storedName))
      .catch(() => {});

    res.json({ message: "Study file deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Could not delete the study file." });
  }
});

module.exports = router;
