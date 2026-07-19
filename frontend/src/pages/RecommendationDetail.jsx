import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import {
    Bookmark,
    Zap,
    Server,
    Shield,
    TrendingDown,
    ArrowRight,
    CheckCircle,
} from "lucide-react";

function RecommendationDetail({ selectedAccountId }) {
    const { recommendationId } = useParams();
    const [rec, setRec] = useState(null);
    const [attackPaths, setAttackPaths] = useState([]);
    const [loading, setLoading] = useState(true);

    // Auto-fix simulation states
    const [fixing, setFixing] = useState(false);
    const [fixed, setFixed] = useState(false);

    useEffect(() => {
        let active = true;
        const loadRecDetails = async () => {
            if (!selectedAccountId) return;
            setLoading(true);
            try {
                const [recsRes, pathsRes] = await Promise.all([
                    api.get("/recommendations", { params: { aws_account_id: selectedAccountId } }),
                    api.get("/attack-paths", { params: { aws_account_id: selectedAccountId } }),
                ]);

                if (active) {
                    const foundRec = (recsRes.data.recommendations || []).find(
                        (r) => r.id === Number(recommendationId)
                    );
                    setRec(foundRec);
                    setAttackPaths(pathsRes.data.attack_paths || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadRecDetails();
        return () => {
            active = false;
        };
    }, [selectedAccountId, recommendationId]);

    const handleRunAutoFix = () => {
        setFixing(true);
        setTimeout(() => {
            setFixing(false);
            setFixed(true);
        }, 2000);
    };

    if (!selectedAccountId) {
        return <div style={{ padding: "30px", color: "#94A3B8" }}>Please select an AWS environment.</div>;
    }

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh", color: "#64748B" }}>
                <h2>Assembling remediation plan...</h2>
            </div>
        );
    }

    if (!rec) {
        return (
            <div style={{ padding: "30px", color: "#EF4444" }}>
                <h3>Error: Recommendation not found.</h3>
                <Link to="/" style={{ color: "#38BDF8", marginTop: "15px", display: "inline-block" }}>
                    Return to Dashboard
                </Link>
            </div>
        );
    }

    // Filter attack paths mitigated by this recommendation
    const mitigatedIds = new Set(rec.related_attack_paths || []);
    const matchingAttackPaths = attackPaths.filter((ap) => mitigatedIds.has(ap.attack_id));

    return (
        <div style={{ padding: "30px", color: "#F1F5F9", fontFamily: "Inter, sans-serif" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: "#064E3B", color: "#10B981", display: "inline-flex" }}>
                        <Bookmark size={32} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: "26px", fontWeight: "700", color: "white", margin: 0 }}>
                            Remediation Advisory: {rec.title}
                        </h1>
                        <p style={{ fontSize: "14px", color: "#94A3B8", marginTop: "4px" }}>
                            Priority: {rec.priority} | Category: {rec.category}
                        </p>
                    </div>
                </div>

                {rec.auto_fix_supported && (
                    <div>
                        {fixed ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "#064E3B", color: "#A7F3D0", padding: "10px 18px", borderRadius: "6px", fontSize: "14px", fontWeight: "600" }}>
                                <CheckCircle size={16} /> Remediation Completed!
                            </span>
                        ) : (
                            <button
                                onClick={handleRunAutoFix}
                                disabled={fixing}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "10px 18px",
                                    backgroundColor: "#10B981",
                                    color: "#0F172A",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                }}
                                onMouseEnter={(e) => (e.target.style.backgroundColor = "#34D399")}
                                onMouseLeave={(e) => (e.target.style.backgroundColor = "#10B981")}
                            >
                                <Zap size={16} /> {fixing ? "Executing auto-fix scripts..." : "Run Auto-Remediation"}
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "30px", alignItems: "start" }}>
                {/* Left Panel: Implementation & Impact */}
                <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                    {/* Advisory Profile */}
                    <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                        <h3 style={{ fontSize: "16px", color: "white", marginBottom: "12px" }}>Remediation Summary</h3>
                        <p style={{ color: "#CBD5E1", fontSize: "14px", lineHeight: "1.6", margin: "0 0 20px 0" }}>{rec.description}</p>

                        <div style={{ display: "flex", gap: "25px", flexWrap: "wrap", marginTop: "20px" }}>
                            <div style={{ fontSize: "13px", color: "#F1F5F9", backgroundColor: "#1E293B", padding: "8px 14px", borderRadius: "6px" }}>
                                Estimated Effort: <strong>{rec.estimated_effort}</strong>
                            </div>
                            <div style={{ fontSize: "13px", color: "#F1F5F9", backgroundColor: "#1E293B", padding: "8px 14px", borderRadius: "6px" }}>
                                Risk Mitigation: <strong>{rec.expected_risk_reduction}</strong>
                            </div>
                        </div>
                    </div>

                    {/* Business Impact */}
                    <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                        <h3 style={{ fontSize: "16px", color: "white", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <TrendingDown size={16} style={{ color: "#38BDF8" }} /> Business & Compliance Impact
                        </h3>
                        <p style={{ color: "#CBD5E1", fontSize: "14px", lineHeight: "1.6" }}>{rec.business_impact}</p>
                    </div>

                    {/* Implementation Steps */}
                    <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                        <h3 style={{ fontSize: "16px", color: "white", marginBottom: "25px" }}>Step-by-Step Remediation Plan</h3>
                        {rec.implementation_steps && rec.implementation_steps.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                {rec.implementation_steps.map((step, i) => (
                                    <div key={i} style={{ display: "flex", gap: "15px", alignItems: "flex-start" }}>
                                        <div style={{
                                            padding: "6px 10px",
                                            borderRadius: "4px",
                                            backgroundColor: "#1E293B",
                                            color: "#38BDF8",
                                            fontSize: "12px",
                                            fontWeight: "bold",
                                            fontFamily: "monospace"
                                        }}>
                                            STEP {i + 1}
                                        </div>
                                        <div style={{ flex: 1, paddingTop: "2px" }}>
                                            <p style={{ fontSize: "14px", color: "#E2E8F0", margin: 0, lineHeight: "1.4" }}>
                                                {typeof step === "string" ? step : step.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ color: "#94A3B8" }}>No structured implementation steps provided. Check references.</div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Affected Resources & Mitigated paths */}
                <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                    {/* Affected Resources */}
                    <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                        <h3 style={{ fontSize: "16px", color: "white", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Server size={16} style={{ color: "#38BDF8" }} /> Impacted Resources ({rec.affected_resources?.length || 0})
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {rec.affected_resources?.map((res, i) => (
                                <div key={i} style={{ backgroundColor: "#1E293B", padding: "10px 14px", borderRadius: "6px", fontSize: "13px", fontFamily: "monospace", color: "#38BDF8" }}>
                                    {res}
                                </div>
                            )) || <div style={{ color: "#94A3B8" }}>No affected resources.</div>}
                        </div>
                    </div>

                    {/* Mitigated Attack Paths */}
                    <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                        <h3 style={{ fontSize: "16px", color: "white", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Shield size={16} style={{ color: "#EF4444" }} /> Mitigated Attack Scenarios ({matchingAttackPaths.length})
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {matchingAttackPaths.map((ap) => (
                                <div key={ap.id} style={{ backgroundColor: "#1E293B", padding: "12px", borderRadius: "6px" }}>
                                    <h4 style={{ fontSize: "13px", color: "white", margin: "0 0 4px 0", fontWeight: "600" }}>{ap.title}</h4>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                                        <span style={{ fontSize: "11px", color: "#EF4444", fontWeight: "bold" }}>Risk Level: {ap.risk}</span>
                                        <Link to={`/attack-paths/${ap.id}`} style={{ fontSize: "11px", color: "#38BDF8", textDecoration: "none", display: "flex", alignItems: "center", gap: "2px" }}>
                                            Analyze Path <ArrowRight size={10} />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                            {matchingAttackPaths.length === 0 && (
                                <div style={{ color: "#94A3B8", fontSize: "13px" }}>No active attack scenarios mitigated.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RecommendationDetail;
