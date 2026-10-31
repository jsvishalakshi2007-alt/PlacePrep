const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Skill = require("../models/Skill");
const TargetCompany = require("../models/TargetCompany");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

// GET /gap-analysis: Compute gap between user skills and target company requirements
router.get("/gap-analysis", async (req, res) => {
  try {
    const userId = req.user.id;
    const [userSkills, companies] = await Promise.all([
      Skill.find({ userId }),
      TargetCompany.find({ userId }).select("name role requiredSkills"),
    ]);

    const userSkillNames = new Set(userSkills.map((s) => s.name.toLowerCase().trim()));

    // Collect all required skills across target companies
    const companyAnalysis = companies.map((c) => {
      const required = c.requiredSkills || [];
      const matched = [];
      const missing = [];

      required.forEach((reqSkill) => {
        const normalized = reqSkill.toLowerCase().trim();
        // Check partial or exact match
        const found = userSkills.find(
          (s) => s.name.toLowerCase().trim() === normalized || normalized.includes(s.name.toLowerCase().trim())
        );

        if (found) {
          matched.push({ name: reqSkill, proficiency: found.proficiency });
        } else {
          missing.push(reqSkill);
        }
      });

      const matchPercent = required.length ? Math.round((matched.length / required.length) * 100) : 100;

      return {
        companyId: c._id,
        companyName: c.name,
        role: c.role,
        totalRequired: required.length,
        matchedCount: matched.length,
        missingCount: missing.length,
        matchPercent,
        matched,
        missing,
      };
    });

    // Overall aggregate skills gap
    const allCompanyRequiredSet = new Set();
    companies.forEach((c) => {
      (c.requiredSkills || []).forEach((s) => allCompanyRequiredSet.add(s.trim()));
    });

    const allRequired = Array.from(allCompanyRequiredSet);
    const overallMatched = [];
    const overallMissing = [];

    allRequired.forEach((reqSkill) => {
      const normalized = reqSkill.toLowerCase();
      const match = userSkills.find(
        (s) => s.name.toLowerCase().trim() === normalized || normalized.includes(s.name.toLowerCase().trim())
      );
      if (match) {
        overallMatched.push({ name: reqSkill, proficiency: match.proficiency });
      } else {
        overallMissing.push(reqSkill);
      }
    });

    const overallMatchRate = allRequired.length
      ? Math.round((overallMatched.length / allRequired.length) * 100)
      : userSkills.length > 0
      ? 100
      : 0;

    res.json({
      totalUserSkills: userSkills.length,
      totalRequiredSkillsAcrossCompanies: allRequired.length,
      overallMatchRate,
      overallMatched,
      overallMissing,
      byCompany: companyAnalysis,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to generate skills gap analysis", error: error.message });
  }
});

// GET /: List user skills
router.get("/", async (req, res) => {
  try {
    const filter = { userId: req.user.id };
    if (req.query.category && req.query.category !== "All") {
      filter.category = req.query.category;
    }
    const skills = await Skill.find(filter).sort({ category: 1, name: 1 });
    res.json(skills);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch skills", error: error.message });
  }
});

// POST /: Add a skill
router.post("/", async (req, res) => {
  try {
    const { name, category, proficiency, projectsUsedIn } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Skill name is required." });
    }

    const skill = await Skill.create({
      name: name.trim(),
      category: [
        "Programming",
        "Technical",
        "Core Subjects",
        "Tools",
        "Soft Skills",
        "Language",
        "Frontend",
        "Backend",
        "Database",
        "Cloud & DevOps",
        "CS Fundamentals",
        "Other",
      ].includes(category)
        ? category
        : "Programming",
      proficiency: ["Beginner", "Intermediate", "Advanced", "Expert"].includes(proficiency)
        ? proficiency
        : "Intermediate",
      projectsUsedIn: projectsUsedIn ? projectsUsedIn.trim() : "",
      userId: req.user.id,
    });

    res.status(201).json(skill);
  } catch (error) {
    res.status(400).json({ message: error.message || "Failed to add skill" });
  }
});

// PATCH /:id: Update an owned skill
router.patch("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid skill ID." });
    }

    const allowedFields = ["name", "category", "proficiency", "projectsUsedIn"];
    const updates = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    const skill = await Skill.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updates },
      { returnDocument: "after", runValidators: true }
    );

    if (!skill) {
      return res.status(404).json({ message: "Skill not found or unauthorized" });
    }

    res.json(skill);
  } catch (error) {
    res.status(400).json({ message: error.message || "Failed to update skill" });
  }
});

// DELETE /:id: Delete an owned skill
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid skill ID." });
    }

    const skill = await Skill.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!skill) {
      return res.status(404).json({ message: "Skill not found or unauthorized" });
    }

    res.json({ message: "Skill removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to delete skill" });
  }
});

module.exports = router;
