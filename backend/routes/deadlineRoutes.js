const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Deadline = require("../models/Deadline");
const authMiddleware = require("../middleware/authMiddleware");

// All deadline routes require authentication
router.use(authMiddleware);

// GET: Fetch user's deadlines
router.get("/", async (req, res) => {
  try {
    const filter = { userId: req.user.id };

    if (req.query.completed !== undefined) {
      filter.completed = req.query.completed === "true";
    }

    if (req.query.type && req.query.type !== "All") {
      filter.type = req.query.type;
    }

    const deadlines = await Deadline.find(filter).sort({ dueDate: 1, createdAt: -1 });
    res.json(deadlines);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch deadlines.",
      error: error.message,
    });
  }
});

// POST: Create a deadline for the logged-in user
router.post("/", async (req, res) => {
  try {
    const { title, company, type, dueDate, priority, notes } = req.body;

    if (!title || !title.trim() || !dueDate) {
      return res.status(400).json({
        message: "Title and due date are required.",
      });
    }

    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid due date format." });
    }

    const deadline = await Deadline.create({
      title: title.trim(),
      company: company ? company.trim() : "",
      type: type || "Other",
      dueDate: parsedDate,
      priority: priority || "Medium",
      notes: notes ? notes.trim() : "",
      userId: req.user.id,
    });

    res.status(201).json(deadline);
  } catch (error) {
    res.status(400).json({
      message: error.message || "Failed to create deadline.",
    });
  }
});

// PATCH: Update an owned deadline
router.patch("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid deadline ID." });
    }

    const allowedFields = ["title", "company", "type", "dueDate", "priority", "notes", "completed"];
    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        if (field === "dueDate" && req.body[field]) {
          const parsed = new Date(req.body[field]);
          if (isNaN(parsed.getTime())) {
            return res.status(400).json({ message: "Invalid due date format." });
          }
          updates[field] = parsed;
        } else {
          updates[field] = req.body[field];
        }
      }
    }

    const deadline = await Deadline.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updates },
      { returnDocument: "after", runValidators: true }
    );

    if (!deadline) {
      return res.status(404).json({ message: "Deadline not found or unauthorized." });
    }

    res.json(deadline);
  } catch (error) {
    res.status(400).json({
      message: error.message || "Failed to update deadline.",
    });
  }
});

// DELETE: Remove an owned deadline
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid deadline ID." });
    }

    const deadline = await Deadline.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!deadline) {
      return res.status(404).json({ message: "Deadline not found or unauthorized." });
    }

    res.json({ message: "Deadline deleted successfully." });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to delete deadline.",
    });
  }
});

module.exports = router;
