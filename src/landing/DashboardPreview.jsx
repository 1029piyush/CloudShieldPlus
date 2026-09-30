import React from "react";
import Reveal from "@/components/Reveal";
import {
  dashboardMetrics,
  securityActivity,
  threatDistribution,
  securityEvents,
  DEMO_NOTE,
} from "@/lib/cloudintercept-data";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ShieldCheck,
  Siren,
  Activity,
  Network,
  LayoutDashboard,
  ShieldAlert,
  BarChart3,
  Bell,
  FileText,
  Settings,
  Search,
} from "lucide-react";

const sidebarIcons = [LayoutDashboard, ShieldAlert, Network, Siren, BarChart3, Bell, FileText, Settings];
const metricIcons = { ShieldCheck, Siren, Activity, Network };

const toneText = {
  secure: "text-ci-secure",
  warning: "text-ci-warning",
  critical: "text-ci-critical",
  neutral: "text-ci-glow",
};
const toneBg = {
  secure: "bg-ci-secure/12",
  warning: "bg-ci-warning/12",
  critical: "bg-ci-critical/12",
  neutral: "bg-ci-accent/12",
};

const sevTone = {
  Critical: "text-ci-critical bg-ci-critical/12",
  High: "text-ci-warning bg-ci-warning/12",
  Medium: "text-ci-warning bg-ci-warning/10",
  Low: "text-ci-secure bg-ci-secure/12",
};

export default function DashboardPreview() {
  return (
    <section id="monitoring" className="relative z-10 bg-ci-bg py-24">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ci-glow">
            One View
          </p>
          <h2
            className="mt-3 font-semibold text-white tracking-tight"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)" }}
          >
            Complete Security Visibility
          </h2>
          <p className="mt-4 text-sm text-ci-muted">
            A single pane of glass across monitoring, threats, and analytics.
          </p>
        </Reveal>

        <Reveal className="mt-12">
          <div className="rounded-3xl glass-strong overflow-hidden glow-cyan">
            <div className="grid md:grid-cols-[220px_1fr]">
              {/* Sidebar */}
              <div className="hidden md:flex flex-col gap-1 border-r border-white/10 bg-ci-panel/60 p-4">
                <div className="px-3 py-2 mb-2 text-xs font-semibold uppercase tracking-wider text-ci-muted">
                  Navigation
                </div>
                {["Overview", "Security Events", "Network Monitor", "Threat Detection", "Analytics", "Alerts", "Reports", "Settings"].map(
                  (n, i) => {
                    const Icon = sidebarIcons[i];
                    return (
                      <div
                        key={n}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                          i === 0 ? "bg-ci-accent/15 text-white" : "text-ci-muted"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {n}
                      </div>
                    );
                  }
                )}
              </div>

              {/* Main */}
              <div className="p-5 sm:p-6">
                {/* Topbar */}
                <div className="flex items-center justify-between gap-3 mb-5">
                  <p className="text-sm font-semibold text-white">Overview</p>
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-ci-muted">
                      <Search className="w-3.5 h-3.5" />
                      Searchâ€¦
                    </div>
                    <div className="w-8 h-8 rounded-full bg-ci-accent/20 flex items-center justify-center text-xs font-semibold text-ci-glow">
                      CI
                    </div>
                  </div>
                </div>

                {/* Metric cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {dashboardMetrics.map((m) => {
                    const Icon = metricIcons[m.icon] ?? Activity;
                    return (
                      <div key={m.label} className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
                        <div className="flex items-center justify-between">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${toneBg[m.tone]}`}>
                            <Icon className={`w-4 h-4 ${toneText[m.tone]}`} />
                          </div>
                          <span className="text-[11px] text-ci-muted">{m.trend}</span>
                        </div>
                        <p className="mt-3 text-2xl font-bold text-white">
                          {m.value}
                          <span className="text-sm font-medium text-ci-muted">{m.unit}</span>
                        </p>
                        <p className="text-[11px] uppercase tracking-wider text-ci-muted mt-0.5">
                          {m.label}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Charts */}
                <div className="mt-4 grid lg:grid-cols-[1.6fr_1fr] gap-4">
                  <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-white">Security Activity</p>
                      <span className="text-[11px] text-ci-muted">{DEMO_NOTE}</span>
                    </div>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={securityActivity} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="ciArea" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#20C4E8" stopOpacity={0.5} />
                              <stop offset="100%" stopColor="#20C4E8" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,232,255,0.08)" vertical={false} />
                          <XAxis dataKey="time" tick={{ fill: "#A9C3D9", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "#A9C3D9", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{
                              background: "rgba(7,26,47,0.95)",
                              border: "1px solid rgba(125,232,255,0.2)",
                              borderRadius: 12,
                              fontSize: 12,
                            }}
                            labelStyle={{ color: "#7DE8FF" }}
                          />
                          <Area type="monotone" dataKey="events" stroke="#20C4E8" strokeWidth={2} fill="url(#ciArea)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-white">Threat Distribution</p>
                      <span className="text-[11px] text-ci-muted">{DEMO_NOTE}</span>
                    </div>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={threatDistribution}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={42}
                            outerRadius={64}
                            paddingAngle={3}
                            stroke="none"
                          >
                            {threatDistribution.map((d) => (
                              <Cell key={d.name} fill={d.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: "rgba(7,26,47,0.95)",
                              border: "1px solid rgba(125,232,255,0.2)",
                              borderRadius: 12,
                              fontSize: 12,
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      {threatDistribution.map((d) => (
                        <div key={d.name} className="flex items-center gap-1.5 text-[11px] text-ci-muted">
                          <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                          {d.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Events table */}
                <div className="mt-4 rounded-xl bg-white/[0.03] border border-white/10 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-white">Recent Security Events</p>
                    <span className="text-[11px] text-ci-muted">{DEMO_NOTE}</span>
                  </div>
                  <div className="overflow-x-auto ci-scroll">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-[11px] uppercase tracking-wider text-ci-muted">
                          <th className="font-medium pb-2">Event</th>
                          <th className="font-medium pb-2 hidden sm:table-cell">Source</th>
                          <th className="font-medium pb-2">Severity</th>
                          <th className="font-medium pb-2 text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {securityEvents.slice(0, 5).map((e, i) => (
                          <tr key={i} className="border-t border-white/5">
                            <td className="py-2.5 text-white">{e.type}</td>
                            <td className="py-2.5 text-ci-muted hidden sm:table-cell">{e.source}</td>
                            <td className="py-2.5">
                              <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ${sevTone[e.severity] ?? ""}`}>
                                {e.severity}
                              </span>
                            </td>
                            <td className="py-2.5 text-right text-ci-muted">{e.time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
