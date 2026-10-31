import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import { ThemeProvider } from "./context/ThemeContext";

import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Applications from "./pages/Applications";
import DsaPractice from "./pages/DsaPractice";
import StudyPlanner from "./pages/StudyPlanner";
import Deadlines from "./pages/Deadlines";
import MockInterviews from "./pages/MockInterviews";
import NotesResources from "./pages/NotesResources";
import Profile from "./pages/Profile";
import CompanyHub from "./pages/CompanyHub";
import SkillsAnalyzer from "./pages/SkillsAnalyzer";
import PlacementTimeline from "./pages/PlacementTimeline";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SetPassword from "./pages/SetPassword";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-muted)",
        }}
      >
        Authenticating session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected Standalone Route */}
      <Route
        path="/set-password"
        element={
          <ProtectedRoute>
            <SetPassword />
          </ProtectedRoute>
        }
      />

      {/* Protected App Routes with Shell Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="applications" element={<Applications />} />
        <Route path="companies" element={<CompanyHub />} />
        <Route path="practice" element={<DsaPractice />} />
        <Route path="planner" element={<StudyPlanner />} />
        <Route path="skills" element={<SkillsAnalyzer />} />
        <Route path="deadlines" element={<Deadlines />} />
        <Route path="mock-interviews" element={<MockInterviews />} />
        <Route path="timeline" element={<PlacementTimeline />} />
        <Route path="notes" element={<NotesResources />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function AppRouter() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}
