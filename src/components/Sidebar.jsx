import React from "react";
import {
  LayoutDashboard,
  Layers,
  ShieldAlert,
  TrendingUp,
  BookmarkCheck,
  Search,
  Network,
  Activity,
  Server,
  Settings as SettingsIcon,
  Shield,
} from "lucide-react";

export default function Sidebar({ activeTab, setActiveTab, user }) {
  const navItems = [
    {
      category: null,
      items: [
        { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={17} /> },
      ],
    },
    {
      category: "SECURITY",
      items: [
        { id: "services", label: "Services", icon: <Layers size={17} /> },
        { id: "threats", label: "Threats", icon: <ShieldAlert size={17} /> },
        { id: "attack-paths", label: "Attack Paths", icon: <TrendingUp size={17} /> },
        { id: "recommendations", label: "Recommendations", icon: <BookmarkCheck size={17} /> },
        { id: "findings", label: "Findings", icon: <Search size={17} /> },
        { id: "resource-map", label: "Resource Map", icon: <Network size={17} /> },
      ],
    },
    {
      category: "OPERATIONS",
      items: [
        { id: "scans", label: "Scans", icon: <Activity size={17} /> },
        { id: "accounts", label: "AWS Accounts", icon: <Server size={17} /> },
      ],
    },
    {
      category: null,
      items: [
        { id: "settings", label: "Settings", icon: <SettingsIcon size={17} /> },
      ],
    },
  ];

  return (
    <aside className="console-sidebar">
      {/* Brand Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "28px",
          paddingLeft: "8px",
        }}
      >
        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "6px",
            backgroundColor: "var(--accent-blue)",
            display: "grid",
            placeItems: "center",
            color: "#ffffff",
          }}
        >
          <Shield size={20} />
        </div>
        <div>
          <h2 style={{ fontSize: "15px", fontWeight: "800", color: "var(--text-main)", letterSpacing: "-0.02em" }}>
            CloudIntercept
          </h2>
          <p style={{ margin: 0, fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: "600" }}>
            SecOps Console
          </p>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "20px", flex: 1 }}>
        {navItems.map((group, idx) => (
          <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {group.category && (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  color: "var(--text-dim)",
                  letterSpacing: "0.08em",
                  paddingLeft: "10px",
                  marginBottom: "4px",
                }}
              >
                {group.category}
              </span>
            )}
            {group.items.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "9px 12px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: isActive ? "rgba(37, 99, 235, 0.18)" : "transparent",
                    color: isActive ? "var(--accent-primary)" : "var(--text-muted)",
                    fontWeight: isActive ? "700" : "500",
                    fontSize: "13px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                    borderLeft: isActive ? "3px solid var(--accent-primary)" : "3px solid transparent",
                  }}
                >
                  <span style={{ color: isActive ? "var(--accent-primary)" : "var(--text-dim)" }}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Info Footprint */}
      {user && (
        <div
          style={{
            borderTop: "1px solid var(--border-color)",
            paddingTop: "14px",
            marginTop: "16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            paddingLeft: "6px",
          }}
        >
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              backgroundColor: "var(--bg-hover)",
              border: "1px solid var(--border-color)",
              display: "grid",
              placeItems: "center",
              fontWeight: "700",
              color: "var(--text-main)",
              fontSize: "12px",
            }}
          >
            {(user.name || user.username || user.email || "US").substring(0, 2).toUpperCase()}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontSize: "12px", fontWeight: "700", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.name || user.username || user.email?.split("@")[0]}
            </p>
            <p style={{ margin: 0, fontSize: "10px", color: "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.email}
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
