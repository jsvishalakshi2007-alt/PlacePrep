import { useState, useEffect } from "react";
import { getTimeline } from "../api/timelineApi";
import Badge from "../components/common/Badge";
import EmptyState from "../components/common/EmptyState";

const TYPE_FILTERS = [
  { label: "All Activity", value: "all" },
  { label: "Applications", value: "application" },
  { label: "Deadlines", value: "deadline" },
  { label: "Mock Interviews", value: "interview" },
  { label: "DSA Practice", value: "dsa" },
  { label: "Tasks", value: "task" },
];

const RANGE_FILTERS = [
  { label: "All Time", value: "all" },
  { label: "Today", value: "today" },
  { label: "Past 7 Days", value: "week" },
  { label: "Past 30 Days", value: "month" },
];

export default function PlacementTimeline() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [rangeFilter, setRangeFilter] = useState("all");

  useEffect(() => {
    let isMounted = true;
    async function loadTimelineData() {
      try {
        const data = await getTimeline({
          type: typeFilter !== "all" ? typeFilter : undefined,
          range: rangeFilter !== "all" ? rangeFilter : undefined,
        });
        if (isMounted) {
          setEvents(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Timeline error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTimelineData();
    return () => {
      isMounted = false;
    };
  }, [typeFilter, rangeFilter]);

  return (
    <div>
      {/* Header Info */}
      <div style={{ marginBottom: "20px" }}>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>
          Chronological journal of your entire placement preparation journey — applications submitted, deadlines, mock interviews, solved DSA problems, and daily goals.
        </p>
      </div>

      {/* Filter Controls */}
      <div
        className="card"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          marginBottom: "24px",
          padding: "14px 20px",
        }}
      >
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`btn btn-sm ${typeFilter === f.value ? "btn-primary" : "btn-outline"}`}
              onClick={() => setTypeFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Time Range:</span>
          {RANGE_FILTERS.map((r) => (
            <button
              key={r.value}
              type="button"
              className={`btn btn-sm ${rangeFilter === r.value ? "btn-secondary" : "btn-outline"}`}
              onClick={() => setRangeFilter(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream */}
      {loading ? (
        <p style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-muted)" }}>
          Loading your placement activity timeline...
        </p>
      ) : events.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="⏱"
            title="No timeline events recorded"
            message="As you submit applications, solve DSA problems, schedule mock interviews, and complete study goals, they will appear in this unified stream."
          />
        </div>
      ) : (
        <div style={{ position: "relative", paddingLeft: "32px" }}>
          {/* Vertical continuous line */}
          <div
            style={{
              position: "absolute",
              left: "14px",
              top: "10px",
              bottom: "10px",
              width: "2px",
              backgroundColor: "var(--color-border)",
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {events.map((item) => (
              <div
                key={item.id}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "16px",
                }}
              >
                {/* Node icon */}
                <div
                  style={{
                    position: "absolute",
                    left: "-32px",
                    top: "14px",
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-surface)",
                    border: "2px solid var(--color-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    boxShadow: "var(--shadow-sm)",
                    zIndex: 2,
                  }}
                >
                  {item.icon}
                </div>

                {/* Event Card */}
                <div
                  className="card"
                  style={{
                    flex: 1,
                    padding: "16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                        {item.category}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>&bull;</span>
                      <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                        {new Date(item.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <strong style={{ fontSize: "15px", display: "block", color: "var(--color-text-primary)" }}>
                      {item.title}
                    </strong>
                    <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                      {item.subtitle}
                    </p>
                  </div>

                  <Badge variant={item.badgeVariant}>{item.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
