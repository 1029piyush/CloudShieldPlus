import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import {
    Cpu,
    AlertTriangle,
    Eye,
    Shield,
    Database,
    ChevronDown,
    ChevronUp,
    Bookmark,
} from "lucide-react";

function ServiceDetail({ selectedAccountId }) {
    const { serviceName } = useParams();
    const [findings, setFindings] = useState([]);
    const [attackPaths, setAttackPaths] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);

    // Track which findings have expanded evidence logs
    const [expandedFinding, setExpandedFinding] = useState({});

    useEffect(() => {
        let active = true;
        const loadServiceData = async () => {
            if (!selectedAccountId) return;
            setLoading(true);
            try {
                const [findingsRes, attackRes, recRes] = await Promise.all([
                    api.get("/findings", { params: { aws_account_id: selectedAccountId } }),
                    api.get("/attack-paths", { params: { aws_account_id: selectedAccountId } }),
                    api.get("/recommendations", { params: { aws_account_id: selectedAccountId } }),
                ]);

                if (active) {
                    setFindings(findingsRes.data.findings || []);
                    setAttackPaths(attackRes.data.attack_paths || []);
                    setRecommendations(recRes.data.recommendations || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadServiceData();
        return () => {
            active = false;
        };
    }, [selectedAccountId, serviceName]);

    if (!selectedAccountId) {
        return <div style={{ padding: "30px", color: "#94A3B8" }}>Please select an AWS environment.</div>;
    }

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh", color: "#64748B" }}>
                <h2>Loading service telemetry...</h2>
            </div>
        );
    }

    // Filter findings for this service
    const filteredFindings = findings.filter(
        (f) => f.service?.toLowerCase() === serviceName?.toLowerCase()
    );

    // Discovered unique resources
    const uniqueResources = Array.from(new Set(filteredFindings.map((f) => f.resource)));

    // Related Recommendations: those referencing any finding rule_id matching the service's findings
    const serviceRuleIds = new Set(filteredFindings.map((f) => f.rule_id));
    const relatedRecommendations = recommendations.filter((r) =>
        r.related_findings?.some((ruleId) => serviceRuleIds.has(ruleId))
    );

    // Related Attack Paths
    const relatedAttackPaths = attackPaths.filter((ap) =>
        ap.related_findings?.some((ruleId) => serviceRuleIds.has(ruleId))
    );

    const toggleEvidence = (id) => {
        setExpandedFinding((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div style={{ padding: "30px", color: "#F1F5F9", fontFamily: "Inter, sans-serif" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "30px" }}>
                <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: "#1E293B", color: "#38BDF8", display: "inline-flex" }}>
                    <Cpu size={32} />
                </div>
                <div>
                    <h1 style={{ fontSize: "28px", fontWeight: "700", color: "white", margin: 0 }}>
                        {serviceName?.toUpperCase()} Advisor profile
                    </h1>
                    <p style={{ fontSize: "14px", color: "#94A3B8", marginTop: "4px" }}>
                        Scanned assets and corresponding security risk posture for {serviceName?.toUpperCase()}
                    </p>
                </div>
            </div>

            {filteredFindings.length === 0 ? (
                <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "40px", textAlign: "center", color: "#94A3B8" }}>
                    No findings detected for {serviceName?.toUpperCase()}. Assets comply with current security rule profiles.
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "30px", alignItems: "start" }}>
                    {/* Left Panel: Findings & Resources */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                        {/* Resources Scanned */}
                        <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                            <h3 style={{ fontSize: "16px", color: "white", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                                <Database size={16} style={{ color: "#38BDF8" }} /> Active Resources ({uniqueResources.length})
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {uniqueResources.map((res, i) => (
                                    <div key={i} style={{ backgroundColor: "#1E293B", padding: "10px 14px", borderRadius: "6px", fontSize: "13px", fontFamily: "monospace", color: "#38BDF8" }}>
                                        {res}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Security Findings & Evidence */}
                        <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                            <h3 style={{ fontSize: "16px", color: "white", marginBottom: "20px" }}>
                                Vulnerabilities & Deviations ({filteredFindings.length})
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                                {filteredFindings.map((f) => (
                                    <div key={f.id} style={{ backgroundColor: "#1E293B", border: "1px solid #334155", borderRadius: "8px", overflow: "hidden" }}>
                                        <div style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                                                    <span style={{
                                                        fontSize: "11px",
                                                        fontWeight: "bold",
                                                        padding: "2px 6px",
                                                        borderRadius: "4px",
                                                        backgroundColor: f.severity === "Critical" ? "#7F1D1D" : "#78350F",
                                                        color: f.severity === "Critical" ? "#FCA5A5" : "#FDE68A",
                                                    }}>
                                                        {f.severity}
                                                    </span>
                                                    <span style={{ fontSize: "12px", color: "#94A3B8" }}>{f.rule_id}</span>
                                                </div>
                                                <h4 style={{ fontSize: "15px", color: "white", fontWeight: "600", margin: "0 0 6px 0" }}>{f.title}</h4>
                                                <p style={{ fontSize: "13px", color: "#CBD5E1", margin: "0 0 8px 0" }}>{f.description}</p>
                                                <div style={{ fontSize: "12px", color: "#94A3B8", fontFamily: "monospace" }}>
                                                    Resource: {f.resource}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => toggleEvidence(f.id)}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                    backgroundColor: "transparent",
                                                    border: "none",
                                                    color: "#38BDF8",
                                                    cursor: "pointer",
                                                    fontSize: "12px",
                                                    fontWeight: "600",
                                                    padding: "4px",
                                                }}
                                            >
                                                Evidence {expandedFinding[f.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </button>
                                        </div>

                                        {expandedFinding[f.id] && f.evidence && (
                                            <div style={{ backgroundColor: "#0F172A", padding: "15px", borderTop: "1px solid #334155", borderBottomLeftRadius: "8px", borderBottomRightRadius: "8px" }}>
                                                <div style={{ fontSize: "11px", fontWeight: "bold", color: "#64748B", textTransform: "uppercase", marginBottom: "8px" }}>
                                                    Scanned Evidence payload
                                                </div>
                                                <pre style={{
                                                    margin: 0,
                                                    fontSize: "12px",
                                                    fontFamily: "monospace",
                                                    color: "#A7F3D0",
                                                    backgroundColor: "#0B0F19",
                                                    padding: "12px",
                                                    borderRadius: "6px",
                                                    overflowX: "auto",
                                                    whiteSpace: "pre-wrap",
                                                    wordBreak: "break-all",
                                                    lineHeight: "1.4"
                                                }}>
                                                    {JSON.stringify(f.evidence, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Recommendations & Mitigated Attack Paths */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                        {/* Related Recommendations */}
                        <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                            <h3 style={{ fontSize: "16px", color: "white", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                                <Bookmark size={16} style={{ color: "#38BDF8" }} /> Remediation Guide
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {relatedRecommendations.map((rec) => (
                                    <div key={rec.id} style={{ backgroundColor: "#1E293B", padding: "12px", borderRadius: "6px" }}>
                                        <Link to={`/recommendations/${rec.id}`} style={{ textDecoration: "none" }}>
                                            <h4 style={{ fontSize: "13px", color: "#38BDF8", margin: "0 0 4px 0", fontWeight: "600" }}>{rec.title}</h4>
                                        </Link>
                                        <div style={{ fontSize: "11px", color: "#94A3B8" }}>
                                            Priority: <strong style={{ color: rec.priority === "Critical" ? "#EF4444" : "#F59E0B" }}>{rec.priority}</strong>
                                        </div>
                                    </div>
                                ))}
                                {relatedRecommendations.length === 0 && (
                                    <div style={{ color: "#94A3B8", fontSize: "13px" }}>No specific recommendations.</div>
                                )}
                            </div>
                        </div>

                        {/* Mitigated Attack Paths */}
                        <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                            <h3 style={{ fontSize: "16px", color: "white", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                                <Shield size={16} style={{ color: "#EF4444" }} /> Exploit Scenarios Mitigated
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {relatedAttackPaths.map((ap) => (
                                    <div key={ap.id} style={{ backgroundColor: "#1E293B", padding: "12px", borderRadius: "6px" }}>
                                        <Link to={`/attack-paths/${ap.id}`} style={{ textDecoration: "none" }}>
                                            <h4 style={{ fontSize: "13px", color: "white", margin: "0 0 4px 0", fontWeight: "600" }}>{ap.title}</h4>
                                        </Link>
                                        <div style={{ fontSize: "11px", color: "#EF4444", fontWeight: "600" }}>Risk Level: {ap.risk}</div>
                                    </div>
                                ))}
                                {relatedAttackPaths.length === 0 && (
                                    <div style={{ color: "#94A3B8", fontSize: "13px" }}>No active attack scenarios reference this service.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ServiceDetail;
