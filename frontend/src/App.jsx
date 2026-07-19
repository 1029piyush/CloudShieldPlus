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
import AttackPaths from "./pages/AttackPaths";
import AttackPathDetail from "./pages/AttackPathDetail";
import Recommendations from "./pages/Recommendations";
import RecommendationDetail from "./pages/RecommendationDetail";
import Scans from "./pages/Scans";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import ServiceDetail from "./pages/ServiceDetail";

// Main Layout Wrapper
function MainLayout({
    accounts,
    selectedAccountId,
    onAccountChange,
    services,
    lastScanTime,
    scanStatus,
    onRunScan,
    scanning,
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
                lastScanTime={lastScanTime}
                scanStatus={scanStatus}
                onRunScan={onRunScan}
                scanning={scanning}
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
    const [scanning, setScanning] = useState(false);

    // Derived states from selected account
    const activeAccount = accounts.find((a) => a.id === selectedAccountId);
    const lastScanTime = activeAccount ? activeAccount.last_scan_time : null;
    const scanStatus = scanning ? "Running" : (activeAccount ? activeAccount.last_scan_status : "Never Scanned");

    const loadAccounts = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await api.get("/aws-accounts");
            const accList = res.data.accounts || [];
            setAccounts(accList);

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

    const handleRunScan = async () => {
        if (!selectedAccountId) return;
        setScanning(true);
        try {
            await api.post("/scans", { aws_account_id: selectedAccountId });
            await loadAccounts();
            await loadServices();
        } catch (err) {
            alert(err.response?.data?.message || "Scan failed.");
        } finally {
            setScanning(false);
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
        loadAccounts();
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
                            lastScanTime={lastScanTime}
                            scanStatus={scanStatus}
                            onRunScan={handleRunScan}
                            scanning={scanning}
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
                        path="/attack-paths"
                        element={<AttackPaths selectedAccountId={selectedAccountId} />}
                    />
                    <Route
                        path="/attack-paths/:attackId"
                        element={<AttackPathDetail selectedAccountId={selectedAccountId} />}
                    />
                    <Route
                        path="/recommendations"
                        element={<Recommendations selectedAccountId={selectedAccountId} />}
                    />
                    <Route
                        path="/recommendations/:recommendationId"
                        element={<RecommendationDetail selectedAccountId={selectedAccountId} />}
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
                        path="/reports"
                        element={<Reports selectedAccountId={selectedAccountId} />}
                    />
                    <Route path="/settings" element={<Settings />} />
                    <Route
                        path="/services/:serviceName"
                        element={<ServiceDetail selectedAccountId={selectedAccountId} />}
                    />
                </Route>

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;