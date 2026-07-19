import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import {
    ShieldAlert,
    HelpCircle,
    Server,
    AlertTriangle,
    Eye,
    TrendingDown,
} from "lucide-react";

function AttackPathDetail({ selectedAccountId }) {
    const { attackId } = useParams();
    const [attackPath, setAttackPath] = useState(null);
    const [findings, setFindings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        const loadAttackPathDetails = async () => {
            if (!selectedAccountId) return;
            setLoading(true);
            try {
                const [pathsRes, findingsRes] = await Promise.all([
                    api.get("/attack-paths", { params: { aws_account_id: selectedAccountId } }),
                    api.get("/findings", { params: { aws_account_id: selectedAccountId } }),
                ]);

                if (active) {
                    const foundPath = (pathsRes.data.attack_paths || []).find(
                        (ap) => ap.id === Number(attackId)
                    );
                    setAttackPath(foundPath);
                    setFindings(findingsRes.data.findings || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadAttackPathDetails();
        return () => {
            active = false;
        };
    }, [selectedAccountId, attackId]);

    if (!selectedAccountId) {
        return <div style={{ padding: "30px", color: "#94A3B8" }}>Please select an AWS environment.</div>;
    }

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh", color: "#64748B" }}>
                <h2>Deconstructing attack path vectors...</h2>
            </div>
        );
    }

    if (!attackPath) {
        return (
            <div style={{ padding: "30px", color: "#EF4444" }}>
                <h3>Error: Attack Path not found.</h3>
                <Link to="/" style={{ color: "#38BDF8", marginTop: "15px", display: "inline-block" }}>
                    Return to Dashboard
                </Link>
            </div>
        );
    }

    // Filter findings contributing to this attack path based on related_findings rule IDs
    const relatedRuleIds = new Set(attackPath.related_findings || []);
    const pathFindings = findings.filter((f) => relatedRuleIds.has(f.rule_id));

    return (
        <div style={{ padding: "30px", color: "#F1F5F9", fontFamily: "Inter, sans-serif" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "30px" }}>
                <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: "#3F0F19", color: "#EF4444", display: "inline-flex" }}>
                    <ShieldAlert size={32} />
                </div>
                <div>
                    <h1 style={{ fontSize: "26px", fontWeight: "700", color: "white", margin: 0 }}>
                        Threat scenario: {attackPath.title}
                    </h1>
                    <p style={{ fontSize: "14px", color: "#94A3B8", marginTop: "4px" }}>
                        Technical breakdown of the exposure chain, resource links, and structural mitigations
                    </p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "30px", alignItems: "start" }}>
                {/* Left Panel: Attack Chain & Details */}
                <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                    {/* Scenario Description */}
                    <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                        <h3 style={{ fontSize: "16px", color: "white", marginBottom: "12px" }}>Risk Overview</h3>
                        <p style={{ color: "#CBD5E1", fontSize: "14px", lineHeight: "1.6" }}>{attackPath.description}</p>

                        <div style={{ display: "flex", gap: "25px", flexWrap: "wrap", marginTop: "20px" }}>
                            <div style={{ fontSize: "13px", color: "#F1F5F9", backgroundColor: "#1E293B", padding: "8px 14px", borderRadius: "6px" }}>
                                Risk Level: <strong style={{ color: "#EF4444" }}>{attackPath.risk}</strong>
                            </div>
                            <div style={{ fontSize: "13px", color: "#F1F5F9", backgroundColor: "#1E293B", padding: "8px 14px", borderRadius: "6px" }}>
                                Likelihood: <strong>{attackPath.likelihood}</strong>
                            </div>
                            <div style={{ fontSize: "13px", color: "#F1F5F9", backgroundColor: "#1E293B", padding: "8px 14px", borderRadius: "6px" }}>
                                Impact Vector: <strong>{attackPath.impact}</strong>
                            </div>
                        </div>
                    </div>

                    {/* Attack Steps Timeline */}
                    <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                        <h3 style={{ fontSize: "16px", color: "white", marginBottom: "25px" }}>Attack Progression</h3>
                        {attackPath.attack_steps && attackPath.attack_steps.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "24px", position: "relative" }}>
                                {attackPath.attack_steps.map((step, index) => (
                                    <div key={index} style={{ display: "flex", gap: "20px" }}>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                            <div style={{
                                                width: "28px",
                                                height: "28px",
                                                borderRadius: "50%",
                                                backgroundColor: "#1E293B",
                                                color: "#38BDF8",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontWeight: "bold",
                                                fontSize: "13px",
                                                border: "2px solid #334155"
                                            }}>
                                                {index + 1}
                                            </div>
                                            {index < attackPath.attack_steps.length - 1 && (
                                                <div style={{ width: "2px", flex: 1, backgroundColor: "#334155", margin: "10px 0" }}></div>
                                            )}
                                        </div>
                                        <div style={{ flex: 1, backgroundColor: "#1E293B", padding: "16px", borderRadius: "8px" }}>
                                            <h4 style={{ fontSize: "14px", color: "white", margin: "0 0 6px 0", fontWeight: "600" }}>{step.step || `Phase ${index + 1}`}</h4>
                                            <p style={{ fontSize: "13px", color: "#94A3B8", margin: 0, lineHeight: "1.4" }}>{step.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ color: "#94A3B8" }}>No structured attack steps provided.</div>
                        )}
                    </div>

                    {/* Remediation/Mitigation Section */}
                    <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                        <h3 style={{ fontSize: "16px", color: "white", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <TrendingDown size={16} style={{ color: "#10B981" }} /> Scenario Mitigation Guidelines
                        </h3>
                        <p style={{ color: "#CBD5E1", fontSize: "14px", lineHeight: "1.6" }}>{attackPath.mitigation}</p>
                    </div>
                </div>

                {/* Right Panel: Affected Resources & Contributing Findings */}
                <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                    {/* Affected Resources */}
                    <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                        <h3 style={{ fontSize: "16px", color: "white", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Server size={16} style={{ color: "#38BDF8" }} /> Affected Resources ({attackPath.affected_resources?.length || 0})
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {attackPath.affected_resources?.map((res, i) => (
                                <div key={i} style={{ backgroundColor: "#1E293B", padding: "10px 14px", borderRadius: "6px", fontSize: "13px", fontFamily: "monospace", color: "#38BDF8" }}>
                                    {res}
                                </div>
                            )) || <div style={{ color: "#94A3B8" }}>No affected resources linked.</div>}
                        </div>
                    </div>

                    {/* Contributing Findings */}
                    <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                        <h3 style={{ fontSize: "16px", color: "white", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <AlertTriangle size={16} style={{ color: "#F59E0B" }} /> Contributing Vulnerabilities ({pathFindings.length})
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {pathFindings.map((f) => (
                                <div key={f.id} style={{ backgroundColor: "#1E293B", padding: "12px", borderRadius: "6px" }}>
                                    <h4 style={{ fontSize: "13px", color: "white", margin: "0 0 4px 0", fontWeight: "600" }}>{f.title}</h4>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                                        <span style={{ fontSize: "11px", color: "#94A3B8" }}>Rule: {f.rule_id}</span>
                                        <Link to={`/services/${f.service.toLowerCase()}`} style={{ fontSize: "11px", color: "#38BDF8", textDecoration: "none", display: "flex", alignItems: "center", gap: "2px" }}>
                                            Inspect <Eye size={10} />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AttackPathDetail;
