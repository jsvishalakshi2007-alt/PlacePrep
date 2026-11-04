import { useState, useEffect } from "react";
import {
  getSkills,
  getSkillsGapAnalysis,
  addSkill,
  updateSkill,
  deleteSkill,
} from "../api/skillApi";
import {
  getResumes,
  uploadResumeFile,
  replaceResumeFile,
  updateResume,
  deleteResume,
  getResumePreviewUrl,
  downloadResumeBlob,
} from "../api/resumeApi";
import Badge from "../components/common/Badge";
import Modal from "../components/common/Modal";
import EmptyState from "../components/common/EmptyState";
import StatCard from "../components/common/StatCard";
import ProgressBar from "../components/common/ProgressBar";

const CATEGORIES = [
  "All",
  "Programming",
  "Technical",
  "Core Subjects",
  "Tools",
  "Soft Skills",
  "Other",
];

const PROFICIENCIES = ["Beginner", "Intermediate", "Advanced", "Expert"];

const POPULAR_SKILLS = [
  { name: "Python", category: "Programming" },
  { name: "Java", category: "Programming" },
  { name: "C++", category: "Programming" },
  { name: "JavaScript", category: "Programming" },
  { name: "React", category: "Technical" },
  { name: "Node.js", category: "Technical" },
  { name: "SQL", category: "Core Subjects" },
  { name: "MongoDB", category: "Technical" },
  { name: "DSA", category: "Core Subjects" },
  { name: "System Design", category: "Technical" },
  { name: "DBMS", category: "Core Subjects" },
  { name: "Operating Systems", category: "Core Subjects" },
  { name: "Computer Networks", category: "Core Subjects" },
  { name: "Git", category: "Tools" },
  { name: "Docker", category: "Tools" },
];

const getProficiencyPercent = (prof) => {
  switch (prof) {
    case "Beginner":
      return 25;
    case "Intermediate":
      return 50;
    case "Advanced":
      return 75;
    case "Expert":
      return 100;
    default:
      return 50;
  }
};

const getProficiencyColor = (prof) => {
  switch (prof) {
    case "Beginner":
      return "#3B82F6"; // blue
    case "Intermediate":
      return "#EAB308"; // amber
    case "Advanced":
      return "#10B981"; // green
    case "Expert":
      return "#8B5CF6"; // purple
    default:
      return "var(--color-primary)";
  }
};

const formatFileSize = (bytes) => {
  if (!bytes || isNaN(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileExtBadge = (fileType, originalName, fileUrl) => {
  const name = (originalName || fileUrl || "").toLowerCase();
  if (name.endsWith(".pdf") || (fileType && fileType.includes("pdf"))) return "PDF";
  if (name.endsWith(".docx") || (fileType && fileType.includes("wordprocessingml"))) return "DOCX";
  if (name.endsWith(".doc") || (fileType && fileType.includes("msword"))) return "DOC";
  return "DOCUMENT";
};

export default function SkillsAnalyzer() {
  const [activeTab, setActiveTab] = useState("skills"); // 'skills' | 'resumes'

  // Skills state
  const [skills, setSkills] = useState([]);
  const [gapAnalysis, setGapAnalysis] = useState(null);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [proficiencyFilter, setProficiencyFilter] = useState("All");
  const [searchSkill, setSearchSkill] = useState("");
  const [refreshSkillsKey, setRefreshSkillsKey] = useState(0);

  // Resume state
  const [resumes, setResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [refreshResumesKey, setRefreshResumesKey] = useState(0);

  // Skill modal
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState(null);
  const [skillForm, setSkillForm] = useState({
    name: "",
    category: "Programming",
    proficiency: "Intermediate",
    projectsUsedIn: "",
  });

  // Resume Upload modal
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [resumeForm, setResumeForm] = useState({
    title: "",
    version: "1.0",
    targetRole: "Software Engineer",
    changelog: "",
    isPrimary: false,
  });

  // Replace Resume modal
  const [replaceModalOpen, setReplaceModalOpen] = useState(false);
  const [replaceTargetResume, setReplaceTargetResume] = useState(null);
  const [replaceFile, setReplaceFile] = useState(null);
  const [replaceVersion, setReplaceVersion] = useState("");
  const [replaceChangelog, setReplaceChangelog] = useState("");

  // In-App Preview Resume Modal
  const [previewModalResume, setPreviewModalResume] = useState(null);

  // Fetch Skills & Gap Analysis
  useEffect(() => {
    let isMounted = true;
    async function loadSkillsData() {
      try {
        const [skillsData, gapData] = await Promise.all([
          getSkills({ category: categoryFilter !== "All" ? categoryFilter : undefined }),
          getSkillsGapAnalysis(),
        ]);
        if (isMounted) {
          setSkills(Array.isArray(skillsData) ? skillsData : []);
          setGapAnalysis(gapData);
        }
      } catch (err) {
        console.error("Skills fetch error:", err);
      } finally {
        if (isMounted) setLoadingSkills(false);
      }
    }

    loadSkillsData();
    return () => {
      isMounted = false;
    };
  }, [categoryFilter, refreshSkillsKey]);

  // Fetch Resumes
  useEffect(() => {
    let isMounted = true;
    if (activeTab === "resumes") {
      async function loadResumesData() {
        try {
          const data = await getResumes();
          if (isMounted) {
            setResumes(Array.isArray(data) ? data : []);
          }
        } catch (err) {
          console.error("Resumes fetch error:", err);
        } finally {
          if (isMounted) setLoadingResumes(false);
        }
      }

      loadResumesData();
    }
    return () => {
      isMounted = false;
    };
  }, [activeTab, refreshResumesKey]);

  // Skill Handlers
  const handleOpenAddSkill = () => {
    setEditingSkillId(null);
    setSkillForm({
      name: "",
      category: "Programming",
      proficiency: "Intermediate",
      projectsUsedIn: "",
    });
    setSkillModalOpen(true);
  };

  const handleOpenEditSkill = (sk) => {
    setEditingSkillId(sk._id);
    setSkillForm({
      name: sk.name,
      category: sk.category || "Programming",
      proficiency: sk.proficiency || "Intermediate",
      projectsUsedIn: sk.projectsUsedIn || "",
    });
    setSkillModalOpen(true);
  };

  const handleSkillSubmit = async (e) => {
    e.preventDefault();
    if (!skillForm.name.trim()) return;

    try {
      if (editingSkillId) {
        await updateSkill(editingSkillId, skillForm);
      } else {
        await addSkill(skillForm);
      }
      setSkillModalOpen(false);
      setRefreshSkillsKey((k) => k + 1);
      window.dispatchEvent(new Event("placeprep:data_updated"));
    } catch (err) {
      alert(err.message || "Failed to save skill");
    }
  };

  const handleDeleteSkill = async (id) => {
    if (!window.confirm("Remove this skill?")) return;
    try {
      await deleteSkill(id);
      setRefreshSkillsKey((k) => k + 1);
      window.dispatchEvent(new Event("placeprep:data_updated"));
    } catch (err) {
      alert(err.message || "Failed to delete skill");
    }
  };

  const handleQuickAddSkill = async (preset) => {
    const existing = skills.find((s) => s.name.toLowerCase() === preset.name.toLowerCase());
    if (existing) {
      alert(`"${preset.name}" is already in your skills inventory!`);
      return;
    }
    try {
      await addSkill({
        name: preset.name,
        category: preset.category,
        proficiency: "Intermediate",
        projectsUsedIn: "",
      });
      setRefreshSkillsKey((k) => k + 1);
      window.dispatchEvent(new Event("placeprep:data_updated"));
    } catch (err) {
      alert(err.message || "Failed to add skill");
    }
  };

  const handleAddMissingSkill = async (skillName) => {
    const existing = skills.find((s) => s.name.toLowerCase() === skillName.toLowerCase());
    if (existing) {
      alert(`"${skillName}" is already in your skills inventory!`);
      return;
    }
    try {
      await addSkill({
        name: skillName,
        category: "Technical",
        proficiency: "Intermediate",
        projectsUsedIn: "",
      });
      setRefreshSkillsKey((k) => k + 1);
      window.dispatchEvent(new Event("placeprep:data_updated"));
    } catch (err) {
      alert(err.message || "Failed to add missing skill");
    }
  };

  const handleQuickUpdateProficiency = async (sk, newProf) => {
    if (sk.proficiency === newProf) return;
    try {
      setSkills((prev) =>
        prev.map((item) => (item._id === sk._id ? { ...item, proficiency: newProf } : item))
      );
      await updateSkill(sk._id, { proficiency: newProf });
      setRefreshSkillsKey((k) => k + 1);
      window.dispatchEvent(new Event("placeprep:data_updated"));
    } catch (err) {
      alert(err.message || "Failed to update proficiency");
      setRefreshSkillsKey((k) => k + 1);
    }
  };

  // Resume Handlers
  const handleOpenAddResume = () => {
    setResumeFile(null);
    setUploadError("");
    setResumeForm({
      title: "",
      version: `v${resumes.length + 1}.0`,
      targetRole: "Software Engineer",
      changelog: "Initial upload",
      isPrimary: resumes.length === 0,
    });
    setResumeModalOpen(true);
  };

  const handleResumeFileChange = (e) => {
    const file = e.target.files[0];
    setUploadError("");
    if (!file) {
      setResumeFile(null);
      return;
    }
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "docx", "doc"].includes(ext)) {
      setUploadError("Only PDF and Word documents (.pdf, .docx, .doc) are supported.");
      setResumeFile(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File exceeds 10MB limit. Please upload a smaller file.");
      setResumeFile(null);
      return;
    }
    setResumeFile(file);
    if (!resumeForm.title) {
      const baseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
      setResumeForm((prev) => ({ ...prev, title: baseName }));
    }
  };

  const handleResumeSubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
      setUploadError("Please select a resume file (.pdf or .docx) to upload.");
      return;
    }

    try {
      setUploading(true);
      setUploadError("");
      const formData = new FormData();
      formData.append("resumeFile", resumeFile);
      formData.append("title", resumeForm.title.trim());
      formData.append("version", resumeForm.version.trim());
      formData.append("targetRole", resumeForm.targetRole.trim());
      formData.append("changelog", resumeForm.changelog.trim());
      formData.append("isPrimary", String(resumeForm.isPrimary));

      await uploadResumeFile(formData);
      setResumeModalOpen(false);
      setResumeFile(null);
      setRefreshResumesKey((k) => k + 1);
      window.dispatchEvent(new Event("placeprep:data_updated"));
    } catch (err) {
      setUploadError(err.message || "Failed to upload resume");
    } finally {
      setUploading(false);
    }
  };

  const handleOpenReplace = (r) => {
    setReplaceTargetResume(r);
    setReplaceFile(null);
    setUploadError("");
    const curNum = parseFloat((r.version || "1.0").replace(/[^0-9.]/g, "")) || 1.0;
    setReplaceVersion(`v${(curNum + 0.1).toFixed(1)}`);
    setReplaceChangelog("");
    setReplaceModalOpen(true);
  };

  const handleReplaceFileChange = (e) => {
    const file = e.target.files[0];
    setUploadError("");
    if (!file) {
      setReplaceFile(null);
      return;
    }
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "docx", "doc"].includes(ext)) {
      setUploadError("Only PDF and Word documents (.pdf, .docx, .doc) are supported.");
      setReplaceFile(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File exceeds 10MB limit. Please upload a smaller file.");
      setReplaceFile(null);
      return;
    }
    setReplaceFile(file);
  };

  const handleReplaceSubmit = async (e) => {
    e.preventDefault();
    if (!replaceFile || !replaceTargetResume) {
      setUploadError("Please select a replacement resume file.");
      return;
    }

    try {
      setUploading(true);
      setUploadError("");
      const formData = new FormData();
      formData.append("resumeFile", replaceFile);
      if (replaceVersion) formData.append("version", replaceVersion.trim());
      if (replaceChangelog) formData.append("changelog", replaceChangelog.trim());

      await replaceResumeFile(replaceTargetResume._id, formData);
      setReplaceModalOpen(false);
      setReplaceFile(null);
      setReplaceTargetResume(null);
      setRefreshResumesKey((k) => k + 1);
      window.dispatchEvent(new Event("placeprep:data_updated"));
    } catch (err) {
      setUploadError(err.message || "Failed to replace resume");
    } finally {
      setUploading(false);
    }
  };

  const handlePreviewResume = (r) => {
    setPreviewModalResume(r);
  };

  const handleDownloadResume = async (r) => {
    try {
      const fileName = r.originalName || `${r.title || "resume"}.pdf`;
      await downloadResumeBlob(r._id, fileName);
    } catch (err) {
      alert("Failed to download resume: " + err.message);
    }
  };

  const handleDeleteResume = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this resume version and file?")) {
      return;
    }
    try {
      await deleteResume(id);
      setRefreshResumesKey((k) => k + 1);
      window.dispatchEvent(new Event("placeprep:data_updated"));
    } catch (err) {
      alert(err.message || "Failed to delete resume");
    }
  };

  const handleSetPrimaryResume = async (r) => {
    try {
      await updateResume(r._id, { isPrimary: true });
      setRefreshResumesKey((k) => k + 1);
      window.dispatchEvent(new Event("placeprep:data_updated"));
    } catch (err) {
      alert(err.message || "Failed to set primary resume");
    }
  };

  // Filter skills by search query and proficiency
  const filteredSkills = skills.filter((sk) => {
    if (categoryFilter !== "All" && sk.category !== categoryFilter) return false;
    if (proficiencyFilter !== "All" && sk.proficiency !== proficiencyFilter) return false;
    if (searchSkill.trim()) {
      const term = searchSkill.toLowerCase().trim();
      const matchName = sk.name.toLowerCase().includes(term);
      const matchCat = sk.category && sk.category.toLowerCase().includes(term);
      const matchProj = sk.projectsUsedIn && sk.projectsUsedIn.toLowerCase().includes(term);
      if (!matchName && !matchCat && !matchProj) return false;
    }
    return true;
  });

  const matchRate = gapAnalysis?.overallMatchRate || 0;
  const advancedCount = skills.filter((s) => s.proficiency === "Advanced" || s.proficiency === "Expert").length;

  return (
    <div>
      {/* Top Stat Cards */}
      <div className="stat-card-grid" style={{ marginBottom: "20px" }}>
        <StatCard
          icon="⚡"
          iconColor="green"
          label="Skills Match Rate"
          value={`${matchRate}%`}
          secondaryText="Coverage of target company skills"
        />
        <StatCard
          icon="★"
          iconColor="purple"
          label="Advanced & Expert"
          value={advancedCount}
          secondaryText={`${skills.length} total technical skills`}
        />
        <StatCard
          icon="⚠"
          iconColor="amber"
          label="Missing Skills"
          value={gapAnalysis?.overallMissing?.length || 0}
          secondaryText="Required by target companies"
        />
        <StatCard
          icon="📄"
          iconColor="blue"
          label="Resume Versions"
          value={resumes.length}
          secondaryText="Targeting tailored roles"
        />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--color-border)", marginBottom: "20px" }}>
        <button
          type="button"
          onClick={() => setActiveTab("skills")}
          style={{
            padding: "10px 18px",
            fontSize: "14px",
            fontWeight: 600,
            color: activeTab === "skills" ? "var(--color-primary)" : "var(--color-text-secondary)",
            borderBottom: activeTab === "skills" ? "2px solid var(--color-primary)" : "none",
            background: "none",
            cursor: "pointer",
          }}
        >
          Skills Inventory & Gap Analyzer
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("resumes")}
          style={{
            padding: "10px 18px",
            fontSize: "14px",
            fontWeight: 600,
            color: activeTab === "resumes" ? "var(--color-primary)" : "var(--color-text-secondary)",
            borderBottom: activeTab === "resumes" ? "2px solid var(--color-primary)" : "none",
            background: "none",
            cursor: "pointer",
          }}
        >
          Resume Versions & Tracking
        </button>
      </div>

      {activeTab === "skills" ? (
        <div>
          {/* Skills Gap Analysis Banner */}
          {gapAnalysis && (
            <div className="card" style={{ marginBottom: "24px" }}>
              <div className="card-header">
                <h2>Target Company Skills Gap Analysis</h2>
                <Badge variant={matchRate >= 80 ? "green" : matchRate >= 50 ? "amber" : "red"}>
                  {matchRate}% Overall Alignment
                </Badge>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <ProgressBar
                  value={matchRate}
                  max={100}
                  color={matchRate >= 75 ? "var(--color-primary)" : "var(--color-accent)"}
                  height={8}
                />
              </div>

              {/* Per-company breakdown pills */}
              {gapAnalysis.byCompany?.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px", marginTop: "14px" }}>
                  {gapAnalysis.byCompany.map((c) => (
                    <div
                      key={c.companyId}
                      style={{
                        padding: "12px 14px",
                        background: "var(--color-surface-hover)",
                        borderRadius: "var(--radius-md)",
                        borderLeft: `3px solid ${c.matchPercent >= 80 ? "var(--color-accent)" : "var(--color-warning)"}`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <strong style={{ fontSize: "14px" }}>{c.companyName}</strong>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: c.matchPercent >= 75 ? "var(--color-accent)" : "var(--color-warning)" }}>
                          {c.matchPercent}% match
                        </span>
                      </div>
                      <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "8px" }}>
                        {c.matchedCount} of {c.totalRequired} skills matched
                      </p>

                      {c.missing?.length > 0 && (
                        <div>
                          <span style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: 600, color: "var(--color-danger)" }}>
                            Missing Skills to acquire (Click to add):
                          </span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                            {c.missing.map((sk, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleAddMissingSkill(sk)}
                                title={`Click to add ${sk} to your skills inventory`}
                                style={{
                                  background: "rgba(239, 68, 68, 0.12)",
                                  color: "var(--color-danger)",
                                  border: "1px solid rgba(239, 68, 68, 0.28)",
                                  borderRadius: "var(--radius-full)",
                                  padding: "3px 8px",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                + {sk}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                  Add target companies in the <strong>Company Hub</strong> to see personalized skill gap matches.
                </p>
              )}
            </div>
          )}

          {/* Quick Add Common Placement Skills Bar */}
          <div
            style={{
              padding: "14px 16px",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                ⚡ Quick Add Placement Skills
              </span>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                Click any chip to instantly add to your inventory
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {POPULAR_SKILLS.map((pop) => {
                const isAdded = skills.some((s) => s.name.toLowerCase() === pop.name.toLowerCase());
                return (
                  <button
                    key={pop.name}
                    type="button"
                    onClick={() => handleQuickAddSkill(pop)}
                    disabled={isAdded}
                    style={{
                      padding: "5px 11px",
                      fontSize: "12px",
                      fontWeight: 600,
                      borderRadius: "var(--radius-full)",
                      border: `1px solid ${isAdded ? "var(--color-border)" : "var(--color-primary-light)"}`,
                      background: isAdded ? "var(--color-surface-hover)" : "var(--color-soft-green)",
                      color: isAdded ? "var(--color-text-muted)" : "var(--color-primary)",
                      cursor: isAdded ? "default" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      transition: "all 0.15s ease",
                    }}
                    title={isAdded ? "Already in skills inventory" : `Add ${pop.name} to skills`}
                  >
                    <span>{isAdded ? "✓" : "+"}</span>
                    <span>{pop.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Bar with Search & Filters */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "14px",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Search skills..."
                value={searchSkill}
                onChange={(e) => setSearchSkill(e.target.value)}
                style={{ width: "200px" }}
              />

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ width: "170px" }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "All" ? "All Categories" : cat}
                  </option>
                ))}
              </select>

              <select
                value={proficiencyFilter}
                onChange={(e) => setProficiencyFilter(e.target.value)}
                style={{ width: "160px" }}
              >
                <option value="All">All Proficiencies</option>
                {PROFICIENCIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <button type="button" className="btn btn-primary" onClick={handleOpenAddSkill}>
              + Add Skill
            </button>
          </div>

          {/* Skills Grid */}
          {loadingSkills ? (
            <p style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-muted)" }}>
              Loading skills inventory...
            </p>
          ) : filteredSkills.length === 0 ? (
            <div className="card">
              <EmptyState
                icon="⚡"
                title="No skills found"
                message={
                  searchSkill || categoryFilter !== "All" || proficiencyFilter !== "All"
                    ? "Try adjusting your search query or filter options."
                    : "Add your technical skills across Programming, Technical Frameworks, Core Subjects, Tools, and Soft Skills to analyze your placement readiness."
                }
                actionLabel="+ Add Skill"
                onAction={handleOpenAddSkill}
              />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              {filteredSkills.map((sk) => {
                const pct = getProficiencyPercent(sk.proficiency);
                const color = getProficiencyColor(sk.proficiency);

                return (
                  <div
                    key={sk._id}
                    className="card"
                    style={{
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                        <div>
                          <strong style={{ fontSize: "15px", display: "block" }}>{sk.name}</strong>
                          <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                            {sk.category}
                          </span>
                        </div>
                        <Badge
                          variant={
                            sk.proficiency === "Expert"
                              ? "purple"
                              : sk.proficiency === "Advanced"
                              ? "green"
                              : sk.proficiency === "Intermediate"
                              ? "amber"
                              : "blue"
                          }
                        >
                          {sk.proficiency}
                        </Badge>
                      </div>

                      {sk.projectsUsedIn && (
                        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "4px 0 10px" }}>
                          🛠️ {sk.projectsUsedIn}
                        </p>
                      )}

                      {/* Progress Tracking Meter */}
                      <div style={{ marginTop: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "4px" }}>
                          <span>Proficiency Meter</span>
                          <strong style={{ color }}>
                            {pct}% ({sk.proficiency})
                          </strong>
                        </div>
                        <ProgressBar value={pct} color={color} height={6} />
                      </div>

                      {/* 1-Click Interactive Level Controls */}
                      <div style={{ marginTop: "10px", display: "flex", gap: "4px" }}>
                        {PROFICIENCIES.map((lvl) => {
                          const isActive = sk.proficiency === lvl;
                          return (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => handleQuickUpdateProficiency(sk, lvl)}
                              style={{
                                flex: 1,
                                padding: "4px 2px",
                                fontSize: "10px",
                                fontWeight: 700,
                                borderRadius: "var(--radius-sm)",
                                border: `1px solid ${isActive ? color : "var(--color-border)"}`,
                                background: isActive ? color : "var(--color-surface-hover)",
                                color: isActive ? "#ffffff" : "var(--color-text-secondary)",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                              title={`Click to set proficiency directly to ${lvl}`}
                            >
                              {lvl.slice(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px", paddingTop: "8px", borderTop: "1px solid var(--color-border-subtle)" }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => handleOpenEditSkill(sk)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteSkill(sk._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Tab 2: Resume Versions & Management */
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 4px" }}>
                Interactive Resume Version Control
              </h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "13px", margin: 0 }}>
                Upload, preview, download, and manage tailored resumes (.PDF & .DOCX) for different job profiles.
              </p>
            </div>
            <button type="button" className="btn btn-primary" onClick={handleOpenAddResume}>
              + Upload Resume File
            </button>
          </div>

          {loadingResumes ? (
            <p style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-muted)" }}>
              Loading resume records...
            </p>
          ) : resumes.length === 0 ? (
            <div className="card">
              <EmptyState
                icon="📄"
                title="No resume versions uploaded"
                message="Upload your PDF or Word resume documents to maintain full version history, instant previews, and downloads."
                actionLabel="+ Upload Resume File"
                onAction={handleOpenAddResume}
              />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {resumes.map((r) => {
                const ext = getFileExtBadge(r.fileType, r.originalName, r.fileUrl);
                const uploadDate = r.createdAt
                  ? new Date(r.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Recently";
                const sizeStr = formatFileSize(r.fileSize);

                return (
                  <div
                    key={r._id}
                    className="card"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "16px",
                      borderLeft: r.isPrimary ? "4px solid var(--color-primary)" : "1px solid var(--color-border)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                      <div
                        style={{
                          width: "48px",
                          height: "54px",
                          borderRadius: "var(--radius-sm)",
                          background: ext === "PDF" ? "rgba(239, 68, 68, 0.12)" : "rgba(59, 130, 246, 0.12)",
                          color: ext === "PDF" ? "#DC2626" : "#2563EB",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "12px",
                          border: `1px solid ${ext === "PDF" ? "rgba(239, 68, 68, 0.25)" : "rgba(59, 130, 246, 0.25)"}`,
                          flexShrink: 0,
                        }}
                      >
                        <span style={{ fontSize: "16px" }}>📄</span>
                        <span>{ext}</span>
                      </div>

                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                          <strong style={{ fontSize: "16px" }}>{r.title}</strong>
                          <Badge variant="blue">{r.version}</Badge>
                          {r.isPrimary && <Badge variant="green">Primary Active</Badge>}
                        </div>

                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "4px" }}>
                          <span>Target: <strong>{r.targetRole}</strong></span>
                          {r.originalName && <span>File: <em>{r.originalName}</em></span>}
                          {sizeStr && <span>Size: {sizeStr}</span>}
                          <span>Uploaded: {uploadDate}</span>
                        </div>

                        {r.changelog && (
                          <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
                            📝 {r.changelog}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => handlePreviewResume(r)}
                        style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
                        title="Open file preview in new tab"
                      >
                        👁️ Preview
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => handleDownloadResume(r)}
                        title="Download file to computer"
                      >
                        ⬇ Download
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => handleOpenReplace(r)}
                        title="Replace this resume with an updated document"
                      >
                        🔄 Replace
                      </button>
                      {!r.isPrimary && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          onClick={() => handleSetPrimaryResume(r)}
                        >
                          Make Primary
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteResume(r._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Skill Modal */}
      {skillModalOpen && (
        <Modal
          open={true}
          title={editingSkillId ? "Edit Technical Skill" : "Add Technical Skill"}
          onClose={() => setSkillModalOpen(false)}
        >
          <form onSubmit={handleSkillSubmit}>
            <div className="form-group">
              <label>Skill Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. React, Python, Docker, PostgreSQL"
                value={skillForm.name}
                onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select
                  value={skillForm.category}
                  onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value })}
                >
                  {CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Proficiency</label>
                <select
                  value={skillForm.proficiency}
                  onChange={(e) => setSkillForm({ ...skillForm, proficiency: e.target.value })}
                >
                  {PROFICIENCIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Projects / Use Cases</label>
              <input
                type="text"
                placeholder="e.g. Built PlacePrep frontend with React 19"
                value={skillForm.projectsUsedIn}
                onChange={(e) => setSkillForm({ ...skillForm, projectsUsedIn: e.target.value })}
              />
            </div>

            <div className="modal-footer" style={{ margin: "20px -24px -24px", padding: "16px 24px" }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setSkillModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingSkillId ? "Save Changes" : "Add Skill"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Resume Upload Modal */}
      {resumeModalOpen && (
        <Modal
          open={true}
          title="Upload Resume Document"
          onClose={() => setResumeModalOpen(false)}
        >
          <form onSubmit={handleResumeSubmit}>
            {uploadError && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid var(--color-danger)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--color-danger)",
                  fontSize: "13px",
                  marginBottom: "16px",
                }}
              >
                {uploadError}
              </div>
            )}

            <div className="form-group">
              <label>Select Resume File (.PDF, .DOCX) *</label>
              <input
                type="file"
                required
                accept=".pdf,.docx,.doc"
                onChange={handleResumeFileChange}
                style={{
                  padding: "8px",
                  border: "1px dashed var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  width: "100%",
                }}
              />
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px", display: "block" }}>
                Max size: 10MB. Supports PDF and Microsoft Word (.docx, .doc).
              </span>
            </div>

            <div className="form-group">
              <label>Resume Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. SDE-1 Generalist Resume"
                value={resumeForm.title}
                onChange={(e) => setResumeForm({ ...resumeForm, title: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Version Tag</label>
                <input
                  type="text"
                  placeholder="e.g. v1.0"
                  value={resumeForm.version}
                  onChange={(e) => setResumeForm({ ...resumeForm, version: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Target Role</label>
                <input
                  type="text"
                  placeholder="e.g. Software Engineer, Backend"
                  value={resumeForm.targetRole}
                  onChange={(e) => setResumeForm({ ...resumeForm, targetRole: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Changelog / Version Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. Added PlacePrep full-stack project and updated LeetCode profile"
                value={resumeForm.changelog}
                onChange={(e) => setResumeForm({ ...resumeForm, changelog: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={resumeForm.isPrimary}
                  onChange={(e) => setResumeForm({ ...resumeForm, isPrimary: e.target.checked })}
                />
                Set as Primary Active Resume
              </label>
            </div>

            <div className="modal-footer" style={{ margin: "20px -24px -24px", padding: "16px 24px" }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setResumeModalOpen(false)}
                disabled={uploading}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={uploading}>
                {uploading ? "Uploading..." : "Upload & Save Resume"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Replace Resume Modal */}
      {replaceModalOpen && replaceTargetResume && (
        <Modal
          open={true}
          title={`Replace Resume — ${replaceTargetResume.title}`}
          onClose={() => setReplaceModalOpen(false)}
        >
          <form onSubmit={handleReplaceSubmit}>
            {uploadError && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid var(--color-danger)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--color-danger)",
                  fontSize: "13px",
                  marginBottom: "16px",
                }}
              >
                {uploadError}
              </div>
            )}

            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "16px" }}>
              Upload an updated PDF or DOCX file to replace the existing document for <strong>{replaceTargetResume.title}</strong>. The old file on disk will be cleanly updated.
            </p>

            <div className="form-group">
              <label>Select Replacement File (.PDF, .DOCX) *</label>
              <input
                type="file"
                required
                accept=".pdf,.docx,.doc"
                onChange={handleReplaceFileChange}
                style={{
                  padding: "8px",
                  border: "1px dashed var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  width: "100%",
                }}
              />
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px", display: "block" }}>
                Max size: 10MB.
              </span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Updated Version Tag</label>
                <input
                  type="text"
                  placeholder="e.g. v1.1"
                  value={replaceVersion}
                  onChange={(e) => setReplaceVersion(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Replacement Changelog</label>
                <input
                  type="text"
                  placeholder="e.g. Corrected graduation year and added certifications"
                  value={replaceChangelog}
                  onChange={(e) => setReplaceChangelog(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer" style={{ margin: "20px -24px -24px", padding: "16px 24px" }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setReplaceModalOpen(false)}
                disabled={uploading}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={uploading}>
                {uploading ? "Updating..." : "Replace Resume File"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* In-App Resume Preview Modal */}
      {previewModalResume && (
        <Modal
          open={true}
          title={`Resume Preview — ${previewModalResume.title} (${previewModalResume.version})`}
          onClose={() => setPreviewModalResume(null)}
          className="modal-lg"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                background: "var(--color-surface-hover)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "20px" }}>📄</span>
                <div>
                  <strong style={{ fontSize: "14px", display: "block" }}>
                    {previewModalResume.originalName || previewModalResume.title}
                  </strong>
                  <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                    Target Role: <strong>{previewModalResume.targetRole}</strong> &bull; {formatFileSize(previewModalResume.fileSize)}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <a
                  href={getResumePreviewUrl(previewModalResume._id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline"
                  style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                >
                  ↗ Open in Tab
                </a>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => handleDownloadResume(previewModalResume)}
                >
                  ⬇ Download File
                </button>
              </div>
            </div>

            {/* Embedded Previewer */}
            {getFileExtBadge(previewModalResume.fileType, previewModalResume.originalName, previewModalResume.fileUrl) === "PDF" ? (
              <iframe
                src={getResumePreviewUrl(previewModalResume._id)}
                title={previewModalResume.title}
                style={{
                  width: "100%",
                  height: "70vh",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "#ffffff",
                }}
              />
            ) : (
              <div
                style={{
                  padding: "48px 24px",
                  textAlign: "center",
                  background: "var(--color-surface-hover)",
                  borderRadius: "var(--radius-md)",
                  border: "1px dashed var(--color-border)",
                }}
              >
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>📝</div>
                <h4 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>
                  Microsoft Word Document (.docx / .doc)
                </h4>
                <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", maxWidth: "420px", margin: "0 auto 16px" }}>
                  Word documents are best viewed directly in Microsoft Word or Google Docs. Click below to download and inspect.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleDownloadResume(previewModalResume)}
                >
                  ⬇ Download {previewModalResume.originalName || "Document"}
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
