const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Application = require("../models/Application");
const authMiddleware = require("../middleware/authMiddleware");

// All application routes require authentication
router.use(authMiddleware);

// GET: Retrieve user's applications
router.get("/", async (req, res) => {
  try {
    const filter = { userId: req.user.id };

    if (req.query.status && req.query.status !== "All") {
      filter.status = req.query.status;
    }

    if (req.query.search) {
      const search = req.query.search.trim();
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ company: regex }, { role: regex }, { notes: regex }];
    }

    const applications = await Application.find(filter).sort({
      appliedDate: -1,
      createdAt: -1,
    });
    res.json(applications);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch applications",
      error: error.message,
    });
  }
});

// POST: Create an application for the logged-in user
router.post("/", async (req, res) => {
  try {
    const { company, role, status, appliedDate, notes, salary, location, jobUrl } = req.body;

    if (!company || !company.trim() || !role || !role.trim()) {
      return res.status(400).json({
        message: "Company and role are required.",
      });
    }

    const application = await Application.create({
      company: company.trim(),
      role: role.trim(),
      status: status || "Applied",
      appliedDate: appliedDate ? new Date(appliedDate) : new Date(),
      notes: notes ? notes.trim() : "",
      salary: salary ? salary.trim() : "",
      location: location ? location.trim() : "",
      jobUrl: jobUrl ? jobUrl.trim() : "",
      userId: req.user.id,
    });

    res.status(201).json(application);
  } catch (error) {
    res.status(400).json({
      message: error.message || "Failed to create application",
    });
  }
});

// PATCH: Update an owned application
router.patch("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid application ID." });
    }

    const allowedFields = [
      "company",
      "role",
      "status",
      "appliedDate",
      "notes",
      "salary",
      "location",
      "jobUrl",
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    const application = await Application.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updates },
      { returnDocument: "after", runValidators: true }
    );

    if (!application) {
      return res.status(404).json({
        message: "Application not found or unauthorized",
      });
    }

    res.json(application);
  } catch (error) {
    res.status(400).json({
      message: error.message || "Failed to update application",
    });
  }
});

// DELETE: Remove an owned application
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid application ID." });
    }

    const application = await Application.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!application) {
      return res.status(404).json({
        message: "Application not found or unauthorized",
      });
    }

    res.json({
      message: "Application deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to delete application",
    });
  }
});

module.exports = router;
