import { useEffect, useState } from "react";
import api from "../services/api";
import { Key, Plus, Trash2, ShieldCheck, Server, Play, Loader2, Clock, CheckCircle, XCircle } from "lucide-react";

function AWSAccounts({ onAccountsUpdated }) {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form inputs
    const [accountName, setAccountName] = useState("");
    const [accessKey, setAccessKey] = useState("");
    const [secretKey, setSecretKey] = useState("");
    const [region, setRegion] = useState("us-east-1");
    const [formLoading, setFormLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });

    // Individual account scanning state tracking
    const [scanningAccount, setScanningAccount] = useState({});

    const loadAccounts = async () => {
        setLoading(true);
        try {
            const res = await api.get("/aws-accounts");
            setAccounts(res.data.accounts || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAccounts();
    }, []);

    const handleConnectAccount = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setMessage({ text: "", type: "" });

        try {
            const res = await api.post("/aws-accounts", {
                account_name: accountName,
                access_key: accessKey,
                secret_key: secretKey,
                region: region,
            });

            setMessage({ text: "AWS account connected successfully! Credentials verified.", type: "success" });
            setAccountName("");
            setAccessKey("");
            setSecretKey("");
            loadAccounts();
            if (onAccountsUpdated) {
                onAccountsUpdated();
            }
        } catch (err) {
            console.error(err);
            setMessage({
                text: err.response?.data?.message || "Failed to validate AWS credentials.",
                type: "error",
            });
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteAccount = async (id) => {
        if (!window.confirm("Are you sure you want to disconnect this AWS account? This will permanently delete all scan records associated with it.")) {
            return;
        }

        try {
            await api.delete(`/aws-accounts/${id}`);
            loadAccounts();
            if (onAccountsUpdated) {
                onAccountsUpdated();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleRunScan = async (accountId) => {
        setScanningAccount((prev) => ({ ...prev, [accountId]: true }));
        try {
            await api.post("/scans", { aws_account_id: accountId });
            loadAccounts();
            if (onAccountsUpdated) {
                onAccountsUpdated();
            }
        } catch (err) {
            alert(err.response?.data?.message || "Scan failed.");
        } finally {
            setScanningAccount((prev) => ({ ...prev, [accountId]: false }));
        }
    };

    return (
        <div style={{ padding: "30px", color: "#F1F5F9", fontFamily: "Inter, sans-serif" }}>
            <div style={{ marginBottom: "30px" }}>
                <h1 style={{ fontSize: "28px", fontWeight: "700", color: "white", margin: 0 }}>
                    AWS Accounts Page
                </h1>
                <p style={{ fontSize: "14px", color: "#94A3B8", marginTop: "4px" }}>
                    Configure, manage, and execute automated scans across connected cloud environments
                </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "30px" }}>
                
                {/* Connected AWS Accounts List */}
                <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                    <h3 style={{ fontSize: "18px", color: "white", margin: "0 0 20px 0", borderBottom: "1px solid #1E293B", paddingBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <Server size={18} style={{ color: "#38BDF8" }} /> Connected AWS Accounts
                    </h3>

                    {loading ? (
                        <div style={{ color: "#94A3B8", textAlign: "center", padding: "40px" }}>Loading accounts...</div>
                    ) : accounts.length === 0 ? (
                        <div style={{ color: "#94A3B8", textAlign: "center", padding: "40px" }}>
                            No AWS accounts connected. Use the Add New Account form below to get started.
                        </div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid #334155", color: "#94A3B8" }}>
                                        <th style={{ padding: "12px 10px" }}>Account Name</th>
                                        <th style={{ padding: "12px 10px" }}>AWS Account ID</th>
                                        <th style={{ padding: "12px 10px" }}>Region</th>
                                        <th style={{ padding: "12px 10px" }}>Last Scan</th>
                                        <th style={{ padding: "12px 10px" }}>Status</th>
                                        <th style={{ padding: "12px 10px", textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accounts.map((acc) => {
                                        const isScanning = !!scanningAccount[acc.id];
                                        return (
                                            <tr key={acc.id} style={{ borderBottom: "1px solid #1E293B" }}>
                                                <td style={{ padding: "14px 10px", fontWeight: "600", color: "white" }}>
                                                    {acc.account_name}
                                                </td>
                                                <td style={{ padding: "14px 10px", fontFamily: "monospace" }}>
                                                    {acc.aws_account_id}
                                                </td>
                                                <td style={{ padding: "14px 10px" }}>
                                                    {acc.region}
                                                </td>
                                                <td style={{ padding: "14px 10px", color: "#94A3B8" }}>
                                                    {acc.last_scan_time ? (
                                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                                            <Clock size={12} />
                                                            {new Date(acc.last_scan_time).toLocaleString()}
                                                        </span>
                                                    ) : (
                                                        "Never Scanned"
                                                    )}
                                                </td>
                                                <td style={{ padding: "14px 10px" }}>
                                                    <span style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "4px",
                                                        fontSize: "11px",
                                                        fontWeight: "bold",
                                                        padding: "4px 8px",
                                                        borderRadius: "4px",
                                                        backgroundColor: acc.last_scan_status === "Completed" ? "#064E3B" : (acc.last_scan_status === "Failed" ? "#7F1D1D" : "#1E293B"),
                                                        color: acc.last_scan_status === "Completed" ? "#10B981" : (acc.last_scan_status === "Failed" ? "#EF4444" : "#94A3B8")
                                                    }}>
                                                        {acc.last_scan_status === "Completed" && <CheckCircle size={10} />}
                                                        {acc.last_scan_status === "Failed" && <XCircle size={10} />}
                                                        {acc.last_scan_status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "14px 10px", textAlign: "right" }}>
                                                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                                        <button
                                                            onClick={() => handleRunScan(acc.id)}
                                                            disabled={isScanning}
                                                            style={{
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: "6px",
                                                                padding: "6px 12px",
                                                                backgroundColor: "#0F172A",
                                                                color: "#38BDF8",
                                                                border: "1px solid #334155",
                                                                borderRadius: "6px",
                                                                cursor: "pointer",
                                                                fontSize: "12px",
                                                                fontWeight: "600",
                                                            }}
                                                        >
                                                            {isScanning ? (
                                                                <Loader2 size={12} className="animate-spin" />
                                                            ) : (
                                                                <Play size={12} fill="#38BDF8" />
                                                            )}
                                                            Run Scan
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteAccount(acc.id)}
                                                            style={{
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                padding: "6px",
                                                                backgroundColor: "transparent",
                                                                color: "#EF4444",
                                                                border: "none",
                                                                cursor: "pointer",
                                                                borderRadius: "6px",
                                                            }}
                                                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#7F1D1D")}
                                                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Add New Account Form */}
                <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                    <h3 style={{ fontSize: "18px", color: "white", margin: "0 0 20px 0", borderBottom: "1px solid #1E293B", paddingBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <Plus size={18} style={{ color: "#38BDF8" }} /> Add New AWS Account
                    </h3>

                    {message.text && (
                        <div style={{
                            padding: "10px 14px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            marginBottom: "20px",
                            backgroundColor: message.type === "success" ? "#064E3B" : "#881337",
                            color: message.type === "success" ? "#A7F3D0" : "#FDA4AF",
                        }}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleConnectAccount} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "12px", color: "#94A3B8", marginBottom: "6px" }}>
                                Connection Name
                            </label>
                            <input
                                type="text"
                                placeholder="AWS Production Stack"
                                value={accountName}
                                onChange={(e) => setAccountName(e.target.value)}
                                style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", backgroundColor: "#1E293B", border: "1px solid #334155", color: "white", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "12px", color: "#94A3B8", marginBottom: "6px" }}>
                                AWS Default Region *
                            </label>
                            <select
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                                style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", backgroundColor: "#1E293B", border: "1px solid #334155", color: "white", fontSize: "13px", outline: "none", cursor: "pointer", boxSizing: "border-box" }}
                            >
                                <option value="us-east-1">us-east-1 (N. Virginia)</option>
                                <option value="us-east-2">us-east-2 (Ohio)</option>
                                <option value="us-west-1">us-west-1 (N. California)</option>
                                <option value="us-west-2">us-west-2 (Oregon)</option>
                                <option value="eu-west-1">eu-west-1 (Ireland)</option>
                                <option value="eu-central-1">eu-central-1 (Frankfurt)</option>
                                <option value="ap-southeast-1">ap-southeast-1 (Singapore)</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "12px", color: "#94A3B8", marginBottom: "6px" }}>
                                AWS Access Key ID *
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="AKIAIOSFODNN7EXAMPLE"
                                value={accessKey}
                                onChange={(e) => setAccessKey(e.target.value)}
                                style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", backgroundColor: "#1E293B", border: "1px solid #334155", color: "white", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "12px", color: "#94A3B8", marginBottom: "6px" }}>
                                AWS Secret Access Key *
                            </label>
                            <input
                                type="password"
                                required
                                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                                value={secretKey}
                                onChange={(e) => setSecretKey(e.target.value)}
                                style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", backgroundColor: "#1E293B", border: "1px solid #334155", color: "white", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                            />
                        </div>

                        <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                            <button
                                type="submit"
                                disabled={formLoading}
                                style={{
                                    padding: "10px 24px",
                                    borderRadius: "6px",
                                    backgroundColor: "#38BDF8",
                                    color: "#0F172A",
                                    border: "none",
                                    fontWeight: "700",
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                }}
                            >
                                {formLoading ? "Validating connection credentials..." : "Connect AWS Account"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AWSAccounts;
