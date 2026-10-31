const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Problem = require("../models/Problem");
const authMiddleware = require("../middleware/authMiddleware");

// All problem routes require authentication
router.use(authMiddleware);

// GET: Retrieve user's problems
router.get("/", async (req, res) => {
  try {
    const filter = { userId: req.user.id };

    if (req.query.difficulty && req.query.difficulty !== "All Difficulties") {
      filter.difficulty = req.query.difficulty;
    }

    if (req.query.topic && req.query.topic !== "All Topics") {
      filter.topic = req.query.topic;
    }

    if (req.query.platform && req.query.platform !== "All") {
      filter.platform = req.query.platform;
    }

    if (req.query.solved !== undefined) {
      filter.solved = req.query.solved === "true";
    }

    if (req.query.revisionRequired === "true") {
      filter.revisionRequired = true;
    }

    if (req.query.search) {
      const search = req.query.search.trim();
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ title: regex }, { topic: regex }, { notes: regex }];
    }

    const problems = await Problem.find(filter).sort({
      solvedDate: -1,
      createdAt: -1,
    });
    res.json(problems);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch problems",
      error: error.message,
    });
  }
});

// POST: Add a coding problem for the logged-in user
router.post("/", async (req, res) => {
  try {
    const { title, platform, difficulty, topic, solved, solvedDate, url, notes, revisionRequired } = req.body;

    if (!title || !title.trim() || !difficulty) {
      return res.status(400).json({
        message: "Problem title and difficulty are required.",
      });
    }

    const problem = await Problem.create({
      title: title.trim(),
      platform: platform || "LeetCode",
      difficulty,
      topic: topic ? topic.trim() : "General",
      solved: solved !== undefined ? Boolean(solved) : true,
      solvedDate: solvedDate ? new Date(solvedDate) : new Date(),
      url: url ? url.trim() : "",
      notes: notes ? notes.trim() : "",
      revisionRequired: Boolean(revisionRequired),
      userId: req.user.id,
    });

    res.status(201).json(problem);
  } catch (error) {
    res.status(400).json({
      message: error.message || "Failed to create problem",
    });
  }
});

// PATCH: Update an owned coding problem
router.patch("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid problem ID." });
    }

    const allowedFields = [
      "title",
      "platform",
      "difficulty",
      "topic",
      "solved",
      "solvedDate",
      "url",
      "notes",
      "revisionRequired",
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    const problem = await Problem.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updates },
      { returnDocument: "after", runValidators: true }
    );

    if (!problem) {
      return res.status(404).json({
        message: "Problem not found or unauthorized",
      });
    }

    res.json(problem);
  } catch (error) {
    res.status(400).json({
      message: error.message || "Failed to update problem",
    });
  }
});

// DELETE: Remove an owned coding problem
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid problem ID." });
    }

    const problem = await Problem.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!problem) {
      return res.status(404).json({
        message: "Problem not found or unauthorized",
      });
    }

    res.json({ message: "Problem deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to delete problem",
    });
  }
});

module.exports = router;
