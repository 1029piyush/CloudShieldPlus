import { useEffect, useState } from "react";
import { User, Server } from "lucide-react";

function Navbar({ accounts = [], selectedAccountId, onAccountChange }) {
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
            {/* AWS Account Selector Dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Server size={18} style={{ color: "#94A3B8" }} />
                <span style={{ fontSize: "14px", color: "#94A3B8" }}>Active Environment:</span>
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
                            fontSize: "14px",
                            fontWeight: "500",
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
                    <span style={{ fontSize: "14px", color: "#FDA4AF", fontWeight: "500" }}>
                        No AWS accounts connected.
                    </span>
                )}
            </div>

            {/* Profile Info */}
            {user && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
                        <span style={{ fontSize: "11px", color: "#64748B" }}>
                            {user.email}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Navbar;
