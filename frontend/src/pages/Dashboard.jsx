import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import {
    Activity,
    ShieldAlert,
    Zap,
    Cpu,
    AlertTriangle,
    Eye,
    TrendingUp,
    CheckCircle2,
    XCircle,
} from "lucide-react";

function Dashboard({ selectedAccountId }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        const loadDashboard = async () => {
            if (!selectedAccountId) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const res = await api.get(`/dashboard`, {
                    params: { aws_account_id: selectedAccountId },
                });
                if (active) {
                    setData(res.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadDashboard();
        return () => {
            active = false;
        };
    }, [selectedAccountId]);

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "70vh", color: "#64748B" }}>
                <h2>Loading security context...</h2>
            </div>
        );
    }

    if (!selectedAccountId) {
        return (
            <div style={{ textAlign: "center", padding: "100px 20px", color: "#94A3B8" }}>
                <ShieldAlert size={48} style={{ color: "#F43F5E", marginBottom: "20px" }} />
                <h2>No Active Environment</h2>
                <p style={{ marginTop: "10px" }}>
                    Please select or connect an AWS account in the AWS Accounts tab to begin scanning.
                </p>
            </div>
        );
    }

    const {
        summary = {},
        hero_attack = {},
        top_recommendations = [],
        services = [],
        recent_findings = [],
        scan_history = [],
    } = data || {};

    const hasLatestScan = summary.last_scan !== null;

    return (
        <div style={{ padding: "30px", color: "#F1F5F9", fontFamily: "Inter, sans-serif" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                <div>
                    <h1 style={{ fontSize: "28px", fontWeight: "700", color: "white", margin: 0 }}>
                        Security Advisory Dashboard
                    </h1>
                    <p style={{ fontSize: "14px", color: "#94A3B8", marginTop: "4px" }}>
                        Real-time threat scenarios and remediation steps based on verified evidence
                    </p>
                </div>
                {hasLatestScan && (
                    <div style={{ fontSize: "13px", color: "#94A3B8", backgroundColor: "#1E293B", padding: "8px 14px", borderRadius: "6px", border: "1px solid #334155" }}>
                        Last scan: {new Date(summary.last_scan).toLocaleString()} ({summary.scan_duration?.toFixed(1)}s)
                    </div>
                )}
            </div>

            {!hasLatestScan ? (
                <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "40px", textAlign: "center", color: "#94A3B8" }}>
                    <Activity size={36} style={{ color: "#38BDF8", marginBottom: "15px" }} />
                    <h3>No Scan History Detected</h3>
                    <p style={{ marginTop: "8px" }}>
                        Run your first security scan in the <strong>Scan History</strong> tab to generate your advisory profile.
                    </p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "30px" }}>
                    {/* Summary Counters */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
                        <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", padding: "20px", borderRadius: "8px" }}>
                            <div style={{ fontSize: "12px", color: "#94A3B8", fontWeight: "bold", textTransform: "uppercase" }}>Discovered Resources</div>
                            <div style={{ fontSize: "28px", fontWeight: "bold", color: "white", marginTop: "8px" }}>{summary.resources}</div>
                        </div>
                        <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", padding: "20px", borderRadius: "8px" }}>
                            <div style={{ fontSize: "12px", color: "#94A3B8", fontWeight: "bold", textTransform: "uppercase" }}>Active Services</div>
                            <div style={{ fontSize: "28px", fontWeight: "bold", color: "white", marginTop: "8px" }}>{summary.services}</div>
                        </div>
                        <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", padding: "20px", borderRadius: "8px" }}>
                            <div style={{ fontSize: "12px", color: "#94A3B8", fontWeight: "bold", textTransform: "uppercase" }}>Total Findings</div>
                            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#38BDF8", marginTop: "8px" }}>{summary.findings}</div>
                        </div>
                        <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", padding: "20px", borderRadius: "8px" }}>
                            <div style={{ fontSize: "12px", color: "#94A3B8", fontWeight: "bold", textTransform: "uppercase" }}>Critical Risks</div>
                            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#EF4444", marginTop: "8px" }}>{summary.critical_findings}</div>
                        </div>
                        <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", padding: "20px", borderRadius: "8px" }}>
                            <div style={{ fontSize: "12px", color: "#94A3B8", fontWeight: "bold", textTransform: "uppercase" }}>Attack Paths</div>
                            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#F59E0B", marginTop: "8px" }}>{summary.attack_paths}</div>
                        </div>
                    </div>

                    {/* 1. Hero Attack Path Section */}
                    <div style={{ backgroundColor: "#0F172A", border: "1px solid #E11D48", borderRadius: "10px", padding: "25px", boxShadow: "0 4px 20px rgba(225, 29, 72, 0.15)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#E11D48", fontWeight: "bold", fontSize: "14px", textTransform: "uppercase", marginBottom: "15px" }}>
                            <ShieldAlert size={20} />
                            Critical Path Advisory
                        </div>
                        {hero_attack && hero_attack.title ? (
                            <div>
                                <h2 style={{ fontSize: "22px", color: "white", margin: "0 0 10px 0" }}>{hero_attack.title}</h2>
                                <p style={{ color: "#94A3B8", fontSize: "14px", lineHeight: "1.6", margin: "0 0 20px 0" }}>{hero_attack.description}</p>
                                <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "20px" }}>
                                    <div style={{ fontSize: "13px", color: "#F1F5F9", backgroundColor: "#1E293B", padding: "6px 12px", borderRadius: "6px" }}>
                                        Risk Level: <strong style={{ color: "#EF4444" }}>{hero_attack.risk}</strong>
                                    </div>
                                    <div style={{ fontSize: "13px", color: "#F1F5F9", backgroundColor: "#1E293B", padding: "6px 12px", borderRadius: "6px" }}>
                                        Likelihood: <strong>{hero_attack.likelihood}</strong>
                                    </div>
                                    <div style={{ fontSize: "13px", color: "#F1F5F9", backgroundColor: "#1E293B", padding: "6px 12px", borderRadius: "6px" }}>
                                        Impact: <strong>{hero_attack.impact}</strong>
                                    </div>
                                </div>
                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                    <Link to={`/attack-paths/${hero_attack.id}`} style={{ display: "flex", alignItems: "center", gap: "6px", color: "#E11D48", textDecoration: "none", fontSize: "14px", fontWeight: "600" }}>
                                        Analyze Attack Chain <Eye size={16} />
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: "#94A3B8" }}>
                                No active attack scenarios discovered. Your environment is structurally decoupled from known exploit chains.
                            </div>
                        )}
                    </div>

                    {/* 2. Top Recommendations & Discovered Services Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "30px" }}>
                        {/* Top Recommendations */}
                        <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                            <h3 style={{ fontSize: "18px", color: "white", margin: "0 0 15px 0", borderBottom: "1px solid #1E293B", paddingBottom: "10px" }}>
                                Priority Remediation Tasks
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                                {top_recommendations.length > 0 ? (
                                    top_recommendations.map((rec) => (
                                        <div key={rec.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", backgroundColor: "#1E293B", padding: "14px", borderRadius: "6px" }}>
                                            <div>
                                                <Link to={`/recommendations/${rec.id}`} style={{ textDecoration: "none" }}>
                                                    <h4 style={{ fontSize: "14px", color: "#38BDF8", margin: "0 0 6px 0", fontWeight: "600" }}>{rec.title}</h4>
                                                </Link>
                                                <span style={{ fontSize: "11px", color: "#94A3B8", display: "inline-block", marginRight: "10px" }}>
                                                    Category: {rec.category}
                                                </span>
                                                <span style={{ fontSize: "11px", color: rec.priority === "Critical" ? "#EF4444" : "#F59E0B" }}>
                                                    Priority: {rec.priority}
                                                </span>
                                            </div>
                                            {rec.auto_fix_supported && (
                                                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#10B981", backgroundColor: "#064E3B", padding: "4px 8px", borderRadius: "4px", fontWeight: "600" }}>
                                                    <Zap size={10} /> Auto-Fix
                                                </span>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ color: "#94A3B8" }}>No active remediation actions required.</div>
                                )}
                            </div>
                        </div>

                        {/* Discovered AWS Services */}
                        <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                            <h3 style={{ fontSize: "18px", color: "white", margin: "0 0 15px 0", borderBottom: "1px solid #1E293B", paddingBottom: "10px" }}>
                                Discovered Workloads
                            </h3>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                                {services.map((service) => (
                                    <Link key={service} to={`/services/${service.toLowerCase()}`} style={{ textDecoration: "none" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", backgroundColor: "#1E293B", border: "1px solid #334155", padding: "12px 18px", borderRadius: "6px", color: "white", fontSize: "14px", fontWeight: "600", transition: "all 0.2s" }}>
                                            <Cpu size={16} style={{ color: "#38BDF8" }} />
                                            {service.toUpperCase()}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 3. Attack Paths & Recent Findings Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "30px" }}>
                        {/* Attack Paths List */}
                        <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                            <h3 style={{ fontSize: "18px", color: "white", margin: "0 0 15px 0", borderBottom: "1px solid #1E293B", paddingBottom: "10px" }}>
                                Exploit Attack Paths
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {data?.attack_paths?.length > 0 ? (
                                    data.attack_paths.map((ap) => (
                                        <Link key={ap.id} to={`/attack-paths/${ap.id}`} style={{ textDecoration: "none" }}>
                                            <div style={{ backgroundColor: "#1E293B", padding: "14px", borderRadius: "6px", borderLeft: "4px solid #EF4444", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div>
                                                    <h4 style={{ fontSize: "14px", color: "white", margin: "0 0 4px 0", fontWeight: "600" }}>{ap.title}</h4>
                                                    <span style={{ fontSize: "11px", color: "#94A3B8" }}>Risk Level: {ap.risk}</span>
                                                </div>
                                                <span style={{ fontSize: "12px", color: "#38BDF8", display: "flex", alignItems: "center", gap: "4px" }}>
                                                    Inspect <Eye size={12} />
                                                </span>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div style={{ color: "#94A3B8" }}>No active attack paths identified.</div>
                                )}
                            </div>
                        </div>

                        {/* Recent Findings */}
                        <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                            <h3 style={{ fontSize: "18px", color: "white", margin: "0 0 15px 0", borderBottom: "1px solid #1E293B", paddingBottom: "10px" }}>
                                Recent Findings
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {recent_findings.length > 0 ? (
                                    recent_findings.map((f) => (
                                        <div key={f.id} style={{ display: "flex", alignItems: "center", gap: "12px", backgroundColor: "#1E293B", padding: "12px", borderRadius: "6px" }}>
                                            <AlertTriangle size={16} style={{ color: f.severity === "Critical" ? "#EF4444" : "#F59E0B" }} />
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ fontSize: "13px", color: "white", margin: "0 0 2px 0", fontWeight: "600" }}>{f.title}</h4>
                                                <span style={{ fontSize: "10px", color: "#94A3B8", marginRight: "10px" }}>Resource: {f.resource}</span>
                                                <span style={{ fontSize: "10px", color: "#38BDF8" }}>Service: {f.service}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ color: "#94A3B8" }}>No recent findings available.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 4. Scan History Section */}
                    <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                        <h3 style={{ fontSize: "18px", color: "white", margin: "0 0 15px 0", borderBottom: "1px solid #1E293B", paddingBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <TrendingUp size={18} style={{ color: "#38BDF8" }} /> Scan Trend History
                        </h3>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid #334155", color: "#94A3B8" }}>
                                        <th style={{ padding: "10px" }}>Scan Time</th>
                                        <th style={{ padding: "10px" }}>Account Name</th>
                                        <th style={{ padding: "10px" }}>Total Findings</th>
                                        <th style={{ padding: "10px" }}>Critical Risks</th>
                                        <th style={{ padding: "10px" }}>Attack Paths</th>
                                        <th style={{ padding: "10px", textAlign: "right" }}>Inspect</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {scan_history.map((s) => (
                                        <tr key={s.id} style={{ borderBottom: "1px solid #1E293B", hover: { backgroundColor: "#1E293B" } }}>
                                            <td style={{ padding: "12px 10px", color: "white" }}>{new Date(s.scan_time).toLocaleString()}</td>
                                            <td style={{ padding: "12px 10px", color: "#94A3B8" }}>{s.account_name}</td>
                                            <td style={{ padding: "12px 10px", fontWeight: "bold" }}>{s.findings_count}</td>
                                            <td style={{ padding: "12px 10px", color: "#EF4444", fontWeight: "bold" }}>{s.critical_findings}</td>
                                            <td style={{ padding: "12px 10px", color: "#F59E0B", fontWeight: "bold" }}>{s.attack_paths_count}</td>
                                            <td style={{ padding: "12px 10px", textAlign: "right" }}>
                                                <Link to={`/scans`} style={{ color: "#38BDF8", textDecoration: "none" }}>
                                                    View Details
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;