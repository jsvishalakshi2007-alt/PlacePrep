const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const TargetCompany = require("../models/TargetCompany");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

// Preset templates for top companies
const COMPANY_PRESETS = [
  {
    name: "Google",
    role: "Software Engineer (L3)",
    package: "32-45 LPA",
    location: "Bangalore / Hyderabad",
    requiredSkills: ["Data Structures & Algorithms", "C++ / Java", "System Design", "Operating Systems", "Networking"],
    dsaTopics: ["Dynamic Programming", "Graphs", "Trees", "Binary Search"],
    aptitudeNotes: "Focus on clean coding, time complexity analysis, and edge case handling.",
    expectedRounds: [
      { name: "Online Assessment", roundType: "Coding", description: "2 DSA problems on Google screening platform", completed: false },
      { name: "Technical Round 1", roundType: "DSA", description: "Trees & Graph traversal algorithms", completed: false },
      { name: "Technical Round 2", roundType: "DSA", description: "Dynamic Programming & Optimization", completed: false },
      { name: "Googleliness & Leadership", roundType: "Behavioral", description: "Scenario-based behavioral questions", completed: false },
    ],
    checklist: [
      { task: "Solve Google Top 50 LeetCode problems", completed: false },
      { task: "Review OOP and concurrency principles", completed: false },
      { task: "Prepare 3 STAR-method leadership examples", completed: false },
    ],
  },
  {
    name: "Amazon",
    role: "SDE-1",
    package: "28-44 LPA",
    location: "Bangalore / Hyderabad / Chennai",
    requiredSkills: ["Java", "Object-Oriented Design", "DSA", "Distributed Systems", "AWS Basics"],
    dsaTopics: ["Trees & BST", "Dynamic Programming", "Heaps", "Arrays & Strings"],
    aptitudeNotes: "Amazon Leadership Principles are heavily tested in every single round.",
    expectedRounds: [
      { name: "Online Assessment (OA)", roundType: "Coding & Work Simulation", description: "2 coding questions + work simulation", completed: false },
      { name: "Technical Round 1", roundType: "DSA", description: "Problem solving and data structure optimization", completed: false },
      { name: "Technical Round 2", roundType: "System / OO Design", description: "Object oriented design (e.g. Parking Lot)", completed: false },
      { name: "Bar Raiser", roundType: "Mix", description: "Deep dive on 14 Leadership Principles and coding", completed: false },
    ],
    checklist: [
      { task: "Write 2 stories for each of the 14 Leadership Principles", completed: false },
      { task: "Master Graph, BFS/DFS, and Tree questions", completed: false },
      { task: "Practice Low Level Design (LLD) class diagrams", completed: false },
    ],
  },
  {
    name: "Microsoft",
    role: "Software Engineer",
    package: "25-42 LPA",
    location: "Hyderabad / Noida / Bangalore",
    requiredSkills: ["C# / C++ / Java", "Data Structures", "Algorithms", "Operating Systems", "Database Management"],
    dsaTopics: ["Strings & Arrays", "Linked Lists", "Trees", "Recursion & Backtracking"],
    aptitudeNotes: "Emphasis on readable, maintainable, modular code and edge case testing.",
    expectedRounds: [
      { name: "Codility Online Assessment", roundType: "Coding", description: "3 coding tasks in 90 minutes", completed: false },
      { name: "Technical Interview 1", roundType: "DSA", description: "Data structures & problem solving", completed: false },
      { name: "Technical Interview 2", roundType: "System Design & CS", description: "CS fundamentals, OS, Threads, Memory", completed: false },
      { name: "AA (As Appropriate / Hiring Manager)", roundType: "Culture & Tech", description: "Project deep dive and fit", completed: false },
    ],
    checklist: [
      { task: "Revise Operating Systems (Paging, Virtual Memory, Deadlocks)", completed: false },
      { task: "Solve Microsoft tagged LeetCode questions", completed: false },
      { task: "Prepare detailed project walk-through", completed: false },
    ],
  },
  {
    name: "Meta",
    role: "Software Engineer - Product",
    package: "35-50 LPA",
    location: "Bangalore / Remote",
    requiredSkills: ["Python / C++", "Algorithms", "System Architecture", "Scalability", "Databases"],
    dsaTopics: ["Graphs", "Intervals", "Dynamic Programming", "Tries & Hash Maps"],
    aptitudeNotes: "Focus on speed and writing fully compilable, bug-free code within 40 minutes.",
    expectedRounds: [
      { name: "Screening Round", roundType: "Coding", description: "2 LeetCode Medium/Hard problems in 45 mins", completed: false },
      { name: "Coding Round 1", roundType: "DSA", description: "Algorithmic thinking and code verification", completed: false },
      { name: "Coding Round 2", roundType: "DSA", description: "Data structure design and concurrency", completed: false },
      { name: "Product Architecture & Behavioral", roundType: "System Design", description: "Design a high-scale real-time product feature", completed: false },
    ],
    checklist: [
      { task: "Master Meta Top 100 tagged LeetCode problems", completed: false },
      { task: "Practice rapid coding with no syntax errors", completed: false },
      { task: "Review modern distributed cache and database sharding", completed: false },
    ],
  },
  {
    name: "TCS / Infosys (Digital & Prime)",
    role: "Digital Specialist Engineer",
    package: "7-14 LPA",
    location: "Pan India",
    requiredSkills: ["Java / Python", "Data Structures", "SQL & DBMS", "Web Development", "Computer Networks"],
    dsaTopics: ["Arrays", "Searching & Sorting", "Strings", "Math & Logic"],
    aptitudeNotes: "Strong aptitude foundation + Clean solution to 2-3 standard coding problems.",
    expectedRounds: [
      { name: "National Qualifier Test (NQT)", roundType: "Aptitude & Coding", description: "Cognitive skills + 2 coding problems", completed: false },
      { name: "Digital Upgrade Test", roundType: "Advanced Coding", description: "DSA and algorithmic complexity", completed: false },
      { name: "Technical + Managerial Interview", roundType: "Comprehensive", description: "Project presentation, DBMS, and OOP", completed: false },
      { name: "HR Interview", roundType: "HR", description: "Document verification and relocation preference", completed: false },
    ],
    checklist: [
      { task: "Practice Quantitative Aptitude (Time & Work, Permutations, Probability)", completed: false },
      { task: "Master basic DBMS queries and normalization", completed: false },
      { task: "Be ready to explain final year academic project end-to-end", completed: false },
    ],
  },
];

// GET /presets: Get preset company templates
router.get("/presets", (req, res) => {
  res.json(COMPANY_PRESETS);
});

// GET /: List user's target companies
router.get("/", async (req, res) => {
  try {
    const filter = { userId: req.user.id };
    if (req.query.status && req.query.status !== "All") {
      filter.status = req.query.status;
    }
    const companies = await TargetCompany.find(filter).sort({ createdAt: -1 });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch target companies", error: error.message });
  }
});

// POST /: Add a target company
router.post("/", async (req, res) => {
  try {
    const {
      name,
      role,
      status,
      priority,
      package: pkg,
      location,
      website,
      requiredSkills,
      expectedRounds,
      dsaTopics,
      aptitudeNotes,
      experienceNotes,
      checklist,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Company name is required." });
    }

    const VALID_STATUSES = [
      "Targeting",
      "Applied",
      "Shortlisted",
      "Online Assessment",
      "Technical Round 1",
      "Technical Round 2",
      "HR Round",
      "Interviewing",
      "Offered",
      "Rejected",
    ];

    const company = await TargetCompany.create({
      name: name.trim(),
      role: role ? role.trim() : "Software Development Engineer",
      status: VALID_STATUSES.includes(status) ? status : "Targeting",
      priority: ["Dream", "Target", "Safety"].includes(priority) ? priority : "Target",
      package: pkg ? pkg.trim() : "",
      location: location ? location.trim() : "",
      website: website ? website.trim() : "",
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills.map((s) => s.trim()).filter(Boolean) : [],
      expectedRounds: Array.isArray(expectedRounds) ? expectedRounds : [],
      dsaTopics: Array.isArray(dsaTopics) ? dsaTopics.map((t) => t.trim()).filter(Boolean) : [],
      aptitudeNotes: aptitudeNotes ? aptitudeNotes.trim() : "",
      experienceNotes: experienceNotes ? experienceNotes.trim() : "",
      checklist: Array.isArray(checklist) ? checklist : [],
      userId: req.user.id,
    });

    res.status(201).json(company);
  } catch (error) {
    res.status(400).json({ message: error.message || "Failed to add target company" });
  }
});

// PATCH /:id: Update an owned target company
router.patch("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid company ID." });
    }

    const allowedFields = [
      "name",
      "role",
      "status",
      "priority",
      "package",
      "location",
      "website",
      "requiredSkills",
      "expectedRounds",
      "dsaTopics",
      "aptitudeNotes",
      "experienceNotes",
      "checklist",
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    const company = await TargetCompany.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updates },
      { returnDocument: "after", runValidators: true }
    );

    if (!company) {
      return res.status(404).json({ message: "Company not found or unauthorized" });
    }

    res.json(company);
  } catch (error) {
    res.status(400).json({ message: error.message || "Failed to update target company" });
  }
});

// DELETE /:id: Delete an owned target company
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid company ID." });
    }

    const company = await TargetCompany.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!company) {
      return res.status(404).json({ message: "Company not found or unauthorized" });
    }

    res.json({ message: "Company removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to delete target company" });
  }
});

module.exports = router;
