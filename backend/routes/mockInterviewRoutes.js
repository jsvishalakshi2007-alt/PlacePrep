const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const MockInterview = require("../models/MockInterview");
const authMiddleware = require("../middleware/authMiddleware");

// All mock interview routes require authentication
router.use(authMiddleware);

// GET /analytics: Aggregated performance metrics & trend history
router.get("/analytics", async (req, res) => {
  try {
    const userId = req.user.id;
    const interviews = await MockInterview.find({ userId }).sort({ interviewDate: 1 });

    const completed = interviews.filter((i) => i.status === "Completed");
    const rated = completed.filter((i) => i.rating);
    const withTechnical = completed.filter((i) => i.technicalScore);
    const withCommunication = completed.filter((i) => i.communicationScore);
    const withProblemSolving = completed.filter((i) => i.problemSolvingScore);

    const calcAvg = (arr, prop) =>
      arr.length ? Number((arr.reduce((sum, item) => sum + item[prop], 0) / arr.length).toFixed(1)) : null;

    const avgOverall = calcAvg(rated, "rating");
    const avgTechnical = calcAvg(withTechnical, "technicalScore");
    const avgCommunication = calcAvg(withCommunication, "communicationScore");
    const avgProblemSolving = calcAvg(withProblemSolving, "problemSolvingScore");

    const recentTrend = completed.slice(-6).map((item) => ({
      _id: item._id,
      title: item.title,
      company: item.company,
      date: item.interviewDate,
      rating: item.rating || 0,
      technicalScore: item.technicalScore || item.rating || 0,
      communicationScore: item.communicationScore || item.rating || 0,
      problemSolvingScore: item.problemSolvingScore || item.rating || 0,
      feedback: item.feedback,
      strengths: item.strengths,
      areasForImprovement: item.areasForImprovement,
    }));

    res.json({
      totalInterviews: interviews.length,
      completedInterviews: completed.length,
      scheduledInterviews: interviews.filter((i) => i.status === "Scheduled").length,
      cancelledInterviews: interviews.filter((i) => i.status === "Cancelled").length,
      averages: {
        overall: avgOverall,
        technical: avgTechnical,
        communication: avgCommunication,
        problemSolving: avgProblemSolving,
      },
      recentTrend,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to generate analytics", error: error.message });
  }
});

// GET: Retrieve user's mock interviews
router.get("/", async (req, res) => {
  try {
    const filter = { userId: req.user.id };

    if (req.query.status && req.query.status !== "All") {
      filter.status = req.query.status;
    }

    const interviews = await MockInterview.find(filter).sort({
      interviewDate: -1,
      createdAt: -1,
    });
    res.json(interviews);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch mock interviews",
      error: error.message,
    });
  }
});

// POST: Add a mock interview for the logged-in user
router.post("/", async (req, res) => {
  try {
    const {
      title,
      company,
      topic,
      duration,
      status,
      interviewDate,
      interviewTime,
      notes,
      feedback,
      rating,
      technicalScore,
      communicationScore,
      problemSolvingScore,
      interviewerName,
      difficulty,
      strengths,
      areasForImprovement,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Interview title is required.",
      });
    }

    if (!interviewDate) {
      return res.status(400).json({
        message: "Interview date is required.",
      });
    }

    const parsedDate = new Date(interviewDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        message: "Invalid interview date format.",
      });
    }

    const interview = await MockInterview.create({
      title: title.trim(),
      company: company ? company.trim() : "General Practice",
      topic: topic ? topic.trim() : "General",
      duration: Number(duration) || 30,
      status: ["Scheduled", "Completed", "Cancelled"].includes(status)
        ? status
        : "Scheduled",
      interviewDate: parsedDate,
      interviewTime: interviewTime ? interviewTime.trim() : "10:00",
      notes: notes ? notes.trim() : "",
      feedback: feedback ? feedback.trim() : "",
      rating: rating ? Math.min(5, Math.max(1, Number(rating))) : null,
      technicalScore: technicalScore ? Math.min(5, Math.max(1, Number(technicalScore))) : null,
      communicationScore: communicationScore ? Math.min(5, Math.max(1, Number(communicationScore))) : null,
      problemSolvingScore: problemSolvingScore ? Math.min(5, Math.max(1, Number(problemSolvingScore))) : null,
      interviewerName: interviewerName ? interviewerName.trim() : "Self / Peer",
      difficulty: ["Easy", "Medium", "Hard"].includes(difficulty) ? difficulty : "Medium",
      strengths: strengths ? strengths.trim() : "",
      areasForImprovement: areasForImprovement ? areasForImprovement.trim() : "",
      userId: req.user.id,
    });

    res.status(201).json(interview);
  } catch (error) {
    res.status(400).json({
      message: error.message || "Failed to create mock interview",
    });
  }
});

// PATCH: Update an owned mock interview (including feedback and ratings)
router.patch("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid interview ID." });
    }

    const allowedFields = [
      "title",
      "company",
      "topic",
      "duration",
      "status",
      "interviewDate",
      "interviewTime",
      "notes",
      "feedback",
      "rating",
      "technicalScore",
      "communicationScore",
      "problemSolvingScore",
      "interviewerName",
      "difficulty",
      "strengths",
      "areasForImprovement",
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        if (field === "interviewDate" && req.body[field]) {
          const parsed = new Date(req.body[field]);
          if (isNaN(parsed.getTime())) {
            return res.status(400).json({ message: "Invalid date format." });
          }
          updates[field] = parsed;
        } else if (["rating", "technicalScore", "communicationScore", "problemSolvingScore"].includes(field)) {
          updates[field] = req.body[field] ? Math.min(5, Math.max(1, Number(req.body[field]))) : null;
        } else {
          updates[field] = req.body[field];
        }
      }
    }

    const interview = await MockInterview.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updates },
      { returnDocument: "after", runValidators: true }
    );

    if (!interview) {
      return res.status(404).json({
        message: "Mock interview not found or unauthorized",
      });
    }

    res.json(interview);
  } catch (error) {
    res.status(400).json({
      message: error.message || "Failed to update mock interview",
    });
  }
});

// DELETE: Remove an owned mock interview
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid interview ID." });
    }

    const interview = await MockInterview.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!interview) {
      return res.status(404).json({
        message: "Mock interview not found or unauthorized",
      });
    }

    res.json({ message: "Mock interview deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to delete mock interview",
    });
  }
});

module.exports = router;
