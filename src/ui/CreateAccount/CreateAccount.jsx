import { useState } from "react";
import api from "../../services/api";
import "./CreateAccount.css";

function CreateAccount({ onBackToLogin }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!agreeTerms) {
      setMessage("Please accept the terms and conditions to continue.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match. Please check and try again.");
      return;
    }

    setLoading(true);
    setMessage("");

    // Derive a unique username from email
    const username = email.split("@")[0];

    try {
      await api.post("/auth/register", {
        username: username,
        email: email,
        password: password
      });

      setMessage("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        onBackToLogin();
      }, 1500);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Failed to create account. Email or username may already exist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page create-account-page">
      <div className="login-card create-account-card">
        <button type="button" className="back-button" onClick={onBackToLogin}>
          ← Back to login
        </button>

        <div className="login-header create-account-header">
          <div>
            <p className="eyebrow">New account</p>
            <h1>Create your CloudIntercept account</h1>
          </div>
          <p className="subtitle">
            Start monitoring your cloud resources, discover issues early, and keep your environment secure.
          </p>
        </div>

        <form className="login-form create-account-form" onSubmit={handleSubmit}>
          <label>
            Full name
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="John Doe"
              required
            />
          </label>

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
              placeholder="Create a password"
              required
            />
          </label>

          <label>
            Confirm password
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat your password"
              required
            />
          </label>

          <label className="terms-checkbox">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(event) => setAgreeTerms(event.target.checked)}
            />
            By creating an account, I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
          </label>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "Registering account..." : "Create account"}
          </button>
        </form>

        <div className="footer-text">
          Already have an account? <button type="button" className="create-account-link" onClick={onBackToLogin}>Sign in</button>
        </div>

        {message && <p className="status-message">{message}</p>}
      </div>
    </div>
  );
}

export default CreateAccount;
