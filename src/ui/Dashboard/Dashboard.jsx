import { useState, useEffect } from "react";
import api from "../../services/api";
import "./Dashboard.css";
import {
  LayoutDashboard,
  Server,
  TrendingUp,
  Bookmark,
  Activity,
  FileText,
  Settings as SettingsIcon,
  ChevronRight,
  Shield,
  Zap,
  Trash2,
  Plus,
  Play,
  Loader2,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Lock,
} from "lucide-react";

function Dashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [services, setServices] = useState([]);
  const [attackPaths, setAttackPaths] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [findings, setFindings] = useState([]);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detail views state
  const [selectedAttackPathId, setSelectedAttackPathId] = useState(null);
  const [selectedRecommendationId, setSelectedRecommendationId] = useState(null);

  // Auto-remediation simulation states
  const [fixingId, setFixingId] = useState(null);
  const [fixedIds, setFixedIds] = useState(new Set());

  // Connection form state
  const [accountName, setAccountName] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [formLoading, setFormLoading] = useState(false);
  const [formMessage, setFormMessage] = useState("");

  // Scan execution state
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStage, setScanStage] = useState("");

  // User info
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
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const res = await api.get("/aws-accounts");
      const list = res.data.accounts || [];
      setAccounts(list);
      if (list.length > 0) {
        const saved = sessionStorage.getItem("selectedAccountId");
        const matched = list.find((a) => String(a.id) === saved);
        if (matched) {
          setSelectedAccountId(matched.id);
        } else {
          setSelectedAccountId(list[0].id);
        }
      } else {
        setSelectedAccountId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = async () => {
    if (!selectedAccountId) {
      setServices([]);
      setAttackPaths([]);
      setRecommendations([]);
      setFindings([]);
      setScans([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [dashRes, pathRes, recsRes, findingsRes, scansRes] = await Promise.all([
        api.get("/dashboard", { params: { aws_account_id: selectedAccountId } }),
        api.get("/attack-paths", { params: { aws_account_id: selectedAccountId } }),
        api.get("/recommendations", { params: { aws_account_id: selectedAccountId } }),
        api.get("/findings", { params: { aws_account_id: selectedAccountId } }),
        api.get("/scans"),
      ]);

      setServices(dashRes.data.services || []);
      setAttackPaths(pathRes.data.attack_paths || []);
      setRecommendations(recsRes.data.recommendations || []);
      setFindings(findingsRes.data.findings || []);
      
      const filteredScans = (scansRes.data.scans || []).filter(
        (s) => s.aws_account_id === selectedAccountId
      );
      setScans(filteredScans);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedAccountId]);

  const handleAccountChange = (e) => {
    const id = Number(e.target.value);
    setSelectedAccountId(id);
    sessionStorage.setItem("selectedAccountId", String(id));
    setSelectedAttackPathId(null);
    setSelectedRecommendationId(null);
  };

  const handleConnectAccount = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormMessage("");

    try {
      await api.post("/aws-accounts", {
        account_name: accountName,
        access_key: accessKey,
        secret_key: secretKey,
        region: region,
      });

      setFormMessage("AWS environment connected successfully!");
      setAccountName("");
      setAccessKey("");
      setSecretKey("");
      loadAccounts();
    } catch (err) {
      setFormMessage(err.response?.data?.message || "Failed to validate AWS credentials.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm("Are you sure you want to delete this AWS connection? This will wipe all historical scans.")) {
      return;
    }
    try {
      await api.delete(`/aws-accounts/${id}`);
      loadAccounts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunScan = async () => {
    if (!selectedAccountId) return;
    setScanning(true);
    setScanProgress(10);
    setScanStage("Connecting to AWS Cloud APIs...");

    const steps = [
      { progress: 30, stage: "Discovering active cloud resources (EC2, S3, IAM)..." },
      { progress: 60, stage: "Evaluating security rules baseline..." },
      { progress: 85, stage: "Constructing vulnerability attack paths..." },
      { progress: 95, stage: "Generating prioritized remediation recommendations..." },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setScanProgress(steps[currentStep].progress);
        setScanStage(steps[currentStep].stage);
        currentStep++;
      }
    }, 1500);

    try {
      await api.post("/scans", { aws_account_id: selectedAccountId });
      clearInterval(interval);
      setScanProgress(100);
      setScanStage("Scan completed successfully!");
      setTimeout(() => {
        setScanning(false);
        loadAccounts();
        loadData();
      }, 1000);
    } catch (err) {
      clearInterval(interval);
      setScanning(false);
      alert(err.response?.data?.message || "Scan failed.");
    }
  };

  const handleRunAutoFix = (id) => {
    setFixingId(id);
    setTimeout(() => {
      setFixingId(null);
      setFixedIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    }, 2000);
  };

  const handleDownloadPDF = (scanId) => {
    const activeAcc = accounts.find((a) => a.id === selectedAccountId);
    const content = `--------------------------------------------------
CLOUDINTERCEPT SECURITY REPORT
--------------------------------------------------
Scan Snapshot: #${scanId}
Environment: ${activeAcc?.account_name || "AWS Environment"}
Timestamp: ${new Date().toLocaleString()}
Compliance Status: Evaluated

This document certifies that a CloudIntercept security scan was successfully
conducted. Discovered AWS resource assets were verified against active 
security engine rules, correlating attack scenarios, and remediation guidelines.

--------------------------------------------------
Generated by CloudIntercept Core Security Advisor.
--------------------------------------------------`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `CloudIntercept_Report_Scan_${scanId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const activeAccount = accounts.find((a) => a.id === selectedAccountId);
  const activeLastScanTime = activeAccount?.last_scan_time;
  const activeScanStatus = scanning ? "Running" : (activeAccount?.last_scan_status || "Never Scanned");

  // Calculate metrics
  const totalFindings = findings.length;
  const criticalFindings = findings.filter((f) => f.severity === "Critical" || f.severity === "High").length;
  const score = totalFindings === 0 ? 100 : Math.max(30, 100 - (criticalFindings * 10) - (findings.filter(f => f.severity === "Medium").length * 4));

  return (
    <div className="dashboard-page" style={{ display: "flex", padding: 0, overflowX: "hidden" }}>
      {/* Sidebar Navigation */}
      <aside style={{ width: "260px", backgroundColor: "#ffffff", borderRight: "1px solid rgba(96, 165, 250, 0.18)", minHeight: "100vh", display: "flex", flexDirection: "column", padding: "24px 16px", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "36px", paddingLeft: "8px" }}>
          <div className="brand-mark" style={{ width: "36px", height: "36px", borderRadius: "10px", fontSize: "14px" }}>CI</div>
          <div>
            <strong style={{ fontSize: "16px", color: "#0f172a" }}>CloudIntercept</strong>
            <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>CSPM Platform</p>
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
          {[
            { id: "overview", label: "Overview", icon: <LayoutDashboard size={18} /> },
            { id: "accounts", label: "AWS Accounts", icon: <Server size={18} /> },
            { id: "attack-paths", label: "Attack Paths", icon: <TrendingUp size={18} /> },
            { id: "recommendations", label: "Recommendations", icon: <Bookmark size={18} /> },
            { id: "scans", label: "Scans", icon: <Activity size={18} /> },
            { id: "reports", label: "Reports", icon: <FileText size={18} /> },
            { id: "settings", label: "Settings", icon: <SettingsIcon size={18} /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedAttackPathId(null);
                  setSelectedRecommendationId(null);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  borderRadius: "14px",
                  border: "none",
                  backgroundColor: isActive ? "#eff6ff" : "transparent",
                  color: isActive ? "#2563eb" : "#475569",
                  fontWeight: isActive ? "700" : "600",
                  fontSize: "14px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </nav>

        {user && (
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "16px", marginTop: "20px", display: "flex", alignItems: "center", gap: "10px", paddingLeft: "8px" }}>
            {user.picture ? (
              <img src={user.picture} alt="Avatar" style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#e2e8f0", display: "grid", placeItems: "center", fontWeight: "700", color: "#475569", fontSize: "13px" }}>
                {(user.name || user.username || user.email || "US").substring(0, 2).toUpperCase()}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.name || user.username || user.email?.split("@")[0]}
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email}
              </p>
            </div>
          </div>
        )}
      </aside>

      {/* Main Workspace Area */}
      <main style={{ flex: 1, padding: "32px", boxSizing: "border-box", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        
        {/* Universal Top Header */}
        <header className="dashboard-header" style={{ borderBottom: "1px solid rgba(96, 165, 250, 0.16)", paddingBottom: "20px", marginBottom: "28px" }}>
          <div>
            <p className="eyebrow">CloudIntercept</p>
            <h1 style={{ textTransform: "capitalize" }}>{activeTab === "overview" ? "Security Dashboard" : activeTab.replace("-", " ")}</h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "15px", flexWrap: "wrap" }}>
            {/* Account Switcher Selector */}
            {accounts.length > 0 && (
              <select
                value={selectedAccountId || ""}
                onChange={handleAccountChange}
                style={{
                  padding: "10px 16px",
                  borderRadius: "14px",
                  border: "1px solid rgba(96, 165, 250, 0.25)",
                  backgroundColor: "#ffffff",
                  color: "#1e293b",
                  fontWeight: "600",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_name} ({acc.aws_account_id})
                  </option>
                ))}
              </select>
            )}

            {/* Scan Status Badge */}
            {selectedAccountId && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#ffffff", padding: "6px 14px", borderRadius: "14px", border: "1px solid rgba(96, 165, 250, 0.18)" }}>
                <span style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: activeScanStatus === "Completed" ? "#10B981" : (activeScanStatus === "Failed" ? "#EF4444" : (activeScanStatus === "Running" ? "#38BDF8" : "#94A3B8")),
                  display: "inline-block"
                }}></span>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>
                  {scanning ? "Scanning..." : activeScanStatus}
                </span>
              </div>
            )}

            {/* Run Scan Button */}
            {selectedAccountId && (
              <button
                onClick={handleRunScan}
                disabled={scanning}
                className="action-button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  borderRadius: "14px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                {scanning ? <Loader2 size={14} className="animate-spin" /> : <Play size={12} fill="#1e3a8a" />}
                Scan
              </button>
            )}

            <button type="button" className="logout-button" style={{ padding: "10px 18px", borderRadius: "14px", fontSize: "13px" }} onClick={onLogout}>
              Sign out
            </button>
          </div>
        </header>

        {/* Global Scanning Progress Bar Overlay */}
        {scanning && (
          <div style={{ backgroundColor: "#ffffff", border: "1px solid rgba(96, 165, 250, 0.22)", borderRadius: "20px", padding: "20px", marginBottom: "28px", boxShadow: "0 10px 30px rgba(37, 99, 235, 0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e3a8a" }}>{scanStage}</span>
              <span style={{ fontSize: "14px", fontWeight: "800", color: "#2563eb" }}>{scanProgress}%</span>
            </div>
            <div style={{ width: "100%", height: "8px", backgroundColor: "#eff6ff", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ width: `${scanProgress}%`, height: "100%", background: "linear-gradient(90deg, #60a5fa, #2563eb)", borderRadius: "999px", transition: "width 0.4s ease" }}></div>
            </div>
          </div>
        )}

        {/* Dynamic Content Switching */}
        {!selectedAccountId && activeTab !== "accounts" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>☁️</div>
            <h2 style={{ color: "#1e293b", marginBottom: "8px" }}>No AWS Environment Connected</h2>
            <p style={{ color: "#64748b", maxWidth: "450px", marginBottom: "24px" }}>
              To start cloud security scans and identify attack vectors, you need to connect your AWS access keys.
            </p>
            <button
              onClick={() => setActiveTab("accounts")}
              className="logout-button"
              style={{ padding: "12px 24px", borderRadius: "14px" }}
            >
              Go to AWS Accounts
            </button>
          </div>
        ) : loading && selectedAccountId ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1, color: "#64748b" }}>
            <h3>Loading environment parameters...</h3>
          </div>
        ) : (
          <>
            {/* Tab content renderer */}
            
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                
                {/* Metrics row */}
                <div className="status-grid" style={{ margin: 0 }}>
                  <article className="status-card">
                    <p className="card-label">Security rating</p>
                    <h2>{score}%</h2>
                    <p className="card-detail">{score >= 80 ? "Good posture" : "Review vulnerabilities"}</p>
                  </article>
                  <article className="status-card">
                    <p className="card-label">Active findings</p>
                    <h2>{totalFindings}</h2>
                    <p className="card-detail">{criticalFindings} high-severity issues</p>
                  </article>
                  <article className="status-card">
                    <p className="card-label">Threat pathways</p>
                    <h2>{attackPaths.length}</h2>
                    <p className="card-detail">Correlated exploit chains</p>
                  </article>
                  <article className="status-card">
                    <p className="card-label">Recommendations</p>
                    <h2>{recommendations.length}</h2>
                    <p className="card-detail">Prioritized mitigations</p>
                  </article>
                </div>

                {/* Hero Attack Scenario */}
                {attackPaths.length > 0 && (
                  <div style={{ backgroundColor: "#ffffff", border: "1px solid rgba(96, 165, 250, 0.18)", borderRadius: "32px", padding: "28px", boxShadow: "0 30px 90px rgba(15, 23, 42, 0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px" }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", backgroundColor: "rgba(239, 68, 68, 0.12)", color: "#EF4444", padding: "4px 10px", borderRadius: "6px", display: "inline-block", marginBottom: "12px" }}>
                        Critical Threat vector
                      </span>
                      <h3 style={{ fontSize: "20px", color: "#0f172a", margin: "0 0 8px 0", fontWeight: "700" }}>{attackPaths[0].title}</h3>
                      <p style={{ fontSize: "14px", color: "#475569", margin: "0 0 16px 0", lineHeight: "1.6" }}>{attackPaths[0].description}</p>
                      <button
                        onClick={() => {
                          setSelectedAttackPathId(attackPaths[0].id);
                          setActiveTab("attack-paths");
                        }}
                        style={{ background: "transparent", border: "none", color: "#2563eb", fontWeight: "700", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        Inspect Path Chain <ChevronRight size={14} />
                      </button>
                    </div>
                    <div style={{ padding: "20px", borderRadius: "50%", backgroundColor: "rgba(239, 68, 68, 0.08)", color: "#EF4444" }}>
                      <Shield size={44} />
                    </div>
                  </div>
                )}

                {/* Discovered Services Grid */}
                <div>
                  <h2 style={{ fontSize: "18px", color: "#0f172a", marginBottom: "16px" }}>Detected workloads</h2>
                  {services.length === 0 ? (
                    <p style={{ color: "#64748b" }}>No cloud workloads mapped yet.</p>
                  ) : (
                    <div className="control-grid" style={{ margin: 0 }}>
                      {services.map((srv) => (
                        <article key={srv.name} className="control-card">
                          <p className="card-label">{srv.name}</p>
                          <h3>{srv.resources_count} assets</h3>
                          <p className="card-detail">{srv.findings_count} findings</p>
                        </article>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Findings */}
                <div style={{ backgroundColor: "#ffffff", border: "1px solid rgba(96, 165, 250, 0.18)", borderRadius: "32px", padding: "28px" }}>
                  <h2 style={{ fontSize: "18px", color: "#0f172a", marginBottom: "16px" }}>Recent security findings</h2>
                  {findings.length === 0 ? (
                    <p style={{ color: "#64748b" }}>No security findings active.</p>
                  ) : (
                    <div className="findings-list">
                      {findings.slice(0, 4).map((f) => (
                        <div key={f.id} className="finding-row">
                          <div>
                            <p className="finding-id" style={{ color: f.severity === "Critical" || f.severity === "High" ? "#EF4444" : "#F59E0B" }}>
                              {f.rule_id}
                            </p>
                            <p style={{ fontSize: "14px", color: "#1e293b", fontWeight: "600" }}>{f.title}</p>
                            <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Resource: {f.resource}</p>
                          </div>
                          <span style={{
                            padding: "8px 12px",
                            borderRadius: "999px",
                            fontSize: "11px",
                            fontWeight: "bold",
                            backgroundColor: f.severity === "Critical" || f.severity === "High" ? "rgba(239, 68, 68, 0.1)" : "rgba(245, 158, 11, 0.1)",
                            color: f.severity === "Critical" || f.severity === "High" ? "#EF4444" : "#D97706"
                          }}>
                            {f.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AWS ACCOUNTS TAB */}
            {activeTab === "accounts" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "28px" }}>
                
                {/* List Accounts */}
                <div style={{ backgroundColor: "#ffffff", border: "1px solid rgba(96, 165, 250, 0.18)", borderRadius: "32px", padding: "28px" }}>
                  <h2 style={{ fontSize: "18px", color: "#0f172a", marginBottom: "20px" }}>Connected Environments</h2>
                  {accounts.length === 0 ? (
                    <p style={{ color: "#64748b" }}>No AWS accounts connected yet.</p>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                            <th style={{ padding: "12px 10px" }}>Account Name</th>
                            <th style={{ padding: "12px 10px" }}>Account ID</th>
                            <th style={{ padding: "12px 10px" }}>Region</th>
                            <th style={{ padding: "12px 10px" }}>Last Scan</th>
                            <th style={{ padding: "12px 10px" }}>Status</th>
                            <th style={{ padding: "12px 10px", textAlign: "right" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accounts.map((acc) => (
                            <tr key={acc.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "14px 10px", fontWeight: "700" }}>{acc.account_name}</td>
                              <td style={{ padding: "14px 10px", fontFamily: "monospace" }}>{acc.aws_account_id}</td>
                              <td style={{ padding: "14px 10px" }}>{acc.region}</td>
                              <td style={{ padding: "14px 10px", color: "#64748b" }}>
                                {acc.last_scan_time ? new Date(acc.last_scan_time).toLocaleString() : "Never"}
                              </td>
                              <td style={{ padding: "14px 10px" }}>
                                <span style={{
                                  padding: "4px 10px",
                                  borderRadius: "999px",
                                  fontSize: "11px",
                                  fontWeight: "bold",
                                  backgroundColor: acc.last_scan_status === "Completed" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                                  color: acc.last_scan_status === "Completed" ? "#10B981" : "#EF4444"
                                }}>
                                  {acc.last_scan_status}
                                </span>
                              </td>
                              <td style={{ padding: "14px 10px", textAlign: "right" }}>
                                <button
                                  onClick={() => handleDeleteAccount(acc.id)}
                                  style={{ background: "transparent", border: "none", color: "#EF4444", cursor: "pointer" }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Add account form */}
                <div style={{ backgroundColor: "#ffffff", border: "1px solid rgba(96, 165, 250, 0.18)", borderRadius: "32px", padding: "28px" }}>
                  <h2 style={{ fontSize: "18px", color: "#0f172a", marginBottom: "20px" }}>Connect new AWS account</h2>
                  
                  {formMessage && (
                    <div style={{
                      padding: "10px 14px",
                      borderRadius: "14px",
                      fontSize: "13px",
                      marginBottom: "20px",
                      backgroundColor: formMessage.includes("successfully") ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                      color: formMessage.includes("successfully") ? "#10B981" : "#EF4444",
                      fontWeight: "700"
                    }}>
                      {formMessage}
                    </div>
                  )}

                  <form onSubmit={handleConnectAccount} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div style={{ display: "grid", gap: "8px" }}>
                      <label style={{ fontSize: "13px", fontWeight: "700", color: "#1e3a8a" }}>Connection Name</label>
                      <input
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="Production AWS Stack"
                        required
                        style={{ padding: "12px", borderRadius: "14px", border: "1px solid rgba(96, 165, 250, 0.25)", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                    <div style={{ display: "grid", gap: "8px" }}>
                      <label style={{ fontSize: "13px", fontWeight: "700", color: "#1e3a8a" }}>AWS Region</label>
                      <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        style={{ padding: "12px", borderRadius: "14px", border: "1px solid rgba(96, 165, 250, 0.25)", outline: "none", cursor: "pointer", boxSizing: "border-box" }}
                      >
                        <option value="us-east-1">us-east-1</option>
                        <option value="us-east-2">us-east-2</option>
                        <option value="us-west-1">us-west-1</option>
                        <option value="us-west-2">us-west-2</option>
                        <option value="eu-central-1">eu-central-1</option>
                        <option value="eu-west-1">eu-west-1</option>
                      </select>
                    </div>
                    <div style={{ display: "grid", gap: "8px" }}>
                      <label style={{ fontSize: "13px", fontWeight: "700", color: "#1e3a8a" }}>AWS Access Key ID</label>
                      <input
                        type="text"
                        value={accessKey}
                        onChange={(e) => setAccessKey(e.target.value)}
                        placeholder="AKIA..."
                        required
                        style={{ padding: "12px", borderRadius: "14px", border: "1px solid rgba(96, 165, 250, 0.25)", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                    <div style={{ display: "grid", gap: "8px" }}>
                      <label style={{ fontSize: "13px", fontWeight: "700", color: "#1e3a8a" }}>AWS Secret Access Key</label>
                      <input
                        type="password"
                        value={secretKey}
                        onChange={(e) => setSecretKey(e.target.value)}
                        placeholder="••••••••••••••••••••"
                        required
                        style={{ padding: "12px", borderRadius: "14px", border: "1px solid rgba(96, 165, 250, 0.25)", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                    <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                      <button
                        type="submit"
                        disabled={formLoading}
                        className="logout-button"
                        style={{ padding: "12px 24px", borderRadius: "14px" }}
                      >
                        {formLoading ? "Validating keys..." : "Add AWS Connection"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ATTACK PATHS TAB */}
            {activeTab === "attack-paths" && (
              <div>
                {!selectedAttackPathId ? (
                  <div style={{ backgroundColor: "#ffffff", border: "1px solid rgba(96, 165, 250, 0.18)", borderRadius: "32px", padding: "28px" }}>
                    <h2 style={{ fontSize: "18px", color: "#0f172a", marginBottom: "20px" }}>Active Threat Pathways</h2>
                    {attackPaths.length === 0 ? (
                      <p style={{ color: "#64748b" }}>No threat vectors mapped.</p>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        {attackPaths.map((ap) => (
                          <div key={ap.id} style={{ backgroundColor: "#f8fbff", border: "1px solid rgba(96, 165, 250, 0.2)", padding: "20px", borderRadius: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                <span style={{
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: "bold",
                                  backgroundColor: "rgba(239, 68, 68, 0.12)",
                                  color: "#EF4444"
                                }}>
                                  {ap.risk} Risk
                                </span>
                                <span style={{ fontSize: "12px", color: "#64748b" }}>Likelihood: {ap.likelihood}</span>
                              </div>
                              <h3 style={{ fontSize: "16px", color: "#102a43", margin: "0 0 8px 0" }}>{ap.title}</h3>
                              <p style={{ fontSize: "13px", color: "#334e68", margin: "0 0 20px 0", lineHeight: "1.5" }}>{ap.description}</p>
                            </div>
                            <button
                              onClick={() => setSelectedAttackPathId(ap.id)}
                              style={{ background: "transparent", border: "none", color: "#2563eb", fontWeight: "700", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", padding: 0 }}
                            >
                              Explore Vector Chain <ChevronRight size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Detail View
                  (() => {
                    const ap = attackPaths.find((p) => p.id === selectedAttackPathId);
                    if (!ap) return null;
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                        <button
                          onClick={() => setSelectedAttackPathId(null)}
                          style={{
                            alignSelf: "flex-start",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            backgroundColor: "#ffffff",
                            border: "1px solid rgba(96, 165, 250, 0.18)",
                            borderRadius: "14px",
                            padding: "10px 16px",
                            cursor: "pointer",
                            fontWeight: "700",
                            fontSize: "13px"
                          }}
                        >
                          <ArrowLeft size={16} /> Back to vectors list
                        </button>

                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "28px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                            
                            {/* Overview */}
                            <div style={{ backgroundColor: "#ffffff", border: "1px solid rgba(96, 165, 250, 0.18)", borderRadius: "32px", padding: "28px" }}>
                              <h2 style={{ fontSize: "20px", margin: "0 0 10px 0" }}>{ap.title}</h2>
                              <p style={{ color: "#334e68", lineHeight: "1.7", fontSize: "14px" }}>{ap.description}</p>
                              
                              <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
                                <div style={{ backgroundColor: "#f8fbff", border: "1px solid rgba(96, 165, 250, 0.2)", borderRadius: "14px", padding: "10px 16px" }}>
                                  <span style={{ fontSize: "11px", color: "#64748b" }}>Risk severity</span>
                                  <h4 style={{ margin: "4px 0 0 0", color: "#EF4444" }}>{ap.risk}</h4>
                                </div>
                                <div style={{ backgroundColor: "#f8fbff", border: "1px solid rgba(96, 165, 250, 0.2)", borderRadius: "14px", padding: "10px 16px" }}>
                                  <span style={{ fontSize: "11px", color: "#64748b" }}>Likelihood</span>
                                  <h4 style={{ margin: "4px 0 0 0", color: "#1e293b" }}>{ap.likelihood}</h4>
                                </div>
                                <div style={{ backgroundColor: "#f8fbff", border: "1px solid rgba(96, 165, 250, 0.2)", borderRadius: "14px", padding: "10px 16px" }}>
                                  <span style={{ fontSize: "11px", color: "#64748b" }}>Impact magnitude</span>
                                  <h4 style={{ margin: "4px 0 0 0", color: "#1e293b" }}>{ap.impact}</h4>
                                </div>
                              </div>
                            </div>

                            {/* Attack Progression */}
                            <div style={{ backgroundColor: "#ffffff", border: "1px solid rgba(96, 165, 250, 0.18)", borderRadius: "32px", padding: "28px" }}>
                              <h3 style={{ fontSize: "18px", color: "#0f172a", marginBottom: "20px" }}>Attack Progression</h3>
                              {ap.attack_steps && ap.attack_steps.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                                  {ap.attack_steps.map((step, idx) => (
                                    <div key={idx} style={{ display: "flex", gap: "20px" }}>
                                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                        <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#2563eb", color: "white", display: "grid", placeItems: "center", fontSize: "12px", fontWeight: "700" }}>
                                          {idx + 1}
                                        </div>
                                        {idx < ap.attack_steps.length - 1 && (
                                          <div style={{ width: "2px", flex: 1, backgroundColor: "rgba(96, 165, 250, 0.2)", margin: "8px 0" }}></div>
                                        )}
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", color: "#1e293b", fontWeight: "700" }}>{step.step || `Stage ${idx + 1}`}</h4>
                                        <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: "1.5" }}>{step.description}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p style={{ color: "#64748b" }}>No sequential chain steps mapped.</p>
                              )}
                            </div>

                            {/* Mitigation guidelines */}
                            <div style={{ backgroundColor: "#ffffff", border: "1px solid rgba(96, 165, 250, 0.18)", borderRadius: "32px", padding: "28px" }}>
                              <h3 style={{ fontSize: "18px", color: "#0f172a", marginBottom: "10px" }}>Scenario Mitigation</h3>
                              <p style={{ color: "#334e68", lineHeight: "1.7", fontSize: "14px" }}>{ap.mitigation}</p>
                            </div>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                            {/* Affected Resources */}
                            <div style={{ backgroundColor: "#ffffff", border: "1px solid rgba(96, 165, 250, 0.18)", borderRadius: "32px", padding: "28px" }}>
                              <h3 style={{ fontSize: "16px", color: "#0f172a", marginBottom: "14px" }}>Affected Resources</h3>
                              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {ap.affected_resources?.map((res, i) => (
                                  <div key={i} style={{ backgroundColor: "#f8fbff", border: "1px solid rgba(96, 165, 250, 0.2)", padding: "10px 14px", borderRadius: "10px", fontSize: "12px", fontFamily: "monospace" }}>
                                    {res}
                                  </div>
                                )) || <p style={{ color: "#64748b" }}>None.</p>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            )}

            {/* RECOMMENDATIONS TAB */}
            {activeTab === "recommendations" && (
              <div>
                {!selectedRecommendationId ? (
                  <div style={{ backgroundColor: "#ffffff", border: "1px solid rgba(96, 165, 250, 0.18)", borderRadius: "32px", padding: "28px" }}>
                    <h2 style={{ fontSize: "18px", color: "#0f172a", marginBottom: "20px" }}>Remediation Advisories</h2>
                    {recommendations.length === 0 ? (
                      <p style={{ color: "#64748b" }}>No recommendations active.</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {recommendations.map((rec) => (
                          <div key={rec.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f8fbff", border: "1px solid rgba(96, 165, 250, 0.2)", padding: "18px 24px", borderRadius: "24px" }}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                                <span style={{
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  fontWeight: "bold",
                                  backgroundColor: rec.priority === "Critical" ? "rgba(239, 68, 68, 0.12)" : "rgba(245, 158, 11, 0.12)",
                                  color: rec.priority === "Critical" ? "#EF4444" : "#F59E0B"
                                }}>
                                  {rec.priority}
                                </span>
                                <span style={{ fontSize: "12px", color: "#64748b" }}>{rec.category}</span>
                              </div>
                              <h3 style={{ fontSize: "15px", color: "#102a43", margin: "0" }}>{rec.title}</h3>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                              {rec.auto_fix_supported && (
                                <span style={{ fontSize: "11px", fontWeight: "800", color: "#10B981", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                  <Zap size={10} fill="#10B981" /> Auto Fix
                                </span>
                              )}
                              <button
                                onClick={() => setSelectedRecommendationId(rec.id)}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "8px 16px",
                                  backgroundColor: "#ffffff",
                                  border: "1px solid rgba(96, 165, 250, 0.25)",
                                  borderRadius: "14px",
                                  fontSize: "13px",
                                  fontWeight: "700",
                                  cursor: "pointer"
                                }}
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Recommendation detail panel
                  (() => {
                    const rec = recommendations.find((r) => r.id === selectedRecommendationId);
                    if (!rec) return null;
                    const isFixing = fixingId === rec.id;
                    const isFixed = fixedIds.has(rec.id);
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                        <button
                          onClick={() => setSelectedRecommendationId(null)}
                          style={{
                            alignSelf: "flex-start",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            backgroundColor: "#ffffff",
                            border: "1px solid rgba(96, 165, 250, 0.18)",
                            borderRadius: "14px",
                            padding: "10px 16px",
                            cursor: "pointer",
                            fontWeight: "700",
                            fontSize: "13px"
                          }}
                        >
                          <ArrowLeft size={16} /> Back to advisories list
                        </button>

                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "28px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                            
                            {/* Summary header card */}
                            <div style={{ backgroundColor: "#ffffff", border: "1px solid rgba(96, 165, 250, 0.18)", borderRadius: "32px", padding: "28px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                                <div>
                                  <h2 style={{ fontSize: "20px", margin: 0 }}>{rec.title}</h2>
                                  <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b" }}>Category: {rec.category} | Priority: {rec.priority}</p>
                                </div>

                                {rec.auto_fix_supported ? (
                                  <div>
                                    {isFixed ? (
                                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "rgba(16, 185, 129, 0.12)", color: "#10B981", padding: "8px 16px", borderRadius: "14px", fontSize: "13px", fontWeight: "700" }}>
                                        <CheckCircle size={14} /> Completed
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => handleRunAutoFix(rec.id)}
                                        disabled={isFixing}
                                        className="logout-button"
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "6px",
                                          padding: "8px 16px",
                                          borderRadius: "14px",
                                          fontSize: "13px",
                                          fontWeight: "700",
                                          cursor: "pointer"
                                        }}
                                      >
                                        {isFixing ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} fill="white" />}
                                        {isFixing ? "Executing..." : "Auto Fix Available"}
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", border: "1px solid #cbd5e1", padding: "6px 12px", borderRadius: "10px" }}>
                                    Manual Action Required
                                  </span>
                                )}
                              </div>

                              <p style={{ color: "#334e68", lineHeight: "1.7", fontSize: "14px", margin: "0 0 20px 0" }}>{rec.description}</p>
                              
                              <div style={{ display: "flex", gap: "20px" }}>
                                <div style={{ backgroundColor: "#f8fbff", border: "1px solid rgba(96, 165, 250, 0.2)", borderRadius: "14px", padding: "10px 16px" }}>
                                  <span style={{ fontSize: "11px", color: "#64748b" }}>Expected Risk Reduction</span>
                                  <h4 style={{ margin: "4px 0 0 0", color: "#10B981" }}>{rec.expected_risk_reduction}</h4>
                                </div>
                                <div style={{ backgroundColor: "#f8fbff", border: "1px solid rgba(96, 165, 250, 0.2)", borderRadius: "14px", padding: "10px 16px" }}>
                                  <span style={{ fontSize: "11px", color: "#64748b" }}>Estimated Effort</span>
                                  <h4 style={{ margin: "4px 0 0 0", color: "#1e293b" }}>{rec.estimated_effort}</h4>
                                </div>
                              </div>
                            </div>

                            {/* Implementation Steps */}
                            <div style={{ backgroundColor: "#ffffff", border: "1px solid rgba(96, 165, 250, 0.18)", borderRadius: "32px", padding: "28px" }}>
                              <h3 style={{ fontSize: "18px", color: "#0f172a", marginBottom: "20px" }}>Remediation Plan</h3>
                              {rec.implementation_steps && rec.implementation_steps.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                  {rec.implementation_steps.map((step, i) => (
                                    <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                                      <div style={{ padding: "4px 8px", backgroundColor: "#eff6ff", border: "1px solid rgba(96, 165, 250, 0.25)", color: "#2563eb", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>
                                        Step {i + 1}
                                      </div>
                                      <div style={{ paddingTop: "2px" }}>
                                        <p style={{ margin: 0, fontSize: "13px", color: "#1e293b", lineHeight: "1.5" }}>
                                          {typeof step === "string" ? step : step.description}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p style={{ color: "#64748b" }}>No steps provided.</p>
                              )}
                            </div>

                            {/* Business Impact */}
                            <div style={{ backgroundColor: "#ffffff", border: "1px solid rgba(96, 165, 250, 0.18)", borderRadius: "32px", padding: "28px" }}>
                              <h3 style={{ fontSize: "18px", color: "#0f172a", marginBottom: "10px" }}>Business & Compliance Impact</h3>
                              <p style={{ color: "#334e68", lineHeight: "1.7", fontSize: "14px" }}>{rec.business_impact}</p>
                            </div>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                            {/* Impacted resources list */}
                            <div style={{ backgroundColor: "#ffffff", border: "1px solid rgba(96, 165, 250, 0.18)", borderRadius: "32px", padding: "28px" }}>
                              <h3 style={{ fontSize: "16px", color: "#0f172a", marginBottom: "14px" }}>Impacted Resources</h3>
                              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {rec.affected_resources?.map((res, i) => (
                                  <div key={i} style={{ backgroundColor: "#f8fbff", border: "1px solid rgba(96, 165, 250, 0.2)", padding: "10px 14px", borderRadius: "10px", fontSize: "12px", fontFamily: "monospace" }}>
                                    {res}
                                  </div>
                                )) || <p style={{ color: "#64748b" }}>None.</p>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            )}

            {/* SCANS TAB */}
            {activeTab === "scans" && (
              <div style={{ backgroundColor: "#ffffff", border: "1px solid rgba(96, 165, 250, 0.18)", borderRadius: "32px", padding: "28px" }}>
                <h2 style={{ fontSize: "18px", color: "#0f172a", marginBottom: "20px" }}>Scan History snapshot</h2>
                {scans.length === 0 ? (
                  <p style={{ color: "#64748b" }}>No scans recorded.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                          <th style={{ padding: "12px 10px" }}>Scan Snapshot ID</th>
                          <th style={{ padding: "12px 10px" }}>Status</th>
                          <th style={{ padding: "12px 10px" }}>Triggered At</th>
                          <th style={{ padding: "12px 10px" }}>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scans.map((s) => (
                          <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "14px 10px", fontWeight: "700" }}>#{s.id}</td>
                            <td style={{ padding: "14px 10px" }}>
                              <span style={{
                                padding: "4px 10px",
                                borderRadius: "999px",
                                fontSize: "11px",
                                fontWeight: "bold",
                                backgroundColor: s.status === "Completed" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                                color: s.status === "Completed" ? "#10B981" : "#EF4444"
                              }}>
                                {s.status}
                              </span>
                            </td>
                            <td style={{ padding: "14px 10px" }}>{new Date(s.started_at).toLocaleString()}</td>
                            <td style={{ padding: "14px 10px", color: "#64748b" }}>
                              {s.duration_seconds ? `${s.duration_seconds}s` : "Under 1s"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* REPORTS TAB */}
            {activeTab === "reports" && (
              <div style={{ backgroundColor: "#ffffff", border: "1px solid rgba(96, 165, 250, 0.18)", borderRadius: "32px", padding: "28px" }}>
                <h2 style={{ fontSize: "18px", color: "#0f172a", marginBottom: "20px" }}>Generated Compliance Reports</h2>
                {scans.filter(s => s.status === "Completed").length === 0 ? (
                  <p style={{ color: "#64748b" }}>Please run at least one completed scan to generate reports.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    {scans.filter(s => s.status === "Completed").map((s) => (
                      <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f8fbff", border: "1px solid rgba(96, 165, 250, 0.2)", padding: "16px 20px", borderRadius: "18px" }}>
                        <div>
                          <h4 style={{ fontSize: "14px", color: "#102a43", margin: "0 0 4px 0", fontWeight: "700" }}>
                            Security Audit Summary - Snapshot #{s.id}
                          </h4>
                          <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                            Compiled: {new Date(s.started_at).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDownloadPDF(s.id)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 16px",
                            backgroundColor: "#ffffff",
                            border: "1px solid rgba(96, 165, 250, 0.25)",
                            borderRadius: "14px",
                            fontSize: "13px",
                            fontWeight: "700",
                            cursor: "pointer"
                          }}
                        >
                          Download PDF Report
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === "settings" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                <div style={{ backgroundColor: "#ffffff", border: "1px solid rgba(96, 165, 250, 0.18)", borderRadius: "32px", padding: "28px" }}>
                  <h2 style={{ fontSize: "18px", color: "#0f172a", marginBottom: "20px" }}>Security Configuration</h2>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div style={{ display: "grid", gap: "6px" }}>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>Profile Name</span>
                      <div style={{ padding: "12px", backgroundColor: "#f8fbff", border: "1px solid rgba(96, 165, 250, 0.2)", borderRadius: "14px", color: "#1e293b", fontWeight: "600" }}>
                        {user?.name || user?.username || user?.email?.split("@")[0]}
                      </div>
                    </div>
                    <div style={{ display: "grid", gap: "6px" }}>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>Associated email</span>
                      <div style={{ padding: "12px", backgroundColor: "#f8fbff", border: "1px solid rgba(96, 165, 250, 0.2)", borderRadius: "14px", color: "#1e293b", fontWeight: "600" }}>
                        {user?.email}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: "#ffffff", border: "1px solid rgba(96, 165, 250, 0.18)", borderRadius: "32px", padding: "28px" }}>
                  <h3 style={{ fontSize: "16px", color: "#0f172a", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Lock size={16} style={{ color: "#10B981" }} /> Symmetrical Credential Encryption
                  </h3>
                  <p style={{ color: "#334e68", lineHeight: "1.6", fontSize: "14px" }}>
                    CloudIntercept uses AES-256 Fernet symmetrical block keys to encrypt and lock your AWS connection credentials at rest.
                  </p>
                </div>
              </div>
            )}
            
          </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
