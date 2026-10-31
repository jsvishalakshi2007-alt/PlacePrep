import { useState, useEffect } from "react";
import {
  getProblems,
  addProblem,
  updateProblem,
  deleteProblem,
} from "../api/problemApi";
import Badge from "../components/common/Badge";
import Modal from "../components/common/Modal";
import EmptyState from "../components/common/EmptyState";
import StatCard from "../components/common/StatCard";

const PLATFORMS = ["LeetCode", "GeeksforGeeks", "CodeChef", "HackerRank", "Other"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const TOPICS = [
  "Arrays",
  "Strings",
  "Linked List",
  "Trees",
  "Graphs",
  "Dynamic Programming",
  "Recursion & Backtracking",
  "Binary Search",
  "Stack & Queue",
  "Heaps & HashMaps",
  "Greedy",
  "Trie",
  "General",
];

export default function DsaPractice() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [topicFilter, setTopicFilter] = useState("All");
  const [revisionOnly, setRevisionOnly] = useState(false);
  const [search, setSearch] = useState("");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    platform: "LeetCode",
    difficulty: "Easy",
    topic: "Arrays",
    url: "",
    notes: "",
    solved: true,
    revisionRequired: false,
  });

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function loadProblemsData() {
      try {
        const data = await getProblems({
          difficulty: difficultyFilter !== "All" ? difficultyFilter : undefined,
          topic: topicFilter !== "All" ? topicFilter : undefined,
          revisionRequired: revisionOnly ? "true" : undefined,
          search: search.trim() || undefined,
        });
        if (isMounted) {
          setProblems(data);
          setError("");
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load DSA problems.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProblemsData();
    return () => {
      isMounted = false;
    };
  }, [difficultyFilter, topicFilter, revisionOnly, search, refreshKey]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      title: "",
      platform: "LeetCode",
      difficulty: "Easy",
      topic: "Arrays",
      url: "",
      notes: "",
      solved: true,
      revisionRequired: false,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (prob) => {
    setEditingId(prob._id);
    setFormData({
      title: prob.title,
      platform: prob.platform,
      difficulty: prob.difficulty,
      topic: prob.topic,
      url: prob.url || "",
      notes: prob.notes || "",
      solved: prob.solved !== undefined ? prob.solved : true,
      revisionRequired: Boolean(prob.revisionRequired),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateProblem(editingId, formData);
      } else {
        await addProblem(formData);
      }
      setModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err.message || "Operation failed.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this problem?")) return;
    try {
      await deleteProblem(id);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err.message || "Failed to delete.");
    }
  };

  const handleToggleSolved = async (prob) => {
    try {
      await updateProblem(prob._id, { solved: !prob.solved });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err.message || "Update failed.");
    }
  };

  const handleToggleRevision = async (prob) => {
    try {
      await updateProblem(prob._id, { revisionRequired: !prob.revisionRequired });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err.message || "Update failed.");
    }
  };

  const totalSolved = problems.filter((p) => p.solved).length;
  const easyCount = problems.filter((p) => p.difficulty === "Easy" && p.solved).length;
  const medCount = problems.filter((p) => p.difficulty === "Medium" && p.solved).length;
  const hardCount = problems.filter((p) => p.difficulty === "Hard" && p.solved).length;

  return (
    <div>
      {/* Metrics Row */}
      <div className="stat-card-grid" style={{ marginBottom: "20px" }}>
        <StatCard
          icon="✓"
          iconColor="green"
          label="Total Solved"
          value={totalSolved}
          secondaryText="Coding challenges completed"
        />
        <StatCard
          icon="🟢"
          iconColor="green"
          label="Easy Problems"
          value={easyCount}
          secondaryText="Foundational & warm-up"
        />
        <StatCard
          icon="🟡"
          iconColor="amber"
          label="Medium Problems"
          value={medCount}
          secondaryText="Interview standard difficulty"
        />
        <StatCard
          icon="🔴"
          iconColor="purple"
          label="Hard Problems"
          value={hardCount}
          secondaryText="Advanced algorithmic topics"
        />
      </div>

      {/* Action and Filter Bar */}
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
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search problems, topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "200px" }}
          />

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            style={{ width: "140px" }}
          >
            <option value="All">All Difficulties</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            style={{ width: "150px" }}
          >
            <option value="All">All Topics</option>
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <button
            type="button"
            className={`btn btn-sm ${revisionOnly ? "btn-primary" : "btn-outline"}`}
            onClick={() => setRevisionOnly(!revisionOnly)}
          >
            {revisionOnly ? "★ In Revision Queue" : "☆ Revision Queue"}
          </button>
        </div>

        <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
          + Add Problem
        </button>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: "20px", color: "var(--color-danger)" }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-muted)" }}>
          Loading DSA problems...
        </p>
      ) : problems.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="⌘"
            title="No problems found"
            message={
              search || difficultyFilter !== "All" || topicFilter !== "All" || revisionOnly
                ? "Try adjusting your search or filters."
                : "Track the problems you have solved across LeetCode, GFG, and CodeChef."
            }
            actionLabel="+ Add Problem"
            onAction={handleOpenAdd}
          />
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "40px" }}>Status</th>
                <th>Problem Title</th>
                <th>Platform</th>
                <th>Difficulty</th>
                <th>Topic</th>
                <th>Revision</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((prob) => (
                <tr key={prob._id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={prob.solved}
                      onChange={() => handleToggleSolved(prob)}
                      title={prob.solved ? "Mark unsolved" : "Mark solved"}
                      style={{ cursor: "pointer", width: "16px", height: "16px" }}
                    />
                  </td>
                  <td>
                    <strong style={{ display: "block" }}>{prob.title}</strong>
                    {prob.url && (
                      <a
                        href={prob.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: "11px",
                          color: "var(--color-accent)",
                          textDecoration: "underline",
                        }}
                      >
                        Open Problem Link &rarr;
                      </a>
                    )}
                  </td>
                  <td>
                    <Badge variant="blue">{prob.platform}</Badge>
                  </td>
                  <td>
                    <Badge variant={prob.difficulty.toLowerCase()}>{prob.difficulty}</Badge>
                  </td>
                  <td>
                    <span style={{ color: "var(--color-text-secondary)", fontSize: "12px" }}>
                      {prob.topic}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleToggleRevision(prob)}
                      style={{
                        color: prob.revisionRequired ? "#F59E0B" : "var(--color-border)",
                        fontSize: "16px",
                      }}
                      title={
                        prob.revisionRequired
                          ? "Marked for revision"
                          : "Add to revision queue"
                      }
                    >
                      ★
                    </button>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => handleOpenEdit(prob)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(prob._id)}
                      >
                        &times;
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Problem Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Problem" : "Add Solved Problem"}
        size="md"
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" form="problem-form" className="btn btn-primary">
              {editingId ? "Save Changes" : "Save Problem"}
            </button>
          </>
        }
      >
        <form id="problem-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Problem Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. 2 Sum, Longest Substring Without Repeating Characters"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Platform</label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Difficulty *</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Primary Topic</label>
            <select
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            >
              {TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Problem URL</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://leetcode.com/problems/..."
            />
          </div>

          <div className="form-group">
            <label>Key Insights & Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optimal time complexity O(N), hashmap approach..."
            />
          </div>

          <div style={{ display: "flex", gap: "20px", marginTop: "10px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={formData.solved}
                onChange={(e) => setFormData({ ...formData, solved: e.target.checked })}
              />
              Mark as Solved
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={formData.revisionRequired}
                onChange={(e) => setFormData({ ...formData, revisionRequired: e.target.checked })}
              />
              Flag for Revision
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}
