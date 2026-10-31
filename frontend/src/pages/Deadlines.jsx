import { useState, useEffect } from "react";
import {
  getDeadlines,
  addDeadline,
  updateDeadline,
  deleteDeadline,
} from "../api/deadlineApi";
import Badge from "../components/common/Badge";
import Modal from "../components/common/Modal";
import EmptyState from "../components/common/EmptyState";
import StatCard from "../components/common/StatCard";

const TYPES = ["Application", "Online Test", "Interview", "Assignment", "Other"];
const PRIORITIES = ["High", "Medium", "Low"];

export default function Deadlines() {
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("Pending");

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    type: "Application",
    dueDate: new Date().toISOString().slice(0, 10),
    priority: "Medium",
    notes: "",
    completed: false,
  });

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function loadDeadlinesData() {
      try {
        const data = await getDeadlines({
          type: typeFilter !== "All" ? typeFilter : undefined,
          completed: statusFilter === "All" ? undefined : statusFilter === "Completed",
        });
        if (isMounted) {
          setDeadlines(data);
          setError("");
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load deadlines.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDeadlinesData();
    return () => {
      isMounted = false;
    };
  }, [typeFilter, statusFilter, refreshKey]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      title: "",
      company: "",
      type: "Application",
      dueDate: new Date().toISOString().slice(0, 10),
      priority: "Medium",
      notes: "",
      completed: false,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      title: item.title,
      company: item.company || "",
      type: item.type,
      dueDate: item.dueDate ? new Date(item.dueDate).toISOString().slice(0, 10) : "",
      priority: item.priority || "Medium",
      notes: item.notes || "",
      completed: Boolean(item.completed),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDeadline(editingId, formData);
      } else {
        await addDeadline(formData);
      }
      setModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err.message || "Operation failed.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this deadline?")) return;
    try {
      await deleteDeadline(id);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err.message || "Delete failed.");
    }
  };

  const handleToggleComplete = async (item) => {
    try {
      await updateDeadline(item._id, { completed: !item.completed });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err.message || "Update failed.");
    }
  };

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const getUrgencyBadge = (dueDate, completed) => {
    if (completed) {
      return <Badge variant="green">Completed</Badge>;
    }
    const target = new Date(dueDate);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <Badge variant="red">Overdue by {Math.abs(diffDays)}d</Badge>;
    }
    if (diffDays === 0) {
      return <Badge variant="red">Due Today</Badge>;
    }
    if (diffDays === 1) {
      return <Badge variant="amber">Due Tomorrow</Badge>;
    }
    if (diffDays <= 3) {
      return <Badge variant="amber">In {diffDays} days</Badge>;
    }
    return <Badge variant="blue">In {diffDays} days</Badge>;
  };

  const overdueCount = deadlines.filter((d) => !d.completed && new Date(d.dueDate) < now).length;
  const pendingCount = deadlines.filter((d) => !d.completed).length;

  return (
    <div>
      {/* Metrics Row */}
      <div className="stat-card-grid" style={{ marginBottom: "20px" }}>
        <StatCard
          icon="◷"
          iconColor="blue"
          label="Pending Deadlines"
          value={pendingCount}
          secondaryText="Upcoming tests, applications & dates"
        />
        <StatCard
          icon="⚠"
          iconColor="amber"
          label="Overdue Deadlines"
          value={overdueCount}
          secondaryText="Need immediate action"
        />
        <StatCard
          icon="✓"
          iconColor="green"
          label="Total Tracked"
          value={deadlines.length}
          secondaryText="Across all placement activities"
        />
      </div>

      {/* Filter and Action Bar */}
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: "140px" }}
          >
            <option value="Pending">Pending Only</option>
            <option value="Completed">Completed Only</option>
            <option value="All">All Deadlines</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ width: "160px" }}
          >
            <option value="All">All Types</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
          + Add Deadline
        </button>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: "20px", color: "var(--color-danger)" }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-muted)" }}>
          Loading deadlines...
        </p>
      ) : deadlines.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="◷"
            title="No deadlines found"
            message={
              statusFilter !== "All" || typeFilter !== "All"
                ? "Try changing your status or type filter."
                : "Add application deadlines, online test slots, and assignment cutoffs."
            }
            actionLabel="+ Add Deadline"
            onAction={handleOpenAdd}
          />
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "40px" }}>Done</th>
                <th>Title & Activity</th>
                <th>Company</th>
                <th>Type</th>
                <th>Due Date</th>
                <th>Urgency</th>
                <th>Priority</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deadlines.map((item) => (
                <tr key={item._id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleComplete(item)}
                      style={{ cursor: "pointer" }}
                    />
                  </td>
                  <td>
                    <strong
                      style={{
                        textDecoration: item.completed ? "line-through" : "none",
                        color: item.completed ? "var(--color-text-muted)" : "inherit",
                        display: "block",
                      }}
                    >
                      {item.title}
                    </strong>
                    {item.notes && (
                      <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                        {item.notes}
                      </span>
                    )}
                  </td>
                  <td>{item.company || "—"}</td>
                  <td>
                    <Badge variant="blue">{item.type}</Badge>
                  </td>
                  <td>
                    {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "—"}
                  </td>
                  <td>{getUrgencyBadge(item.dueDate, item.completed)}</td>
                  <td>
                    <Badge
                      variant={
                        item.priority === "High"
                          ? "red"
                          : item.priority === "Medium"
                          ? "amber"
                          : "green"
                      }
                    >
                      {item.priority || "Medium"}
                    </Badge>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => handleOpenEdit(item)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(item._id)}
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

      {/* Add / Edit Deadline Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Deadline" : "Add Important Deadline"}
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
            <button type="submit" form="deadline-form" className="btn btn-primary">
              {editingId ? "Save Changes" : "Save Deadline"}
            </button>
          </>
        }
      >
        <form id="deadline-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Deadline Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Cisco OT Round 1, Microsoft Application Form Closes"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Company / Org</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. Cisco"
              />
            </div>
            <div className="form-group">
              <label>Deadline Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Due Date *</label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Notes & Instructions</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Test platform link, syllabus, webcam requirement..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
