const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Task = require("../models/Task");
const Deadline = require("../models/Deadline");
const Problem = require("../models/Problem");
const authMiddleware = require("../middleware/authMiddleware");

// All task routes require authentication
router.use(authMiddleware);

// GET /streak-summary: Calculate streak, daily focus, and smart suggestions
router.get("/streak-summary", async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart.getTime() + 86400000);

    const [tasks, deadlines, problems] = await Promise.all([
      Task.find({ userId }).sort({ scheduledDate: 1, createdAt: -1 }),
      Deadline.find({ userId, completed: false }).sort({ dueDate: 1 }).limit(3),
      Problem.find({ userId }).select("difficulty topic solved revisionRequired"),
    ]);

    // Daily tasks (scheduled for today or created today)
    const todayTasks = tasks.filter((t) => {
      if (t.scheduledDate) {
        const d = new Date(t.scheduledDate);
        return d >= todayStart && d < tomorrowStart;
      }
      const c = new Date(t.createdAt);
      return c >= todayStart && c < tomorrowStart;
    });

    const completedToday = todayTasks.filter((t) => t.completed).length;

    // Calculate streak
    const completedTasks = tasks.filter((t) => t.completed);
    let streakDays = 0;

    if (completedTasks.length > 0) {
      const completedDates = new Set();
      completedTasks.forEach((t) => {
        const d = t.completedAt ? new Date(t.completedAt) : new Date(t.updatedAt || now);
        completedDates.add(new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10));
      });

      let checkDate = new Date(todayStart);
      const todayStr = checkDate.toISOString().slice(0, 10);
      let started = completedDates.has(todayStr);

      if (!started) {
        checkDate.setDate(checkDate.getDate() - 1);
        if (completedDates.has(checkDate.toISOString().slice(0, 10))) {
          started = true;
          streakDays = 1;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      } else {
        streakDays = 1;
        checkDate.setDate(checkDate.getDate() - 1);
      }

      while (started && completedDates.has(checkDate.toISOString().slice(0, 10))) {
        streakDays++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    // Generate intelligent personalized suggestions
    const suggestions = [];

    // 1. Suggestion from urgent deadlines
    if (deadlines.length > 0) {
      const urgent = deadlines[0];
      suggestions.push({
        title: `Prepare for ${urgent.title} (${urgent.company || urgent.type})`,
        category: urgent.type === "Online Test" || urgent.type === "Interview" ? "Practice" : "Applications",
        duration: "45 min",
        priority: "High",
        reason: `Deadline due on ${new Date(urgent.dueDate).toLocaleDateString()}`,
      });
    }

    // 2. Suggestion from DSA revision
    const revisionNeeded = problems.filter((p) => p.revisionRequired);
    if (revisionNeeded.length > 0) {
      suggestions.push({
        title: `Revise DSA: ${revisionNeeded[0].title || revisionNeeded[0].topic}`,
        category: "DSA",
        duration: "30 min",
        priority: "Medium",
        reason: "Flagged for revision in your DSA tracker",
      });
    } else {
      // Check untackled core topics
      const solvedTopics = new Set(problems.filter((p) => p.solved).map((p) => p.topic));
      const coreTopics = ["Dynamic Programming", "Trees", "Graphs", "Binary Search"];
      const missingTopic = coreTopics.find((t) => !solvedTopics.has(t)) || "Dynamic Programming";
      suggestions.push({
        title: `Practice 2 problems on ${missingTopic}`,
        category: "DSA",
        duration: "45 min",
        priority: "High",
        reason: `Key topic frequently asked in technical interviews`,
      });
    }

    // 3. System Design or CS fundamentals
    suggestions.push({
      title: "Review DBMS & Operating Systems fundamentals",
      category: "Core CS",
      duration: "30 min",
      priority: "Medium",
      reason: "Essential for technical and online screening rounds",
    });

    res.json({
      streakDays,
      todayTotal: todayTasks.length,
      todayCompleted: completedToday,
      todayProgress: todayTasks.length ? Math.round((completedToday / todayTasks.length) * 100) : 0,
      suggestions: suggestions.slice(0, 3),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load streak summary", error: error.message });
  }
});

// GET: Retrieve user's tasks
router.get("/", async (req, res) => {
  try {
    const filter = { userId: req.user.id };

    if (req.query.completed !== undefined) {
      filter.completed = req.query.completed === "true";
    }

    if (req.query.category && req.query.category !== "All") {
      filter.category = req.query.category;
    }

    const tasks = await Task.find(filter).sort({
      scheduledDate: 1,
      createdAt: -1,
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch tasks",
      error: error.message,
    });
  }
});

// POST: Create a task for the logged-in user
router.post("/", async (req, res) => {
  try {
    const { title, category, duration, completed, scheduledDate, startTime, priority, suggestedBy } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Task title is required." });
    }

    const isCompleted = Boolean(completed);

    const task = await Task.create({
      title: title.trim(),
      category: category || "DSA",
      duration: duration || "30 min",
      completed: isCompleted,
      completedAt: isCompleted ? new Date() : null,
      priority: ["High", "Medium", "Low"].includes(priority) ? priority : "Medium",
      suggestedBy: suggestedBy || "Manual",
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      startTime: startTime || "",
      userId: req.user.id,
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({
      message: error.message || "Failed to create task",
    });
  }
});

// PATCH: Update an owned task, including its schedule and completion
router.patch("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID." });
    }

    const allowedFields = [
      "title",
      "category",
      "duration",
      "completed",
      "scheduledDate",
      "startTime",
      "priority",
      "suggestedBy",
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        if (field === "scheduledDate") {
          updates[field] = req.body[field] ? new Date(req.body[field]) : null;
        } else if (field === "completed") {
          const isDone = Boolean(req.body[field]);
          updates.completed = isDone;
          updates.completedAt = isDone ? new Date() : null;
        } else {
          updates[field] = req.body[field];
        }
      }
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updates },
      { returnDocument: "after", runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found or unauthorized" });
    }

    res.json(task);
  } catch (error) {
    res.status(400).json({
      message: error.message || "Failed to update task",
    });
  }
});

// DELETE: Remove an owned task
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID." });
    }

    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found or unauthorized" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to delete task",
    });
  }
});

module.exports = router;
