import { useEffect, useState } from "react";
import api from "../services/api";
import { Shield, Loader2 } from "lucide-react";

function Login() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleCredentialResponse = async (response) => {
        setLoading(true);
        setError("");
        try {
            const res = await api.post("/auth/google", {
                credential: response.credential,
            });
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.user));
            window.location.href = "/";
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.message ||
                    "Google Sign-In authentication failed on backend."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const initGoogleSignIn = () => {
            if (window.google) {
                window.google.accounts.id.initialize({
                    client_id:
                        "870630654060-p427495s5r1fub6v54qsk8hfl8lphg7c.apps.googleusercontent.com",
                    callback: handleCredentialResponse,
                });

                window.google.accounts.id.renderButton(
                    document.getElementById("googleBtn"),
                    {
                        theme: "filled_blue",
                        size: "large",
                        text: "continue_with",
                        shape: "rectangular",
                        width: 320,
                    }
                );
            }
        };

        if (window.google) {
            initGoogleSignIn();
        } else {
            const checkInterval = setInterval(() => {
                if (window.google) {
                    initGoogleSignIn();
                    clearInterval(checkInterval);
                }
            }, 100);
            return () => clearInterval(checkInterval);
        }
    }, []);

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
                    width: "420px",
                    backgroundColor: "#0F172A",
                    border: "1px solid #1E293B",
                    borderRadius: "12px",
                    padding: "45px 40px",
                    textAlign: "center",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
                }}
            >
                <div
                    style={{
                        display: "inline-flex",
                        padding: "16px",
                        borderRadius: "12px",
                        backgroundColor: "#1E293B",
                        marginBottom: "24px",
                    }}
                >
                    <Shield size={36} style={{ color: "#38BDF8" }} />
                </div>
                <h1
                    style={{
                        fontSize: "30px",
                        fontWeight: "800",
                        color: "white",
                        margin: "0 0 6px 0",
                        letterSpacing: "-0.5px",
                    }}
                >
                    CloudIntercept
                </h1>
                <h2
                    style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#38BDF8",
                        margin: "0 0 12px 0",
                    }}
                >
                    Intelligent Cloud Security Platform
                </h2>
                <p
                    style={{
                        fontSize: "14px",
                        color: "#94A3B8",
                        margin: "0 0 32px 0",
                        lineHeight: "1.6",
                    }}
                >
                    Transforming verified AWS evidence into understandable attack scenarios and
                    prioritized mitigation guidance.
                </p>

                {error && (
                    <div
                        style={{
                            backgroundColor: "#881337",
                            color: "#FDA4AF",
                            padding: "10px 14px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            marginBottom: "24px",
                            textAlign: "left",
                            border: "1px solid #991B1B",
                        }}
                    >
                        {error}
                    </div>
                )}

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "44px",
                    }}
                >
                    {loading ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#38BDF8", fontSize: "14px" }}>
                            <Loader2 className="animate-spin" size={18} />
                            Authenticating session...
                        </div>
                    ) : (
                        <div id="googleBtn"></div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Login;
