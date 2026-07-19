import { useState } from "react";
import api from "../services/api";
import { Shield } from "lucide-react";

function Login() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [customEmail, setCustomEmail] = useState("");

    const makeMockGoogleToken = (email, name) => {
        const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
        const payload = btoa(JSON.stringify({
            email,
            name,
            sub: "google-oauth2|" + Math.floor(Math.random() * 10000000),
            iss: "accounts.google.com",
            exp: Math.floor(Date.now() / 1000) + 3600,
        }));
        return `${header}.${payload}.mocksignature`;
    };

    const handleGoogleAuth = async (email, name) => {
        setLoading(true);
        setError("");
        const token = makeMockGoogleToken(email, name);

        try {
            const res = await api.post("/auth/google", { credential: token });
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.user));
            window.location.href = "/";
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Google Authentication failed.");
        } finally {
            setLoading(false);
            setShowModal(false);
        }
    };

    return (
        <div
            style={{
                height: "100vh",
                backgroundColor: "#0B0F19",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Inter, sans-serif",
                color: "white",
            }}
        >
            <div
                style={{
                    width: "400px",
                    backgroundColor: "#0F172A",
                    border: "1px solid #1E293B",
                    borderRadius: "12px",
                    padding: "40px",
                    textAlign: "center",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                }}
            >
                <div style={{ display: "inline-flex", padding: "16px", borderRadius: "12px", backgroundColor: "#1E293B", marginBottom: "24px" }}>
                    <Shield size={32} style={{ color: "#38BDF8" }} />
                </div>
                <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "white", margin: "0 0 8px 0" }}>
                    CloudIntercept
                </h1>
                <p style={{ fontSize: "14px", color: "#94A3B8", margin: "0 0 32px 0", lineHeight: "1.5" }}>
                    Evidence-Driven Cloud Security Risk & Path Analyzer
                </p>

                {error && (
                    <div style={{ backgroundColor: "#881337", color: "#FDA4AF", padding: "10px 14px", borderRadius: "6px", fontSize: "13px", marginBottom: "20px", textAlign: "left" }}>
                        {error}
                    </div>
                )}

                <button
                    onClick={() => setShowModal(true)}
                    disabled={loading}
                    style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        backgroundColor: "white",
                        color: "#0F172A",
                        border: "none",
                        fontSize: "15px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = "#F1F5F9")}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = "white")}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                    {loading ? "Authenticating..." : "Continue with Google"}
                </button>
            </div>

            {/* Simulated Google OAuth Account Selection Modal */}
            {showModal && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.75)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{
                            width: "360px",
                            backgroundColor: "#1E293B",
                            border: "1px solid #334155",
                            borderRadius: "12px",
                            padding: "30px",
                        }}
                    >
                        <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "15px", color: "white" }}>
                            Choose a Google Account
                        </h2>
                        <p style={{ fontSize: "13px", color: "#94A3B8", marginBottom: "20px" }}>
                            Select a simulated profile to log in to CloudIntercept:
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                            <button
                                onClick={() => handleGoogleAuth("admin@cloudintercept.io", "Piyush Raghorte")}
                                style={{
                                    padding: "12px",
                                    borderRadius: "8px",
                                    backgroundColor: "#0F172A",
                                    color: "white",
                                    border: "1px solid #334155",
                                    cursor: "pointer",
                                    textAlign: "left",
                                    fontSize: "13px",
                                }}
                            >
                                <strong style={{ display: "block" }}>Piyush Raghorte</strong>
                                <span style={{ color: "#64748B" }}>admin@cloudintercept.io</span>
                            </button>

                            <button
                                onClick={() => handleGoogleAuth("secops@cloudintercept.io", "Jane Doe")}
                                style={{
                                    padding: "12px",
                                    borderRadius: "8px",
                                    backgroundColor: "#0F172A",
                                    color: "white",
                                    border: "1px solid #334155",
                                    cursor: "pointer",
                                    textAlign: "left",
                                    fontSize: "13px",
                                }}
                            >
                                <strong style={{ display: "block" }}>Jane Doe</strong>
                                <span style={{ color: "#64748B" }}>secops@cloudintercept.io</span>
                            </button>
                        </div>

                        <div style={{ borderTop: "1px solid #334155", paddingTop: "15px", marginBottom: "20px" }}>
                            <label style={{ display: "block", fontSize: "12px", color: "#94A3B8", marginBottom: "8px" }}>
                                Or enter a custom email:
                            </label>
                            <input
                                type="email"
                                placeholder="name@company.com"
                                value={customEmail}
                                onChange={(e) => setCustomEmail(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    borderRadius: "6px",
                                    backgroundColor: "#0F172A",
                                    color: "white",
                                    border: "1px solid #334155",
                                    outline: "none",
                                    fontSize: "13px",
                                    boxSizing: "border-box",
                                }}
                            />
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: "6px",
                                    backgroundColor: "transparent",
                                    color: "#94A3B8",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleGoogleAuth(customEmail || "user@cloudintercept.io", "Custom User")}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: "6px",
                                    backgroundColor: "#38BDF8",
                                    color: "#0F172A",
                                    border: "none",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                }}
                            >
                                Sign In
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Login;
