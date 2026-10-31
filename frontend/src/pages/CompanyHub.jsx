import { useState, useEffect } from "react";
import {
  getCompanies,
  getCompanyPresets,
  addCompany,
  updateCompany,
  deleteCompany,
} from "../api/companyApi";
import { addTask } from "../api/taskApi";
import Badge from "../components/common/Badge";
import Modal from "../components/common/Modal";
import EmptyState from "../components/common/EmptyState";
import StatCard from "../components/common/StatCard";
import ProgressBar from "../components/common/ProgressBar";

const STATUSES = [
  "All",
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
const PRIORITIES = ["Dream", "Target", "Safety"];

const getStatusBadgeVariant = (status) => {
  switch (status) {
    case "Offered":
      return "green";
    case "Technical Round 1":
    case "Technical Round 2":
      return "purple";
    case "Shortlisted":
    case "Online Assessment":
      return "blue";
    case "Interviewing":
      return "amber";
    case "Rejected":
      return "red";
    default:
      return "gray";
  }
};

export default function CompanyHub() {
  const [companies, setCompanies] = useState([]);
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const PIPELINE_ORDER = [
    "Targeting",
    "Applied",
    "Shortlisted",
    "Online Assessment",
    "Technical Round 1",
    "Technical Round 2",
    "HR Round",
    "Interviewing",
    "Offered",
  ];

  // Modals & Detail View
  const [modalOpen, setModalOpen] = useState(false);
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [detailCompany, setDetailCompany] = useState(null);

  // Detail Modal inline forms
  const [newRound, setNewRound] = useState({ name: "", roundType: "Technical (DSA)", description: "" });
  const [newChecklistTask, setNewChecklistTask] = useState("");
  const [newSkillTag, setNewSkillTag] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    role: "Software Development Engineer",
    status: "Targeting",
    priority: "Target",
    package: "",
    location: "",
    website: "",
    requiredSkills: "",
    dsaTopics: "",
    aptitudeNotes: "",
    experienceNotes: "",
    expectedRounds: [],
    checklist: [],
  });

  // Fetch Companies
  useEffect(() => {
    let isMounted = true;
    async function loadCompanies() {
      try {
        const data = await getCompanies({
          status: statusFilter !== "All" ? statusFilter : undefined,
        });
        if (isMounted) {
          setCompanies(Array.isArray(data) ? data : []);
          setError("");
        }
      } catch (err) {
        if (isMounted) setError(err.message || "Failed to load companies");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCompanies();
    return () => {
      isMounted = false;
    };
  }, [statusFilter, refreshKey]);

  // Fetch Presets
  useEffect(() => {
    async function loadPresets() {
      try {
        const data = await getCompanyPresets();
        setPresets(Array.isArray(data) ? data : []);
      } catch {
        // Fallback silently if presets endpoint fails
      }
    }
    loadPresets();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: "",
      role: "Software Development Engineer",
      status: "Targeting",
      priority: "Target",
      package: "",
      location: "",
      website: "",
      requiredSkills: "",
      dsaTopics: "",
      aptitudeNotes: "",
      experienceNotes: "",
      expectedRounds: [
        { name: "Online Assessment", roundType: "Coding", description: "DSA & Aptitude", completed: false },
        { name: "Technical Round 1", roundType: "DSA", description: "Live coding & Problem solving", completed: false },
        { name: "Technical Round 2", roundType: "CS Core", description: "System Design, OOP & DB", completed: false },
        { name: "HR / Behavioral", roundType: "Culture", description: "Behavioral & Fitment", completed: false },
      ],
      checklist: [
        { task: "Tailor resume for job description", completed: false },
        { task: "Solve company-tagged DSA questions", completed: false },
        { task: "Research recent interview experiences", completed: false },
      ],
    });
    setModalOpen(true);
  };

  const handleApplyPreset = (preset) => {
    setEditingId(null);
    setFormData({
      name: preset.name,
      role: preset.role,
      status: "Targeting",
      priority: "Dream",
      package: preset.package,
      location: preset.location,
      website: "",
      requiredSkills: preset.requiredSkills.join(", "),
      dsaTopics: preset.dsaTopics.join(", "),
      aptitudeNotes: preset.aptitudeNotes,
      experienceNotes: "",
      expectedRounds: preset.expectedRounds,
      checklist: preset.checklist,
    });
    setPresetModalOpen(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (comp) => {
    setEditingId(comp._id);
    setFormData({
      name: comp.name,
      role: comp.role,
      status: comp.status,
      priority: comp.priority || "Target",
      package: comp.package || "",
      location: comp.location || "",
      website: comp.website || "",
      requiredSkills: (comp.requiredSkills || []).join(", "),
      dsaTopics: (comp.dsaTopics || []).join(", "),
      aptitudeNotes: comp.aptitudeNotes || "",
      experienceNotes: comp.experienceNotes || "",
      expectedRounds: comp.expectedRounds || [],
      checklist: comp.checklist || [],
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      const payload = {
        ...formData,
        name: formData.name.trim(),
        requiredSkills: formData.requiredSkills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        dsaTopics: formData.dsaTopics
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

      if (editingId) {
        await updateCompany(editingId, payload);
      } else {
        await addCompany(payload);
      }

      setModalOpen(false);
      setRefreshKey((k) => k + 1);
      window.dispatchEvent(new Event("placeprep:data_updated"));
    } catch (err) {
      alert(err.message || "Failed to save company");
    }
  };

  const handleOpenDetail = (comp) => {
    setDetailCompany(comp);
  };

  const handleUpdateDetailCompany = async (updatedFields) => {
    if (!detailCompany) return;
    try {
      const updated = await updateCompany(detailCompany._id, updatedFields);
      setDetailCompany((prev) => ({ ...prev, ...updated }));
      setCompanies((prev) =>
        prev.map((c) => (c._id === detailCompany._id ? { ...c, ...updated } : c))
      );
      window.dispatchEvent(new Event("placeprep:data_updated"));
    } catch (err) {
      alert(err.message || "Failed to update company");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this target company?")) return;
    try {
      await deleteCompany(id);
      if (detailCompany && detailCompany._id === id) {
        setDetailCompany(null);
      }
      setRefreshKey((k) => k + 1);
      window.dispatchEvent(new Event("placeprep:data_updated"));
    } catch (err) {
      alert(err.message || "Failed to delete");
    }
  };

  const handleToggleRound = async (comp, roundIndex) => {
    try {
      const updatedRounds = [...comp.expectedRounds];
      updatedRounds[roundIndex] = {
        ...updatedRounds[roundIndex],
        completed: !updatedRounds[roundIndex].completed,
      };
      await updateCompany(comp._id, { expectedRounds: updatedRounds });
      if (detailCompany && detailCompany._id === comp._id) {
        setDetailCompany((prev) => ({ ...prev, expectedRounds: updatedRounds }));
      }
      setRefreshKey((k) => k + 1);
      window.dispatchEvent(new Event("placeprep:data_updated"));
    } catch (err) {
      alert(err.message || "Failed to update round progress");
    }
  };

  const handleToggleChecklist = async (comp, checkIndex) => {
    try {
      const updatedChecklist = [...comp.checklist];
      updatedChecklist[checkIndex] = {
        ...updatedChecklist[checkIndex],
        completed: !updatedChecklist[checkIndex].completed,
      };
      await updateCompany(comp._id, { checklist: updatedChecklist });
      if (detailCompany && detailCompany._id === comp._id) {
        setDetailCompany((prev) => ({ ...prev, checklist: updatedChecklist }));
      }
      setRefreshKey((k) => k + 1);
      window.dispatchEvent(new Event("placeprep:data_updated"));
    } catch (err) {
      alert(err.message || "Failed to update checklist");
    }
  };

  const handleStatusChange = async (comp, newStatus) => {
    try {
      await updateCompany(comp._id, { status: newStatus });
      if (detailCompany && detailCompany._id === comp._id) {
        setDetailCompany((prev) => ({ ...prev, status: newStatus }));
      }
      setRefreshKey((k) => k + 1);
      window.dispatchEvent(new Event("placeprep:data_updated"));
    } catch (err) {
      alert(err.message || "Failed to update status");
    }
  };

  const handleAddRoundInDetail = async (e) => {
    e.preventDefault();
    if (!detailCompany || !newRound.name.trim()) return;
    const updatedRounds = [
      ...(detailCompany.expectedRounds || []),
      {
        name: newRound.name.trim(),
        type: newRound.type || "Technical",
        description: newRound.description.trim(),
        completed: false,
      },
    ];
    await handleUpdateDetailCompany({ expectedRounds: updatedRounds });
    setNewRound({ name: "", type: "Technical", description: "" });
  };

  const handleToggleRoundInDetail = async (roundIdx) => {
    if (!detailCompany) return;
    const updatedRounds = detailCompany.expectedRounds.map((r, i) =>
      i === roundIdx ? { ...r, completed: !r.completed } : r
    );
    await handleUpdateDetailCompany({ expectedRounds: updatedRounds });
  };

  const handleRemoveRoundInDetail = async (roundIdx) => {
    if (!detailCompany) return;
    const updatedRounds = detailCompany.expectedRounds.filter((_, i) => i !== roundIdx);
    await handleUpdateDetailCompany({ expectedRounds: updatedRounds });
  };

  const handleAddChecklistInDetail = async (e) => {
    e.preventDefault();
    if (!detailCompany || !newChecklistTask.trim()) return;
    const updatedChecklist = [
      ...(detailCompany.checklist || []),
      { task: newChecklistTask.trim(), completed: false },
    ];
    await handleUpdateDetailCompany({ checklist: updatedChecklist });
    setNewChecklistTask("");
  };

  const handleToggleChecklistInDetail = async (checkIdx) => {
    if (!detailCompany) return;
    const updatedChecklist = detailCompany.checklist.map((c, i) =>
      i === checkIdx ? { ...c, completed: !c.completed } : c
    );
    await handleUpdateDetailCompany({ checklist: updatedChecklist });
  };

  const handleRemoveChecklistInDetail = async (checkIdx) => {
    if (!detailCompany) return;
    const updatedChecklist = detailCompany.checklist.filter((_, i) => i !== checkIdx);
    await handleUpdateDetailCompany({ checklist: updatedChecklist });
  };

  const handleAddSkillInDetail = async (e) => {
    e.preventDefault();
    if (!detailCompany || !newSkillTag.trim()) return;
    const tag = newSkillTag.trim();
    if ((detailCompany.requiredSkills || []).includes(tag)) {
      setNewSkillTag("");
      return;
    }
    const updatedSkills = [...(detailCompany.requiredSkills || []), tag];
    await handleUpdateDetailCompany({ requiredSkills: updatedSkills });
    setNewSkillTag("");
  };

  const handleRemoveSkillInDetail = async (skillToRemove) => {
    if (!detailCompany) return;
    const updatedSkills = (detailCompany.requiredSkills || []).filter((s) => s !== skillToRemove);
    await handleUpdateDetailCompany({ requiredSkills: updatedSkills });
  };

  const handleScheduleTaskForCompany = async (comp) => {
    try {
      await addTask({
        title: `Prep for ${comp.name} - ${comp.role || "Technical Round"}`,
        category: "DSA",
        duration: "45 min",
        priority: comp.priority === "Dream" ? "High" : "Medium",
        scheduledDate: new Date().toISOString(),
        completed: false,
      });
      alert(`✓ Study task for ${comp.name} added to your Daily Study Planner!`);
      window.dispatchEvent(new Event("placeprep:data_updated"));
    } catch (err) {
      alert("Failed to schedule task: " + err.message);
    }
  };

  const handleAdvanceStatus = async (comp) => {
    const curIdx = PIPELINE_ORDER.indexOf(comp.status);
    if (curIdx >= 0 && curIdx < PIPELINE_ORDER.length - 1) {
      const nextStatus = PIPELINE_ORDER[curIdx + 1];
      await handleStatusChange(comp, nextStatus);
    }
  };

  // Filtered companies
  const filteredCompanies = companies.filter((c) => {
    if (priorityFilter !== "All" && c.priority !== priorityFilter) return false;
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.role && c.role.toLowerCase().includes(term)) ||
      (c.requiredSkills && c.requiredSkills.some((s) => s.toLowerCase().includes(term)))
    );
  });

  const totalCompanies = companies.length;
  const interviewingCount = companies.filter((c) => c.status === "Interviewing").length;
  const offeredCount = companies.filter((c) => c.status === "Offered").length;
  const dreamCount = companies.filter((c) => c.priority === "Dream").length;

  return (
    <div>
      {/* Metrics Row */}
      <div className="stat-card-grid" style={{ marginBottom: "20px" }}>
        <StatCard
          icon="🏢"
          iconColor="green"
          label="Target Companies"
          value={totalCompanies}
          secondaryText={`${dreamCount} Dream Tier Companies`}
        />
        <StatCard
          icon="♧"
          iconColor="purple"
          label="In Interviews"
          value={interviewingCount}
          secondaryText="Active interview loops"
        />
        <StatCard
          icon="★"
          iconColor="amber"
          label="Offers Secured"
          value={offeredCount}
          secondaryText={offeredCount > 0 ? "Congratulations!" : "Keep preparing"}
        />
        <StatCard
          icon="📋"
          iconColor="blue"
          label="Targeting Status"
          value={companies.filter((c) => c.status === "Targeting").length}
          secondaryText="Preparing application"
        />
      </div>

      {/* Action Bar */}
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
            placeholder="Search company or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "220px" }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: "160px" }}
          >
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {st === "All" ? "All Statuses" : st}
              </option>
            ))}
          </select>

          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {["All", "Dream", "Target", "Safety"].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriorityFilter(p)}
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  borderRadius: "var(--radius-full)",
                  border: `1px solid ${priorityFilter === p ? "var(--color-primary)" : "var(--color-border)"}`,
                  backgroundColor: priorityFilter === p ? "var(--color-primary)" : "var(--color-surface)",
                  color: priorityFilter === p ? "#ffffff" : "var(--color-text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {p === "All" ? "All Priorities" : `${p}`}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setPresetModalOpen(true)}
          >
            ⚡ Pick from Presets
          </button>
          <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
            + Add Target Company
          </button>
        </div>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: "20px", color: "var(--color-danger)" }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-muted)" }}>
          Loading your target companies...
        </p>
      ) : filteredCompanies.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="🏢"
            title="No target companies found"
            message={
              search || statusFilter !== "All"
                ? "Try adjusting your search query or status filter."
                : "Add target companies like Google, Amazon, or your dream tech firms to track interview rounds, required skills, and preparation checklists."
            }
            actionLabel="+ Add Target Company"
            onAction={handleOpenAdd}
          />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px" }}>
          {filteredCompanies.map((comp) => {
            const completedRounds = (comp.expectedRounds || []).filter((r) => r.completed).length;
            const totalRounds = (comp.expectedRounds || []).length;
            const roundProgress = totalRounds ? Math.round((completedRounds / totalRounds) * 100) : 0;

            return (
              <div
                key={comp._id}
                className="card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  borderLeft: `4px solid ${
                    comp.priority === "Dream"
                      ? "var(--color-accent)"
                      : comp.priority === "Target"
                      ? "var(--color-primary)"
                      : "var(--color-border)"
                  }`,
                }}
              >
                <div>
                  {/* Top Bar */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <h2
                          style={{
                            fontSize: "18px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            color: "var(--color-primary)",
                            transition: "color 0.2s ease",
                          }}
                          onClick={() => handleOpenDetail(comp)}
                          title="Click to view detailed preparation plan"
                        >
                          {comp.name}
                          <span style={{ fontSize: "13px", opacity: 0.7 }}>🔍</span>
                        </h2>
                        <Badge
                          variant={
                            comp.priority === "Dream"
                              ? "purple"
                              : comp.priority === "Target"
                              ? "blue"
                              : "green"
                          }
                        >
                          {comp.priority}
                        </Badge>
                      </div>
                      <p style={{ color: "var(--color-text-secondary)", fontSize: "13px", marginTop: "2px" }}>
                        {comp.role}
                      </p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                      <Badge variant={getStatusBadgeVariant(comp.status)}>{comp.status}</Badge>
                      <select
                        value={comp.status}
                        onChange={(e) => handleStatusChange(comp, e.target.value)}
                        style={{
                          fontSize: "11px",
                          padding: "3px 8px",
                          borderRadius: "var(--radius-sm)",
                        }}
                      >
                        {STATUSES.filter((s) => s !== "All").map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Compensation & Location */}
                  <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "14px" }}>
                    {comp.package && <span>💰 {comp.package}</span>}
                    {comp.location && <span>📍 {comp.location}</span>}
                  </div>

                  {/* Interview Rounds Progress */}
                  {totalRounds > 0 && (
                    <div style={{ marginBottom: "16px", padding: "12px", background: "var(--color-surface-hover)", borderRadius: "var(--radius-md)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                        <strong style={{ color: "var(--color-text-primary)" }}>Interview Rounds Progress</strong>
                        <span style={{ color: "var(--color-text-muted)" }}>
                          {completedRounds} / {totalRounds} Cleared ({roundProgress}%)
                        </span>
                      </div>
                      <ProgressBar value={roundProgress} height={6} />

                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "10px" }}>
                        {comp.expectedRounds.map((rnd, idx) => (
                          <label
                            key={idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              fontSize: "12px",
                              cursor: "pointer",
                              textDecoration: rnd.completed ? "line-through" : "none",
                              color: rnd.completed ? "var(--color-text-muted)" : "var(--color-text-primary)",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(rnd.completed)}
                              onChange={() => handleToggleRound(comp, idx)}
                            />
                            <strong>{rnd.name}</strong>
                            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                              ({rnd.roundType})
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Required Skills */}
                  {comp.requiredSkills?.length > 0 && (
                    <div style={{ marginBottom: "14px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                        Required Technical Skills
                      </span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                        {comp.requiredSkills.map((sk, idx) => (
                          <Badge key={idx} variant="green">
                            {sk}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Checklist */}
                  {comp.checklist?.length > 0 && (
                    <div style={{ marginBottom: "14px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                        Preparation Checklist
                      </span>
                      <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginTop: "6px" }}>
                        {comp.checklist.map((chk, idx) => (
                          <label
                            key={idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              fontSize: "12px",
                              cursor: "pointer",
                              color: chk.completed ? "var(--color-text-muted)" : "var(--color-text-primary)",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(chk.completed)}
                              onChange={() => handleToggleChecklist(comp, idx)}
                            />
                            <span style={{ textDecoration: chk.completed ? "line-through" : "none" }}>
                              {chk.task}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes summary */}
                  {(comp.aptitudeNotes || comp.experienceNotes) && (
                    <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "10px", padding: "8px 10px", background: "var(--color-soft-green)", borderRadius: "var(--radius-sm)" }}>
                      💡 {comp.aptitudeNotes || comp.experienceNotes}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--color-border-subtle)", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => handleOpenDetail(comp)}
                      style={{
                        borderColor: "var(--color-primary)",
                        color: "var(--color-primary)",
                        fontWeight: 600,
                      }}
                    >
                      Prep Plan ➔
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => handleScheduleTaskForCompany(comp)}
                      title="Add a 45-minute preparation study session to your Daily Study Planner"
                      style={{ fontSize: "12px" }}
                    >
                      📅 Plan Study
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    {comp.status !== "Offered" && comp.status !== "Rejected" && (
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleAdvanceStatus(comp)}
                        title="Advance candidate to the next interview stage"
                        style={{ fontSize: "11px", padding: "4px 8px" }}
                      >
                        Next Round ⏩
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => handleOpenEdit(comp)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(comp._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preset Modal */}
      {presetModalOpen && (
        <Modal
          title="Pick a Target Company Preset"
          onClose={() => setPresetModalOpen(false)}
          className="modal-lg"
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            {presets.map((preset, idx) => (
              <div
                key={idx}
                className="card"
                style={{
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700 }}>{preset.name}</h3>
                  <p style={{ color: "var(--color-text-secondary)", fontSize: "12px", margin: "4px 0 10px" }}>
                    {preset.role} &bull; {preset.package}
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "12px" }}>
                    {preset.aptitudeNotes}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "12px" }}>
                    {preset.requiredSkills.slice(0, 3).map((s, i) => (
                      <Badge key={i} variant="blue">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleApplyPreset(preset)}
                >
                  Adopt Template
                </button>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Add / Edit Company Modal */}
      {modalOpen && (
        <Modal
          title={editingId ? "Edit Target Company" : "Add Target Company"}
          onClose={() => setModalOpen(false)}
          className="modal-lg"
        >
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google, Amazon, TCS"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Target Role</label>
                <input
                  type="text"
                  placeholder="e.g. SDE-1, Cloud Engineer"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Preparation Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p} Priority
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  {STATUSES.filter((s) => s !== "All").map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Expected Package (CTC)</label>
                <input
                  type="text"
                  placeholder="e.g. 18-24 LPA"
                  value={formData.package}
                  onChange={(e) => setFormData({ ...formData, package: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore / Remote"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Required Technical Skills (comma separated)</label>
              <input
                type="text"
                placeholder="e.g. Java, Spring Boot, React, System Design, SQL"
                value={formData.requiredSkills}
                onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>DSA Preparation Topics (comma separated)</label>
              <input
                type="text"
                placeholder="e.g. Dynamic Programming, Trees, Graphs, Binary Search"
                value={formData.dsaTopics}
                onChange={(e) => setFormData({ ...formData, dsaTopics: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Interview Experience & Tips</label>
              <textarea
                rows={3}
                placeholder="Notes on hiring process, company culture, glassdoor questions..."
                value={formData.experienceNotes}
                onChange={(e) => setFormData({ ...formData, experienceNotes: e.target.value })}
              />
            </div>

            <div className="modal-footer" style={{ margin: "20px -24px -24px", padding: "16px 24px" }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingId ? "Save Changes" : "Create Target Company"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Detailed Preparation View Modal */}
      {detailCompany && (
        <Modal
          title={`${detailCompany.name} — Detailed Preparation Plan`}
          onClose={() => setDetailCompany(null)}
          className="modal-lg"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Top Overview Banner */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                padding: "16px 20px",
                background: "var(--color-surface-hover)",
                borderRadius: "var(--radius-md)",
                borderLeft: `4px solid ${
                  detailCompany.priority === "Dream"
                    ? "var(--color-accent)"
                    : detailCompany.priority === "Target"
                    ? "var(--color-primary)"
                    : "var(--color-border)"
                }`,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h3 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>
                    {detailCompany.name}
                  </h3>
                  <Badge
                    variant={
                      detailCompany.priority === "Dream"
                        ? "purple"
                        : detailCompany.priority === "Target"
                        ? "blue"
                        : "green"
                    }
                  >
                    {detailCompany.priority} Priority
                  </Badge>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "14px",
                    flexWrap: "wrap",
                    fontSize: "13px",
                    color: "var(--color-text-secondary)",
                    marginTop: "6px",
                  }}
                >
                  {detailCompany.role && <span>💼 {detailCompany.role}</span>}
                  {detailCompany.package && <span>💰 {detailCompany.package}</span>}
                  {detailCompany.location && <span>📍 {detailCompany.location}</span>}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => handleScheduleTaskForCompany(detailCompany)}
                  style={{
                    borderColor: "var(--color-primary)",
                    color: "var(--color-primary)",
                    fontWeight: 600,
                    fontSize: "12px",
                  }}
                >
                  📅 Plan Study Task
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)" }}>
                    Status:
                  </label>
                  <select
                    value={detailCompany.status}
                    onChange={(e) => handleStatusChange(detailCompany, e.target.value)}
                    style={{
                      fontSize: "13px",
                      padding: "6px 12px",
                      fontWeight: 600,
                    }}
                  >
                    {STATUSES.filter((s) => s !== "All").map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Rounds Progress Meter */}
            <div>
              {(() => {
                const completedCount = (detailCompany.expectedRounds || []).filter((r) => r.completed).length;
                const totalCount = (detailCompany.expectedRounds || []).length;
                const pct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
                return (
                  <div style={{ padding: "14px 16px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700 }}>
                        Interview Stage Progress ({pct}%)
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                        {completedCount} of {totalCount} rounds cleared
                      </span>
                    </div>
                    <ProgressBar value={pct} height={8} />
                  </div>
                );
              })()}
            </div>

            {/* Section 1: Expected Interview Rounds */}
            <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "16px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🎯</span> Interview Rounds Checklist
              </h4>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                {(detailCompany.expectedRounds || []).length === 0 ? (
                  <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: 0 }}>
                    No interview rounds added yet. Add rounds below to track your progress through the loop.
                  </p>
                ) : (
                  detailCompany.expectedRounds.map((rnd, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        background: rnd.completed ? "var(--color-soft-green)" : "var(--color-surface-hover)",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border-subtle)",
                      }}
                    >
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          fontSize: "13px",
                          cursor: "pointer",
                          flex: 1,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(rnd.completed)}
                          onChange={() => handleToggleRoundInDetail(idx)}
                        />
                        <span
                          style={{
                            fontWeight: 600,
                            textDecoration: rnd.completed ? "line-through" : "none",
                            color: rnd.completed ? "var(--color-text-muted)" : "var(--color-text-primary)",
                          }}
                        >
                          {rnd.name}
                        </span>
                        <Badge variant="blue">{rnd.type}</Badge>
                        {rnd.description && (
                          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                            — {rnd.description}
                          </span>
                        )}
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveRoundInDetail(idx)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--color-danger)",
                          cursor: "pointer",
                          fontSize: "16px",
                          padding: "2px 6px",
                        }}
                        title="Remove round"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Round Form */}
              <form
                onSubmit={handleAddRoundInDetail}
                style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                  flexWrap: "wrap",
                  paddingTop: "12px",
                  borderTop: "1px dashed var(--color-border)",
                }}
              >
                <input
                  type="text"
                  placeholder="Round Name (e.g. Coding Round 1)"
                  value={newRound.name}
                  onChange={(e) => setNewRound({ ...newRound, name: e.target.value })}
                  style={{ flex: "2 1 180px", fontSize: "13px" }}
                />
                <select
                  value={newRound.type}
                  onChange={(e) => setNewRound({ ...newRound, type: e.target.value })}
                  style={{ flex: "1 1 120px", fontSize: "13px" }}
                >
                  <option value="Online Assessment">OA / Aptitude</option>
                  <option value="Technical">Technical</option>
                  <option value="System Design">System Design</option>
                  <option value="Managerial">Managerial</option>
                  <option value="HR">HR / Culture</option>
                </select>
                <input
                  type="text"
                  placeholder="Brief Description (optional)"
                  value={newRound.description}
                  onChange={(e) => setNewRound({ ...newRound, description: e.target.value })}
                  style={{ flex: "2 1 180px", fontSize: "13px" }}
                />
                <button type="submit" className="btn btn-sm btn-primary">
                  + Add Round
                </button>
              </form>
            </div>

            {/* Section 2: Preparation Checklist */}
            <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "16px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>✅</span> Preparation Checklist & Action Items
              </h4>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                {(detailCompany.checklist || []).length === 0 ? (
                  <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: 0 }}>
                    No checklist items yet. Add actionable prep steps below (e.g., "Solve 20 LeetCode Top Tagged", "Study System Architecture").
                  </p>
                ) : (
                  detailCompany.checklist.map((chk, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        background: chk.completed ? "var(--color-soft-green)" : "var(--color-surface-hover)",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border-subtle)",
                      }}
                    >
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          fontSize: "13px",
                          cursor: "pointer",
                          flex: 1,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(chk.completed)}
                          onChange={() => handleToggleChecklistInDetail(idx)}
                        />
                        <span
                          style={{
                            textDecoration: chk.completed ? "line-through" : "none",
                            color: chk.completed ? "var(--color-text-muted)" : "var(--color-text-primary)",
                          }}
                        >
                          {chk.task}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveChecklistInDetail(idx)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--color-danger)",
                          cursor: "pointer",
                          fontSize: "16px",
                          padding: "2px 6px",
                        }}
                        title="Remove task"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Checklist Task Form */}
              <form
                onSubmit={handleAddChecklistInDetail}
                style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                  paddingTop: "12px",
                  borderTop: "1px dashed var(--color-border)",
                }}
              >
                <input
                  type="text"
                  placeholder="New prep task (e.g., Review Company Glassdoor interview questions)"
                  value={newChecklistTask}
                  onChange={(e) => setNewChecklistTask(e.target.value)}
                  style={{ flex: 1, fontSize: "13px" }}
                />
                <button type="submit" className="btn btn-sm btn-primary">
                  + Add Task
                </button>
              </form>
            </div>

            {/* Section 3: Required Technical Skills & DSA Topics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "16px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "10px" }}>
                  💻 Required Technical Skills
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                  {(detailCompany.requiredSkills || []).length === 0 ? (
                    <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>None specified</span>
                  ) : (
                    detailCompany.requiredSkills.map((sk, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "3px 8px",
                          borderRadius: "12px",
                          background: "var(--color-soft-green)",
                          color: "var(--color-primary)",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        {sk}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkillInDetail(sk)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--color-danger)",
                            cursor: "pointer",
                            padding: 0,
                            lineHeight: 1,
                            fontSize: "12px",
                          }}
                        >
                          ✕
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <form onSubmit={handleAddSkillInDetail} style={{ display: "flex", gap: "6px" }}>
                  <input
                    type="text"
                    placeholder="Add skill (e.g. Docker)"
                    value={newSkillTag}
                    onChange={(e) => setNewSkillTag(e.target.value)}
                    style={{ flex: 1, fontSize: "12px", padding: "4px 8px" }}
                  />
                  <button type="submit" className="btn btn-sm btn-outline">
                    + Add
                  </button>
                </form>
              </div>

              <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "16px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "10px" }}>
                  📊 DSA Topics & Focus Areas
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {(detailCompany.dsaTopics || []).length === 0 ? (
                    <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>None specified</span>
                  ) : (
                    detailCompany.dsaTopics.map((top, idx) => (
                      <Badge key={idx} variant="purple">
                        {top}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Section 4: Interview Experience & Prep Notes */}
            {(detailCompany.aptitudeNotes || detailCompany.experienceNotes) && (
              <div
                style={{
                  padding: "14px 16px",
                  background: "var(--color-soft-green)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border-subtle)",
                }}
              >
                <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-primary)", marginBottom: "6px" }}>
                  💡 Interview Tips & Notes
                </h4>
                <p style={{ fontSize: "13px", color: "var(--color-text-primary)", whiteSpace: "pre-line", margin: 0 }}>
                  {detailCompany.aptitudeNotes || detailCompany.experienceNotes}
                </p>
              </div>
            )}

            {/* Modal Actions Footer */}
            <div
              className="modal-footer"
              style={{
                margin: "10px -24px -24px",
                padding: "16px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => {
                  handleDelete(detailCompany._id);
                }}
              >
                Delete Company
              </button>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    const toEdit = detailCompany;
                    setDetailCompany(null);
                    handleOpenEdit(toEdit);
                  }}
                >
                  Edit Full Profile
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setDetailCompany(null)}
                >
                  Close Plan
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
