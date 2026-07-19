import { useEffect, useState } from "react";
import api from "../services/api";
import { Key, Plus, Trash2, ShieldCheck, Server } from "lucide-react";

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

    return (
        <div style={{ padding: "30px", color: "#F1F5F9", fontFamily: "Inter, sans-serif" }}>
            <div style={{ marginBottom: "30px" }}>
                <h1 style={{ fontSize: "28px", fontWeight: "700", color: "white", margin: 0 }}>
                    AWS Account Manager
                </h1>
                <p style={{ fontSize: "14px", color: "#94A3B8", marginTop: "4px" }}>
                    Connect, validate, and manage environments securely. Credentials are encrypted symmetrically at rest.
                </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "30px", alignItems: "start" }}>
                {/* Connect Account Form */}
                <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                    <h3 style={{ fontSize: "18px", color: "white", margin: "0 0 20px 0", borderBottom: "1px solid #1E293B", paddingBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <Plus size={18} style={{ color: "#38BDF8" }} /> Connect Environment
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

                    <form onSubmit={handleConnectAccount} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "12px", color: "#94A3B8", marginBottom: "6px" }}>
                                Connection Name
                            </label>
                            <input
                                type="text"
                                placeholder="My Production Account"
                                value={accountName}
                                onChange={(e) => setAccountName(e.target.value)}
                                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", backgroundColor: "#1E293B", border: "1px solid #334155", color: "white", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                            />
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
                                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", backgroundColor: "#1E293B", border: "1px solid #334155", color: "white", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
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
                                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", backgroundColor: "#1E293B", border: "1px solid #334155", color: "white", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "12px", color: "#94A3B8", marginBottom: "6px" }}>
                                Default AWS Region *
                            </label>
                            <select
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", backgroundColor: "#1E293B", border: "1px solid #334155", color: "white", fontSize: "13px", outline: "none", cursor: "pointer", boxSizing: "border-box" }}
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

                        <button
                            type="submit"
                            disabled={formLoading}
                            style={{
                                padding: "10px",
                                borderRadius: "6px",
                                backgroundColor: "#38BDF8",
                                color: "#0F172A",
                                border: "none",
                                fontWeight: "600",
                                fontSize: "14px",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                marginTop: "10px",
                            }}
                            onMouseEnter={(e) => (e.target.style.backgroundColor = "#7DD3FC")}
                            onMouseLeave={(e) => (e.target.style.backgroundColor = "#38BDF8")}
                        >
                            {formLoading ? "Validating & Saving..." : "Connect AWS Account"}
                        </button>
                    </form>
                </div>

                {/* Connected Accounts List */}
                <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                    <h3 style={{ fontSize: "18px", color: "white", margin: "0 0 20px 0", borderBottom: "1px solid #1E293B", paddingBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <Server size={18} style={{ color: "#38BDF8" }} /> Connected Environments
                    </h3>

                    {loading ? (
                        <div style={{ color: "#94A3B8", textAlign: "center", padding: "40px" }}>Loading accounts...</div>
                    ) : accounts.length === 0 ? (
                        <div style={{ color: "#94A3B8", textAlign: "center", padding: "40px" }}>
                            No AWS accounts connected. Use the form on the left to add your first environment.
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            {accounts.map((acc) => (
                                <div key={acc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#1E293B", border: "1px solid #334155", padding: "16px 20px", borderRadius: "8px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                                        <div style={{ padding: "10px", borderRadius: "8px", backgroundColor: "#064E3B", color: "#10B981" }}>
                                            <ShieldCheck size={20} />
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: "15px", color: "white", margin: "0 0 4px 0", fontWeight: "600" }}>{acc.account_name}</h4>
                                            <div style={{ fontSize: "12px", color: "#94A3B8" }}>
                                                Account ID: <span style={{ color: "white", marginRight: "15px" }}>{acc.aws_account_id}</span>
                                                Region: <span style={{ color: "white" }}>{acc.region}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteAccount(acc.id)}
                                        style={{ backgroundColor: "transparent", color: "#EF4444", border: "none", cursor: "pointer", padding: "8px", borderRadius: "6px", transition: "all 0.2s" }}
                                        onMouseEnter={(e) => (e.target.style.backgroundColor = "#7F1D1D")}
                                        onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AWSAccounts;
