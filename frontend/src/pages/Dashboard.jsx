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
    Bookmark,
    Database,
    Shield,
} from "lucide-react";

function Dashboard({ selectedAccountId }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

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
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
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
                <h2>No Connected AWS Environment</h2>
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
                        Dashboard Overview
                    </h1>
                    <p style={{ fontSize: "14px", color: "#94A3B8", marginTop: "4px" }}>
                        Intelligent Cloud Security Advisor
                    </p>
                </div>
            </div>

            {!hasLatestScan ? (
                <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "40px", textAlign: "center", color: "#94A3B8" }}>
                    <Activity size={36} style={{ color: "#38BDF8", marginBottom: "15px" }} />
                    <h3>No Scan History Detected</h3>
                    <p style={{ marginTop: "8px" }}>
                        Run your first security scan in the <strong>Scans</strong> tab to generate your advisory profile.
                    </p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                    
                    {/* 1. HERO ATTACK PATH */}
                    <div style={{ backgroundColor: "#0F172A", border: "1px solid #E11D48", borderRadius: "10px", padding: "25px", boxShadow: "0 4px 20px rgba(225, 29, 72, 0.15)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#E11D48", fontWeight: "bold", fontSize: "14px", textTransform: "uppercase", marginBottom: "15px" }}>
                            <ShieldAlert size={20} />
                            Critical Path Advisory (Highest Severity Attack Scenario)
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

                    {/* 2. ENVIRONMENT SUMMARY */}
                    <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                        <h3 style={{ fontSize: "16px", color: "white", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Database size={16} style={{ color: "#38BDF8" }} /> Environment Summary
                        </h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
                            <div style={{ backgroundColor: "#1E293B", padding: "20px", borderRadius: "8px", border: "1px solid #334155" }}>
                                <div style={{ fontSize: "12px", color: "#94A3B8", fontWeight: "bold", textTransform: "uppercase" }}>Resources Scanned</div>
                                <div style={{ fontSize: "28px", fontWeight: "bold", color: "white", marginTop: "8px" }}>{summary.resources}</div>
                            </div>
                            <div style={{ backgroundColor: "#1E293B", padding: "20px", borderRadius: "8px", border: "1px solid #334155" }}>
                                <div style={{ fontSize: "12px", color: "#94A3B8", fontWeight: "bold", textTransform: "uppercase" }}>Discovered Services</div>
                                <div style={{ fontSize: "28px", fontWeight: "bold", color: "white", marginTop: "8px" }}>{summary.services}</div>
                            </div>
                            <div style={{ backgroundColor: "#1E293B", padding: "20px", borderRadius: "8px", border: "1px solid #334155" }}>
                                <div style={{ fontSize: "12px", color: "#94A3B8", fontWeight: "bold", textTransform: "uppercase" }}>Critical Findings</div>
                                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#EF4444", marginTop: "8px" }}>{summary.critical_findings}</div>
                            </div>
                            <div style={{ backgroundColor: "#1E293B", padding: "20px", borderRadius: "8px", border: "1px solid #334155" }}>
                                <div style={{ fontSize: "12px", color: "#94A3B8", fontWeight: "bold", textTransform: "uppercase" }}>Active Attack Paths</div>
                                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#F59E0B", marginTop: "8px" }}>{summary.attack_paths}</div>
                            </div>
                            <div style={{ backgroundColor: "#1E293B", padding: "20px", borderRadius: "8px", border: "1px solid #334155", gridColumn: "span 2" }}>
                                <div style={{ fontSize: "12px", color: "#94A3B8", fontWeight: "bold", textTransform: "uppercase" }}>Telemetry Logs</div>
                                <div style={{ display: "flex", gap: "20px", marginTop: "12px", fontSize: "13px" }}>
                                    <div>Last Scan: <strong style={{ color: "white" }}>{new Date(summary.last_scan).toLocaleString()}</strong></div>
                                    <div>Duration: <strong style={{ color: "white" }}>{summary.scan_duration?.toFixed(1)}s</strong></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. TOP RECOMMENDATIONS */}
                    <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                        <h3 style={{ fontSize: "16px", color: "white", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Bookmark size={16} style={{ color: "#38BDF8" }} /> Top Recommendations
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {top_recommendations.length > 0 ? (
                                top_recommendations.map((rec) => (
                                    <div key={rec.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#1E293B", padding: "14px 20px", borderRadius: "6px", border: "1px solid #334155" }}>
                                        <div>
                                            <Link to={`/recommendations/${rec.id}`} style={{ textDecoration: "none" }}>
                                                <h4 style={{ fontSize: "14px", color: "#38BDF8", margin: "0 0 4px 0", fontWeight: "600" }}>{rec.title}</h4>
                                            </Link>
                                            <div style={{ fontSize: "11px", color: "#94A3B8" }}>
                                                Category: <span style={{ color: "white", marginRight: "15px" }}>{rec.category}</span>
                                                Priority: <span style={{ color: rec.priority === "Critical" ? "#EF4444" : "#F59E0B", fontWeight: "bold" }}>{rec.priority}</span>
                                            </div>
                                        </div>
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
                                    </div>
                                ))
                            ) : (
                                <div style={{ color: "#94A3B8", fontSize: "13px" }}>No active remediation actions required.</div>
                            )}
                        </div>
                    </div>

                    {/* 4. ATTACK PATHS */}
                    <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                        <h3 style={{ fontSize: "16px", color: "white", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Shield size={16} style={{ color: "#EF4444" }} /> Exploit Attack Paths
                        </h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "15px" }}>
                            {data?.attack_paths?.length > 0 ? (
                                data.attack_paths.map((ap) => (
                                    <Link key={ap.id} to={`/attack-paths/${ap.id}`} style={{ textDecoration: "none" }}>
                                        <div style={{ backgroundColor: "#1E293B", padding: "16px", borderRadius: "6px", border: "1px solid #334155", borderLeft: "4px solid #EF4444", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box" }}>
                                            <div>
                                                <h4 style={{ fontSize: "14px", color: "white", margin: "0 0 6px 0", fontWeight: "600" }}>{ap.title}</h4>
                                                <p style={{ fontSize: "12px", color: "#94A3B8", margin: "0 0 12px 0", lineHeight: "1.4" }}>{ap.description.substring(0, 100)}...</p>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
                                                <span style={{ color: "#EF4444", fontWeight: "bold" }}>Risk Level: {ap.risk}</span>
                                                <span style={{ color: "#38BDF8", display: "flex", alignItems: "center", gap: "2px" }}>
                                                    Analyze <Eye size={12} />
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div style={{ color: "#94A3B8", fontSize: "13px" }}>No active attack paths identified.</div>
                            )}
                        </div>
                    </div>

                    {/* 5. DETECTED AWS SERVICES */}
                    <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                        <h3 style={{ fontSize: "16px", color: "white", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Cpu size={16} style={{ color: "#38BDF8" }} /> Discovered AWS Workloads
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

                    {/* 6. RECENT FINDINGS */}
                    <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                        <h3 style={{ fontSize: "16px", color: "white", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <AlertTriangle size={16} style={{ color: "#F59E0B" }} /> Recent Security Findings
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {recent_findings.length > 0 ? (
                                recent_findings.map((f) => (
                                    <div key={f.id} style={{ display: "flex", alignItems: "center", gap: "12px", backgroundColor: "#1E293B", border: "1px solid #334155", padding: "14px 20px", borderRadius: "6px" }}>
                                        <AlertTriangle size={16} style={{ color: f.severity === "Critical" ? "#EF4444" : "#F59E0B" }} />
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ fontSize: "13px", color: "white", margin: "0 0 2px 0", fontWeight: "600" }}>{f.title}</h4>
                                            <div style={{ fontSize: "11px", color: "#94A3B8" }}>
                                                Resource: <span style={{ color: "#CBD5E1", marginRight: "15px" }}>{f.resource}</span>
                                                Service: <span style={{ color: "#38BDF8" }}>{f.service}</span>
                                            </div>
                                        </div>
                                        <span style={{ fontSize: "11px", fontWeight: "bold", color: f.severity === "Critical" ? "#EF4444" : "#F59E0B" }}>
                                            {f.severity}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div style={{ color: "#94A3B8", fontSize: "13px" }}>No recent findings available.</div>
                            )}
                        </div>
                    </div>

                    {/* 7. SCAN HISTORY */}
                    <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                        <h3 style={{ fontSize: "16px", color: "white", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
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
                                        <tr key={s.id} style={{ borderBottom: "1px solid #1E293B" }}>
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