import React, { useState, useMemo } from "react";
import { ShieldAlert, AlertTriangle, ArrowRight, Server, Globe } from "lucide-react";

export default function ThreatsView({
  findings = [],
  attackPaths = [],
  recommendations = [],
  onSelectResource,
  onNavigateToAttackPath,
  onNavigateToRecommendation,
}) {
  const [severityFilter, setSeverityFilter] = useState("ALL");

  // Derive contextual threat objects from backend findings & attack paths
  const threatsList = useMemo(() => {
    const list = [];

    // Group findings by resource & rule category to formulate threat context
    findings.forEach((f) => {
      let threatTitle = f.title;
      let whyItMatters = f.business_impact || f.description;

      if (f.rule_id.startsWith("EC2")) {
        threatTitle = `Public Compute Exposure: ${f.title}`;
        whyItMatters = "Compute instances reachable directly from the public internet are susceptible to direct port scanning, brute-force SSH/RDP attempts, and unpatched vulnerability exploitation.";
      } else if (f.rule_id.startsWith("S3")) {
        threatTitle = `Storage Data Exposure: ${f.title}`;
        whyItMatters = "Unrestricted S3 bucket access permits unauthorized internet users or arbitrary AWS callers to read, exfiltrate, or delete sensitive data assets.";
      } else if (f.rule_id.startsWith("VPC")) {
        threatTitle = `Perimeter Boundary Deficit: ${f.title}`;
        whyItMatters = "Subnets auto-assigning public IPs or NACLs with open 0.0.0.0/0 rules undermine network isolation boundaries, permitting unmonitored ingress.";
      } else if (f.rule_id.startsWith("IAM")) {
        threatTitle = `Identity & Access Escalation Risk: ${f.title}`;
        whyItMatters = "Over-permissive IAM roles or root account usage allow an attacker who compromises an application to pivot across cloud infrastructure.";
      } else if (f.rule_id.startsWith("SG")) {
        threatTitle = `Unrestricted Inbound Vector: ${f.title}`;
        whyItMatters = "Security groups permitting 0.0.0.0/0 traffic on administrative ports invite immediate automated exploitation.";
      }

      // Find related attack paths
      const relAttackPaths = attackPaths.filter((ap) =>
        ap.affected_resources?.includes(f.resource)
      );

      // Find related recommendations
      const relRecs = recommendations.filter((rec) =>
        rec.affected_resources?.includes(f.resource)
      );

      list.push({
        id: `THREAT-${f.rule_id}-${f.resource}`,
        title: threatTitle,
        severity: f.severity,
        whyItMatters,
        affectedResource: f.resource,
        service: f.service,
        relatedFindings: [f.rule_id],
        relatedAttackPaths: relAttackPaths,
        relatedRecommendations: relRecs,
        evidence: f.evidence || [],
      });
    });

    return list;
  }, [findings, attackPaths, recommendations]);

  const filteredThreats = useMemo(() => {
    if (severityFilter === "ALL") return threatsList;
    return threatsList.filter((t) => t.severity.toUpperCase() === severityFilter.toUpperCase());
  }, [threatsList, severityFilter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header Controls */}
      <div className="console-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldAlert size={18} style={{ color: "var(--severity-critical-text)" }} />
            Active Security Threats ({threatsList.length})
          </h2>
          <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
            Real-time security threats derived from backend configuration discovery and exploit correlation.
          </p>
        </div>

        {/* Severity Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-dim)", fontWeight: "600" }}>Severity:</span>
          <select
            className="console-select"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            style={{ fontSize: "12px" }}
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Only</option>
            <option value="MEDIUM">Medium Only</option>
            <option value="LOW">Low Only</option>
          </select>
        </div>
      </div>

      {/* Threats Grid */}
      {filteredThreats.length === 0 ? (
        <div className="console-panel" style={{ textAlign: "center", padding: "40px" }}>
          <AlertTriangle size={36} style={{ color: "var(--text-dim)", marginBottom: "12px" }} />
          <h3 style={{ fontSize: "15px", color: "var(--text-main)", marginBottom: "4px" }}>
            No security threats matching criteria.
          </h3>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
            No active threat vectors matching the selected severity filter.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "16px" }}>
          {filteredThreats.map((threat) => (
            <div key={threat.id} className="console-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "16px" }}>
              <div>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <span className={`badge-severity ${threat.severity}`}>{threat.severity} THREAT</span>
                  <span style={{ fontSize: "11px", color: "var(--text-dim)", fontWeight: "700", textTransform: "uppercase" }}>
                    {threat.service}
                  </span>
                </div>

                <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-main)", margin: "0 0 8px 0" }}>
                  {threat.title}
                </h3>

                {/* Why It Matters */}
                <div style={{ backgroundColor: "var(--bg-panel)", border: "1px solid var(--border-color)", padding: "10px", borderRadius: "6px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--accent-primary)", textTransform: "uppercase" }}>Why It Matters</span>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0 0", lineHeight: "1.4" }}>
                    {threat.whyItMatters}
                  </p>
                </div>

                {/* Affected Resource */}
                <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                  Affected Resource:{" "}
                  <strong style={{ color: "var(--text-main)", fontFamily: "monospace" }}>
                    {threat.affectedResource}
                  </strong>
                </div>
              </div>

              {/* Actions Footer */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                <button
                  onClick={() => onSelectResource(threat.affectedResource, threat.service)}
                  className="btn-secondary"
                  style={{ fontSize: "11px", padding: "6px 10px" }}
                >
                  <Server size={12} /> View Resource
                </button>

                {threat.relatedAttackPaths.length > 0 && (
                  <button
                    onClick={() => onNavigateToAttackPath(threat.relatedAttackPaths[0].attack_id || threat.relatedAttackPaths[0].id)}
                    className="btn-secondary"
                    style={{ fontSize: "11px", padding: "6px 10px", color: "var(--severity-critical-text)" }}
                  >
                    View Attack Path <ArrowRight size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
