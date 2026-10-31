import { useState, useEffect } from "react";
import {
  getMockInterviews,
  getMockAnalytics,
  addMockInterview,
  updateMockInterview,
  deleteMockInterview,
} from "../api/mockInterviewApi";
import Modal from "../components/common/Modal";
import EmptyState from "../components/common/EmptyState";
import StatCard from "../components/common/StatCard";
import Badge from "../components/common/Badge";

const STATUSES = ["Scheduled", "Completed", "Cancelled"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

export default function MockInterviews() {
  const [activeTab, setActiveTab] = useState("sessions"); // "sessions" | "analytics"
  const [interviews, setInterviews] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modals
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    interviewerName: "",
    topic: "Technical (DSA)",
    difficulty: "Medium",
    duration: 45,
    interviewDate: new Date().toISOString().slice(0, 10),
    interviewTime: "14:00",
    status: "Scheduled",
    notes: "",
  });

  const [feedbackData, setFeedbackData] = useState({
    rating: 4,
    technicalScore: 4,
    communicationScore: 4,
    problemSolvingScore: 4,
    feedback: "",
    strengths: "",
    areasForImprovement: "",
    status: "Completed",
  });

  const [refreshKey, setRefreshKey] = useState(0);

  const notifyChange = () => {
    window.dispatchEvent(new Event("placeprep:data_updated"));
  };

  useEffect(() => {
    let isMounted = true;
    async function loadInterviews() {
      try {
        const data = await getMockInterviews({
          status: statusFilter !== "All" ? statusFilter : undefined,
        });
        if (isMounted) {
          setInterviews(data);
          setError("");
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load mock interviews.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadInterviews();
    return () => {
      isMounted = false;
    };
  }, [statusFilter, refreshKey]);

  useEffect(() => {
    if (activeTab !== "analytics") return;
    let isMounted = true;
    async function loadAnalyticsData() {
      try {
        setAnalyticsLoading(true);
        const data = await getMockAnalytics();
        if (isMounted) {
          setAnalytics(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load interview analytics.");
        }
      } finally {
        if (isMounted) {
          setAnalyticsLoading(false);
        }
      }
    }

    loadAnalyticsData();
    return () => {
      isMounted = false;
    };
  }, [activeTab, refreshKey]);

  const handleOpenSchedule = (interview = null) => {
    if (interview) {
      setSelectedInterview(interview);
      setFormData({
        title: interview.title,
        company: interview.company || "",
        interviewerName: interview.interviewerName || "",
        topic: interview.topic || "Technical (DSA)",
        difficulty: interview.difficulty || "Medium",
        duration: interview.duration || 45,
        interviewDate: interview.interviewDate
          ? new Date(interview.interviewDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        interviewTime: interview.interviewTime || "14:00",
        status: interview.status || "Scheduled",
        notes: interview.notes || "",
      });
    } else {
      setSelectedInterview(null);
      setFormData({
        title: "",
        company: "",
        interviewerName: "",
        topic: "Technical (DSA)",
        difficulty: "Medium",
        duration: 45,
        interviewDate: new Date().toISOString().slice(0, 10),
        interviewTime: "14:00",
        status: "Scheduled",
        notes: "",
      });
    }
    setScheduleModalOpen(true);
  };

  const handleSaveInterview = async (e) => {
    e.preventDefault();
    try {
      if (selectedInterview) {
        await updateMockInterview(selectedInterview._id, formData);
      } else {
        await addMockInterview(formData);
      }
      setScheduleModalOpen(false);
      notifyChange();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err.message || "Failed to save interview.");
    }
  };

  const handleOpenFeedback = (interview) => {
    setSelectedInterview(interview);
    setFeedbackData({
      rating: interview.rating || 4,
      technicalScore: interview.technicalScore || interview.rating || 4,
      communicationScore: interview.communicationScore || interview.rating || 4,
      problemSolvingScore: interview.problemSolvingScore || interview.rating || 4,
      feedback: interview.feedback || "",
      strengths: interview.strengths || "",
      areasForImprovement: interview.areasForImprovement || "",
      status: "Completed",
    });
    setFeedbackModalOpen(true);
  };

  const handleSaveFeedback = async (e) => {
    e.preventDefault();
    if (!selectedInterview) return;

    try {
      await updateMockInterview(selectedInterview._id, {
        rating: Number(feedbackData.rating),
        technicalScore: Number(feedbackData.technicalScore),
        communicationScore: Number(feedbackData.communicationScore),
        problemSolvingScore: Number(feedbackData.problemSolvingScore),
        feedback: feedbackData.feedback,
        strengths: feedbackData.strengths,
        areasForImprovement: feedbackData.areasForImprovement,
        status: "Completed",
      });
      setFeedbackModalOpen(false);
      notifyChange();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err.message || "Failed to save feedback.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this mock interview record?")) return;
    try {
      await deleteMockInterview(id);
      notifyChange();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err.message || "Failed to delete.");
    }
  };

  const handleStatusChange = async (interview, newStatus) => {
    try {
      await updateMockInterview(interview._id, { status: newStatus });
      notifyChange();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err.message || "Status update failed.");
    }
  };

  const scheduledCount = interviews.filter((i) => i.status === "Scheduled").length;
  const completedCount = interviews.filter((i) => i.status === "Completed").length;
  const rated = interviews.filter((i) => i.rating);
  const avgRating = rated.length
    ? (rated.reduce((sum, i) => sum + i.rating, 0) / rated.length).toFixed(1)
    : "—";

  return (
    <div>
      {/* Tab Switcher Header */}
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
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            className={`btn ${activeTab === "sessions" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setActiveTab("sessions")}
          >
            Interview Sessions ({interviews.length})
          </button>
          <button
            type="button"
            className={`btn ${activeTab === "analytics" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setActiveTab("analytics")}
          >
            📊 Performance Analytics & Trends
          </button>
        </div>

        {activeTab === "sessions" && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleOpenSchedule()}
          >
            + Schedule Mock Interview
          </button>
        )}
      </div>

      {error && (
        <div className="card" style={{ marginBottom: "20px", color: "var(--color-danger)" }}>
          {error}
        </div>
      )}

      {/* SESSIONS TAB */}
      {activeTab === "sessions" && (
        <>
          {/* Metrics Row */}
          <div className="stat-card-grid" style={{ marginBottom: "20px" }}>
            <StatCard
              icon="📅"
              iconColor="blue"
              label="Scheduled Sessions"
              value={scheduledCount}
              secondaryText="Upcoming peer / mentor mocks"
            />
            <StatCard
              icon="✓"
              iconColor="green"
              label="Completed Mocks"
              value={completedCount}
              secondaryText="With performance feedback"
            />
            <StatCard
              icon="★"
              iconColor="amber"
              label="Average Rating"
              value={avgRating !== "—" ? `${avgRating} / 5` : "N/A"}
              secondaryText="Based on interviewer ratings"
            />
          </div>

          {/* Filter Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
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
          </div>

          {loading ? (
            <p style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-muted)" }}>
              Loading mock interviews...
            </p>
          ) : interviews.length === 0 ? (
            <div className="card">
              <EmptyState
                icon="♧"
                title="No mock interviews found"
                message={
                  statusFilter !== "All"
                    ? "No interviews match the selected status."
                    : "Practice behavioral and technical interviews to build confidence and refine answers."
                }
                actionLabel="+ Schedule Mock Interview"
                onAction={() => handleOpenSchedule()}
              />
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Interview Session</th>
                    <th>Target Company</th>
                    <th>Difficulty</th>
                    <th>Date & Time</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Rating & Feedback</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {interviews.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <strong style={{ display: "block" }}>{item.title}</strong>
                        <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                          {item.topic} {item.interviewerName && `• Interviewer: ${item.interviewerName}`}
                        </span>
                      </td>
                      <td>{item.company || "—"}</td>
                      <td>
                        <Badge
                          variant={
                            item.difficulty === "Hard"
                              ? "amber"
                              : item.difficulty === "Easy"
                              ? "blue"
                              : "green"
                          }
                        >
                          {item.difficulty || "Medium"}
                        </Badge>
                      </td>
                      <td>
                        {item.interviewDate
                          ? new Date(item.interviewDate).toLocaleDateString()
                          : "—"}
                        {item.interviewTime && ` at ${item.interviewTime}`}
                      </td>
                      <td>{item.duration} min</td>
                      <td>
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item, e.target.value)}
                          style={{
                            padding: "3px 8px",
                            fontSize: "11px",
                            fontWeight: 600,
                            borderRadius: "var(--radius-full)",
                            border: "1px solid var(--color-border)",
                          }}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {item.rating ? (
                          <div>
                            <span className="star-rating">
                              {"★".repeat(item.rating)}
                              {"☆".repeat(5 - item.rating)}
                            </span>
                            {item.feedback && (
                              <span
                                style={{
                                  display: "block",
                                  fontSize: "11px",
                                  color: "var(--color-text-muted)",
                                  maxWidth: "160px",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                                title={item.feedback}
                              >
                                {item.feedback}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "var(--color-text-muted)", fontSize: "11px" }}>
                            Pending review
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleOpenFeedback(item)}
                            title="Add structured feedback & multi-dimension rating"
                          >
                            Feedback
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            onClick={() => handleOpenSchedule(item)}
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
        </>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === "analytics" && (
        <div>
          {analyticsLoading ? (
            <p style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-muted)" }}>
              Computing performance analytics...
            </p>
          ) : !analytics || analytics.completedInterviews === 0 ? (
            <div className="card">
              <EmptyState
                icon="📊"
                title="No Completed Mock Interviews Yet"
                message="Complete mock interviews and submit performance feedback to unlock multi-dimension analytics, technical vs communication breakdowns, and historical score trends."
                actionLabel="+ Schedule Mock Interview"
                onAction={() => {
                  setActiveTab("sessions");
                  handleOpenSchedule();
                }}
              />
            </div>
          ) : (
            <>
              {/* Multi-Dimension Summary Cards */}
              <div className="stat-card-grid" style={{ marginBottom: "24px" }}>
                <StatCard
                  icon="★"
                  iconColor="amber"
                  label="Overall Rating"
                  value={analytics.averages.overall ? `${analytics.averages.overall} / 5.0` : "—"}
                  secondaryText={`Across ${analytics.completedInterviews} completed sessions`}
                />
                <StatCard
                  icon="💻"
                  iconColor="blue"
                  label="Technical & DSA"
                  value={analytics.averages.technical ? `${analytics.averages.technical} / 5.0` : "—"}
                  secondaryText="Coding & algorithmic depth"
                />
                <StatCard
                  icon="🗣"
                  iconColor="green"
                  label="Communication & HR"
                  value={analytics.averages.communication ? `${analytics.averages.communication} / 5.0` : "—"}
                  secondaryText="Articulation & behavioral clarity"
                />
                <StatCard
                  icon="🧩"
                  iconColor="purple"
                  label="Problem Solving"
                  value={analytics.averages.problemSolving ? `${analytics.averages.problemSolving} / 5.0` : "—"}
                  secondaryText="Approach, edge cases & complexity"
                />
              </div>

              {/* Dimension Score Meters */}
              <div className="card" style={{ marginBottom: "24px" }}>
                <div className="card-header">
                  <h2>Multi-Dimension Evaluation Breakdown</h2>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "10px" }}>
                  {[
                    { label: "Technical Competence & DSA", val: analytics.averages.technical || 0, color: "var(--color-primary)" },
                    { label: "Communication & Behavioral Articulation", val: analytics.averages.communication || 0, color: "var(--color-accent)" },
                    { label: "Algorithmic Problem Solving & Edge Cases", val: analytics.averages.problemSolving || 0, color: "#8B5CF6" },
                    { label: "Overall Interview Conversion Rating", val: analytics.averages.overall || 0, color: "#F59E0B" },
                  ].map((dim, i) => {
                    const pct = Math.round(((dim.val || 0) / 5) * 100);
                    return (
                      <div key={i}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                          <span>{dim.label}</span>
                          <span style={{ color: dim.color }}>{dim.val ? `${dim.val} / 5.0 (${pct}%)` : "Not evaluated"}</span>
                        </div>
                        <div style={{ height: "10px", background: "var(--color-border)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${pct}%`,
                              height: "100%",
                              background: dim.color,
                              borderRadius: "var(--radius-full)",
                              transition: "width 0.4s ease",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Performance Trend Feed */}
              <div className="card">
                <div className="card-header">
                  <h2>Recent Interview Trend & Qualitative Feedback</h2>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "10px" }}>
                  {analytics.recentTrend.map((session, idx) => (
                    <div
                      key={session._id || idx}
                      style={{
                        padding: "16px",
                        background: "var(--color-surface-hover)",
                        border: "1px solid var(--color-border-subtle)",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                        <div>
                          <strong style={{ fontSize: "15px", color: "var(--color-text-primary)" }}>
                            {session.title}
                          </strong>
                          <span style={{ fontSize: "12px", color: "var(--color-text-muted)", marginLeft: "8px" }}>
                            {session.company ? `(${session.company})` : ""} •{" "}
                            {session.date ? new Date(session.date).toLocaleDateString() : ""}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span className="star-rating">
                            {"★".repeat(session.rating || 0)}
                            {"☆".repeat(5 - (session.rating || 0))}
                          </span>
                          <Badge variant="green">Overall: {session.rating}/5</Badge>
                        </div>
                      </div>

                      {/* Sub-scores */}
                      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", fontSize: "12px", marginBottom: "10px" }}>
                        <span>
                          <strong>Technical:</strong> {session.technicalScore}/5
                        </span>
                        <span>•</span>
                        <span>
                          <strong>Communication:</strong> {session.communicationScore}/5
                        </span>
                        <span>•</span>
                        <span>
                          <strong>Problem Solving:</strong> {session.problemSolvingScore}/5
                        </span>
                      </div>

                      {/* Strengths & Improvement */}
                      {session.strengths && (
                        <p style={{ margin: "4px 0", fontSize: "12px", color: "var(--color-primary)" }}>
                          <strong>Strengths:</strong> {session.strengths}
                        </p>
                      )}
                      {session.areasForImprovement && (
                        <p style={{ margin: "4px 0", fontSize: "12px", color: "var(--color-warning)" }}>
                          <strong>Improvement:</strong> {session.areasForImprovement}
                        </p>
                      )}
                      {session.feedback && (
                        <p style={{ margin: "4px 0", fontSize: "12px", color: "var(--color-text-secondary)", fontStyle: "italic" }}>
                          "{session.feedback}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Schedule / Edit Modal */}
      <Modal
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title={selectedInterview ? "Edit Mock Interview" : "Schedule Mock Interview"}
        size="md"
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setScheduleModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" form="interview-form" className="btn btn-primary">
              {selectedInterview ? "Save Changes" : "Schedule Session"}
            </button>
          </>
        }
      >
        <form id="interview-form" onSubmit={handleSaveInterview}>
          <div className="form-group">
            <label>Session Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Amazon System Design Mock, Google DSA Round"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Target Company</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. Amazon, Atlassian"
              />
            </div>
            <div className="form-group">
              <label>Interviewer / Mentor Name</label>
              <input
                type="text"
                value={formData.interviewerName}
                onChange={(e) => setFormData({ ...formData, interviewerName: e.target.value })}
                placeholder="e.g. Senior SDE, Peer, Coach"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Interview Topic</label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="e.g. DSA, Low-Level Design, HR"
              />
            </div>
            <div className="form-group">
              <label>Difficulty</label>
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

          <div className="form-row">
            <div className="form-group">
              <label>Interview Date *</label>
              <input
                type="date"
                required
                value={formData.interviewDate}
                onChange={(e) => setFormData({ ...formData, interviewDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Interview Time</label>
              <input
                type="time"
                value={formData.interviewTime}
                onChange={(e) => setFormData({ ...formData, interviewTime: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Duration (minutes)</label>
              <input
                type="number"
                min={15}
                max={180}
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label>Initial Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Preparation Notes & Objectives</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Questions to focus on, meeting link, problem constraints..."
            />
          </div>
        </form>
      </Modal>

      {/* Structured Feedback Modal */}
      <Modal
        open={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        title="Interviewer Feedback & Performance Rating"
        size="md"
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setFeedbackModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" form="feedback-form" className="btn btn-primary">
              Save Feedback & Mark Completed
            </button>
          </>
        }
      >
        <form id="feedback-form" onSubmit={handleSaveFeedback}>
          <p style={{ marginBottom: "14px", fontWeight: 600 }}>
            Session: {selectedInterview?.title} ({selectedInterview?.company || "General"})
          </p>

          <div className="form-group">
            <label>Overall Performance Rating (1 to 5 Stars)</label>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFeedbackData({ ...feedbackData, rating: star })}
                  style={{
                    fontSize: "24px",
                    color: star <= feedbackData.rating ? "#F59E0B" : "var(--color-border)",
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                  }}
                >
                  ★
                </button>
              ))}
              <span style={{ fontSize: "13px", fontWeight: 600, marginLeft: "8px" }}>
                {feedbackData.rating} of 5 Stars
              </span>
            </div>
          </div>

          {/* Multi-dimension Ratings */}
          <div className="form-row">
            <div className="form-group">
              <label>Technical Score (1-5)</label>
              <select
                value={feedbackData.technicalScore}
                onChange={(e) => setFeedbackData({ ...feedbackData, technicalScore: Number(e.target.value) })}
              >
                {[1, 2, 3, 4, 5].map((v) => (
                  <option key={v} value={v}>
                    {v} - {v === 5 ? "Exceptional" : v === 4 ? "Strong" : v === 3 ? "Adequate" : v === 2 ? "Developing" : "Needs Work"}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Communication Score (1-5)</label>
              <select
                value={feedbackData.communicationScore}
                onChange={(e) => setFeedbackData({ ...feedbackData, communicationScore: Number(e.target.value) })}
              >
                {[1, 2, 3, 4, 5].map((v) => (
                  <option key={v} value={v}>
                    {v} - {v === 5 ? "Articulate & Clear" : v === 4 ? "Good" : v === 3 ? "Acceptable" : v === 2 ? "Hesitant" : "Poor"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Problem Solving & Logic (1-5)</label>
            <select
              value={feedbackData.problemSolvingScore}
              onChange={(e) => setFeedbackData({ ...feedbackData, problemSolvingScore: Number(e.target.value) })}
            >
              {[1, 2, 3, 4, 5].map((v) => (
                <option key={v} value={v}>
                  {v} - {v === 5 ? "Optimal & Rigorous" : v === 4 ? "Solves with hints" : v === 3 ? "Brute force" : v === 2 ? "Struggled" : "Failed approach"}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Key Strengths Observed</label>
            <textarea
              rows={2}
              value={feedbackData.strengths}
              onChange={(e) => setFeedbackData({ ...feedbackData, strengths: e.target.value })}
              placeholder="Good communication, quick edge-case identification..."
            />
          </div>

          <div className="form-group">
            <label>Areas for Improvement</label>
            <textarea
              rows={2}
              value={feedbackData.areasForImprovement}
              onChange={(e) =>
                setFeedbackData({ ...feedbackData, areasForImprovement: e.target.value })
              }
              placeholder="More rigorous time complexity analysis, dry run code carefully..."
            />
          </div>

          <div className="form-group">
            <label>Comprehensive Interviewer Feedback</label>
            <textarea
              rows={3}
              value={feedbackData.feedback}
              onChange={(e) => setFeedbackData({ ...feedbackData, feedback: e.target.value })}
              placeholder="General remarks, overall recommendation, problem solutions discussed..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
