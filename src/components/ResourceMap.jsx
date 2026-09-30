import React, { useState, useMemo, useEffect } from "react";
import {
  ShieldAlert,
  Globe,
  Lock,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Activity,
  X,
  Server,
  Database,
  Box,
  Key,
} from "lucide-react";

export default function ResourceMap({
  nodes = [],
  edges = [],
  findings = [],
  attackPaths = [],
  recommendations = [],
  initialSelectedResourceId = null,
  initialSelectedAttackPathId = null,
  onSelectResourceDetails,
}) {
  const [viewMode, setViewMode] = useState("resource"); // 'resource' | 'security' | 'attack_path'
  const [selectedAttackPathId, setSelectedAttackPathId] = useState(
    initialSelectedAttackPathId || (attackPaths.length > 0 ? attackPaths[0].attack_id : "")
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Sync initial selection props if provided
  useEffect(() => {
    if (initialSelectedResourceId) {
      const match = nodes.find(
        (n) => n.name === initialSelectedResourceId || n.node_id === initialSelectedResourceId
      );
      if (match) setSelectedNode(match);
    }
  }, [initialSelectedResourceId, nodes]);

  useEffect(() => {
    if (initialSelectedAttackPathId) {
      setViewMode("attack_path");
      setSelectedAttackPathId(initialSelectedAttackPathId);
    }
  }, [initialSelectedAttackPathId]);

  // Compute attack path participant nodes
  const activeAttackPathResources = useMemo(() => {
    if (viewMode !== "attack_path" || !selectedAttackPathId) return new Set();
    const ap = attackPaths.find(
      (a) => a.attack_id === selectedAttackPathId || String(a.id) === String(selectedAttackPathId)
    );
    if (!ap) return new Set();
    return new Set(ap.affected_resources || []);
  }, [viewMode, selectedAttackPathId, attackPaths]);

  // Filter nodes based on user search and filters
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const matchesSearch =
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.service.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesService =
        serviceFilter === "ALL" || node.service.toUpperCase() === serviceFilter.toUpperCase();

      const matchesSeverity =
        severityFilter === "ALL" ||
        node.security_status.toUpperCase() === severityFilter.toUpperCase();

      return matchesSearch && matchesService && matchesSeverity;
    });
  }, [nodes, searchTerm, serviceFilter, severityFilter]);

  // Unique services list for filter dropdown
  const uniqueServices = useMemo(() => {
    const set = new Set(nodes.map((n) => n.service));
    return Array.from(set).sort();
  }, [nodes]);

  // Arrange resources into AWS-style architecture layers.
  const architectureLayout = useMemo(() => {
    const positions = {};
    if (filteredNodes.length === 0) {
      return { positions, width: 900, height: 620 };
    }

    const layerForNode = (node) => {
      const type = (node.resource_type || "").toLowerCase();
      const service = (node.service || "").toLowerCase();
      if (node.node_id === "internet:public" || service === "network") return 0;
      if (["internetgateway", "loadbalancer", "apigateway"].some((value) => type.includes(value)) || service === "elb" || service === "apigateway") return 1;
      if (type.includes("targetgroup") || type.includes("listener") || service === "cloudfront") return 2;
      if (["ec2", "lambda", "rds", "ecs", "dynamodb"].some((value) => type.includes(value) || service === value)) return 3;
      if (type.includes("subnet")) return 4;
      if (type.includes("routetable") || type.includes("securitygroup") || type.includes("networkacl")) return 5;
      if (type === "vpc" || service === "vpc") return 6;
      if (service === "iam" || service === "kms") return 7;
      return 3;
    };

    const layers = new Map();
    filteredNodes.forEach((node) => {
      const layer = layerForNode(node);
      if (!layers.has(layer)) layers.set(layer, []);
      layers.get(layer).push(node);
    });

    const nodeWidth = 160;
    const nodeGap = 44;
    const layerGap = 108;
    const maxLayerSize = Math.max(...Array.from(layers.values()).map((layer) => layer.length));
    const width = Math.max(900, maxLayerSize * (nodeWidth + nodeGap) + 80);
    const height = Math.max(620, (Math.max(...layers.keys()) + 1) * layerGap + 90);

    Array.from(layers.entries()).sort(([left], [right]) => left - right).forEach(([layer, layerNodes]) => {
      layerNodes.sort((left, right) => (left.name || "").localeCompare(right.name || ""));
      const rowWidth = layerNodes.length * nodeWidth + Math.max(0, layerNodes.length - 1) * nodeGap;
      const startX = Math.max(40, (width - rowWidth) / 2);
      layerNodes.forEach((node, index) => {
        positions[node.node_id] = {
          x: startX + index * (nodeWidth + nodeGap),
          y: 30 + layer * layerGap,
        };
      });
    });

    return { positions, width, height };
  }, [filteredNodes]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Critical":
        return { label: "CRITICAL THREAT", cls: "critical" };
      case "High":
        return { label: "HIGH RISK", cls: "high" };
      case "Medium":
        return { label: "MEDIUM RISK", cls: "medium" };
      default:
        return { label: "CLEAN", cls: "low" };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
      {/* Controls Bar */}
      <div className="console-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", padding: "14px 18px" }}>
        {/* View Mode Buttons */}
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { id: "resource", label: "Architecture", icon: <Layers size={13} /> },
            { id: "security", label: "Security Map", icon: <ShieldAlert size={13} /> },
            { id: "attack_path", label: "Attack Path Mode", icon: <Activity size={13} /> },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              className={viewMode === mode.id ? "btn-primary" : "btn-secondary"}
              style={{ fontSize: "12px", padding: "6px 12px" }}
            >
              {mode.icon}
              {mode.label}
            </button>
          ))}
        </div>

        {/* Attack Path Selector (when in attack_path mode) */}
        {viewMode === "attack_path" && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-dim)" }}>
              Target Attack Path:
            </span>
            <select
              className="console-select"
              value={selectedAttackPathId}
              onChange={(e) => setSelectedAttackPathId(e.target.value)}
              style={{ fontSize: "12px" }}
            >
              {attackPaths.map((ap) => (
                <option key={ap.attack_id || ap.id} value={ap.attack_id || ap.id}>
                  {ap.attack_id} - {ap.title} ({ap.risk})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Search & Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "var(--bg-input)", border: "1px solid var(--border-color)", padding: "4px 10px", borderRadius: "6px" }}>
            <Search size={13} style={{ color: "var(--text-dim)" }} />
            <input
              type="text"
              placeholder="Filter nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: "none", background: "transparent", outline: "none", fontSize: "12px", color: "var(--text-main)", width: "130px" }}
            />
          </div>

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

          {/* Zoom Controls */}
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.5))}
              className="btn-secondary"
              style={{ padding: "4px 8px" }}
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.6))}
              className="btn-secondary"
              style={{ padding: "4px 8px" }}
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="btn-secondary"
              style={{ padding: "4px 8px" }}
              title="Reset Zoom"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div style={{ display: "flex", gap: "16px", minHeight: "540px", position: "relative" }}>
        <div
          style={{
            flex: 1,
            backgroundColor: "#020617",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
            overflow: "hidden",
            position: "relative",
            minHeight: "540px",
          }}
        >
          <svg
            style={{
              width: "100%",
              height: "100%",
              minHeight: "540px",
              transform: `scale(${zoomLevel})`,
              transformOrigin: "top left",
              transition: "transform 0.15s ease-out",
            }}
            viewBox={`0 0 ${architectureLayout.width} ${architectureLayout.height}`}
            preserveAspectRatio="xMidYMin meet"
          >
            {/* Render Edges */}
            {edges.map((edge, idx) => {
              const srcPos = architectureLayout.positions[edge.source];
              const tgtPos = architectureLayout.positions[edge.target];
              if (!srcPos || !tgtPos) return null;

              const srcNodeName = nodes.find((n) => n.node_id === edge.source)?.name;
              const tgtNodeName = nodes.find((n) => n.node_id === edge.target)?.name;

              const isAttackEdge =
                viewMode === "attack_path" &&
                activeAttackPathResources.has(srcNodeName) &&
                activeAttackPathResources.has(tgtNodeName);

              return (
                <g key={idx}>
                  <path
                    d={
                      srcPos.y === tgtPos.y
                        ? `M ${srcPos.x + 80} ${srcPos.y + 30} H ${tgtPos.x + 80}`
                        : `M ${srcPos.x + 80} ${srcPos.y + 60} V ${(srcPos.y + tgtPos.y + 60) / 2} H ${tgtPos.x + 80} V ${tgtPos.y}`
                    }
                    fill="none"
                    stroke={isAttackEdge ? "#EF4444" : "#334155"}
                    strokeWidth={isAttackEdge ? 3 : 1.5}
                    strokeDasharray={edge.relationship === "INTERNET_EXPOSED" ? "5,5" : "none"}
                  />
                </g>
              );
            })}

            {/* Render Nodes */}
            {filteredNodes.map((node) => {
              const pos = architectureLayout.positions[node.node_id];
              if (!pos) return null;

              const isSelected = selectedNode?.node_id === node.node_id;
              const badge = getStatusBadge(node.security_status);

              const isMuted =
                (viewMode === "security" && node.security_status === "Clean") ||
                (viewMode === "attack_path" && !activeAttackPathResources.has(node.name));

              return (
                <g
                  key={node.node_id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => setSelectedNode(node)}
                  style={{ cursor: "pointer", opacity: isMuted ? 0.25 : 1 }}
                >
                  <rect
                    width="160"
                    height="60"
                    rx="6"
                    fill={isSelected ? "#1e293b" : "#0f172a"}
                    stroke={isSelected ? "#38bdf8" : "#334155"}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />

                  {/* Top Severity Indicator Strip */}
                  <rect
                    width="160"
                    height="4"
                    rx="2"
                    fill={
                      node.security_status === "Critical"
                        ? "#EF4444"
                        : node.security_status === "High"
                        ? "#F97316"
                        : node.security_status === "Medium"
                        ? "#EAB308"
                        : "#10B981"
                    }
                  />

                  {/* Title Text */}
                  <text
                    x="12"
                    y="28"
                    fill="#f8fafc"
                    fontSize="12"
                    fontWeight="700"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {node.name.length > 16 ? node.name.substring(0, 14) + "..." : node.name}
                  </text>

                  {/* Metadata Subtitle */}
                  <text
                    x="12"
                    y="46"
                    fill="#94a3b8"
                    fontSize="10"
                    fontWeight="600"
                    fontFamily="Inter, sans-serif"
                  >
                    {node.service} | {node.exposure.toUpperCase()}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <div
            className="console-panel"
            style={{
              width: "320px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span className={`badge-severity ${getStatusBadge(selectedNode.security_status).cls}`}>
                  {getStatusBadge(selectedNode.security_status).label}
                </span>
                <h3 style={{ fontSize: "15px", fontWeight: "800", color: "var(--text-main)", margin: "6px 0 0 0", fontFamily: "monospace" }}>
                  {selectedNode.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "4px" }}>
                <span style={{ color: "var(--text-dim)" }}>Service:</span>
                <strong style={{ color: "var(--text-main)" }}>{selectedNode.service}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "4px" }}>
                <span style={{ color: "var(--text-dim)" }}>Exposure:</span>
                <strong style={{ color: selectedNode.exposure === "public" ? "var(--severity-critical-text)" : "var(--severity-low-text)" }}>
                  {selectedNode.exposure.toUpperCase()}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "4px" }}>
                <span style={{ color: "var(--text-dim)" }}>Region:</span>
                <strong style={{ color: "var(--text-main)" }}>{selectedNode.region}</strong>
              </div>
            </div>

            {/* Findings Count */}
            <div>
              <h4 style={{ fontSize: "12px", color: "var(--text-main)", marginBottom: "6px" }}>
                Findings ({selectedNode.related_findings?.length || 0})
              </h4>
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                {(selectedNode.related_findings || []).map((ruleId) => (
                  <span
                    key={ruleId}
                    style={{
                      fontFamily: "monospace",
                      fontSize: "11px",
                      backgroundColor: "var(--bg-card)",
                      border: "1px solid var(--border-color)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      color: "var(--accent-primary)",
                    }}
                  >
                    {ruleId}
                  </span>
                ))}
              </div>
            </div>

            {/* Inspect Details Action */}
            {onSelectResourceDetails && (
              <button
                onClick={() => onSelectResourceDetails(selectedNode.name, selectedNode.service)}
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", fontSize: "12px", marginTop: "auto" }}
              >
                Inspect Full Resource Details
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
