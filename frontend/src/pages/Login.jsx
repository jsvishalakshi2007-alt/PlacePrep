import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { loginUser, googleLoginUser } from "../api/authApi";
import { useAuth } from "../context/useAuth";
import "../styles/auth.css";

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const successMessage = location.state?.message;

  const handleLoginSuccess = (data) => {
    if (!data?.token) {
      throw new Error("The server did not return an authentication token.");
    }

    login(data.token, data.user);

    if (typeof onLogin === "function") {
      onLogin(data.token, data.user);
    }

    navigate("/", { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginUser({
        email: email.trim().toLowerCase(),
        password,
      });

      handleLoginSuccess(data);
    } catch (err) {
      setError(err.message || "Login failed.");
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
      handleLoginSuccess(data);
    } catch (err) {
      setError(err.message || "Google login failed.");
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
              Plan with precision. Practice with purpose. Get placed.
            </h2>
            <p className="auth-showcase-caption">
              Track target company pipelines, analyze placement skill gaps, organize tailored resumes, and follow structured daily study plans.
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
              <h1>Welcome Back</h1>
              <p>Login to your PlacePrep account</p>
            </div>

            {successMessage && (
              <p className="auth-success" role="status">
                {successMessage}
              </p>
            )}

            <div className="google-signup">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() =>
                  setError("Google sign-in failed. Please try again.")
                }
                text="continue_with"
                shape="rectangular"
                theme="outline"
                size="large"
                width="320"
              />
              {googleLoading && (
                <p className="auth-hint" role="status">
                  Signing in with Google...
                </p>
              )}
            </div>

            <div className="auth-divider">
              <span>or login with email</span>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="auth-field">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
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
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="auth-footer">
              Don't have an account? <Link to="/register">Sign up</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
