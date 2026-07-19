import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authenticateWithGoogle } from "../services/auth";
import { Shield } from "lucide-react";

function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleGoogleSuccess = async (credentialResponse) => {
        setError("");
        setLoading(true);
        try {
            // credentialResponse.credential is the Google ID Token
            const data = await authenticateWithGoogle(credentialResponse.credential);
            
            // Save ONLY CloudIntercept JWT and user profile
            login(data.access_token, data.user);
            
            // Redirect to "/"
            navigate("/");
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Google verification failed on backend.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "radial-gradient(circle at top, #eef9ff 0%, #d4ecff 42%, #b7e0ff 100%)",
            fontFamily: "Inter, sans-serif",
            padding: "20px"
        }}>
            <div style={{
                width: "440px",
                backgroundColor: "rgba(255, 255, 255, 0.98)",
                border: "1px solid rgba(96, 165, 250, 0.18)",
                borderRadius: "32px",
                boxShadow: "0 30px 90px rgba(15, 23, 42, 0.12)",
                padding: "48px 40px",
                textAlign: "center",
                boxSizing: "border-box"
            }}>
                {/* CloudIntercept Logo */}
                <div style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "18px",
                    background: "linear-gradient(135deg, #38bdf8, #2563eb)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    margin: "0 auto 24px auto",
                    boxShadow: "0 10px 25px rgba(37, 99, 235, 0.2)"
                }}>
                    <Shield size={32} />
                </div>

                {/* Project Title */}
                <h1 style={{
                    fontSize: "28px",
                    fontWeight: "800",
                    color: "#0f172a",
                    margin: "0 0 10px 0",
                    letterSpacing: "-0.02em"
                }}>
                    CloudIntercept
                </h1>

                {/* Short Description */}
                <p style={{
                    fontSize: "14px",
                    color: "#475569",
                    lineHeight: "1.6",
                    margin: "0 0 36px 0"
                }}>
                    Intelligent evidence-driven cloud security posture management platform.
                </p>

                {/* Continue with Google button */}
                <div style={{ display: "flex", justifyContent: "center", minHeight: "44px" }}>
                    {loading ? (
                        <div style={{ fontSize: "14px", fontWeight: "700", color: "#2563eb" }}>
                            Verifying credentials...
                        </div>
                    ) : (
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError("Google Sign-In failed.")}
                            useOneTap={false}
                            theme="outline"
                            size="large"
                            width="360"
                        />
                    )}
                </div>

                {error && (
                    <div style={{
                        marginTop: "24px",
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#ef4444",
                        backgroundColor: "rgba(239, 68, 68, 0.08)",
                        padding: "10px 14px",
                        borderRadius: "12px"
                    }}>
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Login;
