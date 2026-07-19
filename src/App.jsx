import { useState, useEffect } from "react";
import HomePage from "./ui/HomePage/HomePage";
import Login from "./ui/LoginPage/Login";
import ForgotPassword from "./ui/ForgotPassword/ForgotPassword";
import CreateAccount from "./ui/CreateAccount/CreateAccount";
import AdvancedLogin from "./ui/AdvancedLogin/AdvancedLogin";
import Dashboard from "./ui/Dashboard/Dashboard";

function App() {
    const [view, setView] = useState("home");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setView("dashboard");
        }
    }, []);

    const handleLoginSuccess = () => {
        setView("dashboard");
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setView("home");
    };

    if (view === "home") {
        return <HomePage onLogin={() => setView("login")} onCreateAccount={() => setView("create")} />;
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
                onLogin={handleLoginSuccess}
            />
        );
    }

    if (view === "dashboard") {
        return <Dashboard onLogout={handleLogout} />;
    }

    return (
        <Login
            onForgotPassword={() => setView("forgot")}
            onCreateAccount={() => setView("create")}
            onAdvancedLogin={() => setView("advanced")}
            onLogin={handleLoginSuccess}
        />
    );
}

export default App;