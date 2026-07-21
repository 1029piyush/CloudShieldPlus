import { useState, useEffect } from "react";
import api from "../../services/api";
import "./Login.css";

function Login({ onForgotPassword, onCreateAccount, onAdvancedLogin, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("Signing in... Please wait.");

    // Username derived from email
    const username = email.split("@")[0];

    try {
      const res = await api.post("/auth/login", {
        username: username,
        password: password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setMessage("Login successful. Redirecting to dashboard...");
      setTimeout(() => {
        onLogin();
      }, 800);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (response) => {
    setMessage("Authenticating with Google...");
    try {
      const res = await api.post("/auth/google", {
        id_token: response.credential,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setMessage("Authentication successful! Loading dashboard...");
      setTimeout(() => {
        onLogin();
      }, 800);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Google Authentication failed.");
    }
  };

  useEffect(() => {
    const initGsi = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "870630654060-p427495s5r1fub6v54qsk8hfl8lphg7c.apps.googleusercontent.com",
          callback: handleGoogleLoginSuccess,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("googleBtn"),
          { theme: "outline", size: "large", text: "continue_with", width: 440 }
        );
      }
    };

    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        initGsi();
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div>
            <p className="eyebrow">Welcome to</p>
            <h1>CloudIntercept</h1>
          </div>
          <p className="subtitle">Access the CloudIntercept platform for secure cloud monitoring and compliance.</p>
        </div>

        {/* Real Google Sign-In Render Target */}
        <div style={{ display: "flex", justifyContent: "center", width: "100%", minHeight: "44px" }}>
          <div id="googleBtn"></div>
        </div>

        <div className="divider">or sign in with email</div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
            />
          </label>

          <div className="login-options">
            <label className="remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              Remember me
            </label>
            <button type="button" className="forgot-link" onClick={onForgotPassword}>
              Forgot password?
            </button>
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="footer-text">
          Don’t have an account? <button type="button" className="create-account-link" onClick={onCreateAccount}>Create one</button>
        </div>
        <div className="footer-text" style={{ marginTop: "12px" }}>
          <button type="button" className="create-account-link" onClick={onAdvancedLogin}>Advanced login</button>
        </div>

        {message && <p className="status-message">{message}</p>}
      </div>
    </div>
  );
}

export default Login;
