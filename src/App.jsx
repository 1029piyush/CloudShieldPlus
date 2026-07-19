import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "870630654060-p427495s5r1fub6v54qsk8hfl8lphg7c.apps.googleusercontent.com";

// Protected Route wrapper
function ProtectedRoute({ children }) {
    const { token, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
                <h3>Verifying session status...</h3>
            </div>
        );
    }

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

// Minimalist authenticated home view
function WelcomeHome() {
    const { user, logout } = useAuth();

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
                width: "400px",
                backgroundColor: "white",
                borderRadius: "24px",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.05)",
                padding: "40px",
                textAlign: "center",
                boxSizing: "border-box"
            }}>
                {user?.picture && (
                    <img 
                        src={user.picture} 
                        alt={user.name} 
                        style={{
                            width: "80px",
                            height: "80px",
                            borderRadius: "50%",
                            marginBottom: "16px",
                            border: "3px solid #2563eb",
                            objectFit: "cover"
                        }} 
                    />
                )}
                <h2 style={{ margin: "0 0 6px 0", color: "#0f172a" }}>Welcome, {user?.name}!</h2>
                <p style={{ margin: "0 0 24px 0", color: "#64748b", fontSize: "14px" }}>{user?.email}</p>
                
                <div style={{
                    fontSize: "12px",
                    color: "#10b981",
                    backgroundColor: "#ecfdf5",
                    padding: "8px 12px",
                    borderRadius: "10px",
                    fontWeight: "700",
                    marginBottom: "24px",
                    display: "inline-block"
                }}>
                    Authenticated via CloudIntercept JWT
                </div>

                <button 
                    onClick={logout}
                    style={{
                        width: "100%",
                        padding: "12px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                        transition: "opacity 0.2s"
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = 0.9}
                    onMouseLeave={(e) => e.target.style.opacity = 1}
                >
                    Log out
                </button>
            </div>
        </div>
    );
}

function App() {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route 
                            path="/" 
                            element={
                                <ProtectedRoute>
                                    <WelcomeHome />
                                </ProtectedRoute>
                            } 
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </GoogleOAuthProvider>
    );
}

export default App;