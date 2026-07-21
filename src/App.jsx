import { useState, useEffect } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider, useAuth } from "./context/AuthContext";

// UI Pages
import HomePage from "./ui/HomePage/HomePage";
import Login from "./ui/LoginPage/Login";
import ForgotPassword from "./ui/ForgotPassword/ForgotPassword";
import CreateAccount from "./ui/CreateAccount/CreateAccount";
import AdvancedLogin from "./ui/AdvancedLogin/AdvancedLogin";
import Dashboard from "./ui/Dashboard/Dashboard";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "870630654060-p427495s5r1fub6v54qsk8hfl8lphg7c.apps.googleusercontent.com";

function MainRouter() {
  const { token, login, logout, loading } = useAuth();
  const [view, setView] = useState("home");

  useEffect(() => {
    if (token) {
      setView("dashboard");
    } else if (view === "dashboard") {
      setView("home");
    }
  }, [token]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontFamily: "Inter, sans-serif", color: "#64748b" }}>
        <h3>Verifying CloudIntercept session...</h3>
      </div>
    );
  }

  // If user is authenticated, show Dashboard
  if (token || view === "dashboard") {
    return <Dashboard onLogout={logout} />;
  }

  // Unauthenticated routing views
  if (view === "login") {
    return (
      <Login
        onForgotPassword={() => setView("forgot")}
        onCreateAccount={() => setView("create")}
        onAdvancedLogin={() => setView("advanced")}
        onLogin={() => {
          // Re-sync auth context
          const storedToken = localStorage.getItem("token");
          const storedUser = localStorage.getItem("user");
          if (storedToken && storedUser) {
            try {
              login(storedToken, JSON.parse(storedUser));
            } catch (e) {
              login(storedToken, null);
            }
          }
          setView("dashboard");
        }}
      />
    );
  }

  if (view === "forgot") {
    return <ForgotPassword onBackToLogin={() => setView("login")} />;
  }

  if (view === "create") {
    return <CreateAccount onBackToLogin={() => setView("login")} />;
  }

  if (view === "advanced") {
    return (
      <AdvancedLogin
        onBackToLogin={() => setView("login")}
        onLogin={() => {
          const storedToken = localStorage.getItem("token");
          const storedUser = localStorage.getItem("user");
          if (storedToken && storedUser) {
            try {
              login(storedToken, JSON.parse(storedUser));
            } catch (e) {
              login(storedToken, null);
            }
          }
          setView("dashboard");
        }}
      />
    );
  }

  // Default: Landing Page
  return (
    <HomePage
      onLogin={() => setView("login")}
      onCreateAccount={() => setView("create")}
    />
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <MainRouter />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;