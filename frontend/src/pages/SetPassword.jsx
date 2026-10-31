import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { setPassword as setPasswordApi } from "../api/authApi";

export default function SetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (password.length < 8 || password.length > 128) {
      setError("Password must be between 8 and 128 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const data = await setPasswordApi({ password, confirmPassword });
      setMessage(data.message || "Password set successfully.");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      setError(err.message || "Unable to set password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="set-password-page"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background: "var(--color-bg)",
      }}
    >
      <section
        className="card"
        style={{
          width: "100%",
          maxWidth: "440px",
          padding: "32px",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <p style={{ color: "var(--color-primary)", fontWeight: 700, fontSize: "14px", textTransform: "uppercase" }}>
          PlacePrep
        </p>

        <h1 style={{ margin: "8px 0 12px", fontSize: "22px" }}>
          Set your password
        </h1>

        <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.5, marginBottom: "20px" }}>
          If you signed up with Google, set a password to allow standard email &amp; password sign-in.
        </p>

        {message && (
          <div
            style={{
              padding: "10px 14px",
              background: "var(--color-soft-green)",
              color: "var(--color-primary)",
              borderRadius: "var(--radius-sm)",
              marginBottom: "16px",
              fontSize: "13px",
            }}
          >
            ✓ {message}
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "10px 14px",
              background: "var(--color-danger-bg)",
              color: "var(--color-danger)",
              borderRadius: "var(--radius-sm)",
              marginBottom: "16px",
              fontSize: "13px",
            }}
          >
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="set-pass">New Password (8-128 chars)</label>
            <input
              id="set-pass"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="set-conf">Confirm Password</label>
            <input
              id="set-conf"
              type={showPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "12px" }}>
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              Show password
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginBottom: "16px" }}
            disabled={loading}
          >
            {loading ? "Setting Password..." : "Set Password"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "13px" }}>
          <Link to="/" style={{ color: "var(--color-accent)", textDecoration: "underline" }}>
            Return to Dashboard
          </Link>
        </p>
      </section>
    </main>
  );
}
