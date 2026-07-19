import { Link, useLocation } from "react-router-dom";
import {
    Shield,
    LayoutDashboard,
    Server,
    Activity,
    Cpu,
    LogOut,
    Bookmark,
    FileText,
    Settings as SettingsIcon,
} from "lucide-react";

function Sidebar({ services = [] }) {
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
    };

    const primaryNav = [
        { path: "/", label: "Dashboard", icon: LayoutDashboard },
        { path: "/aws-accounts", label: "AWS Accounts", icon: Server },
        { path: "/attack-paths", label: "Attack Paths", icon: Shield },
        { path: "/recommendations", label: "Recommendations", icon: Bookmark },
        { path: "/scans", label: "Scans", icon: Activity },
        { path: "/reports", label: "Reports", icon: FileText },
        { path: "/settings", label: "Settings", icon: SettingsIcon },
    ];

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
                {/* Branding Logo */}
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

                {/* Primary Navigation */}
                <div style={{ padding: "20px 10px 10px 10px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {primaryNav.map((item) => {
                            const Icon = item.icon;
                            const active =
                                item.path === "/"
                                    ? location.pathname === "/"
                                    : location.pathname.startsWith(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        padding: "8px 12px",
                                        borderRadius: "6px",
                                        color: active ? "white" : "#94A3B8",
                                        backgroundColor: active ? "#1E293B" : "transparent",
                                        textDecoration: "none",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    <Icon size={18} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Detected AWS Services Dynamic Sub-Menu */}
                    {services && services.length > 0 && (
                        <div style={{ marginTop: "24px" }}>
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
                                Detected AWS Services
                            </span>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "4px",
                                    marginTop: "8px",
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
                                                padding: "6px 12px",
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

            {/* Logout Action */}
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
