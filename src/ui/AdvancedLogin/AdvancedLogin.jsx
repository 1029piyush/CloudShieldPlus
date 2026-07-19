import { useState } from "react";
import api from "../../services/api";
import "./AdvancedLogin.css";

function AdvancedLogin({ onBackToLogin, onLogin }) {
  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [region, setRegion] = useState("");
  const [sessionDuration, setSessionDuration] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const regions = [
    "us-east-1",
    "us-east-2",
    "us-west-1",
    "us-west-2",
    "ca-central-1",
    "eu-west-1",
    "eu-west-2",
    "eu-west-3",
    "eu-central-1",
    "ap-south-1",
    "ap-southeast-1",
    "ap-southeast-2",
    "ap-northeast-1",
    "ap-northeast-2",
    "sa-east-1"
  ];

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!accessKeyId || !secretAccessKey || !region) {
      setMessage("Please fill in the required fields before continuing.");
      return;
    }

    setLoading(true);
    setMessage("Establishing cloud session...");

    // Derive a unique identity key derived from the AWS Access Key ID
    const shortKey = accessKeyId.trim().substring(0, 8);
    const tempUsername = `aws_${shortKey}`;
    const tempEmail = `aws_${shortKey}@cloudintercept.io`;
    const tempPassword = `pwd_${secretAccessKey.trim().substring(0, 8)}`;

    try {
      let token = "";
      let user = null;

      // 1. Try to login
      try {
        const loginRes = await api.post("/auth/login", {
          username: tempUsername,
          password: tempPassword
        });
        token = loginRes.data.token;
        user = loginRes.data.user;
      } catch (err) {
        // 2. If login fails, register the user first
        await api.post("/auth/register", {
          username: tempUsername,
          email: tempEmail,
          password: tempPassword
        });

        // Retry login
        const loginRes = await api.post("/auth/login", {
          username: tempUsername,
          password: tempPassword
        });
        token = loginRes.data.token;
        user = loginRes.data.user;
      }

      // Store JWT token to request headers interceptor
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // 3. Connect the AWS credentials
      setMessage("AWS Session: Connecting Account and Validating Permissions...");
      await api.post("/aws-accounts", {
        account_name: "Direct Key Login",
        access_key: accessKeyId,
        secret_key: secretAccessKey,
        region: region
      });

      setMessage("Success! Loading dashboard...");
      setTimeout(() => {
        onLogin();
      }, 500);

    } catch (err) {
      console.error(err);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setMessage(err.response?.data?.message || "Failed to validate AWS credentials. Ensure access keys are correct.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page advanced-login-page">
      <div className="login-card advanced-login-card">
        <button type="button" className="back-button" onClick={onBackToLogin}>
          ← Back to login
        </button>

        <div className="login-header advanced-login-header">
          <div>
            <p className="eyebrow">Advanced login</p>
            <h1>Access with your cloud keys</h1>
          </div>
          <p className="subtitle">
            Use your access key credentials to connect directly to your cloud provider.
          </p>
        </div>

        <form className="login-form advanced-login-form" onSubmit={handleSubmit}>
          <label>
            Access Key ID
            <div className="input-group">
              <input
                type={showAccessKey ? "text" : "password"}
                value={accessKeyId}
                onChange={(event) => setAccessKeyId(event.target.value)}
                placeholder="AKIA..."
                required
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowAccessKey((current) => !current)}
                aria-label={showAccessKey ? "Hide access key" : "Show access key"}
              >
                {showAccessKey ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="visibility-icon">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="visibility-icon">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <path d="M4 4l16 16" />
                  </svg>
                )}
              </button>
            </div>
          </label>

          <label>
            Secret Access Key
            <div className="input-group">
              <input
                type={showSecretKey ? "text" : "password"}
                value={secretAccessKey}
                onChange={(event) => setSecretAccessKey(event.target.value)}
                placeholder="••••••••••••••••••••"
                required
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowSecretKey((current) => !current)}
                aria-label={showSecretKey ? "Hide secret access key" : "Show secret access key"}
              >
                {showSecretKey ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="visibility-icon">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="visibility-icon">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <path d="M4 4l16 16" />
                  </svg>
                )}
              </button>
            </div>
          </label>

          <label>
            Region
            <select value={region} onChange={(event) => setRegion(event.target.value)} required>
              <option value="" disabled>
                Select a region
              </option>
              {regions.map((regionOption) => (
                <option key={regionOption} value={regionOption}>
                  {regionOption}
                </option>
              ))}
            </select>
          </label>

          <label>
            Session duration (minutes)
            <input
              type="number"
              min="0"
              value={sessionDuration}
              onChange={(event) => setSessionDuration(event.target.value)}
              placeholder="Optional"
            />
          </label>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "Verifying..." : "Sign in with access keys"}
          </button>
        </form>

        {message && <p className="status-message">{message}</p>}
      </div>
    </div>
  );
}

export default AdvancedLogin;
