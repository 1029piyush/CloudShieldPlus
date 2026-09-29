import React, { useState } from "react";
import {
  X,
  ShieldAlert,
  AlertTriangle,
  TrendingUp,
  BookmarkCheck,
  ChevronDown,
  ChevronRight,
  Code,
  Network,
  Globe,
  Lock,
  ArrowRight,
} from "lucide-react";

export default function ResourceDetailDrawer({
  resourceId,
  serviceName,
  findings = [],
  attackPaths = [],
  recommendations = [],
  nodes = [],
  onClose,
  onNavigateToAttackPath,
  onNavigateToRecommendation,
  onNavigateToMap,
}) {
  const [evidenceExpanded, setEvidenceExpanded] = useState(false);

  if (!resourceId) return null;

  // Find node metadata from resource map data if available
  const node = nodes.find(
    (n) => n.name === resourceId || n.node_id === resourceId
  );

  // Filter findings for this resource
  const resourceFindings = findings.filter(
    (f) => f.resource === resourceId || (node && node.related_findings?.includes(f.rule_id))
  );

  // Filter attack paths affecting this resource
  const resourceAttackPaths = attackPaths.filter(
    (ap) =>
      ap.affected_resources?.includes(resourceId) ||
      (node && ap.affected_resources?.includes(node.name))
  );

  // Filter recommendations affecting this resource
  const resourceRecommendations = recommendations.filter(
    (rec) =>
      rec.affected_resources?.includes(resourceId) ||
      (node && rec.affected_resources?.includes(node.name))
  );

  // Extract all evidence lines from findings
  const allEvidence = resourceFindings.flatMap((f) => f.evidence || []);

  // Determine highest severity
  const hasCritical = resourceFindings.some((f) => f.severity === "Critical");
  const hasHigh = resourceFindings.some((f) => f.severity === "High");
  const hasMedium = resourceFindings.some((f) => f.severity === "Medium");

  const resourceSeverity = hasCritical
    ? "Critical"
    : hasHigh
    ? "High"
    : hasMedium
    ? "Medium"
    : "Low";

  // Derive contextual threat statements from findings
  const threatsList = resourceFindings.map((f) => {
    if (f.rule_id.startsWith("EC2")) return `Publicly accessible compute instance vulnerability (${f.title})`;
    if (f.rule_id.startsWith("S3")) return `Object storage bucket exposure risk (${f.title})`;
    if (f.rule_id.startsWith("VPC")) return `Network perimeter security deficit (${f.title})`;
    if (f.rule_id.startsWith("IAM")) return `Excessive privilege exploitation risk (${f.title})`;
    if (f.rule_id.startsWith("SG")) return `Unrestricted inbound network vector (${f.title})`;
    return `Security context warning: ${f.title}`;
  });

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span className={`badge-severity ${resourceSeverity}`}>
                {resourceSeverity}
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-dim)", fontWeight: "700", textTransform: "uppercase" }}>
                {serviceName || node?.service || "AWS Resource"}
              </span>
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-main)", margin: 0, fontFamily: "monospace" }}>
              {resourceId}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Toolbar */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => onNavigateToMap && onNavigateToMap(resourceId)}
            className="btn-secondary"
            style={{ fontSize: "12px", padding: "6px 12px" }}
          >
            <Network size={14} /> View on Resource Map
          </button>
        </div>

        {/* 1. RESOURCE METADATA */}
        <section className="console-card">
          <h3 style={{ fontSize: "13px", fontWeight: "700", color: "var(--accent-primary)", uppercase: "true", letterSpacing: "0.05em", marginBottom: "12px" }}>
            RESOURCE SPECIFICATIONS
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px" }}>
            <div>
              <span style={{ color: "var(--text-dim)" }}>Resource ID:</span>
              <p style={{ margin: "2px 0 0 0", color: "var(--text-main)", fontWeight: "600", fontFamily: "monospace" }}>
                {resourceId}
              </p>
            </div>
            <div>
              <span style={{ color: "var(--text-dim)" }}>Service:</span>
              <p style={{ margin: "2px 0 0 0", color: "var(--text-main)", fontWeight: "600" }}>
                {serviceName || node?.service || "AWS"}
              </p>
            </div>
            <div>
              <span style={{ color: "var(--text-dim)" }}>Region:</span>
              <p style={{ margin: "2px 0 0 0", color: "var(--text-main)", fontWeight: "600" }}>
                {node?.region || "us-east-1"}
              </p>
            </div>
            <div>
              <span style={{ color: "var(--text-dim)" }}>Network Exposure:</span>
              <p style={{ margin: "2px 0 0 0", color: node?.exposure === "public" ? "var(--severity-critical-text)" : "var(--severity-low-text)", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                {node?.exposure === "public" ? <Globe size={12} /> : <Lock size={12} />}
                {(node?.exposure || (hasCritical ? "Public" : "Private")).toUpperCase()}
              </p>
            </div>
          </div>
        </section>

        {/* 2. SECURITY FINDINGS */}
        <section className="console-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
              <ShieldAlert size={15} style={{ color: "var(--severity-critical-text)" }} />
              Security Findings ({resourceFindings.length})
            </h3>
          </div>

          {resourceFindings.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
              ✓ No security findings detected for this resource.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {resourceFindings.map((f) => (
                <div
                  key={f.id || f.rule_id}
                  style={{
                    backgroundColor: "var(--bg-panel)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "6px",
                    padding: "12px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: "700", color: "var(--accent-primary)" }}>
                      {f.rule_id}
                    </span>
                    <span className={`badge-severity ${f.severity}`}>{f.severity}</span>
                  </div>
                  <h4 style={{ fontSize: "13px", color: "var(--text-main)", margin: "0 0 4px 0", fontWeight: "600" }}>
                    {f.title}
                  </h4>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, lineHeight: "1.4" }}>
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3. THREATS */}
        <section className="console-card">
          <h3 style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-main)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
            <AlertTriangle size={15} style={{ color: "var(--severity-high-text)" }} />
            Contextual Threat Impact
          </h3>

          {threatsList.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
              No active threat exposure context.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {threatsList.map((t, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "rgba(249, 115, 22, 0.08)",
                    borderLeft: "3px solid var(--severity-high-border)",
                    fontSize: "12px",
                    color: "var(--text-main)",
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 4. ATTACK PATHS */}
        <section className="console-card">
          <h3 style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-main)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
            <TrendingUp size={15} style={{ color: "var(--severity-critical-text)" }} />
            Participating Attack Paths ({resourceAttackPaths.length})
          </h3>

          {resourceAttackPaths.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
              No evidence-backed attack paths identified.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {resourceAttackPaths.map((ap) => (
                <div
                  key={ap.attack_id || ap.id}
                  style={{
                    backgroundColor: "var(--bg-panel)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "6px",
                    padding: "12px",
                    display: "flex",
                    justify: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--severity-critical-text)", textTransform: "uppercase" }}>
                      {ap.attack_id} | {ap.risk} Risk
                    </span>
                    <h4 style={{ fontSize: "13px", color: "var(--text-main)", margin: "2px 0 0 0" }}>
                      {ap.title}
                    </h4>
                  </div>
                  <button
                    onClick={() => onNavigateToAttackPath && onNavigateToAttackPath(ap.attack_id || ap.id)}
                    className="btn-secondary"
                    style={{ fontSize: "11px", padding: "4px 10px" }}
                  >
                    View Attack Path <ArrowRight size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 5. RECOMMENDATIONS */}
        <section className="console-card">
          <h3 style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-main)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
            <BookmarkCheck size={15} style={{ color: "var(--severity-low-text)" }} />
            Remediation Recommendations ({resourceRecommendations.length})
          </h3>

          {resourceRecommendations.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
              No remediation recommendations generated.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {resourceRecommendations.map((rec) => (
                <div
                  key={rec.recommendation_id || rec.id}
                  style={{
                    backgroundColor: "var(--bg-panel)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "6px",
                    padding: "12px",
                    display: "flex",
                    justify: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--accent-primary)" }}>
                      {rec.category} | Priority: {rec.priority}
                    </span>
                    <h4 style={{ fontSize: "13px", color: "var(--text-main)", margin: "2px 0 0 0" }}>
                      {rec.title}
                    </h4>
                  </div>
                  <button
                    onClick={() => onNavigateToRecommendation && onNavigateToRecommendation(rec.recommendation_id || rec.id)}
                    className="btn-secondary"
                    style={{ fontSize: "11px", padding: "4px 10px" }}
                  >
                    View Action <ArrowRight size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 6. AWS EVIDENCE DISCLOSURE */}
        <section className="console-card">
          <button
            onClick={() => setEvidenceExpanded(!evidenceExpanded)}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              color: "var(--text-main)",
              display: "flex",
              justify: "space-between",
              alignItems: "center",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
              <Code size={15} style={{ color: "var(--accent-primary)" }} />
              AWS API Evidence ({allEvidence.length} statements)
            </span>
            {evidenceExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {evidenceExpanded && (
            <div
              style={{
                marginTop: "12px",
                backgroundColor: "#020617",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                padding: "12px",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "12px",
                color: "#38BDF8",
                maxHeight: "220px",
                overflowY: "auto",
              }}
            >
              {allEvidence.length === 0 ? (
                <span style={{ color: "var(--text-dim)" }}>No raw evidence lines recorded.</span>
              ) : (
                allEvidence.map((ev, i) => (
                  <div key={i} style={{ marginBottom: "4px" }}>
                    <span style={{ color: "var(--text-dim)" }}>[{i + 1}]</span> {ev}
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
