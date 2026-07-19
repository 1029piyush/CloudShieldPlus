import { Link, useLocation } from "react-router-dom";
import { Shield, LayoutDashboard, Key, Activity, Cpu, LogOut } from "lucide-react";

function Sidebar({ services = [] }) {
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
    };

    return (
        <div
            style={{
                width: "260px",
                backgroundColor: "#0F172A",
                borderRight: "1px solid #1E293B",
                height: "100vh",
                position: "fixed",
                top: 0,
                left: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                color: "#E2E8F0",
                fontFamily: "Inter, sans-serif",
            }}
        >
            <div>
                {/* Branding */}
                <div
                    style={{
                        padding: "24px 20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        borderBottom: "1px solid #1E293B",
                    }}
                >
                    <Shield style={{ color: "#38BDF8" }} size={24} />
                    <span style={{ fontWeight: "bold", fontSize: "18px", color: "white" }}>
                        CloudIntercept
                    </span>
                </div>

                {/* Navigation Link List */}
                <div style={{ padding: "20px 10px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <Link
                            to="/"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "10px 12px",
                                borderRadius: "6px",
                                color: location.pathname === "/" ? "white" : "#94A3B8",
                                backgroundColor:
                                    location.pathname === "/" ? "#1E293B" : "transparent",
                                textDecoration: "none",
                                fontSize: "14px",
                                fontWeight: "500",
                                transition: "all 0.2s",
                            }}
                        >
                            <LayoutDashboard size={18} />
                            Dashboard
                        </Link>

                        <Link
                            to="/aws-accounts"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "10px 12px",
                                borderRadius: "6px",
                                color: location.pathname === "/aws-accounts" ? "white" : "#94A3B8",
                                backgroundColor:
                                    location.pathname === "/aws-accounts"
                                        ? "#1E293B"
                                        : "transparent",
                                textDecoration: "none",
                                fontSize: "14px",
                                fontWeight: "500",
                                transition: "all 0.2s",
                            }}
                        >
                            <Key size={18} />
                            AWS Accounts
                        </Link>

                        <Link
                            to="/scans"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "10px 12px",
                                borderRadius: "6px",
                                color: location.pathname.startsWith("/scans") ? "white" : "#94A3B8",
                                backgroundColor: location.pathname.startsWith("/scans")
                                    ? "#1E293B"
                                    : "transparent",
                                textDecoration: "none",
                                fontSize: "14px",
                                fontWeight: "500",
                                transition: "all 0.2s",
                            }}
                        >
                            <Activity size={18} />
                            Scan History
                        </Link>
                    </div>

                    {/* Discovered Services dynamic listing */}
                    {services && services.length > 0 && (
                        <div style={{ marginTop: "30px" }}>
                            <span
                                style={{
                                    paddingLeft: "12px",
                                    fontSize: "11px",
                                    fontWeight: "bold",
                                    textTransform: "uppercase",
                                    color: "#64748B",
                                    letterSpacing: "1px",
                                }}
                            >
                                Discovered Services
                            </span>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "4px",
                                    marginTop: "10px",
                                }}
                            >
                                {services.map((service) => {
                                    const path = `/services/${service.toLowerCase()}`;
                                    const active = location.pathname === path;
                                    return (
                                        <Link
                                            key={service}
                                            to={path}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "12px",
                                                padding: "8px 12px",
                                                borderRadius: "6px",
                                                color: active ? "white" : "#94A3B8",
                                                backgroundColor: active ? "#1E293B" : "transparent",
                                                textDecoration: "none",
                                                fontSize: "13px",
                                                fontWeight: "500",
                                                transition: "all 0.2s",
                                            }}
                                        >
                                            <Cpu size={16} />
                                            {service.toUpperCase()}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Logout Footer */}
            <div style={{ padding: "20px 10px", borderTop: "1px solid #1E293B" }}>
                <button
                    onClick={handleLogout}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        color: "#FDA4AF",
                        backgroundColor: "transparent",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: "14px",
                        fontWeight: "500",
                        transition: "all 0.2s",
                    }}
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>
        </div>
    );
}

export default Sidebar;
