
const express = require("express");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");

const cloudinary = require("../config/cloudinary");
const StudyFile = require("../models/StudyFile");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Allowed document formats
const allowedTypes = new Map([
  [".pdf", "application/pdf"],
  [".doc", "application/msword"],
  [
    ".docx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  [".txt", "text/plain"],
]);

// Use memory storage instead of local disk storage
const upload = multer({
  storage: multer.memoryStorage(),
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

// Upload buffer to Cloudinary as a private authenticated raw file
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const ext = path.extname(file.originalname).toLowerCase();

    const publicId = crypto.randomUUID() + ext;

const stream = cloudinary.uploader.upload_stream(
  {
    resource_type: "raw",
    type: "authenticated",
    public_id: publicId,
    asset_folder: "placeprep/study-files",
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

// Generate a temporary authenticated download URL
const getPrivateDownloadUrl = (publicId, originalName) => {
  const ext = path.extname(originalName).toLowerCase().replace(".", "");

  return cloudinary.utils.private_download_url(
    publicId,
    ext,
    {
      resource_type: "raw",
      type: "authenticated",
      expires_at: Math.floor(Date.now() / 1000) + 300,
      attachment: true,
    }
  );
};

// All routes require authentication
router.use(authMiddleware);

// Upload study file
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
  let uploadedPublicId;

  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Select a file to upload.",
      });
    }

    const result = await uploadToCloudinary(req.file);
    uploadedPublicId = result.public_id;

    const savedFile = await StudyFile.create({
      originalName: path.basename(req.file.originalname).slice(0, 255),
      storedName: result.public_id,
      fileUrl: result.secure_url,
      mimeType: req.file.mimetype,
      size: req.file.size,
      userId: req.user.id,
    });

    res.status(201).json(savedFile);
  } catch (error) {
    console.error("Study file upload error:", error);

    if (uploadedPublicId) {
      await cloudinary.uploader.destroy(uploadedPublicId, {
        resource_type: "raw",
        type: "authenticated",
      }).catch(() => {});
    }

    res.status(500).json({
      message: "Could not save the study file.",
    });
  }
});

// Get logged-in user's study files
router.get("/", async (req, res) => {
  try {
    const files = await StudyFile.find({
      userId: req.user.id,
    })
      .select("-storedName -fileUrl")
      .sort({ createdAt: -1 });

    res.json(files);
  } catch (error) {
    console.error("Fetch study files error:", error);

    res.status(500).json({
      message: "Could not fetch study files.",
    });
  }
});

// Download study file
router.get("/:id/download", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid file ID.",
      });
    }

    const file = await StudyFile.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!file) {
      return res.status(404).json({
        message: "Study file not found.",
      });
    }

    const downloadUrl = getPrivateDownloadUrl(
      file.storedName,
      file.originalName
    );

    res.redirect(302, downloadUrl);
  } catch (error) {
    console.error("Study file download error:", error);

    res.status(500).json({
      message: "Could not download the study file.",
    });
  }
});

// Delete study file
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid file ID.",
      });
    }

    const file = await StudyFile.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!file) {
      return res.status(404).json({
        message: "Study file not found.",
      });
    }

    await cloudinary.uploader.destroy(file.storedName, {
      resource_type: "raw",
      type: "authenticated",
    });

    await StudyFile.deleteOne({
      _id: file._id,
      userId: req.user.id,
    });

    res.json({
      message: "Study file deleted successfully.",
    });
  } catch (error) {
    console.error("Study file deletion error:", error);

    res.status(500).json({
      message: "Could not delete the study file.",
    });
  }
});

module.exports = router;
