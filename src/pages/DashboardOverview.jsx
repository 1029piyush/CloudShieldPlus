import React, { useMemo } from "react";
import {
  ShieldAlert,
  Server,
  TrendingUp,
  BookmarkCheck,
  Layers,
  Clock,
  ArrowRight,
} from "lucide-react";

export default function DashboardOverview({
  findings = [],
  nodes = [],
  attackPaths = [],
  recommendations = [],
  services = [],
  summary = {},
  lastScanTime = null,
  onNavigateTab,
  onSelectResource,
  onNavigateToAttackPath,
  onNavigateToRecommendation,
}) {
  // Calculate top-level security operations metrics
  const activeThreatsCount = summary.active_threats ?? summary.activeThreats ?? findings.length;
  const affectedResourcesCount = useMemo(() => {
    if (summary.affected_resources != null) return summary.affected_resources;
    if (summary.affectedResources != null) return summary.affectedResources;
    const set = new Set(findings.map((f) => f.resource));
    return set.size;
  }, [findings, summary]);
  const attackPathsCount = summary.attack_paths ?? summary.attackPaths ?? attackPaths.length;
  const recommendationsCount = summary.recommendations ?? recommendations.length;
  const servicesAnalyzedCount = summary.services_analyzed ?? summary.servicesAnalyzed ?? (services.length > 0 ? services.length : new Set(findings.map(f => f.service)).size);

  // Format last scan time
  const lastScanLabel = lastScanTime
    ? new Date(lastScanTime).toLocaleString()
    : "Never Scanned";

  // Top unresolved active threats (Critical & High)
  const topThreats = useMemo(() => {
    const sorted = [...findings].sort((a, b) => {
      const weight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      return (weight[b.severity] || 0) - (weight[a.severity] || 0);
    });
    return sorted.slice(0, 4);
  }, [findings]);

  // Top recommendations (limit to 4)
  const topRecommendations = useMemo(() => {
    return recommendations.slice(0, 4);
  }, [recommendations]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 6 Top-Level Operational Metrics Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
        }}
      >
        <div className="console-panel" style={{ padding: "16px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--severity-critical-text)", textTransform: "uppercase" }}>
            Active Threats
          </span>
          <h2 style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-main)", margin: "4px 0 0 0" }}>
            {activeThreatsCount}
          </h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--text-dim)" }}>
            Verified Security Findings
          </p>
        </div>

        <div className="console-panel" style={{ padding: "16px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--severity-high-text)", textTransform: "uppercase" }}>
            Affected Resources
          </span>
          <h2 style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-main)", margin: "4px 0 0 0" }}>
            {affectedResourcesCount}
          </h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--text-dim)" }}>
            Discovered Cloud Assets
          </p>
        </div>

        <div className="console-panel" style={{ padding: "16px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--accent-primary)", textTransform: "uppercase" }}>
            Attack Paths
          </span>
          <h2 style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-main)", margin: "4px 0 0 0" }}>
            {attackPathsCount}
          </h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--text-dim)" }}>
            Correlated Exploit Chains
          </p>
        </div>

        <div className="console-panel" style={{ padding: "16px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--severity-low-text)", textTransform: "uppercase" }}>
            Recommendations
          </span>
          <h2 style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-main)", margin: "4px 0 0 0" }}>
            {recommendationsCount}
          </h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--text-dim)" }}>
            Actionable Mitigations
          </p>
        </div>

        <div className="console-panel" style={{ padding: "16px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Services Analyzed
          </span>
          <h2 style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-main)", margin: "4px 0 0 0" }}>
            {servicesAnalyzedCount}
          </h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--text-dim)" }}>
            Discovered AWS Services
          </p>
        </div>

        <div className="console-panel" style={{ padding: "16px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Last Scan
          </span>
          <h4 style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-main)", margin: "8px 0 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {lastScanLabel}
          </h4>
          <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--text-dim)" }}>
            AWS Audit Timestamp
          </p>
        </div>
      </div>

      {/* Main Grid: Active Threats & Recommended Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* ACTIVE THREATS PANEL */}
        <div className="console-panel" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "800", color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
              <ShieldAlert size={16} style={{ color: "var(--severity-critical-text)" }} />
              ACTIVE THREATS
            </h3>
            <button
              onClick={() => onNavigateTab("threats")}
              className="btn-secondary"
              style={{ fontSize: "11px", padding: "4px 10px" }}
            >
              View All ({findings.length})
            </button>
          </div>

          {topThreats.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
              ✓ No active threats detected in environment.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {topThreats.map((t) => {
                const relAp = attackPaths.find((ap) => ap.affected_resources?.includes(t.resource));
                return (
                  <div
                    key={t.id || `${t.rule_id}-${t.resource}`}
                    style={{
                      backgroundColor: "var(--bg-card)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "6px",
                      padding: "12px",
                      display: "flex",
                      justify: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <span className={`badge-severity ${t.severity}`}>{t.severity}</span>
                        <span style={{ fontSize: "11px", color: "var(--text-dim)", fontFamily: "monospace" }}>{t.rule_id}</span>
                      </div>
                      <h4 style={{ fontSize: "13px", color: "var(--text-main)", margin: "0 0 2px 0", fontWeight: "600" }}>
                        {t.title}
                      </h4>
                      <p style={{ margin: 0, fontSize: "11px", color: "var(--text-dim)", fontFamily: "monospace" }}>
                        Resource: {t.resource}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => onSelectResource(t.resource, t.service)}
                        className="btn-secondary"
                        style={{ fontSize: "11px", padding: "4px 8px" }}
                      >
                        [View Resource]
                      </button>
                      {relAp && (
                        <button
                          onClick={() => onNavigateToAttackPath(relAp.attack_id || relAp.id)}
                          className="btn-secondary"
                          style={{ fontSize: "11px", padding: "4px 8px", color: "var(--severity-critical-text)" }}
                        >
                          [View Attack Path]
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* TOP RECOMMENDATIONS PANEL */}
        <div className="console-panel" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "800", color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
              <BookmarkCheck size={16} style={{ color: "var(--severity-low-text)" }} />
              RECOMMENDED ACTIONS
            </h3>
            <button
              onClick={() => onNavigateTab("recommendations")}
              className="btn-secondary"
              style={{ fontSize: "11px", padding: "4px 10px" }}
            >
              View All ({recommendations.length})
            </button>
          </div>

          {topRecommendations.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
              No active recommendations generated.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {topRecommendations.map((rec) => (
                <div
                  key={rec.recommendation_id || rec.id}
                  style={{
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "6px",
                    padding: "12px",
                    display: "flex",
                    justify: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--accent-primary)", uppercase: "true" }}>
                      Priority: {rec.priority} | {rec.category}
                    </span>
                    <h4 style={{ fontSize: "13px", color: "var(--text-main)", margin: "2px 0 2px 0", fontWeight: "600" }}>
                      {rec.title}
                    </h4>
                    <p style={{ margin: 0, fontSize: "11px", color: "var(--text-dim)", fontFamily: "monospace" }}>
                      Affected: {rec.affected_resources?.[0] || "Multiple Workloads"}
                    </p>
                  </div>

                  <button
                    onClick={() => onNavigateToRecommendation(rec.recommendation_id || rec.id)}
                    className="btn-secondary"
                    style={{ fontSize: "11px", padding: "4px 10px" }}
                  >
                    Inspect
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
