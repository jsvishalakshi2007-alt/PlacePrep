import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { registerUser, googleLoginUser } from "../api/authApi";
import { useAuth } from "../context/useAuth";
import "../styles/auth.css";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleChange = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await registerUser({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      navigate("/login", {
        state: {
          message: "Registration successful. Please log in with your credentials.",
        },
      });
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (googleResponse) => {
    setError("");

    if (!googleResponse?.credential) {
      setError("Google did not return a credential. Please try again.");
      return;
    }

    setGoogleLoading(true);

    try {
      const data = await googleLoginUser(googleResponse.credential);
      login(data.token, data.user);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Google sign-up failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-layout">
        <section className="auth-showcase">
          <div className="auth-showcase-brand">
            <img className="auth-leaf-logo" src="/favicon.svg" alt="" />
            <div>
              <h1>PlacePrep</h1>
              <p>Your companion for a better tomorrow</p>
            </div>
          </div>

          <div className="auth-showcase-message">
            <span className="auth-showcase-tag">Placement Preparation Platform</span>
            <h2 className="auth-showcase-title">
              Track every loop. Master every round. Land your offer.
            </h2>
            <p className="auth-showcase-caption">
              Create your account to unlock structured company interview tracking, personalized skill gap analysis, and versioned resume management.
            </p>
            <div className="auth-showcase-features">
              <div className="auth-feature-pill">🎯 10-Stage Target Company Tracking</div>
              <div className="auth-feature-pill">⚡ Interactive Skills Gap Analytics</div>
              <div className="auth-feature-pill">📄 In-App Resume Previewer & Versioning</div>
              <div className="auth-feature-pill">📅 Integrated Daily Study Planner</div>
            </div>
          </div>

          <div className="auth-decoration auth-decoration-one" aria-hidden="true" />
          <div className="auth-decoration auth-decoration-two" aria-hidden="true" />
        </section>

        <section className="auth-form-side">
          <div className="auth-card">
            <div className="auth-brand">
              <img className="auth-logo" src="/favicon.svg" alt="" />
              <h1>Create an Account</h1>
              <p>Sign up to start your placement preparation journey</p>
            </div>

            <div className="google-signup">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() =>
                  setError("Google sign-up failed. Please try again.")
                }
                text="signup_with"
                shape="rectangular"
                theme="outline"
                size="large"
                width="320"
              />
              {googleLoading && (
                <p className="auth-hint" role="status">
                  Signing up with Google...
                </p>
              )}
            </div>

            <div className="auth-divider">
              <span>or register with email</span>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label htmlFor="reg-name">Full Name</label>
                <input
                  id="reg-name"
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="reg-email">Email</label>
                <input
                  id="reg-email"
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="reg-password">Password</label>
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="reg-confirm">Confirm Password</label>
                <input
                  id="reg-confirm"
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="auth-form-options">
                <label className="auth-checkbox">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(event) =>
                      setShowPassword(event.target.checked)
                    }
                  />
                  Show password
                </label>
              </div>

              {error && (
                <p className="auth-error" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="auth-submit"
                disabled={loading || googleLoading}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <p className="auth-footer">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
