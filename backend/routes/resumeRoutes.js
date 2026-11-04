
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
const crypto = require("crypto");

const router = express.Router();

const ResumeVersion = require("../models/ResumeVersion");
const authMiddleware = require("../middleware/authMiddleware");
const cloudinary = require("../config/cloudinary");

router.use(authMiddleware);

// Multer stores uploads temporarily in memory.
// Cloudinary stores the permanent file.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      return cb(
        new Error("Only PDF, DOC and DOCX files are supported.")
      );
    }

    cb(null, true);
  },
});

const handleUpload = (req, res, next) => {
  upload.single("resumeFile")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        message:
          err.code === "LIMIT_FILE_SIZE"
            ? "File is too large. Maximum size is 10MB."
            : err.message,
      });
    }
    next();
  });
};

// Upload a private resume to Cloudinary.
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const publicId = `resume-${crypto.randomUUID()}${ext}`;

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        type: "authenticated",
        public_id: publicId,
        asset_folder: "placeprep/resumes",
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(file.buffer);
  });
};

// Delete a Cloudinary asset safely.
const deleteCloudinaryFile = async (publicId) => {
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw",
      type: "authenticated",
    });
  } catch (error) {
    console.error("Cloudinary deletion failed:", error.message);
  }
};

// Generate a short-lived authenticated download/preview URL.
const getPrivateUrl = (resume, attachment = true) => {
  if (!resume.cloudinaryPublicId) return null;

  const ext = path.extname(resume.originalName || "").replace(".", "");

  return cloudinary.utils.private_download_url(
    resume.cloudinaryPublicId,
    ext,
    {
      resource_type: "raw",
      type: "authenticated",
      expires_at: Math.floor(Date.now() / 1000) + 300,
      attachment,
    }
  );
};

// GET /api/resumes
router.get("/", async (req, res) => {
  try {
    const resumes = await ResumeVersion.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    const result = resumes.map((resume) => {
      const item = resume.toObject();

      // Do not expose permanent Cloudinary identifiers.
      delete item.cloudinaryPublicId;

      return item;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch resume versions",
      error: error.message,
    });
  }
});

// POST /api/resumes/upload
router.post("/upload", handleUpload, async (req, res) => {
  let uploadedPublicId = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No resume file was uploaded.",
      });
    }

    const { title, version, targetRole, changelog, isPrimary } = req.body;

    const existingCount = await ResumeVersion.countDocuments({
      userId: req.user.id,
    });

    const shouldBePrimary =
      isPrimary === "true" ||
      isPrimary === true ||
      existingCount === 0;

    const result = await uploadToCloudinary(req.file);
    uploadedPublicId = result.public_id;

    if (shouldBePrimary) {
      await ResumeVersion.updateMany(
        { userId: req.user.id },
        { isPrimary: false }
      );
    }

    const resume = await ResumeVersion.create({
      title:
        title?.trim() ||
        path.parse(req.file.originalname).name,

      version: version?.trim() || "1.0",
      targetRole: targetRole?.trim() || "Software Engineer",

      fileUrl: result.secure_url,
      fileName: result.public_id,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype || "application/pdf",
      cloudinaryPublicId: result.public_id,

      filePath: "",
      changelog: changelog?.trim() || "Initial upload",
      isPrimary: shouldBePrimary,
      userId: req.user.id,
    });

    res.status(201).json(resume);
  } catch (error) {
    if (uploadedPublicId) {
      await deleteCloudinaryFile(uploadedPublicId);
    }

    res.status(500).json({
      message: error.message || "Failed to upload resume.",
    });
  }
});

// POST /api/resumes/:id/replace
router.post("/:id/replace", handleUpload, async (req, res) => {
  let uploadedPublicId = null;

  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid resume ID.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "No replacement resume file was provided.",
      });
    }

    const resume = await ResumeVersion.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!resume) {
      return res.status(404).json({
        message: "Resume version not found.",
      });
    }

    const result = await uploadToCloudinary(req.file);
    uploadedPublicId = result.public_id;

    const oldPublicId = resume.cloudinaryPublicId;

    resume.fileUrl = result.secure_url;
    resume.fileName = result.public_id;
    resume.originalName = req.file.originalname;
    resume.fileSize = req.file.size;
    resume.fileType = req.file.mimetype || "application/pdf";
    resume.cloudinaryPublicId = result.public_id;
    resume.filePath = "";

    if (req.body.version?.trim()) {
      resume.version = req.body.version.trim();
    }

    if (req.body.changelog?.trim()) {
      resume.changelog = req.body.changelog.trim();
    }

    if (req.body.title?.trim()) {
      resume.title = req.body.title.trim();
    }

    await resume.save();

    if (oldPublicId) {
      await deleteCloudinaryFile(oldPublicId);
    }

    res.json(resume);
  } catch (error) {
    if (uploadedPublicId) {
      await deleteCloudinaryFile(uploadedPublicId);
    }

    res.status(500).json({
      message: error.message || "Failed to replace resume file.",
    });
  }
});

// GET /api/resumes/:id/download
router.get("/:id/download", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid resume ID.",
      });
    }

    const resume = await ResumeVersion.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!resume) {
      return res.status(404).json({
        message: "Resume not found.",
      });
    }

    const url = getPrivateUrl(resume, true);

    if (url) {
      return res.redirect(302, url);
    }

    return res.status(404).json({
      message: "This resume has no Cloudinary file. Please upload it again.",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to download resume.",
    });
  }
});

// GET /api/resumes/:id/preview
router.get("/:id/preview", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid resume ID.",
      });
    }

    const resume = await ResumeVersion.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!resume) {
      return res.status(404).json({
        message: "Resume not found.",
      });
    }

    if (resume.fileType !== "application/pdf") {
      return res.status(400).json({
        message: "Browser preview is available only for PDF files.",
      });
    }

    const url = getPrivateUrl(resume, false);

    if (url) {
      return res.redirect(302, url);
    }

    return res.status(404).json({
      message: "This resume has no Cloudinary file. Please upload it again.",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to preview resume.",
    });
  }
});

// POST /api/resumes
router.post("/", async (req, res) => {
  try {
    const { title, version, targetRole, changelog, isPrimary } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        message: "Resume title is required.",
      });
    }

    const existingCount = await ResumeVersion.countDocuments({
      userId: req.user.id,
    });

    const shouldBePrimary =
      Boolean(isPrimary) || existingCount === 0;

    if (shouldBePrimary) {
      await ResumeVersion.updateMany(
        { userId: req.user.id },
        { isPrimary: false }
      );
    }

    const resume = await ResumeVersion.create({
      title: title.trim(),
      version: version?.trim() || "1.0",
      targetRole: targetRole?.trim() || "Software Engineer",
      changelog: changelog?.trim() || "",
      isPrimary: shouldBePrimary,
      userId: req.user.id,
    });

    res.status(201).json(resume);
  } catch (error) {
    res.status(400).json({
      message: error.message || "Failed to add resume version.",
    });
  }
});

// PATCH /api/resumes/:id
router.patch("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid resume ID.",
      });
    }

    const updates = {};
    const allowedFields = [
      "title",
      "version",
      "targetRole",
      "changelog",
      "isPrimary",
    ];

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (updates.isPrimary === true) {
      await ResumeVersion.updateMany(
        { userId: req.user.id },
        { isPrimary: false }
      );
    }

    const resume = await ResumeVersion.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!resume) {
      return res.status(404).json({
        message: "Resume version not found.",
      });
    }

    res.json(resume);
  } catch (error) {
    res.status(400).json({
      message: error.message || "Failed to update resume.",
    });
  }
});

// DELETE /api/resumes/:id
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid resume ID.",
      });
    }

    const resume = await ResumeVersion.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!resume) {
      return res.status(404).json({
        message: "Resume version not found.",
      });
    }

    if (resume.cloudinaryPublicId) {
      await deleteCloudinaryFile(resume.cloudinaryPublicId);
    }

    await resume.deleteOne();

    res.json({
      message: "Resume version removed successfully.",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to delete resume.",
    });
  }
});

module.exports = router;
