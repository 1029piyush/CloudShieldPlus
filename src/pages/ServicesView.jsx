import React, { useState, useMemo, useEffect } from "react";
import { useDashboard } from "@/context/DashboardContext";
import {
  ChevronRight,
  ChevronDown,
  Layers,
  Server,
  Database,
  Box,
  Key,
  Shield,
  Activity,
  Globe,
  Lock,
  Search,
  CheckCircle2,
} from "lucide-react";

export default function ServicesView() {
  useEffect(() => { document.title = "CloudShieldPlus | Services"; }, []);
  const { serviceInventory = [], findings = [], mapNodes: nodes = [], attackPaths = [], recommendations = [], handleOpenResourceDrawer: onSelectResource } = useDashboard();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedServices, setExpandedServices] = useState({});

  // Group resources dynamically by service name using backend scan data
  const servicesData = useMemo(() => {
    const serviceMap = {};

    serviceInventory.forEach((service) => {
      const srv = (service.service || service.service_key || "AWS").toUpperCase();
      serviceMap[srv] = { name: srv, resources: {} };
      (service.resources || []).forEach((resource) => {
        const data = resource.data || resource;
        const id = resource.resource_id || data.name || data.id || "Unknown resource";
        serviceMap[srv].resources[id] = {
          id,
          service: srv,
          region: data.region || data.home_region || "Unknown",
          exposure: data.exposure || "unknown",
          security_status: resource.findings?.length ? resource.findings[0].severity : "Clean",
          findings: resource.findings || [],
          attack_paths: resource.attack_paths || [],
        };
      });
    });

    // 1. Collect resources from resource-map nodes
    nodes.forEach((node) => {
      const srv = (node.service || "AWS").toUpperCase();
      if (!serviceMap[srv]) {
        serviceMap[srv] = { name: srv, resources: {} };
      }
      if (!serviceMap[srv].resources[node.name]) {
        serviceMap[srv].resources[node.name] = {
          id: node.name,
          service: srv,
          region: node.region || "us-east-1",
          exposure: node.exposure || "private",
          security_status: node.security_status || "Clean",
          findings: [],
          attack_paths: [],
        };
      }
    });

    // 2. Collect resources and attach findings from findings array
    findings.forEach((f) => {
      const srv = (f.service || "AWS").toUpperCase();
      if (!serviceMap[srv]) {
        serviceMap[srv] = { name: srv, resources: {} };
      }
      const resId = f.resource;
      if (!serviceMap[srv].resources[resId]) {
        serviceMap[srv].resources[resId] = {
          id: resId,
          service: srv,
          region: "us-east-1",
          exposure: f.severity === "Critical" || f.severity === "High" ? "public" : "private",
          security_status: f.severity,
          findings: [],
          attack_paths: [],
        };
      }
      serviceMap[srv].resources[resId].findings.push(f);
    });

    // 3. Attach attack path associations
    attackPaths.forEach((ap) => {
      (ap.affected_resources || []).forEach((resId) => {
        Object.values(serviceMap).forEach((srvObj) => {
          if (srvObj.resources[resId]) {
            srvObj.resources[resId].attack_paths.push(ap);
          }
        });
      });
    });

    // Convert map to array of service objects
    return Object.values(serviceMap).map((srv) => {
      const resList = Object.values(srv.resources);
      const criticalCount = resList.filter((r) => r.findings.some((f) => f.severity === "Critical")).length;
      const highCount = resList.filter((r) => r.findings.some((f) => f.severity === "High")).length;
      const mediumCount = resList.filter((r) => r.findings.some((f) => f.severity === "Medium")).length;
      const lowCount = resList.filter((r) => r.findings.some((f) => f.severity === "Low")).length;
      const cleanCount = resList.filter((r) => r.findings.length === 0).length;

      return {
        name: srv.name,
        resources: resList,
        counts: {
          total: resList.length,
          critical: criticalCount,
          high: highCount,
          medium: mediumCount,
          low: lowCount,
          clean: cleanCount,
        },
      };
    });
  }, [serviceInventory, findings, nodes, attackPaths]);

  // Filter services by search term
  const filteredServices = useMemo(() => {
    if (!searchTerm) return servicesData;
    const term = searchTerm.toLowerCase();
    return servicesData.filter(
      (srv) =>
        srv.name.toLowerCase().includes(term) ||
        srv.resources.some((r) => r.id.toLowerCase().includes(term))
    );
  }, [servicesData, searchTerm]);

  const toggleExpand = (srvName) => {
    setExpandedServices((prev) => ({
      ...prev,
      [srvName]: !prev[srvName],
    }));
  };

  const getServiceIcon = (srvName) => {
    switch (srvName.toUpperCase()) {
      case "S3":
        return <Box size={18} style={{ color: "#f59e0b" }} />;
      case "RDS":
      case "DYNAMODB":
        return <Database size={18} style={{ color: "#06b6d4" }} />;
      case "LAMBDA":
      case "ECS":
        return <Activity size={18} style={{ color: "#a855f7" }} />;
      case "KMS":
      case "SECRETS MANAGER":
      case "SECRETSMANAGER":
        return <Key size={18} style={{ color: "#10b981" }} />;
      default:
        return <Server size={18} style={{ color: "#38bdf8" }} />;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Search Header */}
      <div
        className="console-panel"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>
            Discovered AWS Services ({servicesData.length})
          </h2>
          <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
            Select an AWS service to inspect resources, findings, threat context, attack paths, and evidence.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "var(--bg-input)", border: "1px solid var(--border-color)", padding: "6px 12px", borderRadius: "6px" }}>
          <Search size={14} style={{ color: "var(--text-dim)" }} />
          <input
            type="text"
            placeholder="Search service or resource..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: "none", background: "transparent", outline: "none", color: "var(--text-main)", fontSize: "12px", width: "180px" }}
          />
        </div>
      </div>

      {/* Services List */}
      {filteredServices.length === 0 ? (
        <div className="console-panel" style={{ textAlign: "center", padding: "40px" }}>
          <Layers size={36} style={{ color: "var(--text-dim)", marginBottom: "12px" }} />
          <h3 style={{ fontSize: "15px", color: "var(--text-main)", marginBottom: "4px" }}>
            No AWS services found matching criteria.
          </h3>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
            Run an environment scan or adjust your search filter.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredServices.map((srv) => {
            const isExpanded = expandedServices[srv.name] !== false; // Default expanded for first-view
            const { counts } = srv;

            return (
              <div
                key={srv.name}
                style={{
                  backgroundColor: "var(--bg-panel)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                {/* Expandable Service Header Row */}
                <button
                  onClick={() => toggleExpand(srv.name)}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    padding: "16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    textAlign: "left",
                    color: "var(--text-main)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {getServiceIcon(srv.name)}
                    <span style={{ fontSize: "15px", fontWeight: "800" }}>{srv.name}</span>
                    <span
                      style={{
                        fontSize: "11px",
                        backgroundColor: "var(--bg-card)",
                        border: "1px solid var(--border-color)",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        color: "var(--text-muted)",
                        fontWeight: "600",
                      }}
                    >
                      {counts.total} {counts.total === 1 ? "Resource" : "Resources"}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    {/* Severity Pills Summary */}
                    <div style={{ display: "flex", gap: "6px", fontSize: "11px" }}>
                      {counts.critical > 0 && (
                        <span className="badge-severity critical">{counts.critical} Critical</span>
                      )}
                      {counts.high > 0 && (
                        <span className="badge-severity high">{counts.high} High</span>
                      )}
                      {counts.medium > 0 && (
                        <span className="badge-severity medium">{counts.medium} Medium</span>
                      )}
                      {counts.low > 0 && (
                        <span className="badge-severity low">{counts.low} Low</span>
                      )}
                      {counts.clean > 0 && counts.critical === 0 && counts.high === 0 && (
                        <span className="badge-severity clean">{counts.clean} Clean</span>
                      )}
                    </div>

                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                </button>

                {/* Expanded Resources Cards Grid */}
                {isExpanded && (
                  <div
                    style={{
                      padding: "0 20px 20px 20px",
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                      gap: "14px",
                      borderTop: "1px solid var(--border-color)",
                      paddingTop: "16px",
                      backgroundColor: "rgba(11, 19, 36, 0.4)",
                    }}
                  >
                    {srv.resources.map((res) => {
                      const resFindings = res.findings || [];
                      const resAttackPaths = res.attack_paths || [];

                      const hasCrit = resFindings.some((f) => f.severity === "Critical");
                      const hasH = resFindings.some((f) => f.severity === "High");
                      const hasM = resFindings.some((f) => f.severity === "Medium");

                      const severityLabel = hasCrit
                        ? "Critical"
                        : hasH
                        ? "High"
                        : hasM
                        ? "Medium"
                        : resFindings.length > 0
                        ? "Low"
                        : "Clean";

                      return (
                        <div
                          key={res.id}
                          className="console-card"
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            justify: "space-between",
                            gap: "12px",
                          }}
                        >
                          {/* Card Title & Badges */}
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                              <span className={`badge-severity ${severityLabel}`}>{severityLabel}</span>
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: "700",
                                  textTransform: "uppercase",
                                  color: res.exposure === "public" ? "var(--severity-critical-text)" : "var(--text-dim)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "3px",
                                }}
                              >
                                {res.exposure === "public" ? <Globe size={11} /> : <Lock size={11} />}
                                {res.exposure}
                              </span>
                            </div>

                            <h4
                              style={{
                                fontSize: "14px",
                                fontWeight: "700",
                                color: "var(--text-main)",
                                margin: "0 0 4px 0",
                                fontFamily: "monospace",
                                wordBreak: "break-all",
                              }}
                            >
                              {res.id}
                            </h4>

                            <p style={{ margin: 0, fontSize: "11px", color: "var(--text-dim)" }}>
                              Region: {res.region} | {resFindings.length} {resFindings.length === 1 ? "Finding" : "Findings"} Â· {resAttackPaths.length} Attack Paths
                            </p>
                          </div>

                          {/* Findings Highlights */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {resFindings.length === 0 ? (
                              <p style={{ margin: 0, fontSize: "12px", color: "var(--severity-low-text)", display: "flex", alignItems: "center", gap: "4px" }}>
                                <CheckCircle2 size={13} /> No security findings detected
                              </p>
                            ) : (
                              resFindings.slice(0, 3).map((f) => (
                                <p
                                  key={f.id || f.rule_id}
                                  style={{
                                    margin: 0,
                                    fontSize: "12px",
                                    color: "var(--severity-high-text)",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  âš  {f.title}
                                </p>
                              ))
                            )}
                          </div>

                          {/* Inspect Details Button */}
                          <button
                            onClick={() => onSelectResource(res.id, srv.name)}
                            className="btn-secondary"
                            style={{ width: "100%", justifyContent: "center", fontSize: "12px", marginTop: "4px" }}
                          >
                            View Details
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

