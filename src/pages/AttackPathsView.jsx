import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "@/context/DashboardContext";
import { TrendingUp, ShieldAlert, Network, ArrowLeft, ArrowRight, Server, CheckCircle2 } from "lucide-react";

export default function AttackPathsView() {
  useEffect(() => { document.title = "CloudShieldPlus | Attack Paths"; }, []);
  const navigate = useNavigate();
  const { attackPaths = [], handleOpenResourceDrawer: onSelectResource, handleNavigateToMap } = useDashboard();
  const onNavigateToMap = (id) => { handleNavigateToMap(id); navigate("/resource-map"); };
  const [selectedPathId, setSelectedPathId] = useState(null);

  const selectedPath = attackPaths.find(
    (ap) => ap.attack_id === selectedPathId || String(ap.id) === String(selectedPathId)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Overview List Header */}
      {!selectedPath ? (
        <>
          <div className="console-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <TrendingUp size={18} style={{ color: "var(--severity-critical-text)" }} />
                Correlated Vulnerability Attack Paths ({attackPaths.length})
              </h2>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                Deterministic exploit scenarios constructed by backend graph analysis across multi-resource findings.
              </p>
            </div>
          </div>

          {attackPaths.length === 0 ? (
            <div className="console-panel" style={{ textAlign: "center", padding: "40px" }}>
              <CheckCircle2 size={36} style={{ color: "var(--severity-low-text)", marginBottom: "12px" }} />
              <h3 style={{ fontSize: "15px", color: "var(--text-main)", marginBottom: "4px" }}>
                No evidence-backed attack paths identified.
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                Discovered resources do not exhibit multi-stage attack pathway exposure.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "16px" }}>
              {attackPaths.map((ap) => (
                <div
                  key={ap.attack_id || ap.id}
                  className="console-card"
                  style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "16px" }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <span className={`badge-severity ${ap.risk || "High"}`}>
                        {ap.risk || "High"} RISK
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-dim)", fontWeight: "700", fontFamily: "monospace" }}>
                        {ap.attack_id}
                      </span>
                    </div>

                    <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-main)", margin: "0 0 8px 0" }}>
                      {ap.title}
                    </h3>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 12px 0", lineHeight: "1.4" }}>
                      {ap.description}
                    </p>

                    <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: "var(--text-dim)" }}>
                      <span>Likelihood: <strong style={{ color: "var(--text-main)" }}>{ap.likelihood}</strong></span>
                      <span>Impact: <strong style={{ color: "var(--text-main)" }}>{ap.impact}</strong></span>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                    <button
                      onClick={() => setSelectedPathId(ap.attack_id || ap.id)}
                      className="btn-primary"
                      style={{ fontSize: "12px", padding: "6px 12px" }}
                    >
                      Inspect Chain <ArrowRight size={13} />
                    </button>
                    {onNavigateToMap && (
                      <button
                        onClick={() => onNavigateToMap(ap.attack_id || ap.id)}
                        className="btn-secondary"
                        style={{ fontSize: "12px", padding: "6px 12px" }}
                      >
                        <Network size={13} /> Show on Map
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Detailed View for Single Attack Path */
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              onClick={() => setSelectedPathId(null)}
              className="btn-secondary"
              style={{ fontSize: "12px" }}
            >
              <ArrowLeft size={14} /> Back to Attack Paths List
            </button>
            {onNavigateToMap && (
              <button
                onClick={() => onNavigateToMap(selectedPath.attack_id || selectedPath.id)}
                className="btn-primary"
                style={{ fontSize: "12px" }}
              >
                <Network size={14} /> Highlight on Resource Map
              </button>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Header Overview Card */}
              <div className="console-panel">
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                  <span className={`badge-severity ${selectedPath.risk || "High"}`}>
                    {selectedPath.risk} Risk
                  </span>
                  <span style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--accent-primary)", fontWeight: "700" }}>
                    {selectedPath.attack_id}
                  </span>
                </div>

                <h2 style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-main)", margin: "0 0 10px 0" }}>
                  {selectedPath.title}
                </h2>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0, lineHeight: "1.6" }}>
                  {selectedPath.description}
                </p>

                <div style={{ display: "flex", gap: "20px", marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--border-color)" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Likelihood</span>
                    <p style={{ margin: "2px 0 0 0", fontSize: "13px", fontWeight: "700", color: "var(--text-main)" }}>
                      {selectedPath.likelihood}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Impact Magnitude</span>
                    <p style={{ margin: "2px 0 0 0", fontSize: "13px", fontWeight: "700", color: "var(--text-main)" }}>
                      {selectedPath.impact}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sequential Attack Steps */}
              <div className="console-panel">
                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-main)", marginBottom: "16px" }}>
                  Attack Chain Progression Steps
                </h3>
                {selectedPath.attack_steps && selectedPath.attack_steps.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {selectedPath.attack_steps.map((step, idx) => (
                      <div key={idx} style={{ display: "flex", gap: "14px" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div
                            style={{
                              width: "26px",
                              height: "26px",
                              borderRadius: "50%",
                              backgroundColor: "var(--accent-blue)",
                              color: "#ffffff",
                              display: "grid",
                              placeItems: "center",
                              fontSize: "12px",
                              fontWeight: "700",
                            }}
                          >
                            {idx + 1}
                          </div>
                          {idx < selectedPath.attack_steps.length - 1 && (
                            <div style={{ width: "2px", flex: 1, backgroundColor: "var(--border-color)", margin: "4px 0" }}></div>
                          )}
                        </div>
                        <div style={{ flex: 1, backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "12px" }}>
                          <h4 style={{ margin: "0 0 4px 0", fontSize: "13px", color: "var(--text-main)", fontWeight: "700" }}>
                            {step.step || `Stage ${idx + 1}`}
                          </h4>
                          <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.4" }}>
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
                    No sequential progression steps mapped.
                  </p>
                )}
              </div>

              {/* Mitigation Guidelines */}
              <div className="console-panel">
                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "var(--severity-low-text)", marginBottom: "8px" }}>
                  Scenario Mitigation Strategy
                </h3>
                <p style={{ fontSize: "13px", color: "var(--text-main)", margin: 0, lineHeight: "1.5" }}>
                  {selectedPath.mitigation}
                </p>
              </div>
            </div>

            {/* Affected Resources Sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="console-panel">
                <h3 style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-main)", marginBottom: "12px" }}>
                  Affected Resources ({selectedPath.affected_resources?.length || 0})
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {(selectedPath.affected_resources || []).map((res, i) => (
                    <button
                      key={i}
                      onClick={() => onSelectResource(res)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justify: "space-between",
                        padding: "8px 10px",
                        backgroundColor: "var(--bg-card)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontFamily: "monospace",
                        color: "var(--accent-primary)",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{res}</span>
                      <Server size={12} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

