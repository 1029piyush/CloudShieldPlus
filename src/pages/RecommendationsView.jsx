import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "@/context/DashboardContext";
import { BookmarkCheck, Zap, ArrowLeft, ArrowRight, CheckCircle2, Server, Wrench } from "lucide-react";

export default function RecommendationsView() {
  useEffect(() => { document.title = "CloudShieldPlus | Recommendations"; }, []);
  const navigate = useNavigate();
  const { recommendations = [], handleOpenResourceDrawer: onSelectResource } = useDashboard();
  const onNavigateToAttackPath = () => navigate("/attack-paths");
  const [selectedRecId, setSelectedRecId] = useState(null);

  const selectedRec = recommendations.find(
    (r) => r.recommendation_id === selectedRecId || String(r.id) === String(selectedRecId)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {!selectedRec ? (
        <>
          {/* List Header */}
          <div className="console-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <BookmarkCheck size={18} style={{ color: "var(--severity-low-text)" }} />
                Prioritized Remediation Advisories ({recommendations.length})
              </h2>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                Engine-generated remediation guidance prioritized by risk reduction impact and implementation effort.
              </p>
            </div>
          </div>

          {recommendations.length === 0 ? (
            <div className="console-panel" style={{ textAlign: "center", padding: "40px" }}>
              <CheckCircle2 size={36} style={{ color: "var(--severity-low-text)", marginBottom: "12px" }} />
              <h3 style={{ fontSize: "15px", color: "var(--text-main)", marginBottom: "4px" }}>
                No remediation recommendations generated.
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                All environment security configuration checks are operating within defined safety parameters.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {recommendations.map((rec) => (
                <div
                  key={rec.recommendation_id || rec.id}
                  className="console-card"
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span className={`badge-severity ${rec.priority || "Medium"}`}>{rec.priority} PRIORITY</span>
                      <span style={{ fontSize: "11px", color: "var(--text-dim)", fontWeight: "600" }}>{rec.category}</span>
                      {rec.auto_fix_supported && (
                        <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--severity-low-text)", backgroundColor: "var(--severity-low-bg)", padding: "2px 6px", borderRadius: "4px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                          <Zap size={10} /> Auto-Fix Supported
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-main)", margin: "0 0 4px 0" }}>
                      {rec.title}
                    </h3>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "600px" }}>
                      {rec.description}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedRecId(rec.recommendation_id || rec.id)}
                    className="btn-secondary"
                    style={{ fontSize: "12px", padding: "6px 12px" }}
                  >
                    View Remediation Steps <ArrowRight size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Detailed View for Single Recommendation */
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <button
            onClick={() => setSelectedRecId(null)}
            className="btn-secondary"
            style={{ fontSize: "12px", alignSelf: "flex-start" }}
          >
            <ArrowLeft size={14} /> Back to Advisories List
          </button>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Header Card */}
              <div className="console-panel">
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span className={`badge-severity ${selectedRec.priority}`}>{selectedRec.priority} Priority</span>
                  <span style={{ fontSize: "12px", color: "var(--text-dim)", fontWeight: "600" }}>{selectedRec.category}</span>
                </div>

                <h2 style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-main)", margin: "0 0 12px 0" }}>
                  {selectedRec.title}
                </h2>

                {/* WHAT */}
                <div style={{ marginBottom: "14px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--accent-primary)", textTransform: "uppercase" }}>WHAT SHOULD BE CHANGED</span>
                  <p style={{ fontSize: "13px", color: "var(--text-main)", margin: "4px 0 0 0", lineHeight: "1.5" }}>
                    {selectedRec.description}
                  </p>
                </div>

                {/* WHY */}
                {selectedRec.business_impact && (
                  <div style={{ marginBottom: "14px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--severity-high-text)", textTransform: "uppercase" }}>WHY IT MATTERS (BUSINESS IMPACT)</span>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "4px 0 0 0", lineHeight: "1.5" }}>
                      {selectedRec.business_impact}
                    </p>
                  </div>
                )}

                <div style={{ display: "flex", gap: "20px", marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--border-color)" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Expected Risk Reduction</span>
                    <p style={{ margin: "2px 0 0 0", fontSize: "13px", fontWeight: "700", color: "var(--severity-low-text)" }}>
                      {selectedRec.expected_risk_reduction || "High Risk Mitigation"}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Estimated Effort</span>
                    <p style={{ margin: "2px 0 0 0", fontSize: "13px", fontWeight: "700", color: "var(--text-main)" }}>
                      {selectedRec.estimated_effort || "Low - Standard Config Update"}
                    </p>
                  </div>
                </div>
              </div>

              {/* HOW: Implementation Steps */}
              <div className="console-panel">
                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-main)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Wrench size={15} style={{ color: "var(--accent-primary)" }} />
                  Implementation & Remediation Plan
                </h3>

                {selectedRec.implementation_steps && selectedRec.implementation_steps.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {selectedRec.implementation_steps.map((step, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          gap: "10px",
                          backgroundColor: "var(--bg-card)",
                          border: "1px solid var(--border-color)",
                          padding: "10px 12px",
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                      >
                        <span style={{ fontWeight: "700", color: "var(--accent-primary)" }}>Step {i + 1}:</span>
                        <span style={{ color: "var(--text-main)", lineHeight: "1.4" }}>
                          {typeof step === "string" ? step : step.description}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
                    Follow standard AWS console / CLI procedures for this service configuration.
                  </p>
                )}
              </div>
            </div>

            {/* WHERE: Impacted Resources */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="console-panel">
                <h3 style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-main)", marginBottom: "12px" }}>
                  WHERE: Affected Resources ({selectedRec.affected_resources?.length || 0})
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {(selectedRec.affected_resources || []).map((res, i) => (
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

