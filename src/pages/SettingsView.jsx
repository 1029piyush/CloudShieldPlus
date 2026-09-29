import React from "react";
import { User, Server, ShieldCheck, Info } from "lucide-react";

export default function SettingsView({ user, accounts = [] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* User Profile Panel */}
      <div className="console-panel">
        <h3 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-main)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
          <User size={16} style={{ color: "var(--accent-primary)" }} /> User Profile & Session
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "13px" }}>
          <div>
            <span style={{ color: "var(--text-dim)", fontSize: "11px" }}>Identity Name</span>
            <p style={{ margin: "2px 0 0 0", color: "var(--text-main)", fontWeight: "600" }}>
              {user?.name || user?.username || user?.email?.split("@")[0] || "Operator"}
            </p>
          </div>
          <div>
            <span style={{ color: "var(--text-dim)", fontSize: "11px" }}>Email Identity</span>
            <p style={{ margin: "2px 0 0 0", color: "var(--text-main)", fontWeight: "600" }}>
              {user?.email || "operator@cloudintercept.local"}
            </p>
          </div>
        </div>
      </div>

      {/* Connected AWS Environments Overview */}
      <div className="console-panel">
        <h3 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-main)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
          <Server size={16} style={{ color: "var(--accent-primary)" }} /> Connected AWS Environments ({accounts.length})
        </h3>
        {accounts.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
            No AWS accounts linked to this user profile.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {accounts.map((acc) => (
              <div
                key={acc.id}
                style={{
                  display: "flex",
                  justify: "space-between",
                  alignItems: "center",
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              >
                <div>
                  <strong style={{ color: "var(--text-main)" }}>{acc.account_name}</strong>
                  <span style={{ color: "var(--text-dim)", marginLeft: "8px", fontFamily: "monospace" }}>({acc.aws_account_id})</span>
                </div>
                <span style={{ color: "var(--text-muted)" }}>Region: {acc.region}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Console Architecture Info */}
      <div className="console-panel">
        <h3 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-main)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
          <Info size={16} style={{ color: "var(--accent-primary)" }} /> Console Information & Version
        </h3>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "6px" }}>
          <div>Platform Version: <strong style={{ color: "var(--text-main)" }}>CloudIntercept v2.0 SecOps Console</strong></div>
          <div>Security Engine Architecture: <strong style={{ color: "var(--text-main)" }}>Evidence-First Graph Analysis Engine</strong></div>
          <div>Environment Protection Status: <strong style={{ color: "var(--severity-low-text)" }}>Active Monitoring</strong></div>
        </div>
      </div>
    </div>
  );
}
