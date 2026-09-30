import { useEffect } from "react";
import { Activity } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import { Badge } from "@/components/ui/badge";

function scanVariant(status) {
  if (status === "Completed") return "low";
  if (status === "Running") return "default";
  return "critical";
}

export default function ScansPage() {
  useEffect(() => { document.title = "CloudShieldPlus | Scans"; }, []);
  const { scans } = useDashboard();

  return (
    <div className="flex flex-col gap-6">
      <div className="glass rounded-2xl p-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
          <Activity size={18} className="text-ci-accent" />
          Scan History ({scans.length})
        </h2>
        <p className="text-xs text-ci-muted">All environment security scan snapshots.</p>
      </div>
      <div className="glass rounded-2xl overflow-hidden">
        {scans.length === 0 ? (
          <div className="text-center py-12 text-ci-muted">No scan history recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {["ID", "Status", "Started At", "Duration"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs text-ci-muted uppercase tracking-wider font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scans.map(s => (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="px-5 py-3 font-mono text-ci-accent font-bold">#{s.id}</td>
                    <td className="px-5 py-3"><Badge variant={scanVariant(s.status)}>{s.status}</Badge></td>
                    <td className="px-5 py-3 text-ci-muted">{new Date(s.started_at).toLocaleString()}</td>
                    <td className="px-5 py-3 text-ci-muted">{s.duration ? `${s.duration}s` : "< 1s"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
