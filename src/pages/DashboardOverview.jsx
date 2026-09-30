import React, { useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDashboard } from "@/context/DashboardContext";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import {
  ShieldAlert, Server, TrendingUp, BookmarkCheck, Layers,
  Clock, ArrowRight, CheckCircle2, Zap, AlertTriangle,
  Activity, Shield, Target,
} from "lucide-react";

// ── Severity color map ─────────────────────────────────────────────
const SEV_COLOR = {
  Critical: "#EF4444",
  High:     "#F59E0B",
  Medium:   "#EAB308",
  Low:      "#10B981",
};

const PRIORITY_COLOR = {
  Critical: "text-ci-critical bg-ci-critical/15 border-ci-critical/30",
  High:     "text-ci-warning bg-ci-warning/15 border-ci-warning/30",
  Medium:   "text-yellow-400 bg-yellow-500/15 border-yellow-500/30",
  Low:      "text-ci-secure bg-ci-secure/15 border-ci-secure/30",
};

// ── Metric card ────────────────────────────────────────────────────
function MetricCard({ label, value, sub, color = "text-ci-accent", icon: Icon }) {
  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-bold uppercase tracking-wider ${color}`}>{label}</span>
        {Icon && <Icon size={16} className={color} />}
      </div>
      <p className="text-3xl font-bold text-white leading-none">{value}</p>
      <p className="text-[11px] text-ci-muted">{sub}</p>
    </div>
  );
}

// ── Custom pie label ───────────────────────────────────────────────
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>{Math.round(percent * 100)}%</text>;
};

export default function DashboardOverview() {
  useEffect(() => { document.title = "CloudIntercept | Overview"; }, []);
  const navigate = useNavigate();
  const {
    findings = [],
    attackPaths = [],
    recommendations = [],
    services = [],
    summary = {},
    scans = [],
    loading,
  } = useDashboard();

  // ── Metrics ──────────────────────────────────────────────────────
  const lastScan = scans[0] || null;
  const lastScanLabel = lastScan?.started_at
    ? new Date(lastScan.started_at).toLocaleString()
    : "Never Scanned";

  const criticalCount = useMemo(() => findings.filter(f => f.severity === "Critical").length, [findings]);
  const highCount     = useMemo(() => findings.filter(f => f.severity === "High").length, [findings]);
  const mediumCount   = useMemo(() => findings.filter(f => f.severity === "Medium").length, [findings]);
  const lowCount      = useMemo(() => findings.filter(f => f.severity === "Low").length, [findings]);

  const affectedResources = useMemo(() => new Set(findings.map(f => f.resource)).size, [findings]);
  const servicesCount = useMemo(() => {
    if (services.length > 0) return services.length;
    return new Set(findings.map(f => f.service)).size;
  }, [findings, services]);

  // Security score: 100 - weighted penalty
  const securityScore = useMemo(() => {
    if (!findings.length) return 100;
    const penalty = criticalCount * 8 + highCount * 4 + mediumCount * 2 + lowCount * 0.5;
    return Math.max(0, Math.round(100 - penalty));
  }, [criticalCount, highCount, mediumCount, lowCount, findings]);

  const scoreColor = securityScore >= 80 ? "text-ci-secure" : securityScore >= 60 ? "text-ci-warning" : "text-ci-critical";
  const scoreLabel = securityScore >= 80 ? "Good" : securityScore >= 60 ? "Fair" : "Poor";

  // ── Chart data ───────────────────────────────────────────────────
  const severityPieData = useMemo(() => {
    const data = [
      { name: "Critical", value: criticalCount, color: "#EF4444" },
      { name: "High",     value: highCount,     color: "#F59E0B" },
      { name: "Medium",   value: mediumCount,   color: "#EAB308" },
      { name: "Low",      value: lowCount,      color: "#10B981" },
    ];
    return data.filter(d => d.value > 0);
  }, [criticalCount, highCount, mediumCount, lowCount]);

  const serviceBarData = useMemo(() => {
    const map = {};
    findings.forEach(f => {
      const svc = (f.service || "AWS").toUpperCase();
      if (!map[svc]) map[svc] = { service: svc, Critical: 0, High: 0, Medium: 0, Low: 0 };
      if (map[svc][f.severity] !== undefined) map[svc][f.severity]++;
    });
    return Object.values(map).sort((a, b) => (b.Critical + b.High) - (a.Critical + a.High)).slice(0, 8);
  }, [findings]);

  const topThreats = useMemo(() => {
    const w = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    return [...findings].sort((a, b) => (w[b.severity] || 0) - (w[a.severity] || 0)).slice(0, 5);
  }, [findings]);

  const topRecs = useMemo(() => {
    const w = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    return [...recommendations].sort((a, b) => (w[b.priority] || 0) - (w[a.priority] || 0)).slice(0, 5);
  }, [recommendations]);

  const hasData = findings.length > 0 || recommendations.length > 0;

  return (
    <div className="flex flex-col gap-6">

      {/* ── No data banner ─────────────────────────────────────── */}
      {!hasData && !loading && (
        <div className="glass rounded-2xl p-6 flex items-center gap-4">
          <Activity size={32} className="text-ci-accent shrink-0" />
          <div>
            <p className="text-white font-semibold">No scan data yet</p>
            <p className="text-ci-muted text-sm">Run a scan from the top bar to populate the dashboard.</p>
          </div>
        </div>
      )}

      {/* ── Metric row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard label="Security Score" value={securityScore} sub={scoreLabel} color={scoreColor} icon={Shield} />
        <MetricCard label="Critical Findings" value={criticalCount} sub="Immediate action" color="text-ci-critical" icon={ShieldAlert} />
        <MetricCard label="Attack Paths" value={attackPaths.length} sub="Exploit chains" color="text-ci-warning" icon={TrendingUp} />
        <MetricCard label="Recommendations" value={recommendations.length} sub="Actionable fixes" color="text-ci-accent" icon={BookmarkCheck} />
        <MetricCard label="Services Scanned" value={servicesCount} sub="AWS services" color="text-ci-muted" icon={Layers} />
        <MetricCard label="Last Scan" value={lastScan ? new Date(lastScan.started_at).toLocaleDateString() : "—"} sub={lastScan?.status || "Never"} color="text-ci-muted" icon={Clock} />
      </div>

      {/* ── Charts row ──────────────────────────────────────────── */}
      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Severity pie */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-white">Findings by Severity</p>
              <span className="text-[11px] text-ci-muted">{findings.length} total</span>
            </div>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={severityPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value" labelLine={false} label={renderPieLabel}>
                    {severityPieData.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "rgba(7,26,47,0.95)", border: "1px solid rgba(125,232,255,0.2)", borderRadius: 10, fontSize: 12 }} /></PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 text-sm">
                {[["Critical", criticalCount, "#EF4444"], ["High", highCount, "#F59E0B"], ["Medium", mediumCount, "#EAB308"], ["Low", lowCount, "#10B981"]].map(([label, count, color]) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: color }} />
                    <span className="text-ci-muted text-xs w-16">{label}</span>
                    <span className="font-bold text-white text-xs">{count}</span>
                  </div>
                ))}
                <Link to="/findings" className="mt-2 text-[11px] text-ci-accent hover:underline flex items-center gap-1">View all <ArrowRight size={10} /></Link>
              </div>
            </div>
          </div>

          {/* Service bar chart */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-white">Findings by AWS Service</p>
              <Link to="/services" className="text-[11px] text-ci-accent hover:underline">View services</Link>
            </div>
            {serviceBarData.length === 0 ? (
              <p className="text-ci-muted text-sm text-center py-8">No findings data</p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={serviceBarData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barCategoryGap="30%">
                  <XAxis dataKey="service" tick={{ fill: "#A9C3D9", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#A9C3D9", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "rgba(7,26,47,0.95)", border: "1px solid rgba(125,232,255,0.2)", borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="Critical" stackId="a" fill="#EF4444" radius={[0,0,0,0]} />
                  <Bar dataKey="High"     stackId="a" fill="#F59E0B" />
                  <Bar dataKey="Medium"   stackId="a" fill="#EAB308" />
                  <Bar dataKey="Low"      stackId="a" fill="#10B981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* ── Threats + Recommendations ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Active Threats */}
        <div className="glass rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><ShieldAlert size={15} className="text-ci-critical" />Active Threats</h3>
            <Link to="/findings" className="text-[11px] text-ci-accent hover:underline flex items-center gap-1">View all ({findings.length}) <ArrowRight size={10} /></Link>
          </div>
          {topThreats.length === 0 ? (
            <div className="flex items-center gap-3 py-6 justify-center"><CheckCircle2 size={20} className="text-ci-secure" /><p className="text-ci-muted text-sm">No threats detected</p></div>
          ) : (
            <div className="flex flex-col gap-2">
              {topThreats.map((t) => (
                <div key={t.id || t.rule_id + t.resource} className="glass rounded-xl px-4 py-3 flex items-start gap-3 group hover:border-ci-glow/30 transition-colors">
                  <span className={`mt-0.5 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase shrink-0 border ${PRIORITY_COLOR[t.severity] || PRIORITY_COLOR.Low}`}>{t.severity}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{t.title}</p>
                    <p className="text-[11px] text-ci-muted font-mono truncate">{t.resource}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div className="glass rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><BookmarkCheck size={15} className="text-ci-secure" />Top Recommendations</h3>
            <Link to="/recommendations" className="text-[11px] text-ci-accent hover:underline flex items-center gap-1">View all ({recommendations.length}) <ArrowRight size={10} /></Link>
          </div>
          {topRecs.length === 0 ? (
            <div className="flex items-center gap-3 py-6 justify-center"><CheckCircle2 size={20} className="text-ci-secure" /><p className="text-ci-muted text-sm">No recommendations yet</p></div>
          ) : (
            <div className="flex flex-col gap-2">
              {topRecs.map((rec) => (
                <Link key={rec.recommendation_id || rec.id} to="/recommendations"
                  className="glass rounded-xl px-4 py-3 flex items-start gap-3 hover:border-ci-glow/30 transition-colors no-underline">
                  <span className={`mt-0.5 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase shrink-0 border ${PRIORITY_COLOR[rec.priority] || PRIORITY_COLOR.Low}`}>{rec.priority}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{rec.title}</p>
                    <p className="text-[11px] text-ci-muted truncate">{rec.category} • {rec.affected_resources?.[0] || "Multiple resources"}</p>
                    {rec.auto_fix_supported && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-ci-secure mt-0.5"><Zap size={9} />Auto-fix available</span>
                    )}
                  </div>
                  <ArrowRight size={13} className="text-ci-muted shrink-0 mt-0.5" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Attack paths row ─────────────────────────────────────── */}
      {attackPaths.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><Target size={15} className="text-ci-warning" />Attack Paths</h3>
            <Link to="/attack-paths" className="text-[11px] text-ci-accent hover:underline flex items-center gap-1">View all ({attackPaths.length}) <ArrowRight size={10} /></Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {attackPaths.slice(0, 3).map((ap) => (
              <Link key={ap.attack_id || ap.id} to="/attack-paths" className="glass rounded-xl p-4 hover:border-ci-glow/30 transition-colors no-underline">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase border ${PRIORITY_COLOR[ap.risk] || PRIORITY_COLOR.High}`}>{ap.risk} RISK</span>
                  <span className="text-[10px] text-ci-muted font-mono">{ap.attack_id}</span>
                </div>
                <p className="text-sm font-semibold text-white">{ap.title}</p>
                <p className="text-[11px] text-ci-muted mt-1 line-clamp-2">{ap.description}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
