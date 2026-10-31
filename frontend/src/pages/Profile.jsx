import { useState } from "react";
import { useAuth } from "../context/useAuth";
import { updateProfile, setPassword as updatePasswordApi } from "../api/authApi";
import ProgressBar from "../components/common/ProgressBar";
import Badge from "../components/common/Badge";

function ProfileFormInner({ user, onProfileUpdated }) {
  const [formData, setFormData] = useState(() => ({
    name: user?.name || "",
    email: user?.email || "",
    profileImage: user?.profileImage || "",
    careerObjective: user?.careerObjective || "",
    college: user?.college || "",
    department: user?.department || "",
    academicYear: user?.academicYear || "",
    graduationYear: user?.graduationYear ? String(user.graduationYear) : "",
    skills: Array.isArray(user?.skills) ? user.skills.join(", ") : "",
    interests: Array.isArray(user?.interests) ? user.interests.join(", ") : "",
  }));

  const [activeTab, setActiveTab] = useState("personal");

  // Password fields
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Calculate completeness
  const calculateCompleteness = () => {
    let filled = 0;
    const fields = [
      formData.name,
      formData.email,
      formData.college,
      formData.department,
      formData.academicYear,
      formData.graduationYear,
      formData.skills,
      formData.interests,
      formData.careerObjective,
    ];
    fields.forEach((f) => {
      if (typeof f === "string" && f.trim()) filled++;
    });
    return Math.round((filled / fields.length) * 100);
  };

  const completeness = calculateCompleteness();

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const updates = {
        name: formData.name.trim(),
        college: formData.college.trim(),
        department: formData.department.trim(),
        academicYear: formData.academicYear.trim(),
        graduationYear: formData.graduationYear ? Number(formData.graduationYear) : null,
        careerObjective: formData.careerObjective.trim(),
        profileImage: formData.profileImage.trim(),
        skills: formData.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        interests: formData.interests
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean),
      };

      const updated = await updateProfile(updates);
      onProfileUpdated(updated);
      setSuccessMessage("Profile saved successfully.");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setErrorMessage(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg("");
    setPasswordError("");

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    try {
      await updatePasswordApi({ password, confirmPassword });
      setPasswordMsg("Password changed successfully.");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordMsg(""), 4000);
    } catch (err) {
      setPasswordError(err.message || "Failed to change password.");
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* Profile Overview Card with Completeness Meter */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
          <div
            className="user-avatar"
            style={{ width: "64px", height: "64px", fontSize: "26px" }}
          >
            {(user?.name || "U").charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "20px" }}>{user?.name || "Student Profile"}</h2>
            <p style={{ color: "var(--color-text-secondary)", marginTop: "2px" }}>
              {user?.email} &bull; {user?.college || "Academic institution not set"}
            </p>
            <div style={{ marginTop: "10px", maxWidth: "360px" }}>
              <ProgressBar
                value={completeness}
                max={100}
                label="Profile Completeness"
                height={8}
                color={completeness >= 80 ? "var(--color-primary)" : "var(--color-accent)"}
              />
            </div>
          </div>
          <Badge variant={user?.authProvider === "google" ? "blue" : "green"}>
            {user?.authProvider === "google" ? "Google Account" : "PlacePrep Verified"}
          </Badge>
        </div>
      </div>

      {/* 4-Section Navigation Tabs (Report 3.5) */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--color-border)",
          marginBottom: "20px",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("personal")}
          style={{
            padding: "10px 16px",
            fontWeight: 600,
            fontSize: "13px",
            color: activeTab === "personal" ? "var(--color-primary)" : "var(--color-text-secondary)",
            borderBottom: activeTab === "personal" ? "2px solid var(--color-primary)" : "2px solid transparent",
          }}
        >
          1. Personal Information
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("academic")}
          style={{
            padding: "10px 16px",
            fontWeight: 600,
            fontSize: "13px",
            color: activeTab === "academic" ? "var(--color-primary)" : "var(--color-text-secondary)",
            borderBottom: activeTab === "academic" ? "2px solid var(--color-primary)" : "2px solid transparent",
          }}
        >
          2. Academic Information
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("skills")}
          style={{
            padding: "10px 16px",
            fontWeight: 600,
            fontSize: "13px",
            color: activeTab === "skills" ? "var(--color-primary)" : "var(--color-text-secondary)",
            borderBottom: activeTab === "skills" ? "2px solid var(--color-primary)" : "2px solid transparent",
          }}
        >
          3. Skills & Interests
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("security")}
          style={{
            padding: "10px 16px",
            fontWeight: 600,
            fontSize: "13px",
            color: activeTab === "security" ? "var(--color-primary)" : "var(--color-text-secondary)",
            borderBottom: activeTab === "security" ? "2px solid var(--color-primary)" : "2px solid transparent",
          }}
        >
          4. Account & Security
        </button>
      </div>

      {/* Confirmation Alerts */}
      {successMessage && (
        <div
          className="card"
          style={{
            background: "var(--color-soft-green)",
            borderColor: "var(--color-accent)",
            color: "var(--color-primary)",
            marginBottom: "16px",
            padding: "12px 16px",
          }}
        >
          ✓ {successMessage}
        </div>
      )}

      {errorMessage && (
        <div
          className="card"
          style={{
            background: "var(--color-danger-bg)",
            borderColor: "var(--color-danger)",
            color: "var(--color-danger)",
            marginBottom: "16px",
            padding: "12px 16px",
          }}
        >
          ⚠ {errorMessage}
        </div>
      )}

      {/* TAB 1: Personal Information */}
      {activeTab === "personal" && (
        <div className="card">
          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Email Address (read-only)</label>
              <input type="email" disabled value={formData.email} />
            </div>

            <div className="form-group">
              <label>Avatar / Profile Image URL</label>
              <input
                type="url"
                value={formData.profileImage}
                onChange={(e) => setFormData({ ...formData, profileImage: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="form-group">
              <label>Career Objective / Elevator Pitch</label>
              <textarea
                rows={3}
                value={formData.careerObjective}
                onChange={(e) => setFormData({ ...formData, careerObjective: e.target.value })}
                placeholder="Passionate full-stack developer seeking SDE role..."
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Personal Information"}
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: Academic Information */}
      {activeTab === "academic" && (
        <div className="card">
          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label>College / University *</label>
              <input
                type="text"
                value={formData.college}
                onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                placeholder="e.g. National Institute of Technology"
              />
            </div>

            <div className="form-group">
              <label>Department / Branch</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. Computer Science & Engineering"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Current Academic Year</label>
                <input
                  type="text"
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  placeholder="e.g. 4th Year, Final Year"
                />
              </div>

              <div className="form-group">
                <label>Expected Graduation Year</label>
                <input
                  type="number"
                  min={2000}
                  max={2100}
                  value={formData.graduationYear}
                  onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                  placeholder="2027"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Academic Information"}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: Skills and Interests */}
      {activeTab === "skills" && (
        <div className="card">
          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label>Technical Skills (comma-separated)</label>
              <textarea
                rows={3}
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="e.g. C++, Java, React, Node.js, Express, MongoDB, Docker, Git"
              />
            </div>

            {formData.skills && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                {formData.skills
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((s) => (
                    <Badge key={s} variant="green">
                      {s}
                    </Badge>
                  ))}
              </div>
            )}

            <div className="form-group">
              <label>Interests & Preparation Focus (comma-separated)</label>
              <textarea
                rows={3}
                value={formData.interests}
                onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                placeholder="e.g. Backend Engineering, Distributed Systems, Cloud Computing"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Skills & Interests"}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: Account and Security Settings */}
      {activeTab === "security" && (
        <div className="card">
          <h3 style={{ marginBottom: "12px" }}>Account Details</h3>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: "16px" }}>
            Sign-in Provider: <strong>{user?.authProvider || "local"}</strong>
          </p>

          <hr style={{ border: "none", borderTop: "1px solid var(--color-border)", margin: "20px 0" }} />

          <h3 style={{ marginBottom: "12px" }}>Change Account Password</h3>

          {passwordMsg && (
            <div style={{ color: "var(--color-primary)", marginBottom: "12px" }}>
              ✓ {passwordMsg}
            </div>
          )}
          {passwordError && (
            <div style={{ color: "var(--color-danger)", marginBottom: "12px" }}>
              ⚠ {passwordError}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label>New Password (min 8 characters)</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Update Password
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const { user, updateUserProfile } = useAuth();
  return (
    <ProfileFormInner
      key={user?._id || user?.id || user?.email || "default"}
      user={user}
      onProfileUpdated={updateUserProfile}
    />
  );
}
