import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardSummary } from "../api/summaryApi";
import { getTimeline } from "../api/timelineApi";
import StatCard from "../components/common/StatCard";
import DonutChart from "../components/common/DonutChart";
import Badge from "../components/common/Badge";
import ProgressBar from "../components/common/ProgressBar";
import EmptyState from "../components/common/EmptyState";
import Modal from "../components/common/Modal";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [readinessModalOpen, setReadinessModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadDashboard() {
      try {
        const [summary, timeline] = await Promise.all([
          getDashboardSummary(),
          getTimeline({ range: "all" }),
        ]);
        if (isMounted) {
          setData(summary);
          setRecentEvents(Array.isArray(timeline) ? timeline.slice(0, 4) : []);
          setError("");
        }
      } catch (err) {
        if (isMounted) setError(err.message || "Failed to load dashboard metrics.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboard();

    const handleDataUpdated = () => {
      loadDashboard();
    };

    window.addEventListener("placeprep:data_updated", handleDataUpdated);
    window.addEventListener("focus", handleDataUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener("placeprep:data_updated", handleDataUpdated);
      window.removeEventListener("focus", handleDataUpdated);
    };
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center" }}>
        <p style={{ color: "var(--color-text-muted)" }}>Loading your placement dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ borderLeft: "4px solid var(--color-danger)" }}>
        <h3>Dashboard Notice</h3>
        <p style={{ color: "var(--color-text-secondary)", marginTop: "6px" }}>{error}</p>
      </div>
    );
  }

  const {
    readinessScore = 0,
    scoreBreakdown = {},
    strengths = [],
    weaknesses = [],
    actionableSuggestions = [],
    profileCompleteness = 0,
    applications = { total: 0 },
    dsa = { total: 0, solved: 0, easy: 0, medium: 0, hard: 0, byTopic: {} },
    tasks = { total: 0, completed: 0, pending: 0, streak: 0 },
    interviews = { total: 0, scheduled: 0, completed: 0, nextInterview: null },
    deadlines = { total: 0, pending: 0, overdue: 0, dueToday: 0, list: [] },
    companies = { total: 0, interviewing: 0, offered: 0 },
  } = data || {};

  // Donut chart segments for Applications
  const applicationSegments = [
    { label: "Applied", count: applications.applied || 0, color: "#3B82F6" },
    { label: "Online Test", count: applications.onlineTest || 0, color: "#F59E0B" },
    { label: "Interview", count: applications.interview || 0, color: "#8B5CF6" },
    { label: "Offer", count: applications.offer || 0, color: "#10B981" },
    { label: "Rejected", count: applications.rejected || 0, color: "#EF4444" },
  ];

  // Donut chart segments for DSA Difficulty
  const dsaSegments = [
    { label: "Easy", count: dsa.easy || 0, color: "#10B981" },
    { label: "Medium", count: dsa.medium || 0, color: "#F59E0B" },
    { label: "Hard", count: dsa.hard || 0, color: "#EF4444" },
  ];

  const activeDeadlinesList = deadlines.list || [];

  return (
    <div>
      {/* Top Stat Cards */}
      <div className="stat-card-grid">
        <StatCard
          icon="★"
          iconColor="green"
          label="Readiness Score"
          value={`${readinessScore}%`}
          secondaryText={readinessScore >= 75 ? "Placement Ready" : "Target: 80%+"}
        />
        <StatCard
          icon="⌘"
          iconColor="blue"
          label="DSA Solved"
          value={dsa.solved}
          secondaryText={`${dsa.easy} Easy • ${dsa.medium} Med • ${dsa.hard} Hard`}
        />
        <StatCard
          icon="▤"
          iconColor="amber"
          label="Applications"
          value={applications.total}
          secondaryText={`${applications.interview || 0} in interview stages`}
        />
        <StatCard
          icon="♧"
          iconColor="purple"
          label="Mock Interviews"
          value={interviews.completed}
          secondaryText={`${interviews.scheduled} sessions scheduled`}
        />
      </div>

      {/* Grid: Placement Readiness & Urgent Deadlines */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        {/* Placement Readiness Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2>Placement Readiness Analytics</h2>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                Data-driven evaluation across 5 preparation pillars
              </span>
            </div>
            <Badge variant={readinessScore >= 70 ? "green" : readinessScore >= 40 ? "amber" : "red"}>
              {readinessScore >= 75 ? "Ready for Placement" : readinessScore >= 50 ? "Progressing Well" : "Needs Attention"}
            </Badge>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <ProgressBar
              value={readinessScore}
              max={100}
              label="Overall Readiness Score"
              color={readinessScore >= 70 ? "var(--color-primary)" : "var(--color-accent)"}
              height={10}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginTop: "14px" }}>
            <div style={{ padding: "10px", background: "var(--color-surface-hover)", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>DSA Coding</span>
              <p style={{ fontWeight: 600, marginTop: "2px" }}>{scoreBreakdown.dsa || 0} / 35 pts</p>
            </div>
            <div style={{ padding: "10px", background: "var(--color-surface-hover)", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Applications</span>
              <p style={{ fontWeight: 600, marginTop: "2px" }}>{scoreBreakdown.applications || 0} / 25 pts</p>
            </div>
            <div style={{ padding: "10px", background: "var(--color-surface-hover)", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Mock Interviews</span>
              <p style={{ fontWeight: 600, marginTop: "2px" }}>{scoreBreakdown.mockInterviews || 0} / 15 pts</p>
            </div>
            <div style={{ padding: "10px", background: "var(--color-surface-hover)", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Skills & Profile</span>
              <p style={{ fontWeight: 600, marginTop: "2px" }}>{scoreBreakdown.skillsAndProfile || profileCompleteness}%</p>
            </div>
            <div style={{ padding: "10px", background: "var(--color-surface-hover)", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Discipline & Streak</span>
              <p style={{ fontWeight: 600, marginTop: "2px" }}>🔥 {tasks.streak || 0} days</p>
            </div>
          </div>

          <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--color-border-subtle)", textAlign: "right" }}>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => setReadinessModalOpen(true)}
            >
              Analyze Score & Recommendations →
            </button>
          </div>
        </div>

        {/* Task Activity & Urgent Deadlines */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2>Urgent Deadlines</h2>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                {deadlines.completed} / {deadlines.total} completed &bull; {deadlines.overdue} overdue
              </span>
            </div>
            <Link to="/deadlines" className="btn btn-sm btn-secondary">Manage</Link>
          </div>

          {activeDeadlinesList.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {activeDeadlinesList.map((item) => {
                let badgeVariant = "blue";
                let badgeLabel = `In ${item.remainingDays}d`;

                if (item.urgencyStatus === "today") {
                  badgeVariant = "red";
                  badgeLabel = "Due Today";
                } else if (item.urgencyStatus === "tomorrow") {
                  badgeVariant = "amber";
                  badgeLabel = "Due Tomorrow";
                } else if (item.urgencyStatus === "overdue") {
                  badgeVariant = "red";
                  badgeLabel = `Overdue ${Math.abs(item.remainingDays)}d`;
                }

                return (
                  <div
                    key={item._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      background: "var(--color-surface-hover)",
                      borderRadius: "var(--radius-md)",
                      borderLeft: `3px solid ${
                        item.urgencyStatus === "overdue" || item.priority === "High"
                          ? "var(--color-danger)"
                          : "var(--color-accent)"
                      }`,
                    }}
                  >
                    <div>
                      <strong style={{ display: "block", fontSize: "13px" }}>{item.title}</strong>
                      <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                        {item.company || item.type} &bull; Due {new Date(item.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <Badge variant={badgeVariant}>{badgeLabel}</Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon="✓"
              title="No pending deadlines"
              message="You have cleared all pending deadlines. Add new application or test deadlines to keep track."
            />
          )}
        </div>
      </div>

      {/* Grid: Charts & Target Companies */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        {/* Application Pipeline Card */}
        <div className="card">
          <div className="card-header">
            <h2>Application Funnel</h2>
            <Link to="/applications" className="btn btn-sm btn-outline">Manage</Link>
          </div>
          <DonutChart
            segments={applicationSegments}
            total={applications.total}
            label="Applied"
            emptyMessage="No job applications tracked yet."
          />
        </div>

        {/* DSA Difficulty Breakdown */}
        <div className="card">
          <div className="card-header">
            <h2>DSA Practice Breakdown</h2>
            <Link to="/practice" className="btn btn-sm btn-outline">Practice</Link>
          </div>
          <DonutChart
            segments={dsaSegments}
            total={dsa.solved}
            label="Solved"
            emptyMessage="No coding problems solved yet."
          />
        </div>

        {/* Target Companies Overview */}
        <div className="card">
          <div className="card-header">
            <h2>Target Companies Hub</h2>
            <Link to="/companies" className="btn btn-sm btn-outline">Explore</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", background: "var(--color-surface-hover)", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>Targeting Companies:</span>
              <strong>{companies.total}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", background: "var(--color-surface-hover)", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>Interviewing:</span>
              <strong style={{ color: "var(--color-purple)" }}>{companies.interviewing}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", background: "var(--color-surface-hover)", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>Offers Secured:</span>
              <strong style={{ color: "var(--color-accent)" }}>{companies.offered}</strong>
            </div>
          </div>
          <div style={{ marginTop: "14px" }}>
            <Link to="/companies" className="btn btn-sm btn-secondary" style={{ width: "100%" }}>
              Manage Target Companies & Rounds →
            </Link>
          </div>
        </div>
      </div>

      {/* Upcoming Mock Interview Banner */}
      <div className="card" style={{ marginBottom: "24px", background: "linear-gradient(135deg, var(--color-surface), var(--color-soft-green))" }}>
        <div className="card-header">
          <div>
            <h2>Next Scheduled Mock Interview</h2>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
              {interviews.scheduled} sessions scheduled &bull; {interviews.completed} completed
            </span>
          </div>
          <Link to="/mock-interviews" className="btn btn-sm btn-primary">Schedule Session</Link>
        </div>

        {interviews.nextInterview ? (
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
            <div>
              <h3 style={{ fontSize: "16px", marginBottom: "4px" }}>{interviews.nextInterview.title}</h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "13px" }}>
                Company: <strong>{interviews.nextInterview.company}</strong> &bull; Topic: <strong>{interviews.nextInterview.topic}</strong>
              </p>
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "4px" }}>
                Scheduled for {new Date(interviews.nextInterview.interviewDate).toLocaleDateString()} at {interviews.nextInterview.interviewTime || "10:00"}
                {interviews.nextInterview.duration ? ` (${interviews.nextInterview.duration} min)` : ""}
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <Badge variant="scheduled">Confirmed</Badge>
              <Link to="/mock-interviews" className="btn btn-sm btn-outline">
                Record Feedback
              </Link>
            </div>
          </div>
        ) : (
          <p style={{ color: "var(--color-text-secondary)", fontSize: "13px" }}>
            No mock interviews scheduled currently. Practicing mock interviews significantly boosts placement conversion rates.
          </p>
        )}
      </div>

      {/* Recent Placement Activity Timeline Preview */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2>Recent Placement Activity</h2>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
              Latest milestones and actions
            </span>
          </div>
          <Link to="/timeline" className="btn btn-sm btn-outline">View Full Timeline</Link>
        </div>

        {recentEvents.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {recentEvents.map((evt) => (
              <div
                key={evt.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: "var(--color-surface-hover)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "16px" }}>{evt.icon}</span>
                  <div>
                    <strong style={{ fontSize: "13px", display: "block" }}>{evt.title}</strong>
                    <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                      {evt.subtitle} &bull; {new Date(evt.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Badge variant={evt.badgeVariant}>{evt.status}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>
            Your recent placement activities will be displayed here as you progress.
          </p>
        )}
      </div>

      {/* Smart Readiness Score Modal */}
      {readinessModalOpen && (
        <Modal
          open={true}
          title="Smart Placement Readiness Assessment"
          onClose={() => setReadinessModalOpen(false)}
          className="modal-lg"
        >
          <div>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <strong style={{ fontSize: "36px", color: "var(--color-primary)", display: "block" }}>
                {readinessScore}%
              </strong>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                {readinessScore >= 75
                  ? "Outstanding Placement Readiness"
                  : readinessScore >= 50
                  ? "Solid Progress — Target Areas for Improvement"
                  : "Foundation Stage — Follow Recommendations Below"}
              </p>
            </div>

            <h3 style={{ fontSize: "14px", marginBottom: "10px", color: "var(--color-text-secondary)" }}>
              Score Breakdown by Pillar
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginBottom: "20px" }}>
              <div style={{ padding: "10px", background: "var(--color-surface-hover)", borderRadius: "var(--radius-md)" }}>
                <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>DSA Problem Solving</span>
                <p style={{ fontWeight: 700, fontSize: "14px" }}>{scoreBreakdown.dsa || 0} / 35 pts</p>
              </div>
              <div style={{ padding: "10px", background: "var(--color-surface-hover)", borderRadius: "var(--radius-md)" }}>
                <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Application Pipeline</span>
                <p style={{ fontWeight: 700, fontSize: "14px" }}>{scoreBreakdown.applications || 0} / 25 pts</p>
              </div>
              <div style={{ padding: "10px", background: "var(--color-surface-hover)", borderRadius: "var(--radius-md)" }}>
                <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Mock Interview Performance</span>
                <p style={{ fontWeight: 700, fontSize: "14px" }}>{scoreBreakdown.mockInterviews || 0} / 15 pts</p>
              </div>
              <div style={{ padding: "10px", background: "var(--color-surface-hover)", borderRadius: "var(--radius-md)" }}>
                <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Skills & Profile</span>
                <p style={{ fontWeight: 700, fontSize: "14px" }}>{scoreBreakdown.skillsAndProfile || 0} / 15 pts</p>
              </div>
              <div style={{ padding: "10px", background: "var(--color-surface-hover)", borderRadius: "var(--radius-md)" }}>
                <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Preparation Consistency</span>
                <p style={{ fontWeight: 700, fontSize: "14px" }}>{scoreBreakdown.consistency || 0} / 10 pts</p>
              </div>
            </div>

            {/* Strengths */}
            {strengths.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <h4 style={{ fontSize: "13px", color: "var(--color-accent)", marginBottom: "6px" }}>
                  ✓ Key Strengths
                </h4>
                <ul style={{ paddingLeft: "20px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                  {strengths.map((str, idx) => (
                    <li key={idx} style={{ marginBottom: "4px" }}>{str}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weaknesses */}
            {weaknesses.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <h4 style={{ fontSize: "13px", color: "var(--color-danger)", marginBottom: "6px" }}>
                  ⚠ Areas for Improvement
                </h4>
                <ul style={{ paddingLeft: "20px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                  {weaknesses.map((w, idx) => (
                    <li key={idx} style={{ marginBottom: "4px" }}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actionable Suggestions */}
            {actionableSuggestions.length > 0 && (
              <div style={{ padding: "14px", background: "var(--color-soft-green)", borderRadius: "var(--radius-md)" }}>
                <h4 style={{ fontSize: "13px", color: "var(--color-primary)", marginBottom: "6px" }}>
                  🎯 Recommended Actions to Boost Your Score
                </h4>
                <ul style={{ paddingLeft: "20px", fontSize: "13px", color: "var(--color-text-primary)" }}>
                  {actionableSuggestions.map((sug, idx) => (
                    <li key={idx} style={{ marginBottom: "4px" }}>{sug}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="modal-footer" style={{ margin: "20px -24px -24px", padding: "16px 24px" }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setReadinessModalOpen(false)}
              >
                Close Assessment
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
