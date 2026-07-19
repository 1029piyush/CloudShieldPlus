import { useState } from "react";
import "./ForgotPassword.css";

function ForgotPassword({ onBackToLogin }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage(`If ${email} is registered, a password reset link will be sent.`);

    // TODO: connect to backend password reset flow
  };

  return (
    <div className="login-page forgot-page">
      <div className="login-card forgot-card">
        <button type="button" className="back-button" onClick={onBackToLogin}>
          ← Back to login
        </button>

        <div className="login-header forgot-header">
          <p className="eyebrow">Forgot Password</p>
          <h1>Reset your password</h1>
          <p className="subtitle">
            Enter your email address below and we’ll send you a secure link to reset your password.
          </p>
        </div>

        <form className="login-form forgot-form" onSubmit={handleSubmit}>
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

          <button type="submit" className="submit-button">
            Send reset link
          </button>
        </form>

        {message && <p className="status-message">{message}</p>}
      </div>
    </div>
  );
}

export default ForgotPassword;
