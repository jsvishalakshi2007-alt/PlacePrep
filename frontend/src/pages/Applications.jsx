import { useState, useEffect } from "react";
import {
  getApplications,
  addApplication,
  updateApplication,
  deleteApplication,
} from "../api/applicationApi";
import Modal from "../components/common/Modal";
import EmptyState from "../components/common/EmptyState";

const STATUSES = ["Applied", "Online Test", "Interview", "Offer", "Rejected"];

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    company: "",
    role: "",
    status: "Applied",
    appliedDate: new Date().toISOString().slice(0, 10),
    salary: "",
    location: "",
    jobUrl: "",
    notes: "",
  });

  useEffect(() => {
    let isMounted = true;
    async function fetchApps() {
      try {
        const data = await getApplications({
          status: filterStatus !== "All" ? filterStatus : undefined,
          search: search.trim() || undefined,
        });
        if (isMounted) {
          setApplications(data);
          setError("");
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load applications.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchApps();
    return () => {
      isMounted = false;
    };
  }, [filterStatus, search, refreshKey]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      company: "",
      role: "",
      status: "Applied",
      appliedDate: new Date().toISOString().slice(0, 10),
      salary: "",
      location: "",
      jobUrl: "",
      notes: "",
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (app) => {
    setEditingId(app._id);
    setFormData({
      company: app.company,
      role: app.role,
      status: app.status,
      appliedDate: app.appliedDate ? new Date(app.appliedDate).toISOString().slice(0, 10) : "",
      salary: app.salary || "",
      location: app.location || "",
      jobUrl: app.jobUrl || "",
      notes: app.notes || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateApplication(editingId, formData);
      } else {
        await addApplication(formData);
      }
      setModalOpen(false);
      setLoading(true);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err.message || "Operation failed.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this application?")) return;
    try {
      await deleteApplication(id);
      setLoading(true);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err.message || "Failed to delete.");
    }
  };

  const handleStatusChange = async (app, newStatus) => {
    try {
      await updateApplication(app._id, { status: newStatus });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err.message || "Failed to update status.");
    }
  };

  return (
    <div>
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
            placeholder="Search company, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "220px" }}
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: "160px" }}
          >
            <option value="All">All Statuses</option>
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
          + Add Application
        </button>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: "20px", color: "var(--color-danger)" }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-muted)" }}>
          Loading applications...
        </p>
      ) : applications.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="▤"
            title="No applications found"
            message={
              filterStatus !== "All" || search
                ? "Try clearing filters or search terms."
                : "Keep track of all your company job and internship applications here."
            }
            actionLabel="+ Add Application"
            onAction={handleOpenAdd}
          />
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Status</th>
                <th>Applied Date</th>
                <th>Location / CTC</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app._id}>
                  <td>
                    <strong>{app.company}</strong>
                    {app.jobUrl && (
                      <a
                        href={app.jobUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "block",
                          fontSize: "11px",
                          color: "var(--color-accent)",
                          marginTop: "2px",
                        }}
                      >
                        Job Posting &rarr;
                      </a>
                    )}
                  </td>
                  <td>{app.role}</td>
                  <td>
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app, e.target.value)}
                      style={{
                        padding: "3px 8px",
                        fontSize: "11px",
                        fontWeight: 600,
                        borderRadius: "var(--radius-full)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      {STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {app.appliedDate
                      ? new Date(app.appliedDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td>
                    <span>
                      {app.location || "Remote / Hybrid"}
                      {app.salary && ` • ${app.salary}`}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => handleOpenEdit(app)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(app._id)}
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

      {/* Add / Edit Application Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Application" : "New Job Application"}
        size="lg"
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="app-form"
              className="btn btn-primary"
            >
              {editingId ? "Save Changes" : "Save Application"}
            </button>
          </>
        }
      >
        <form id="app-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Company Name *</label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. Google, Microsoft, Adobe"
              />
            </div>
            <div className="form-group">
              <label>Role / Position *</label>
              <input
                type="text"
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g. Software Engineer, SDE Intern"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Application Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Applied Date</label>
              <input
                type="date"
                value={formData.appliedDate}
                onChange={(e) => setFormData({ ...formData, appliedDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Bangalore / Remote"
              />
            </div>
            <div className="form-group">
              <label>CTC / Stipend</label>
              <input
                type="text"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                placeholder="e.g. 18 LPA / 50k pm"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Job Portal URL / Link</label>
            <input
              type="url"
              value={formData.jobUrl}
              onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="form-group">
            <label>Application Notes / Referrals</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Referral name, job ID, tech stack requirements..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
