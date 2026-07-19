import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { Bookmark, Zap, Eye } from "lucide-react";

function Recommendations({ selectedAccountId }) {
    const [recs, setRecs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadRecs = async () => {
            if (!selectedAccountId) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const res = await api.get("/recommendations", {
                    params: { aws_account_id: selectedAccountId },
                });
                setRecs(res.data.recommendations || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadRecs();
    }, [selectedAccountId]);

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh", color: "#64748B" }}>
                <h2>Loading prioritized remediation guide...</h2>
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
                    Remediation Advisor
                </h1>
                <p style={{ fontSize: "14px", color: "#94A3B8", marginTop: "4px" }}>
                    Prioritized action items and compliance mitigations to reduce your attack surface
                </p>
            </div>

            <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                <h3 style={{ fontSize: "18px", color: "white", margin: "0 0 20px 0", borderBottom: "1px solid #1E293B", paddingBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Bookmark size={18} style={{ color: "#38BDF8" }} /> Prioritized Advisories ({recs.length})
                </h3>

                {recs.length === 0 ? (
                    <div style={{ color: "#94A3B8", textAlign: "center", padding: "40px" }}>
                        No active remediation tasks. Scanned assets meet all security rule baselines.
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {recs.map((rec) => (
                            <div key={rec.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#1E293B", border: "1px solid #334155", padding: "16px 20px", borderRadius: "8px" }}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                                        <span style={{
                                            fontSize: "11px",
                                            fontWeight: "bold",
                                            padding: "2px 6px",
                                            borderRadius: "4px",
                                            backgroundColor: rec.priority === "Critical" ? "#7F1D1D" : "#78350F",
                                            color: rec.priority === "Critical" ? "#FCA5A5" : "#FDE68A",
                                        }}>
                                            {rec.priority}
                                        </span>
                                        <span style={{ fontSize: "12px", color: "#94A3B8" }}>{rec.category}</span>
                                    </div>
                                    <h4 style={{ fontSize: "15px", color: "white", fontWeight: "600", margin: "0" }}>{rec.title}</h4>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                                    <span style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        fontSize: "11px",
                                        fontWeight: "bold",
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                        backgroundColor: rec.auto_fix_supported ? "#064E3B" : "#1E293B",
                                        color: rec.auto_fix_supported ? "#10B981" : "#94A3B8",
                                        border: rec.auto_fix_supported ? "none" : "1px solid #334155"
                                    }}>
                                        {rec.auto_fix_supported ? (
                                            <>
                                                <Zap size={10} /> Auto Fix Available
                                            </>
                                        ) : (
                                            "Manual Action Required"
                                        )}
                                    </span>
                                    <Link to={`/recommendations/${rec.id}`} style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        padding: "6px 12px",
                                        backgroundColor: "#0F172A",
                                        color: "#38BDF8",
                                        border: "1px solid #334155",
                                        borderRadius: "6px",
                                        textDecoration: "none",
                                        fontSize: "13px",
                                        fontWeight: "600"
                                    }}>
                                        Inspect <Eye size={12} />
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

export default Recommendations;
