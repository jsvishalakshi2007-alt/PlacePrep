
const express = require("express");
const mongoose = require("mongoose");
const Note = require("../models/Note");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// All note routes require login
router.use(authMiddleware);

// GET: List and search the logged-in user's notes
router.get("/", async (req, res) => {
  try {
    const filter = { userId: req.user.id };

    if (req.query.search) {
      const search = req.query.search.trim();
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");

      filter.$or = [
        { title: regex },
        { subject: regex },
        { content: regex },
        { tags: regex },
      ];
    }

    if (req.query.subject) {
      filter.subject = req.query.subject;
    }

    if (req.query.favorite === "true") {
      filter.isFavorite = true;
    }

    if (req.query.tag) {
      filter.tags = req.query.tag;
    }

    const notes = await Note.find(filter).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notes." });
  }
});

// POST: Create a note
router.post("/", async (req, res) => {
  try {
    const { title, subject, content, tags } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof subject !== "string" ||
      !subject.trim() ||
      typeof content !== "string" ||
      !content.trim()
    ) {
      return res.status(400).json({
        message: "Title, subject, and content are required.",
      });
    }

    const note = await Note.create({
      title: title.trim(),
      subject: subject.trim(),
      content: content.trim(),
      tags: Array.isArray(tags)
        ? tags.filter((tag) => typeof tag === "string").map((tag) => tag.trim()).filter(Boolean)
        : [],
      userId: req.user.id,
    });

    res.status(201).json(note);
  } catch (error) {
    res.status(400).json({ message: "Failed to create note." });
  }
});

// PUT: Update a note
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid note ID." });
    }

    const allowed = ["title", "subject", "content", "tags", "isFavorite"];
    const updates = {};

    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        updates[key] = req.body[key];
      }
    }

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!note) {
      return res.status(404).json({ message: "Note not found." });
    }

    res.json(note);
  } catch (error) {
    res.status(400).json({ message: "Failed to update note." });
  }
});

// DELETE: Delete a note
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid note ID." });
    }

    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found." });
    }

    res.json({ message: "Note deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete note." });
  }
});

module.exports = router;
