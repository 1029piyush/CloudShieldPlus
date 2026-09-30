import { ShieldAlert, Activity, Search, TrendingUp, Network, FileText } from "lucide-react";
import Reveal from "@/components/Reveal";

const MOCK_TILES = [
  { label: "Active Threats", value: "3", color: "text-ci-critical", bg: "bg-ci-critical/10 border-ci-critical/20" },
  { label: "Findings", value: "14", color: "text-ci-warning", bg: "bg-ci-warning/10 border-ci-warning/20" },
  { label: "Services", value: "26", color: "text-ci-accent", bg: "bg-ci-accent/10 border-ci-accent/20" },
  { label: "Secure Score", value: "87%", color: "text-ci-secure", bg: "bg-ci-secure/10 border-ci-secure/20" },
];

const MOCK_NAV = ["Overview", "Findings", "Attack Paths", "Reports"];

export default function DashboardPreviewSection() {
  return (
    <section className="py-24 px-6 bg-ci-bg" id="preview">
      <div className="max-w-5xl mx-auto">
        <Reveal className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest text-ci-accent font-semibold mb-3">
            Dashboard Preview
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Security console,{" "}
            <span className="text-gradient-cyan">at a glance</span>
          </h2>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="glass-strong rounded-3xl glow-cyan p-2 overflow-hidden">
            {/* Mock titlebar */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/8">
              <span className="w-3 h-3 rounded-full bg-ci-critical/60" />
              <span className="w-3 h-3 rounded-full bg-ci-warning/60" />
              <span className="w-3 h-3 rounded-full bg-ci-secure/60" />
              <span className="ml-3 text-xs text-ci-muted font-mono">CloudShieldPlus â€” Security Console</span>
            </div>

            <div className="flex min-h-[280px]">
              {/* Mock sidebar strip */}
              <div className="hidden sm:flex flex-col gap-1 p-3 w-32 border-r border-white/8">
                {MOCK_NAV.map((item, i) => (
                  <div key={item} className={`px-3 py-2 rounded-lg text-[11px] font-medium ${i === 0 ? "bg-ci-accent/15 text-ci-accent" : "text-ci-muted"}`}>
                    {item}
                  </div>
                ))}
              </div>

              {/* Mock content */}
              <div className="flex-1 p-4 grid grid-cols-2 md:grid-cols-4 gap-3 content-start">
                {MOCK_TILES.map(({ label, value, color, bg }) => (
                  <div key={label} className={`glass rounded-xl p-4 border ${bg}`}>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    <p className="text-[11px] text-ci-muted mt-1">{label}</p>
                  </div>
                ))}
                {/* Mock chart bar */}
                <div className="col-span-2 md:col-span-4 glass rounded-xl p-4">
                  <p className="text-[11px] text-ci-muted mb-3 font-semibold uppercase tracking-wider">Severity Distribution</p>
                  <div className="flex items-end gap-2 h-16">
                    {[40, 70, 55, 30, 80, 45, 65].map((h, i) => (
                      <div key={i} className="flex-1 rounded-sm bg-ci-accent/40" style={{ height: `${h}%` }} />
                    ))}
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

