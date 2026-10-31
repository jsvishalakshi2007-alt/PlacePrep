
const express = require("express");
const mongoose = require("mongoose");
const Resource = require("../models/Resource");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

// GET: List, search, and filter resources
router.get("/", async (req, res) => {
  try {
    const filter = { userId: req.user.id };

    if (req.query.search) {
      const escaped = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");

      filter.$or = [
        { title: regex },
        { category: regex },
        { description: regex },
        { tags: regex },
      ];
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.favorite === "true") {
      filter.isFavorite = true;
    }

    if (req.query.tag) {
      filter.tags = req.query.tag;
    }

    const resources = await Resource.find(filter).sort({ updatedAt: -1 });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch resources." });
  }
});

// POST: Create a resource
router.post("/", async (req, res) => {
  try {
    const { title, url, category, description, tags } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof url !== "string" ||
      !url.trim() ||
      typeof category !== "string" ||
      !category.trim()
    ) {
      return res.status(400).json({
        message: "Title, URL, and category are required.",
      });
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(url.trim());
    } catch {
      return res.status(400).json({ message: "Enter a valid URL." });
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return res.status(400).json({
        message: "Only HTTP and HTTPS resource links are allowed.",
      });
    }

    const resource = await Resource.create({
      title: title.trim(),
      url: parsedUrl.toString(),
      category: category.trim(),
      description: typeof description === "string" ? description.trim() : "",
      tags: Array.isArray(tags)
        ? tags.filter((tag) => typeof tag === "string").map((tag) => tag.trim()).filter(Boolean)
        : [],
      userId: req.user.id,
    });

    res.status(201).json(resource);
  } catch (error) {
    res.status(400).json({ message: "Failed to create resource." });
  }
});

// PUT: Update a resource
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid resource ID." });
    }

    const allowed = ["title", "url", "category", "description", "tags", "isFavorite"];
    const updates = {};

    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        updates[key] = req.body[key];
      }
    }

    if (typeof updates.url === "string") {
      try {
        const parsedUrl = new URL(updates.url.trim());

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new Error("Unsupported URL protocol");
        }

        updates.url = parsedUrl.toString();
      } catch {
        return res.status(400).json({ message: "Enter a valid HTTP or HTTPS URL." });
      }
    }

    const resource = await Resource.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!resource) {
      return res.status(404).json({ message: "Resource not found." });
    }

    res.json(resource);
  } catch (error) {
    res.status(400).json({ message: "Failed to update resource." });
  }
});

// DELETE: Delete a resource
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid resource ID." });
    }

    const resource = await Resource.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!resource) {
      return res.status(404).json({ message: "Resource not found." });
    }

    res.json({ message: "Resource deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete resource." });
  }
});

module.exports = router;
