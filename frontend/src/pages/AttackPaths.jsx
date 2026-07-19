import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { Shield, Eye, ShieldAlert } from "lucide-react";

function AttackPaths({ selectedAccountId }) {
    const [paths, setPaths] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPaths = async () => {
            if (!selectedAccountId) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const res = await api.get("/attack-paths", {
                    params: { aws_account_id: selectedAccountId },
                });
                setPaths(res.data.attack_paths || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadPaths();
    }, [selectedAccountId]);

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh", color: "#64748B" }}>
                <h2>Loading threat scenarios...</h2>
            </div>
        );
    }

    if (!selectedAccountId) {
        return <div style={{ padding: "30px", color: "#94A3B8" }}>Please select an AWS environment.</div>;
    }

    return (
        <div style={{ padding: "30px", color: "#F1F5F9", fontFamily: "Inter, sans-serif" }}>
            <div style={{ marginBottom: "30px" }}>
                <h1 style={{ fontSize: "28px", fontWeight: "700", color: "white", margin: 0 }}>
                    Exploit Attack Paths
                </h1>
                <p style={{ fontSize: "14px", color: "#94A3B8", marginTop: "4px" }}>
                    Identify correlated threat chains and entry points within your active AWS account
                </p>
            </div>

            <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                <h3 style={{ fontSize: "18px", color: "white", margin: "0 0 20px 0", borderBottom: "1px solid #1E293B", paddingBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Shield size={18} style={{ color: "#EF4444" }} /> Identified Attack Vectors ({paths.length})
                </h3>

                {paths.length === 0 ? (
                    <div style={{ color: "#94A3B8", textAlign: "center", padding: "40px" }}>
                        No exploit attack scenarios identified. Your environment is structurally decoupled from known exploit chains.
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        {paths.map((ap) => (
                            <div key={ap.id} style={{ backgroundColor: "#1E293B", border: "1px solid #334155", padding: "20px", borderRadius: "8px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                                        <ShieldAlert size={16} style={{ color: "#EF4444" }} />
                                        <span style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", backgroundColor: "#7F1D1D", color: "#FCA5A5", padding: "2px 6px", borderRadius: "4px" }}>
                                            Risk: {ap.risk}
                                        </span>
                                    </div>
                                    <h4 style={{ fontSize: "15px", color: "white", fontWeight: "600", margin: "0 0 8px 0" }}>{ap.title}</h4>
                                    <p style={{ fontSize: "13px", color: "#94A3B8", lineHeight: "1.4", margin: "0 0 20px 0" }}>{ap.description}</p>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #334155", paddingTop: "12px", fontSize: "12px" }}>
                                    <span style={{ color: "#94A3B8" }}>Likelihood: <strong>{ap.likelihood}</strong></span>
                                    <Link to={`/attack-paths/${ap.id}`} style={{ color: "#38BDF8", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px", fontWeight: "600" }}>
                                        Inspect Chain <Eye size={12} />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AttackPaths;
