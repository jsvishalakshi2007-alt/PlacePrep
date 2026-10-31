const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const router = express.Router();
const ResumeVersion = require("../models/ResumeVersion");
const authMiddleware = require("../middleware/authMiddleware");

// Configure Multer for local disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, "..", "uploads", "resumes");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `resume-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = [".pdf", ".docx", ".doc"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF and Word documents (.pdf, .docx, .doc) are supported."), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter,
});

const handleUpload = (req, res, next) => {
  upload.single("resumeFile")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "File is too large. Maximum size allowed is 10MB." });
      }
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

router.use(authMiddleware);

// Helper to remove a file from disk safely
const safelyUnlinkFile = (filePath) => {
  if (!filePath) return;
  try {
    const resolvedPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(__dirname, "..", filePath);
    if (fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
    }
  } catch (err) {
    console.error("Failed to delete resume file from disk:", err.message);
  }
};

// GET /: List resume versions for current user
router.get("/", async (req, res) => {
  try {
    const resumes = await ResumeVersion.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(resumes);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch resume versions", error: error.message });
  }
});

// POST /upload: Upload new resume file
router.post("/upload", handleUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No resume file was uploaded." });
    }

    const { title, version, targetRole, changelog, isPrimary } = req.body;
    const shouldBePrimary = isPrimary === "true" || isPrimary === true;

    if (shouldBePrimary) {
      await ResumeVersion.updateMany({ userId: req.user.id }, { isPrimary: false });
    } else {
      // If user has no existing resumes, make this one primary
      const existingCount = await ResumeVersion.countDocuments({ userId: req.user.id });
      if (existingCount === 0) {
        req.body.isPrimary = true;
      }
    }

    const relativePath = path.join("uploads", "resumes", req.file.filename).replace(/\\/g, "/");
    const resumeTitle = title && title.trim()
      ? title.trim()
      : path.parse(req.file.originalname).name;

    const resume = await ResumeVersion.create({
      title: resumeTitle,
      version: version ? version.trim() : "1.0",
      targetRole: targetRole ? targetRole.trim() : "Software Engineer",
      fileUrl: `/${relativePath}`,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype || "application/pdf",
      filePath: req.file.path,
      changelog: changelog ? changelog.trim() : "Initial upload",
      isPrimary: shouldBePrimary || Boolean(req.body.isPrimary),
      userId: req.user.id,
    });

    res.status(201).json(resume);
  } catch (error) {
    if (req.file && req.file.path) {
      safelyUnlinkFile(req.file.path);
    }
    res.status(400).json({ message: error.message || "Failed to upload resume" });
  }
});

// POST /:id/replace: Replace the resume file for an existing version
router.post("/:id/replace", handleUpload, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      if (req.file && req.file.path) safelyUnlinkFile(req.file.path);
      return res.status(400).json({ message: "Invalid resume ID." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No replacement resume file was provided." });
    }

    const existingResume = await ResumeVersion.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!existingResume) {
      if (req.file && req.file.path) safelyUnlinkFile(req.file.path);
      return res.status(404).json({ message: "Resume version not found or unauthorized" });
    }

    // Safely remove the old file from disk
    if (existingResume.filePath) {
      safelyUnlinkFile(existingResume.filePath);
    } else if (existingResume.fileName) {
      safelyUnlinkFile(path.join(__dirname, "..", "uploads", "resumes", existingResume.fileName));
    }

    const relativePath = path.join("uploads", "resumes", req.file.filename).replace(/\\/g, "/");

    existingResume.fileName = req.file.filename;
    existingResume.originalName = req.file.originalname;
    existingResume.fileSize = req.file.size;
    existingResume.fileType = req.file.mimetype || "application/pdf";
    existingResume.filePath = req.file.path;
    existingResume.fileUrl = `/${relativePath}`;

    if (req.body.version && req.body.version.trim()) {
      existingResume.version = req.body.version.trim();
    }
    if (req.body.changelog && req.body.changelog.trim()) {
      existingResume.changelog = req.body.changelog.trim();
    }
    if (req.body.title && req.body.title.trim()) {
      existingResume.title = req.body.title.trim();
    }

    await existingResume.save();

    res.json(existingResume);
  } catch (error) {
    if (req.file && req.file.path) safelyUnlinkFile(req.file.path);
    res.status(400).json({ message: error.message || "Failed to replace resume file" });
  }
});

// GET /:id/download: Download resume file with original filename
router.get("/:id/download", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid resume ID." });
    }

    const resume = await ResumeVersion.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!resume) {
      return res.status(404).json({ message: "Resume version not found or unauthorized" });
    }

    let filePathOnDisk = resume.filePath;
    if (!filePathOnDisk && resume.fileName) {
      filePathOnDisk = path.join(__dirname, "..", "uploads", "resumes", resume.fileName);
    }

    if (!filePathOnDisk || !fs.existsSync(filePathOnDisk)) {
      return res.status(404).json({ message: "Resume file not found on disk." });
    }

    const downloadName = resume.originalName || `${resume.title || "resume"}.pdf`;
    res.download(filePathOnDisk, downloadName);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to download resume" });
  }
});

// GET /:id/preview: Inline preview for in-browser viewing
router.get("/:id/preview", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid resume ID." });
    }

    const resume = await ResumeVersion.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!resume) {
      return res.status(404).json({ message: "Resume version not found or unauthorized" });
    }

    let filePathOnDisk = resume.filePath;
    if (!filePathOnDisk && resume.fileName) {
      filePathOnDisk = path.join(__dirname, "..", "uploads", "resumes", resume.fileName);
    }

    if (!filePathOnDisk || !fs.existsSync(filePathOnDisk)) {
      return res.status(404).json({ message: "Resume file not found on disk." });
    }

    res.setHeader("Content-Type", resume.fileType || "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${resume.originalName || resume.fileName || "resume.pdf"}"`
    );

    const stream = fs.createReadStream(filePathOnDisk);
    stream.pipe(res);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to preview resume" });
  }
});

// POST /: Add a resume version (JSON metadata fallback)
router.post("/", async (req, res) => {
  try {
    const { title, version, targetRole, fileUrl, changelog, isPrimary } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Resume title is required." });
    }

    if (isPrimary) {
      await ResumeVersion.updateMany({ userId: req.user.id }, { isPrimary: false });
    }

    const resume = await ResumeVersion.create({
      title: title.trim(),
      version: version ? version.trim() : "1.0",
      targetRole: targetRole ? targetRole.trim() : "Software Engineer",
      fileUrl: fileUrl ? fileUrl.trim() : "",
      changelog: changelog ? changelog.trim() : "",
      isPrimary: Boolean(isPrimary),
      userId: req.user.id,
    });

    res.status(201).json(resume);
  } catch (error) {
    res.status(400).json({ message: error.message || "Failed to add resume version" });
  }
});

// PATCH /:id: Update a resume version metadata
router.patch("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid resume ID." });
    }

    if (req.body.isPrimary) {
      await ResumeVersion.updateMany({ userId: req.user.id }, { isPrimary: false });
    }

    const allowedFields = ["title", "version", "targetRole", "fileUrl", "changelog", "isPrimary"];
    const updates = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    const resume = await ResumeVersion.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updates },
      { returnDocument: "after", runValidators: true }
    );

    if (!resume) {
      return res.status(404).json({ message: "Resume version not found or unauthorized" });
    }

    res.json(resume);
  } catch (error) {
    res.status(400).json({ message: error.message || "Failed to update resume version" });
  }
});

// DELETE /:id: Delete a resume version and remove file from disk
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid resume ID." });
    }

    const resume = await ResumeVersion.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!resume) {
      return res.status(404).json({ message: "Resume version not found or unauthorized" });
    }

    // Unlink the file from disk
    if (resume.filePath) {
      safelyUnlinkFile(resume.filePath);
    } else if (resume.fileName) {
      safelyUnlinkFile(path.join(__dirname, "..", "uploads", "resumes", resume.fileName));
    }

    res.json({ message: "Resume version removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to delete resume version" });
  }
});

module.exports = router;
