import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();

  const navItems = [
    { to: "/", label: "Overview", icon: "⌂" },
    { to: "/applications", label: "Applications", icon: "▤" },
    { to: "/companies", label: "Target Companies", icon: "🏢" },
    { to: "/practice", label: "DSA Practice", icon: "⌘" },
    { to: "/planner", label: "Study Planner", icon: "▦" },
    { to: "/skills", label: "Skills & Resume", icon: "🎯" },
    { to: "/deadlines", label: "Deadlines", icon: "◷" },
    { to: "/mock-interviews", label: "Mock Interviews", icon: "♧" },
    { to: "/timeline", label: "Activity Timeline", icon: "⏱" },
    { to: "/notes", label: "Notes & Resources", icon: "▧" },
    { to: "/profile", label: "My Profile", icon: "◎" },
  ];

  return (
    <aside className={`app-sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <NavLink to="/" className="brand-wrapper" title="PlacePrep">
          <div className="brand-logo-icon">P</div>
          {!collapsed && (
            <div className="brand-text-container">
              <strong>PlacePrep</strong>
              <small>Plan • Practice • Place</small>
            </div>
          )}
        </NavLink>
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      <nav className="sidebar-nav-section">
        {!collapsed && <div className="nav-group-label">Workspace</div>}
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? "active" : ""}`
            }
            title={collapsed ? item.label : undefined}
          >
            <span className="nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-snippet">
          <div className="user-avatar">
            {(user?.name || "U").charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="user-meta">
              <strong>{user?.name || "Student"}</strong>
              <span>{user?.college || "Placement Track"}</span>
            </div>
          )}
        </div>
        <button
          type="button"
          className="logout-icon-btn"
          onClick={logout}
          title="Log out"
          aria-label="Log out"
        >
          ⎋
        </button>
      </div>
    </aside>
  );
}
