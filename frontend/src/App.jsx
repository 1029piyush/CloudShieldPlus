import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import api from "./services/api";

// Layout Components
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AWSAccounts from "./pages/AWSAccounts";
import Scans from "./pages/Scans";
import ServiceDetail from "./pages/ServiceDetail";
import AttackPathDetail from "./pages/AttackPathDetail";
import RecommendationDetail from "./pages/RecommendationDetail";

// Main Layout Wrapper
function MainLayout({
    accounts,
    selectedAccountId,
    onAccountChange,
    services,
}) {
    const isAuthenticated = localStorage.getItem("token") !== null;

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div style={{ backgroundColor: "#0B0F19", minHeight: "100vh" }}>
            <Sidebar services={services} />
            <Navbar
                accounts={accounts}
                selectedAccountId={selectedAccountId}
                onAccountChange={onAccountChange}
            />
            <div
                style={{
                    marginLeft: "260px",
                    paddingTop: "70px",
                    minHeight: "calc(100vh - 70px)",
                }}
            >
                <Outlet />
            </div>
        </div>
    );
}

function App() {
    const [accounts, setAccounts] = useState([]);
    const [selectedAccountId, setSelectedAccountId] = useState(null);
    const [services, setServices] = useState([]);

    const loadAccounts = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await api.get("/aws-accounts");
            const accList = res.data.accounts || [];
            setAccounts(accList);

            // Default to first account or restore selected ID
            if (accList.length > 0) {
                const saved = sessionStorage.getItem("selectedAccountId");
                const matched = accList.find((a) => String(a.id) === saved);
                if (matched) {
                    setSelectedAccountId(matched.id);
                } else {
                    setSelectedAccountId(accList[0].id);
                }
            } else {
                setSelectedAccountId(null);
                setServices([]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const loadServices = async () => {
        if (!selectedAccountId) {
            setServices([]);
            return;
        }

        try {
            const res = await api.get("/dashboard", {
                params: { aws_account_id: selectedAccountId },
            });
            setServices(res.data.services || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadAccounts();
    }, []);

    useEffect(() => {
        loadServices();
    }, [selectedAccountId]);

    const handleAccountChange = (id) => {
        setSelectedAccountId(id);
        sessionStorage.setItem("selectedAccountId", String(id));
    };

    const handleAccountsUpdated = () => {
        loadAccounts();
    };

    const handleScanCompleted = () => {
        loadServices();
    };

    return (
        <BrowserRouter>
            <Routes>
                {/* Public Route */}
                <Route path="/login" element={<Login />} />

                {/* Protected Layout */}
                <Route
                    element={
                        <MainLayout
                            accounts={accounts}
                            selectedAccountId={selectedAccountId}
                            onAccountChange={handleAccountChange}
                            services={services}
                        />
                    }
                >
                    {/* Nested Protected Views */}
                    <Route
                        path="/"
                        element={<Dashboard selectedAccountId={selectedAccountId} />}
                    />
                    <Route
                        path="/aws-accounts"
                        element={<AWSAccounts onAccountsUpdated={handleAccountsUpdated} />}
                    />
                    <Route
                        path="/scans"
                        element={
                            <Scans
                                selectedAccountId={selectedAccountId}
                                onScanCompleted={handleScanCompleted}
                            />
                        }
                    />
                    <Route
                        path="/services/:serviceName"
                        element={<ServiceDetail selectedAccountId={selectedAccountId} />}
                    />
                    <Route
                        path="/attack-paths/:attackId"
                        element={<AttackPathDetail selectedAccountId={selectedAccountId} />}
                    />
                    <Route
                        path="/recommendations/:recommendationId"
                        element={<RecommendationDetail selectedAccountId={selectedAccountId} />}
                    />
                </Route>

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;