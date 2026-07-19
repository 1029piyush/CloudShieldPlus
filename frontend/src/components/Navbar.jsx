import { useEffect, useState } from "react";
import { User, Server, Play, Loader2, Clock, ShieldCheck } from "lucide-react";

function Navbar({
    accounts = [],
    selectedAccountId,
    onAccountChange,
    lastScanTime,
    scanStatus,
    onRunScan,
    scanning,
}) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    // Format scan status color
    const getStatusStyle = (status) => {
        switch (status) {
            case "Completed":
                return { color: "#10B981", bg: "#064E3B" };
            case "Running":
                return { color: "#38BDF8", bg: "#0C4A6E" };
            case "Failed":
                return { color: "#EF4444", bg: "#7F1D1D" };
            default:
                return { color: "#94A3B8", bg: "#1E293B" };
        }
    };

    const statusInfo = getStatusStyle(scanStatus);

    return (
        <div
            style={{
                height: "70px",
                backgroundColor: "#0F172A",
                borderBottom: "1px solid #1E293B",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 30px",
                position: "fixed",
                top: 0,
                left: "260px",
                right: 0,
                zIndex: 100,
                fontFamily: "Inter, sans-serif",
            }}
        >
            {/* Left: Environment Selector & Scan Status */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                {/* Switcher */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Server size={16} style={{ color: "#94A3B8" }} />
                    {accounts && accounts.length > 0 ? (
                        <select
                            value={selectedAccountId || ""}
                            onChange={(e) => onAccountChange(Number(e.target.value))}
                            style={{
                                backgroundColor: "#1E293B",
                                color: "white",
                                border: "1px solid #334155",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                fontSize: "13px",
                                fontWeight: "600",
                                cursor: "pointer",
                                outline: "none",
                            }}
                        >
                            {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.account_name} ({acc.aws_account_id})
                                </option>
                            ))}
                        </select>
                    ) : (
                        <span style={{ fontSize: "13px", color: "#FDA4AF", fontWeight: "600" }}>
                            No connected accounts
                        </span>
                    )}
                </div>

                {/* Scan Telemetry Details */}
                {selectedAccountId && lastScanTime !== undefined && (
                    <div style={{ display: "flex", alignItems: "center", gap: "15px", borderLeft: "1px solid #1E293B", paddingLeft: "20px" }}>
                        {/* Status */}
                        <span
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "11px",
                                fontWeight: "bold",
                                textTransform: "uppercase",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                backgroundColor: statusInfo.bg,
                                color: statusInfo.color,
                            }}
                        >
                            {scanStatus || "No Scans"}
                        </span>

                        {/* Last Scan Time */}
                        {lastScanTime && (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#94A3B8" }}>
                                <Clock size={14} />
                                <span>
                                    {new Date(lastScanTime).toLocaleString([], { hour: '2-digit', minute:'2-digit' })}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Right: Run Scan Button & User Profile */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                {selectedAccountId && onRunScan && (
                    <button
                        onClick={onRunScan}
                        disabled={scanning}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 14px",
                            backgroundColor: "#38BDF8",
                            color: "#0F172A",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontWeight: "700",
                            cursor: "pointer",
                            transition: "all 0.2s",
                        }}
                    >
                        {scanning ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                Scanning...
                            </>
                        ) : (
                            <>
                                <Play size={14} fill="#0F172A" />
                                Run Scan
                            </>
                        )}
                    </button>
                )}

                {/* User Profile */}
                {user && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", borderLeft: "1px solid #1E293B", paddingLeft: "20px" }}>
                        <div
                            style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                backgroundColor: "#334155",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#38BDF8",
                            }}
                        >
                            <User size={16} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "13px", fontWeight: "600", color: "white" }}>
                                {user.username}
                            </span>
                            <span style={{ fontSize: "10px", color: "#64748B" }}>
                                {user.email}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Navbar;
