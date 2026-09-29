import React, { useState, useEffect } from "react";
import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import ResourceDetailDrawer from "../../components/ResourceDetailDrawer";
import ResourceMap from "../../components/ResourceMap";

import DashboardOverview from "../../pages/DashboardOverview";
import ServicesView from "../../pages/ServicesView";
import ThreatsView from "../../pages/ThreatsView";
import FindingsExplorer from "../../pages/FindingsExplorer";
import AttackPathsView from "../../pages/AttackPathsView";
import RecommendationsView from "../../pages/RecommendationsView";
import SettingsView from "../../pages/SettingsView";

import { Loader2, Trash2, Server } from "lucide-react";
import "./Dashboard.css";

export default function Dashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);

  // Core backend scan data
  const [dashboardSummary, setDashboardSummary] = useState({});
  const [services, setServices] = useState([]);
  const [serviceInventory, setServiceInventory] = useState([]);
  const [attackPaths, setAttackPaths] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [findings, setFindings] = useState([]);
  const [scans, setScans] = useState([]);
  const [mapNodes, setMapNodes] = useState([]);
  const [mapEdges, setMapEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Cross-navigation selection states
  const [selectedDrawerResource, setSelectedDrawerResource] = useState(null);
  const [selectedDrawerService, setSelectedDrawerService] = useState(null);
  const [targetMapResourceId, setTargetMapResourceId] = useState(null);
  const [targetMapAttackPathId, setTargetMapAttackPathId] = useState(null);

  // AWS Account Connection form state
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

  // User session
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
      setErrorMsg("Failed to connect to backend service.");
    }
  };

  const loadData = async () => {
    if (!selectedAccountId) {
      setDashboardSummary({});
      setServices([]);
      setServiceInventory([]);
      setAttackPaths([]);
      setRecommendations([]);
      setFindings([]);
      setScans([]);
      setMapNodes([]);
      setMapEdges([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const [dashRes, pathRes, recsRes, findingsRes, scansRes, mapRes] = await Promise.all([
        api.get("/dashboard", { params: { aws_account_id: selectedAccountId } }),
        api.get("/attack-paths", { params: { aws_account_id: selectedAccountId } }),
        api.get("/recommendations", { params: { aws_account_id: selectedAccountId } }),
        api.get("/findings", { params: { aws_account_id: selectedAccountId } }),
        api.get("/scans"),
        api.get("/resource-map", { params: { aws_account_id: selectedAccountId } }),
      ]);

      setDashboardSummary(dashRes.data || {});
      setServices(dashRes.data.services || []);
      setServiceInventory(dashRes.data.services || []);
      setAttackPaths(pathRes.data.attack_paths || []);
      setRecommendations(recsRes.data.recommendations || []);
      setFindings(findingsRes.data.findings || []);
      setMapNodes(mapRes.data.nodes || []);
      setMapEdges(mapRes.data.edges || []);

      const filteredScans = (scansRes.data.scans || []).filter(
        (s) => s.aws_account_id === selectedAccountId
      );
      setScans(filteredScans);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load environment security data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedAccountId]);

  const handleAccountChange = (id) => {
    setSelectedAccountId(id);
    sessionStorage.setItem("selectedAccountId", String(id));
    setSelectedDrawerResource(null);
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
    if (!window.confirm("Are you sure you want to disconnect this AWS environment?")) {
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
    setScanProgress(15);
    setScanStage("Connecting to AWS Cloud APIs...");

    const steps = [
      { progress: 35, stage: "Discovering active cloud resources (VPC, EC2, S3, IAM)..." },
      { progress: 65, stage: "Evaluating security rules baseline..." },
      { progress: 85, stage: "Constructing vulnerability attack paths..." },
      { progress: 95, stage: "Generating prioritized remediation advisories..." },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setScanProgress(steps[currentStep].progress);
        setScanStage(steps[currentStep].stage);
        currentStep++;
      }
    }, 1200);

    try {
      await api.post("/scans", { aws_account_id: selectedAccountId });
      clearInterval(interval);
      setScanProgress(100);
      setScanStage("Scan completed successfully!");
      setTimeout(() => {
        setScanning(false);
        loadAccounts();
        loadData();
      }, 800);
    } catch (err) {
      clearInterval(interval);
      setScanning(false);
      alert(err.response?.data?.message || "Scan failed.");
    }
  };

  // Cross-navigation handlers
  const handleOpenResourceDrawer = (resourceId, serviceName) => {
    setSelectedDrawerResource(resourceId);
    setSelectedDrawerService(serviceName || null);
  };

  const handleNavigateToAttackPath = (attackPathId) => {
    setActiveTab("attack-paths");
  };

  const handleNavigateToRecommendation = (recommendationId) => {
    setActiveTab("recommendations");
  };

  const handleNavigateToMap = (targetId) => {
    if (typeof targetId === "string" && (targetId.startsWith("AP") || targetId.startsWith("ATTACK"))) {
      setTargetMapAttackPathId(targetId);
      setTargetMapResourceId(null);
    } else if (targetId) {
      setTargetMapResourceId(targetId);
      setTargetMapAttackPathId(null);
    }
    setActiveTab("resource-map");
  };

  const activeAccount = accounts.find((a) => a.id === selectedAccountId);
  const activeLastScanTime = activeAccount?.last_scan_time;
  const activeScanStatus = scanning ? "Running" : (activeAccount?.last_scan_status || "Never Scanned");

  return (
    <div className="dashboard-shell">
      {/* Navigation Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />

      {/* Main Workspace Area */}
      <main className="dashboard-main">
        
        {/* Top Header */}
        <Navbar
          activeTab={activeTab}
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          onAccountChange={handleAccountChange}
          activeScanStatus={activeScanStatus}
          scanning={scanning}
          onRunScan={handleRunScan}
          onLogout={onLogout}
        />

        {/* Global Scan Execution Overlay Bar */}
        {scanning && (
          <div className="console-panel" style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--accent-primary)" }}>{scanStage}</span>
              <span style={{ fontSize: "13px", fontWeight: "800", color: "var(--text-main)" }}>{scanProgress}%</span>
            </div>
            <div style={{ width: "100%", height: "6px", backgroundColor: "var(--bg-input)", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ width: `${scanProgress}%`, height: "100%", backgroundColor: "var(--accent-primary)", borderRadius: "3px", transition: "width 0.3s ease" }}></div>
            </div>
          </div>
        )}

        {/* Empty state when no AWS account is linked */}
        {!selectedAccountId && activeTab !== "accounts" ? (
          <div className="console-panel" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, textAlign: "center", padding: "60px" }}>
            <Server size={44} style={{ color: "var(--text-dim)", marginBottom: "16px" }} />
            <h2 style={{ color: "var(--text-main)", marginBottom: "8px", fontSize: "18px" }}>No AWS Environment Connected</h2>
            <p style={{ color: "var(--text-muted)", maxWidth: "450px", marginBottom: "20px", fontSize: "13px" }}>
              To start cloud security scans and evaluate attack pathways, connect your AWS environment credentials.
            </p>
            <button onClick={() => setActiveTab("accounts")} className="btn-primary">
              Connect AWS Account
            </button>
          </div>
        ) : loading && selectedAccountId ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1, color: "var(--text-muted)" }}>
            <Loader2 size={24} className="animate-spin" style={{ marginRight: "10px" }} />
            <span>Loading environment security baseline...</span>
          </div>
        ) : errorMsg ? (
          <div className="console-panel" style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ color: "var(--severity-critical-text)", fontSize: "14px", fontWeight: "700", margin: "0 0 12px 0" }}>
              {errorMsg}
            </p>
            <button onClick={loadData} className="btn-secondary" style={{ fontSize: "12px" }}>
              Retry Loading Data
            </button>
          </div>
        ) : (
          <>
            {/* View Switcher */}
            {activeTab === "dashboard" && (
              <DashboardOverview
                findings={findings}
                nodes={mapNodes}
                attackPaths={attackPaths}
                recommendations={recommendations}
                services={services}
                summary={dashboardSummary}
                lastScanTime={activeLastScanTime}
                onNavigateTab={setActiveTab}
                onSelectResource={handleOpenResourceDrawer}
                onNavigateToAttackPath={handleNavigateToAttackPath}
                onNavigateToRecommendation={handleNavigateToRecommendation}
              />
            )}

            {activeTab === "services" && (
              <ServicesView
                serviceInventory={serviceInventory}
                findings={findings}
                nodes={mapNodes}
                attackPaths={attackPaths}
                recommendations={recommendations}
                onSelectResource={handleOpenResourceDrawer}
              />
            )}

            {activeTab === "threats" && (
              <ThreatsView
                findings={findings}
                attackPaths={attackPaths}
                recommendations={recommendations}
                onSelectResource={handleOpenResourceDrawer}
                onNavigateToAttackPath={handleNavigateToAttackPath}
                onNavigateToRecommendation={handleNavigateToRecommendation}
              />
            )}

            {activeTab === "findings" && (
              <FindingsExplorer
                findings={findings}
                onSelectResource={handleOpenResourceDrawer}
                onNavigateToAttackPath={handleNavigateToAttackPath}
                onNavigateToRecommendation={handleNavigateToRecommendation}
              />
            )}

            {activeTab === "attack-paths" && (
              <AttackPathsView
                attackPaths={attackPaths}
                onSelectResource={handleOpenResourceDrawer}
                onNavigateToMap={handleNavigateToMap}
              />
            )}

            {activeTab === "recommendations" && (
              <RecommendationsView
                recommendations={recommendations}
                onSelectResource={handleOpenResourceDrawer}
                onNavigateToAttackPath={handleNavigateToAttackPath}
              />
            )}

            {activeTab === "resource-map" && (
              <div className="console-panel" style={{ padding: "16px" }}>
                <ResourceMap
                  nodes={mapNodes}
                  edges={mapEdges}
                  findings={findings}
                  attackPaths={attackPaths}
                  recommendations={recommendations}
                  initialSelectedResourceId={targetMapResourceId}
                  initialSelectedAttackPathId={targetMapAttackPathId}
                  onSelectResourceDetails={handleOpenResourceDrawer}
                />
              </div>
            )}

            {activeTab === "scans" && (
              <div className="console-panel">
                <h2 style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-main)", marginBottom: "16px" }}>
                  Scan History Logs
                </h2>
                {scans.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>No scan history recorded.</p>
                ) : (
                  <table className="console-table">
                    <thead>
                      <tr>
                        <th>Snapshot ID</th>
                        <th>Status</th>
                        <th>Started At</th>
                        <th>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scans.map((s) => (
                        <tr key={s.id}>
                          <td style={{ fontFamily: "monospace", fontWeight: "700" }}>#{s.id}</td>
                          <td>
                            <span className={`badge-severity ${s.status === "Completed" ? "low" : "critical"}`}>
                              {s.status}
                            </span>
                          </td>
                          <td style={{ color: "var(--text-muted)" }}>{new Date(s.started_at).toLocaleString()}</td>
                          <td style={{ color: "var(--text-dim)" }}>{s.duration ? `${s.duration}s` : "< 1s"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === "accounts" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
                <div className="console-panel">
                  <h2 style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-main)", marginBottom: "16px" }}>
                    Connected AWS Environments
                  </h2>
                  {accounts.length === 0 ? (
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>No AWS accounts connected.</p>
                  ) : (
                    <table className="console-table">
                      <thead>
                        <tr>
                          <th>Connection Name</th>
                          <th>Account ID</th>
                          <th>Region</th>
                          <th>Last Scan</th>
                          <th>Status</th>
                          <th style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accounts.map((acc) => (
                          <tr key={acc.id}>
                            <td style={{ fontWeight: "700" }}>{acc.account_name}</td>
                            <td style={{ fontFamily: "monospace" }}>{acc.aws_account_id}</td>
                            <td>{acc.region}</td>
                            <td style={{ color: "var(--text-muted)" }}>
                              {acc.last_scan_time ? new Date(acc.last_scan_time).toLocaleString() : "Never"}
                            </td>
                            <td>
                              <span className={`badge-severity ${acc.last_scan_status === "Completed" ? "low" : "critical"}`}>
                                {acc.last_scan_status}
                              </span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button
                                onClick={() => handleDeleteAccount(acc.id)}
                                style={{ background: "transparent", border: "none", color: "var(--severity-critical-text)", cursor: "pointer" }}
                                title="Disconnect Environment"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="console-panel">
                  <h2 style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-main)", marginBottom: "16px" }}>
                    Connect New AWS Account
                  </h2>
                  {formMessage && (
                    <div style={{ padding: "8px 12px", borderRadius: "6px", fontSize: "12px", marginBottom: "16px", backgroundColor: formMessage.includes("successfully") ? "var(--severity-low-bg)" : "var(--severity-critical-bg)", color: formMessage.includes("successfully") ? "var(--severity-low-text)" : "var(--severity-critical-text)", fontWeight: "600" }}>
                      {formMessage}
                    </div>
                  )}

                  <form onSubmit={handleConnectAccount} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div style={{ display: "grid", gap: "4px" }}>
                      <label style={{ fontSize: "12px", color: "var(--text-dim)", fontWeight: "600" }}>Connection Name</label>
                      <input
                        className="console-input"
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="Production Workloads"
                        required
                      />
                    </div>
                    <div style={{ display: "grid", gap: "4px" }}>
                      <label style={{ fontSize: "12px", color: "var(--text-dim)", fontWeight: "600" }}>AWS Region</label>
                      <select className="console-select" value={region} onChange={(e) => setRegion(e.target.value)}>
                        <option value="us-east-1">us-east-1</option>
                        <option value="us-east-2">us-east-2</option>
                        <option value="us-west-1">us-west-1</option>
                        <option value="us-west-2">us-west-2</option>
                        <option value="eu-central-1">eu-central-1</option>
                        <option value="eu-west-1">eu-west-1</option>
                        <option value="ap-south-1">ap-south-1</option>
                      </select>
                    </div>
                    <div style={{ display: "grid", gap: "4px" }}>
                      <label style={{ fontSize: "12px", color: "var(--text-dim)", fontWeight: "600" }}>AWS Access Key ID</label>
                      <input
                        className="console-input"
                        type="text"
                        value={accessKey}
                        onChange={(e) => setAccessKey(e.target.value)}
                        placeholder="AKIA..."
                        required
                      />
                    </div>
                    <div style={{ display: "grid", gap: "4px" }}>
                      <label style={{ fontSize: "12px", color: "var(--text-dim)", fontWeight: "600" }}>AWS Secret Access Key</label>
                      <input
                        className="console-input"
                        type="password"
                        value={secretKey}
                        onChange={(e) => setSecretKey(e.target.value)}
                        placeholder="••••••••••••••••••••"
                        required
                      />
                    </div>
                    <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                      <button type="submit" disabled={formLoading} className="btn-primary">
                        {formLoading ? "Validating..." : "Connect AWS Account"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === "settings" && <SettingsView user={user} accounts={accounts} />}
          </>
        )}

        {/* Global Resource Details Drawer */}
        {selectedDrawerResource && (
          <ResourceDetailDrawer
            resourceId={selectedDrawerResource}
            serviceName={selectedDrawerService}
            findings={findings}
            attackPaths={attackPaths}
            recommendations={recommendations}
            nodes={mapNodes}
            onClose={() => setSelectedDrawerResource(null)}
            onNavigateToAttackPath={handleNavigateToAttackPath}
            onNavigateToRecommendation={handleNavigateToRecommendation}
            onNavigateToMap={handleNavigateToMap}
          />
        )}
      </main>
    </div>
  );
}
