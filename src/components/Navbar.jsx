import React from "react";
import { Play, Loader2, LogOut, Globe } from "lucide-react";

export default function Navbar({
  activeTab,
  accounts = [],
  selectedAccountId,
  onAccountChange,
  activeScanStatus,
  scanning,
  onRunScan,
  onLogout,
}) {
  const activeAccount = accounts.find((a) => a.id === selectedAccountId);

  const getTabTitle = (tab) => {
    switch (tab) {
      case "dashboard":
        return "Security Operations Overview";
      case "services":
        return "AWS Services & Resource Security";
      case "threats":
        return "Active Security Threats";
      case "attack-paths":
        return "Correlated Attack Pathways";
      case "recommendations":
        return "Actionable Remediation Advisories";
      case "findings":
        return "Security Findings Explorer";
      case "resource-map":
        return "Security Resource & Topology Map";
      case "scans":
        return "Scan Execution History";
      case "accounts":
        return "Connected AWS Environments";
      case "settings":
        return "Console Settings & Architecture";
      default:
        return "SecOps Console";
    }
  };

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: "18px",
        marginBottom: "24px",
        borderBottom: "1px solid var(--border-color)",
        flexWrap: "wrap",
        gap: "16px",
      }}
    >
      <div>
        <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--accent-primary)", letterSpacing: "0.08em", marginBottom: "4px" }}>
          CloudIntercept Console
        </p>
        <h1 style={{ fontSize: "22px", fontWeight: "800", color: "var(--text-main)", margin: 0, letterSpacing: "-0.02em" }}>
          {getTabTitle(activeTab)}
        </h1>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        {/* Account Selector */}
        {accounts.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-dim)", fontWeight: "600" }}>Account:</span>
            <select
              className="console-select"
              value={selectedAccountId || ""}
              onChange={(e) => onAccountChange(Number(e.target.value))}
              style={{ fontWeight: "600" }}
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_name} ({acc.aws_account_id})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Region Indicator */}
        {activeAccount && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              padding: "6px 10px",
              borderRadius: "6px",
              fontSize: "12px",
              color: "var(--text-muted)",
              fontWeight: "600",
            }}
          >
            <Globe size={13} style={{ color: "var(--accent-primary)" }} />
            {activeAccount.region}
          </div>
        )}

        {/* Scan Status Badge */}
        {selectedAccountId && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                backgroundColor:
                  activeScanStatus === "Completed"
                    ? "#10B981"
                    : activeScanStatus === "Failed"
                    ? "#EF4444"
                    : scanning
                    ? "#38BDF8"
                    : "#94A3B8",
                display: "inline-block",
              }}
            ></span>
            <span style={{ color: "var(--text-muted)" }}>
              {scanning ? "Scan in Progress..." : activeScanStatus}
            </span>
          </div>
        )}

        {/* Run Scan Button */}
        {selectedAccountId && (
          <button
            onClick={onRunScan}
            disabled={scanning}
            className="btn-primary"
            style={{ opacity: scanning ? 0.7 : 1 }}
          >
            {scanning ? <Loader2 size={14} className="animate-spin" /> : <Play size={12} fill="white" />}
            Run Scan
          </button>
        )}

        {/* Sign Out Button */}
        <button onClick={onLogout} className="btn-secondary" title="Sign out of console">
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </header>
  );
}
