const express = require("express");
const router = express.Router();

const Application = require("../models/Application");
const Deadline = require("../models/Deadline");
const MockInterview = require("../models/MockInterview");
const Problem = require("../models/Problem");
const Task = require("../models/Task");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = "all", range = "all" } = req.query;
    const now = new Date();

    const [applications, deadlines, interviews, problems, tasks] = await Promise.all([
      Application.find({ userId }).select("company role status appliedDate createdAt"),
      Deadline.find({ userId }).select("title company type dueDate priority completed createdAt"),
      MockInterview.find({ userId }).select("title company topic status interviewDate interviewTime rating"),
      Problem.find({ userId, solved: true }).select("title platform difficulty topic updatedAt"),
      Task.find({ userId, completed: true }).select("title category priority completedAt updatedAt"),
    ]);

    const events = [];

    // 1. Applications
    applications.forEach((app) => {
      events.push({
        id: `app-${app._id}`,
        type: "application",
        category: "Application",
        title: `Applied to ${app.company}`,
        subtitle: `${app.role} • Status: ${app.status}`,
        date: app.appliedDate ? new Date(app.appliedDate) : new Date(app.createdAt),
        status: app.status,
        badgeVariant:
          app.status === "Offer"
            ? "green"
            : app.status === "Interview"
            ? "purple"
            : app.status === "Rejected"
            ? "red"
            : "blue",
        icon: "▤",
      });
    });

    // 2. Deadlines
    deadlines.forEach((d) => {
      events.push({
        id: `dl-${d._id}`,
        type: "deadline",
        category: "Deadline",
        title: d.title,
        subtitle: `${d.company ? d.company + " • " : ""}${d.type} (${d.priority} Priority)`,
        date: new Date(d.dueDate),
        status: d.completed ? "Completed" : "Upcoming",
        badgeVariant: d.completed ? "green" : d.priority === "High" ? "red" : "amber",
        icon: "◷",
      });
    });

    // 3. Mock Interviews
    interviews.forEach((i) => {
      events.push({
        id: `mock-${i._id}`,
        type: "interview",
        category: "Mock Interview",
        title: i.title,
        subtitle: `${i.company} (${i.topic})${i.rating ? ` • Rated ${i.rating}★` : ""}`,
        date: new Date(i.interviewDate),
        status: i.status,
        badgeVariant: i.status === "Completed" ? "green" : i.status === "Cancelled" ? "red" : "blue",
        icon: "♧",
      });
    });

    // 4. DSA Solved Problems
    problems.forEach((p) => {
      events.push({
        id: `dsa-${p._id}`,
        type: "dsa",
        category: "DSA Solved",
        title: `Solved ${p.title}`,
        subtitle: `${p.platform} • ${p.difficulty} • ${p.topic}`,
        date: new Date(p.updatedAt),
        status: p.difficulty,
        badgeVariant: p.difficulty === "Easy" ? "green" : p.difficulty === "Medium" ? "amber" : "red",
        icon: "⌘",
      });
    });

    // 5. Completed Tasks
    tasks.forEach((t) => {
      events.push({
        id: `task-${t._id}`,
        type: "task",
        category: "Goal Completed",
        title: `Completed Task: ${t.title}`,
        subtitle: `${t.category} (${t.priority} Priority)`,
        date: t.completedAt ? new Date(t.completedAt) : new Date(t.updatedAt),
        status: "Completed",
        badgeVariant: "green",
        icon: "✓",
      });
    });

    // Filter by type
    let filtered = events;
    if (type !== "all") {
      filtered = filtered.filter((e) => e.type === type);
    }

    // Filter by date range
    if (range === "today") {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      filtered = filtered.filter((e) => e.date >= todayStart);
    } else if (range === "week") {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      filtered = filtered.filter((e) => e.date >= weekStart);
    } else if (range === "month") {
      const monthStart = new Date(now);
      monthStart.setDate(monthStart.getDate() - 30);
      filtered = filtered.filter((e) => e.date >= monthStart);
    }

    // Sort descending by date
    filtered.sort((a, b) => b.date - a.date);

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: "Failed to generate placement timeline", error: error.message });
  }
});

module.exports = router;
