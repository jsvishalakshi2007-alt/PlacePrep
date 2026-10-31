const express = require("express");
const router = express.Router();

const Note = require("../models/Note");
const Resource = require("../models/Resource");
const StudyFile = require("../models/StudyFile");
const Application = require("../models/Application");
const Problem = require("../models/Problem");
const Task = require("../models/Task");
const MockInterview = require("../models/MockInterview");
const Deadline = require("../models/Deadline");
const User = require("../models/User");
const TargetCompany = require("../models/TargetCompany");
const Skill = require("../models/Skill");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // Day boundaries for accurate comparison regardless of time-of-day
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const [
      notesCount,
      resourcesCount,
      filesCount,
      favoritesCount,
      applications,
      problems,
      tasks,
      interviews,
      deadlines,
      targetCompanies,
      skills,
      user,
    ] = await Promise.all([
      Note.countDocuments({ userId }),
      Resource.countDocuments({ userId }),
      StudyFile.countDocuments({ userId }),
      Note.countDocuments({ userId, isFavorite: true }),
      Application.find({ userId }).select("status company role appliedDate salary location"),
      Problem.find({ userId }).select("difficulty topic solved solvedDate revisionRequired title platform"),
      Task.find({ userId }).select("completed category scheduledDate completedAt priority"),
      MockInterview.find({ userId }).select(
        "title status interviewDate interviewTime duration rating technicalScore communicationScore problemSolvingScore company topic notes feedback interviewerName difficulty"
      ),
      Deadline.find({ userId }).select("title company type dueDate priority completed notes"),
      TargetCompany.find({ userId }).select("name role status priority requiredSkills expectedRounds"),
      Skill.find({ userId }).select("name category proficiency"),
      User.findById(userId).select("name college department skills interests careerObjective graduationYear academicYear"),
    ]);

    // 1. Applications aggregation
    const appStats = {
      total: applications.length,
      applied: 0,
      onlineTest: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    };

    applications.forEach((app) => {
      if (app.status === "Applied") appStats.applied++;
      else if (app.status === "Online Test") appStats.onlineTest++;
      else if (app.status === "Interview") appStats.interview++;
      else if (app.status === "Offer") appStats.offer++;
      else if (app.status === "Rejected") appStats.rejected++;
    });

    // 2. DSA aggregation
    const solvedProblems = problems.filter((p) => p.solved);
    const dsaStats = {
      total: problems.length,
      solved: solvedProblems.length,
      easy: solvedProblems.filter((p) => p.difficulty === "Easy").length,
      medium: solvedProblems.filter((p) => p.difficulty === "Medium").length,
      hard: solvedProblems.filter((p) => p.difficulty === "Hard").length,
      revisionRequired: problems.filter((p) => p.revisionRequired).length,
      byTopic: {},
    };

    solvedProblems.forEach((p) => {
      const topic = p.topic && p.topic.trim() ? p.topic.trim() : "General";
      dsaStats.byTopic[topic] = (dsaStats.byTopic[topic] || 0) + 1;
    });

    // 3. Tasks & Streak aggregation
    const completedTasks = tasks.filter((t) => t.completed);
    const completedTasksCount = completedTasks.length;

    // Calculate streak from completedAt dates
    let streakDays = 0;
    if (completedTasks.length > 0) {
      const completedDates = new Set();
      completedTasks.forEach((t) => {
        const d = t.completedAt ? new Date(t.completedAt) : new Date(t.updatedAt || now);
        completedDates.add(new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10));
      });

      // Walk back from today or yesterday
      let checkDate = new Date(todayStart);
      const todayStr = checkDate.toISOString().slice(0, 10);
      let started = completedDates.has(todayStr);

      if (!started) {
        // Check yesterday to see if active streak carries over
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

    const taskStats = {
      total: tasks.length,
      completed: completedTasksCount,
      pending: tasks.length - completedTasksCount,
      streak: streakDays,
    };

    // 4. Mock Interviews aggregation
    const completedInterviews = interviews.filter((i) => i.status === "Completed");
    const scheduledInterviews = interviews
      .filter((i) => i.status === "Scheduled")
      .sort((a, b) => new Date(a.interviewDate) - new Date(b.interviewDate));
    const cancelledInterviews = interviews.filter((i) => i.status === "Cancelled");

    const ratedInterviews = completedInterviews.filter((i) => i.rating);
    const avgRating = ratedInterviews.length
      ? Number(
          (
            ratedInterviews.reduce((acc, i) => acc + i.rating, 0) /
            ratedInterviews.length
          ).toFixed(1)
        )
      : null;

    const interviewStats = {
      total: interviews.length,
      scheduled: scheduledInterviews.length,
      completed: completedInterviews.length,
      cancelled: cancelledInterviews.length,
      averageRating: avgRating,
      nextInterview: scheduledInterviews[0] || null,
      scheduledList: scheduledInterviews.slice(0, 5),
    };

    // 5. Deadlines aggregation with normalized date calculation
    const formattedDeadlines = deadlines.map((d) => {
      const dueDate = new Date(d.dueDate);
      const dueDayStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 0, 0, 0, 0);
      const diffTime = dueDayStart.getTime() - todayStart.getTime();
      const remainingDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      let urgencyStatus = "upcoming";
      if (d.completed) {
        urgencyStatus = "completed";
      } else if (remainingDays < 0) {
        urgencyStatus = "overdue";
      } else if (remainingDays === 0) {
        urgencyStatus = "today";
      } else if (remainingDays === 1) {
        urgencyStatus = "tomorrow";
      }

      return {
        _id: d._id,
        title: d.title,
        company: d.company || "",
        type: d.type || "Other",
        dueDate: d.dueDate,
        priority: d.priority || "Medium",
        completed: Boolean(d.completed),
        notes: d.notes || "",
        remainingDays,
        urgencyStatus,
      };
    });

    const pendingFormattedDeadlines = formattedDeadlines
      .filter((d) => !d.completed)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    const completedDeadlinesCount = formattedDeadlines.filter((d) => d.completed).length;
    const overdueCount = pendingFormattedDeadlines.filter((d) => d.urgencyStatus === "overdue").length;
    const dueTodayCount = pendingFormattedDeadlines.filter((d) => d.urgencyStatus === "today").length;

    const deadlineStats = {
      total: deadlines.length,
      completed: completedDeadlinesCount,
      pending: pendingFormattedDeadlines.length,
      overdue: overdueCount,
      dueToday: dueTodayCount,
      list: pendingFormattedDeadlines.slice(0, 6),
      nextUpcoming: pendingFormattedDeadlines.slice(0, 6), // For backwards-compatibility
    };

    // 6. Target Companies aggregation
    const companyStats = {
      total: targetCompanies.length,
      targeting: targetCompanies.filter((c) => c.status === "Targeting").length,
      applied: targetCompanies.filter((c) => c.status === "Applied").length,
      interviewing: targetCompanies.filter((c) => c.status === "Interviewing").length,
      offered: targetCompanies.filter((c) => c.status === "Offered").length,
      list: targetCompanies.slice(0, 5),
    };

    // 7. Profile completeness calculation
    let profileFilled = 0;
    const profileTotalFields = 7;
    if (user?.name) profileFilled++;
    if (user?.college) profileFilled++;
    if (user?.department) profileFilled++;
    if ((user?.skills && user.skills.length > 0) || skills.length > 0) profileFilled++;
    if (user?.interests && user.interests.length > 0) profileFilled++;
    if (user?.careerObjective) profileFilled++;
    if (user?.graduationYear) profileFilled++;
    const profileCompleteness = Math.round((profileFilled / profileTotalFields) * 100);

    // 8. Smart Placement Readiness Score Calculation (0 to 100)
    // A. DSA Score (0 to 35 pts)
    const dsaWeighted = dsaStats.easy * 0.5 + dsaStats.medium * 1.0 + dsaStats.hard * 1.8;
    const dsaScore = Math.min(35, Math.round((dsaWeighted / 35) * 35));

    // B. Application Pipeline Score (0 to 25 pts)
    const appWeighted = appStats.applied * 1 + appStats.onlineTest * 1.5 + appStats.interview * 3 + appStats.offer * 5;
    const appScore = Math.min(25, Math.round((appWeighted / 20) * 25));

    // C. Mock Interview Performance Score (0 to 15 pts)
    const interviewCountFactor = Math.min(10, completedInterviews.length * 3.5);
    const interviewQualityFactor = avgRating ? (avgRating / 5) * 5 : 0;
    const mockScore = Math.min(15, Math.round(interviewCountFactor + interviewQualityFactor));

    // D. Technical Skills & Profile Completeness (0 to 15 pts)
    const skillCountScore = Math.min(7, skills.length * 1.2);
    const profileScore = Math.round((profileCompleteness / 100) * 8);
    const skillAndProfileScore = Math.min(15, Math.round(skillCountScore + profileScore));

    // E. Study Discipline & Streak (0 to 10 pts)
    const taskRatio = tasks.length > 0 ? (completedTasksCount / tasks.length) * 6 : 3;
    const streakBonus = Math.min(4, streakDays * 0.8);
    const consistencyScore = Math.min(10, Math.round(taskRatio + streakBonus));

    const readinessScore = Math.min(
      100,
      Math.max(5, dsaScore + appScore + mockScore + skillAndProfileScore + consistencyScore)
    );

    // Strengths and Weaknesses derivation
    const strengths = [];
    const weaknesses = [];
    const actionableSuggestions = [];

    if (dsaStats.solved >= 25) {
      strengths.push(`Strong DSA problem-solving volume (${dsaStats.solved} problems solved)`);
    } else {
      weaknesses.push(`Low DSA problem-solving count (${dsaStats.solved}/40 recommended target)`);
      actionableSuggestions.push("Solve at least 2 Medium-level DSA problems daily");
    }

    if (dsaStats.hard >= 3) {
      strengths.push("Tackled challenging Hard DSA problems");
    }

    if (appStats.total >= 8) {
      strengths.push(`Active application pipeline with ${appStats.total} tracked companies`);
    } else {
      weaknesses.push(`Limited company applications (${appStats.total} submitted)`);
      actionableSuggestions.push("Explore and apply to 3 new target companies this week");
    }

    if (completedInterviews.length >= 2) {
      strengths.push(`Completed ${completedInterviews.length} mock interviews${avgRating ? ` with ${avgRating}★ avg` : ""}`);
    } else {
      weaknesses.push("Insufficient mock interview practice (recommended: 3+ completed sessions)");
      actionableSuggestions.push("Schedule a technical mock interview session to practice live coding");
    }

    if (skills.length >= 5) {
      strengths.push(`Broad technical skill inventory (${skills.length} skills listed)`);
    } else {
      weaknesses.push("Technical skills inventory needs expansion");
      actionableSuggestions.push("Add your core technologies and frameworks in the Skills Analyzer");
    }

    if (streakDays >= 3) {
      strengths.push(`Active ${streakDays}-day daily preparation streak`);
    } else if (tasks.length === 0 || completedTasksCount === 0) {
      weaknesses.push("Inconsistent daily preparation activity");
      actionableSuggestions.push("Set daily tasks in the Study Planner to build momentum");
    }

    // Set Cache-Control to avoid stale 304 caching
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

    res.json({
      readinessScore,
      scoreBreakdown: {
        dsa: dsaScore,
        applications: appScore,
        mockInterviews: mockScore,
        skillsAndProfile: skillAndProfileScore,
        consistency: consistencyScore,
      },
      strengths,
      weaknesses,
      actionableSuggestions,
      profileCompleteness,
      applications: appStats,
      dsa: dsaStats,
      tasks: taskStats,
      interviews: interviewStats,
      deadlines: deadlineStats,
      companies: companyStats,
      skillsCount: skills.length,
      notesCount,
      resourcesCount,
      filesCount,
      favoritesCount,
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);
    res.status(500).json({
      message: "Unable to load dashboard summary.",
      error: error.message,
    });
  }
});

module.exports = router;
