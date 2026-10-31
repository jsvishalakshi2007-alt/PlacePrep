import { useState, useEffect } from "react";
import {
  getTasks,
  addTask,
  updateTask,
  deleteTask,
  getStreakSummary,
} from "../api/taskApi";
import { getDeadlines } from "../api/deadlineApi";
import Badge from "../components/common/Badge";
import Modal from "../components/common/Modal";
import EmptyState from "../components/common/EmptyState";
import StatCard from "../components/common/StatCard";

const CATEGORIES = ["DSA", "Practice", "Applications", "Learning", "System Design", "Core CS"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

export default function StudyPlanner() {
  const [tasks, setTasks] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [streakSummary, setStreakSummary] = useState({
    streakDays: 0,
    todayTotal: 0,
    todayCompleted: 0,
    todayProgress: 0,
    suggestions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("DSA");
  const [newTaskDuration, setNewTaskDuration] = useState("45 min");
  const [newTaskPriority, setNewTaskPriority] = useState("Medium");
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().slice(0, 10));

  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("10:00");

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function loadTasksData() {
      try {
        const [tasksData, streakData, deadlinesData] = await Promise.all([
          getTasks(),
          getStreakSummary().catch(() => ({
            streakDays: 0,
            todayTotal: 0,
            todayCompleted: 0,
            todayProgress: 0,
            suggestions: [],
          })),
          getDeadlines().catch(() => []),
        ]);
        if (isMounted) {
          setTasks(Array.isArray(tasksData) ? tasksData : []);
          setStreakSummary(streakData);
          setDeadlines(Array.isArray(deadlinesData) ? deadlinesData : []);
          setError("");
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load study tasks.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTasksData();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Compute 7 days of the selected week (Sunday to Saturday)
  const weekStart = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
    d.setDate(d.getDate() - day + weekOffset * 7);
    return d;
  })();

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + i);
    return dayDate;
  });

  const notifyChange = () => {
    window.dispatchEvent(new Event("placeprep:data_updated"));
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      await addTask({
        title: newTaskTitle.trim(),
        category: newTaskCategory,
        duration: newTaskDuration,
        priority: newTaskPriority,
        scheduledDate: newTaskDate ? new Date(`${newTaskDate}T12:00:00`).toISOString() : undefined,
        completed: false,
      });
      setNewTaskTitle("");
      setAddModalOpen(false);
      notifyChange();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err.message || "Failed to add task.");
    }
  };

  const handleAdoptSuggestion = async (suggestion) => {
    try {
      await addTask({
        title: suggestion.title,
        category: suggestion.category || "DSA",
        duration: "45 min",
        priority: suggestion.priority || "High",
        scheduledDate: new Date().toISOString(),
        suggestedBy: "smart_engine",
        completed: false,
      });
      notifyChange();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err.message || "Failed to adopt suggestion.");
    }
  };

  const handleToggleComplete = async (task) => {
    try {
      await updateTask(task._id, { completed: !task.completed });
      notifyChange();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err.message || "Update failed.");
    }
  };

  const handleOpenSchedule = (task) => {
    setSelectedTask(task);
    const dateStr = task.scheduledDate
      ? new Date(task.scheduledDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    setScheduleDate(dateStr);
    setScheduleTime(task.startTime || "10:00");
    setScheduleModalOpen(true);
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!selectedTask || !scheduleDate) return;

    try {
      await updateTask(selectedTask._id, {
        scheduledDate: new Date(`${scheduleDate}T12:00:00`).toISOString(),
        startTime: scheduleTime,
      });
      setScheduleModalOpen(false);
      setSelectedTask(null);
      notifyChange();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err.message || "Schedule update failed.");
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm("Remove this task?")) return;
    try {
      await deleteTask(id);
      notifyChange();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err.message || "Delete failed.");
    }
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.length - completedCount;

  // Filter overdue tasks: scheduled before today and not completed
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const overdueTasks = tasks.filter(
    (t) => !t.completed && t.scheduledDate && new Date(t.scheduledDate) < now
  );

  return (
    <div>
      {/* Daily Focus & Preparation Streak Banner */}
      <div
        className="card"
        style={{
          marginBottom: "20px",
          background: "linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-hover) 100%)",
          borderLeft: "4px solid var(--color-primary)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "20px" }}>🔥</span>
              <h2 style={{ margin: 0, fontSize: "18px" }}>
                {streakSummary.streakDays > 0
                  ? `${streakSummary.streakDays}-Day Preparation Streak!`
                  : "Start Your Daily Prep Streak Today!"}
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-secondary)" }}>
              {streakSummary.streakDays > 0
                ? "Consistency is the key to top-tier campus and off-campus placements. Keep going!"
                : "Complete at least one scheduled prep task today to ignite your preparation streak."}
            </p>
          </div>

          <div style={{ minWidth: "220px", flex: 1, maxWidth: "340px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
              <span style={{ fontWeight: 600 }}>Today's Target Progress</span>
              <span style={{ color: "var(--color-primary)", fontWeight: 700 }}>
                {streakSummary.todayCompleted} / {streakSummary.todayTotal} ({streakSummary.todayProgress}%)
              </span>
            </div>
            <div
              style={{
                height: "8px",
                background: "var(--color-border)",
                borderRadius: "var(--radius-full)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${streakSummary.todayProgress}%`,
                  height: "100%",
                  background: "var(--color-primary)",
                  borderRadius: "var(--radius-full)",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        </div>

        {/* Smart Recommendations List */}
        {streakSummary.suggestions && streakSummary.suggestions.length > 0 && (
          <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--color-border-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-primary)" }}>
                💡 Recommended Focus for Today:
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px" }}>
              {streakSummary.suggestions.map((sug, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div style={{ overflow: "hidden", paddingRight: "8px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {sug.title}
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                      {sug.reason || sug.category}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => handleAdoptSuggestion(sug)}
                    style={{ whiteSpace: "nowrap", flexShrink: 0 }}
                  >
                    + Add to Today
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="stat-card-grid" style={{ marginBottom: "20px" }}>
        <StatCard
          icon="✓"
          iconColor="green"
          label="Completed Tasks"
          value={completedCount}
          secondaryText="Daily preparation goals met"
        />
        <StatCard
          icon="⌛"
          iconColor="blue"
          label="Pending Tasks"
          value={pendingCount}
          secondaryText="Scheduled in planner"
        />
        <StatCard
          icon="⚠"
          iconColor="amber"
          label="Overdue Tasks"
          value={overdueTasks.length}
          secondaryText="Tasks past scheduled dates"
        />
      </div>

      {/* Week Navigation Header */}
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
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => setWeekOffset((prev) => prev - 1)}
          >
            &larr; Prev Week
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => setWeekOffset(0)}
          >
            Current Week
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => setWeekOffset((prev) => prev + 1)}
          >
            Next Week &rarr;
          </button>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)" }}>
            {weekDays[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} &ndash;{" "}
            {weekDays[6].toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setAddModalOpen(true)}
        >
          + Add Study Task
        </button>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: "20px", color: "var(--color-danger)" }}>
          {error}
        </div>
      )}

      {loading && (
        <p style={{ textAlign: "center", padding: "10px 0", color: "var(--color-text-muted)" }}>
          Updating tasks...
        </p>
      )}

      {/* Overdue alert banner if any */}
      {overdueTasks.length > 0 && (
        <div
          className="card"
          style={{
            marginBottom: "20px",
            borderLeft: "4px solid var(--color-warning)",
            background: "var(--color-warning-bg)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <strong style={{ color: "var(--color-warning)" }}>Attention: You have {overdueTasks.length} overdue task(s)</strong>
              <p style={{ fontSize: "12px", marginTop: "4px", color: "var(--color-text-primary)" }}>
                Consider rescheduling or completing them to maintain your study rhythm.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 7-Day Week Columns Grid (Single Horizontal Row) */}
      <div
        style={{
          overflowX: "auto",
          width: "100%",
          paddingBottom: "8px",
          marginBottom: "30px",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(130px, 1fr))",
            gap: "10px",
            minWidth: "750px",
          }}
        >
          {weekDays.map((day) => {
            const dateString = day.toISOString().slice(0, 10);
            const isToday = new Date().toISOString().slice(0, 10) === dateString;
            const isSelected = selectedDate === dateString;

            const dayTasks = tasks.filter((t) => {
              if (!t.scheduledDate) return false;
              return new Date(t.scheduledDate).toISOString().slice(0, 10) === dateString;
            });

            const dayDeadlines = deadlines.filter((dl) => {
              if (!dl.dueDate) return false;
              return new Date(dl.dueDate).toISOString().slice(0, 10) === dateString;
            });

            return (
              <div
                key={dateString}
                className="card"
                onClick={() => setSelectedDate(dateString)}
                style={{
                  padding: "12px",
                  borderTop: isToday
                    ? "4px solid var(--color-primary)"
                    : isSelected
                    ? "4px solid var(--color-accent)"
                    : "1px solid var(--color-border)",
                  border: isSelected ? "2px solid var(--color-primary)" : undefined,
                  backgroundColor: isSelected
                    ? "var(--color-surface-hover)"
                    : isToday
                    ? "var(--color-soft-green)"
                    : "var(--color-surface)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      marginBottom: "10px",
                      borderBottom: "1px solid var(--color-border-subtle)",
                      paddingBottom: "6px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          color: isToday
                            ? "var(--color-primary)"
                            : isSelected
                            ? "var(--color-accent)"
                            : "var(--color-text-muted)",
                        }}
                      >
                        {day.toLocaleDateString(undefined, { weekday: "short" })}
                      </span>
                      <strong
                        style={{
                          display: "block",
                          fontSize: "16px",
                          color: isToday ? "var(--color-primary)" : "inherit",
                        }}
                      >
                        {day.getDate()}
                      </strong>
                    </div>
                    {isToday && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "10px",
                          background: "var(--color-primary)",
                          color: "#fff",
                        }}
                      >
                        Today
                      </span>
                    )}
                  </div>

                  {/* Deadlines Section */}
                  {dayDeadlines.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "8px" }}>
                      {dayDeadlines.map((dl) => (
                        <div
                          key={dl._id}
                          style={{
                            padding: "3px 6px",
                            borderRadius: "var(--radius-sm)",
                            background: "rgba(239, 68, 68, 0.12)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            color: "#DC2626",
                            fontSize: "11px",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={`Deadline: ${dl.title} (${dl.company || dl.category})`}
                        >
                          <span>◷</span>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                            {dl.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tasks Section */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", minHeight: "90px" }}>
                    {dayTasks.length === 0 && dayDeadlines.length === 0 ? (
                      <span style={{ fontSize: "11px", color: "var(--color-text-muted)", fontStyle: "italic" }}>
                        No tasks
                      </span>
                    ) : (
                      dayTasks.map((task) => (
                        <div
                          key={task._id}
                          style={{
                            padding: "6px 8px",
                            background: task.completed ? "var(--color-soft-green)" : "var(--color-surface)",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--color-border-subtle)",
                            opacity: task.completed ? 0.75 : 1,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => handleToggleComplete(task)}
                              style={{ marginTop: "3px", cursor: "pointer" }}
                            />
                            <div style={{ flex: 1, overflow: "hidden" }}>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  textDecoration: task.completed ? "line-through" : "none",
                                  display: "block",
                                  wordBreak: "break-word",
                                }}
                              >
                                {task.title}
                              </span>
                              <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                                {task.duration}
                                {task.priority && ` • ${task.priority}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Day Footer Add Button */}
                <div style={{ marginTop: "8px", paddingTop: "6px", borderTop: "1px dashed var(--color-border-subtle)" }}>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setNewTaskDate(dateString);
                      setAddModalOpen(true);
                    }}
                    style={{
                      width: "100%",
                      fontSize: "11px",
                      padding: "2px 4px",
                      background: "transparent",
                      color: "var(--color-text-muted)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    + Add Task
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unscheduled Tasks Queue */}
      <div className="card">
        <div className="card-header">
          <h2>All Tasks & Unscheduled Queue</h2>
        </div>

        {tasks.length === 0 ? (
          <EmptyState
            icon="▦"
            title="No study tasks yet"
            message="Organize your placement prep syllabus into weekly study tasks."
            actionLabel="+ Add Study Task"
            onAction={() => setAddModalOpen(true)}
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>Done</th>
                  <th>Task Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Duration</th>
                  <th>Scheduled Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleComplete(task)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    <td>
                      <strong
                        style={{
                          textDecoration: task.completed ? "line-through" : "none",
                          color: task.completed ? "var(--color-text-muted)" : "inherit",
                        }}
                      >
                        {task.title}
                      </strong>
                    </td>
                    <td>
                      <Badge variant="green">{task.category}</Badge>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color:
                            task.priority === "Urgent"
                              ? "var(--color-danger)"
                              : task.priority === "High"
                              ? "var(--color-warning)"
                              : "var(--color-text-secondary)",
                        }}
                      >
                        {task.priority || "Medium"}
                      </span>
                    </td>
                    <td>{task.duration}</td>
                    <td>
                      {task.scheduledDate ? (
                        <span>
                          {new Date(task.scheduledDate).toLocaleDateString()}{" "}
                          {task.startTime && `at ${task.startTime}`}
                        </span>
                      ) : (
                        <span style={{ color: "var(--color-text-muted)", fontStyle: "italic" }}>
                          Unscheduled
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          onClick={() => handleOpenSchedule(task)}
                        >
                          Schedule
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteTask(task._id)}
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
      </div>

      {/* Add Task Modal */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Create Study Task"
        size="md"
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setAddModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" form="task-form" className="btn btn-primary">
              Create Task
            </button>
          </>
        }
      >
        <form id="task-form" onSubmit={handleAddTask}>
          <div className="form-group">
            <label>Task Title *</label>
            <input
              type="text"
              required
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="e.g. Solve 3 Binary Tree questions, Study OS Paging"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select
                value={newTaskCategory}
                onChange={(e) => setNewTaskCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Estimated Duration</label>
              <input
                type="text"
                value={newTaskDuration}
                onChange={(e) => setNewTaskDuration(e.target.value)}
                placeholder="e.g. 45 min, 1.5 hr"
              />
            </div>
            <div className="form-group">
              <label>Scheduled Date</label>
              <input
                type="date"
                value={newTaskDate}
                onChange={(e) => setNewTaskDate(e.target.value)}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Schedule Task Modal */}
      <Modal
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title="Schedule Task"
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setScheduleModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" form="sched-form" className="btn btn-primary">
              Save Schedule
            </button>
          </>
        }
      >
        <form id="sched-form" onSubmit={handleSaveSchedule}>
          <p style={{ marginBottom: "14px", fontWeight: 600 }}>
            {selectedTask?.title}
          </p>

          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              required
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Start Time</label>
            <input
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
