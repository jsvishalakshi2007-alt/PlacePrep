import { useLocation, Link } from "react-router-dom";
import { useTheme } from "../../context/useTheme";
import { useAuth } from "../../context/useAuth";

export default function Header() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case "/":
        return "Dashboard Overview";
      case "/applications":
        return "Job & Internship Applications";
      case "/practice":
        return "DSA & Coding Practice";
      case "/planner":
        return "Study Planner & Tasks";
      case "/deadlines":
        return "Upcoming Deadlines";
      case "/mock-interviews":
        return "Mock Interview Management";
      case "/notes":
        return "Notes, Resources & Files";
      case "/profile":
        return "Student Profile";
      default:
        return "PlacePrep";
    }
  };

  return (
    <header className="app-header">
      <div className="header-title-box">
        <h1>{getPageTitle(location.pathname)}</h1>
      </div>

      <div className="header-actions">
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? "☼" : "☾"}
        </button>

        <Link
          to="/profile"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <div className="user-avatar" style={{ width: 34, height: 34 }}>
            {(user?.name || "U").charAt(0).toUpperCase()}
          </div>
        </Link>
      </div>
    </header>
  );
}
