import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "@/context/DashboardContext";
import { Search, Filter, ShieldAlert, ArrowRight, Code, Server, X } from "lucide-react";

export default function FindingsExplorer() {
  useEffect(() => { document.title = "CloudShieldPlus | Findings"; }, []);
  const navigate = useNavigate();
  const { findings = [], handleOpenResourceDrawer: onSelectResource } = useDashboard();
  const onNavigateToAttackPath = () => navigate("/attack-paths");
  const onNavigateToRecommendation = () => navigate("/recommendations");
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [selectedFinding, setSelectedFinding] = useState(null);

  // Derive unique services for dropdown
  const uniqueServices = useMemo(() => {
    const set = new Set(findings.map((f) => (f.service || "AWS").toUpperCase()));
    return Array.from(set).sort();
  }, [findings]);

  // Filter findings
  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      const matchesSearch =
        f.rule_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.resource.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesService =
        serviceFilter === "ALL" || (f.service || "").toUpperCase() === serviceFilter.toUpperCase();

      const matchesSeverity =
        severityFilter === "ALL" || (f.severity || "").toUpperCase() === severityFilter.toUpperCase();

      return matchesSearch && matchesService && matchesSeverity;
    });
  }, [findings, searchTerm, serviceFilter, severityFilter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Search & Filter Toolbar */}
      <div className="console-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <Search size={18} style={{ color: "var(--accent-primary)" }} />
            Security Findings Explorer ({filteredFindings.length} of {findings.length})
          </h2>
          <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
            Inspect verified AWS security rule violations and evidence-backed security checks.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Search Box */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "var(--bg-input)", border: "1px solid var(--border-color)", padding: "6px 12px", borderRadius: "6px" }}>
            <Search size={14} style={{ color: "var(--text-dim)" }} />
            <input
              type="text"
              placeholder="Search rule ID, title, resource..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: "none", background: "transparent", outline: "none", color: "var(--text-main)", fontSize: "12px", width: "180px" }}
            />
          </div>

          {/* Service Filter */}
          <select
            className="console-select"
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            style={{ fontSize: "12px" }}
          >
            <option value="ALL">All Services</option>
            {uniqueServices.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Severity Filter */}
          <select
            className="console-select"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            style={{ fontSize: "12px" }}
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Findings List Table */}
      <div className="console-panel" style={{ padding: 0, overflow: "hidden" }}>
        {filteredFindings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <ShieldAlert size={36} style={{ color: "var(--text-dim)", marginBottom: "12px" }} />
            <h3 style={{ fontSize: "15px", color: "var(--text-main)", marginBottom: "4px" }}>
              No findings match your search.
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
              Try clearing your filters or running a fresh environment scan.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="console-table">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Rule ID</th>
                  <th>Finding Title</th>
                  <th>Service</th>
                  <th>Affected Resource</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFindings.map((f) => (
                  <tr key={f.id || `${f.rule_id}-${f.resource}`}>
                    <td>
                      <span className={`badge-severity ${f.severity}`}>{f.severity}</span>
                    </td>
                    <td style={{ fontFamily: "monospace", fontWeight: "700", color: "var(--accent-primary)" }}>
                      {f.rule_id}
                    </td>
                    <td style={{ fontWeight: "600" }}>{f.title}</td>
                    <td>{f.service}</td>
                    <td style={{ fontFamily: "monospace", color: "var(--text-muted)" }}>{f.resource}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        onClick={() => setSelectedFinding(f)}
                        className="btn-secondary"
                        style={{ fontSize: "11px", padding: "4px 10px" }}
                      >
                        Inspect Finding
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Finding Detail Drawer */}
      {selectedFinding && (
        <div className="drawer-overlay" onClick={() => setSelectedFinding(null)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span className={`badge-severity ${selectedFinding.severity}`}>{selectedFinding.severity}</span>
                  <span style={{ fontFamily: "monospace", fontSize: "12px", color: "var(--accent-primary)", fontWeight: "700" }}>
                    {selectedFinding.rule_id}
                  </span>
                </div>
                <h2 style={{ fontSize: "17px", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>
                  {selectedFinding.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedFinding(null)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Finding Description */}
            <div className="console-card">
              <h3 style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-dim)", textTransform: "uppercase", marginBottom: "6px" }}>
                Description
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-main)", margin: 0, lineHeight: "1.5" }}>
                {selectedFinding.description}
              </p>
            </div>

            {/* Business Impact */}
            <div className="console-card">
              <h3 style={{ fontSize: "12px", fontWeight: "700", color: "var(--severity-high-text)", textTransform: "uppercase", marginBottom: "6px" }}>
                Business & Operational Impact
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0, lineHeight: "1.5" }}>
                {selectedFinding.business_impact || "Unauthorized network access or policy bypass can result in resource compromise or data exposure."}
              </p>
            </div>

            {/* Recommendation */}
            <div className="console-card">
              <h3 style={{ fontSize: "12px", fontWeight: "700", color: "var(--severity-low-text)", textTransform: "uppercase", marginBottom: "6px" }}>
                Recommended Action
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-main)", margin: 0, lineHeight: "1.5" }}>
                {selectedFinding.recommendation}
              </p>
            </div>

            {/* AWS Evidence */}
            <div className="console-card">
              <h3 style={{ fontSize: "12px", fontWeight: "700", color: "var(--accent-primary)", textTransform: "uppercase", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Code size={14} /> AWS Evidence
              </h3>
              <div
                style={{
                  backgroundColor: "#020617",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                  padding: "12px",
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "12px",
                  color: "#38BDF8",
                }}
              >
                {(selectedFinding.evidence || []).map((ev, i) => (
                  <div key={i} style={{ marginBottom: "4px" }}>
                    <span style={{ color: "var(--text-dim)" }}>[{i + 1}]</span> {ev}
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Actions */}
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button
                onClick={() => {
                  const res = selectedFinding.resource;
                  const srv = selectedFinding.service;
                  setSelectedFinding(null);
                  onSelectResource(res, srv);
                }}
                className="btn-primary"
              >
                <Server size={14} /> View Resource Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

