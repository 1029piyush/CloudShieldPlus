import { useEffect, useState } from "react";
import { FileText, Download, Shield, AlertTriangle, TrendingUp, BookmarkCheck, Clock, ChevronRight } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import api from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

const SEV_VARIANT = { Critical: "critical", High: "high", Medium: "medium", Low: "low" };

function MetricPill({ label, value, color = "text-ci-accent" }) {
  return (
    <div className="flex flex-col items-center glass rounded-xl px-4 py-3 min-w-[80px]">
      <span className={`text-xl font-bold ${color}`}>{value}</span>
      <span className="text-[10px] text-ci-muted uppercase tracking-wider mt-0.5">{label}</span>
    </div>
  );
}

export default function ReportsPage() {
  useEffect(() => { document.title = "CloudIntercept | Reports"; }, []);
  const { selectedAccountId } = useDashboard();
  const [reports, setReports]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [error, setError]         = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError("");
      try {
        const params = selectedAccountId ? `?aws_account_id=${selectedAccountId}` : "";
        const res = await api.get(`/reports${params}`);
        setReports(res.data?.reports ?? []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load reports.");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [selectedAccountId]);

  const handleDownload = async (scanId, accountName, scanDate) => {
    setDownloading(scanId);
    try {
      const res = await api.get(`/reports/pdf/${scanId}`, { responseType: "blob" });
      const url  = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href  = url;
      const date = new Date(scanDate).toISOString().split("T")[0];
      link.download = `cloudintercept-${(accountName || "report").replace(/\s+/g, "-").toLowerCase()}-${date}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download report. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="glass rounded-2xl p-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
          <FileText size={18} className="text-ci-accent" />
          Security Assessment Reports
        </h2>
        <p className="text-xs text-ci-muted">
          Download comprehensive PDF reports for each completed scan — includes findings, attack paths, and remediation recommendations.
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : error ? (
        <div className="glass rounded-2xl p-6 text-center">
          <p className="text-ci-critical text-sm">{error}</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center gap-4 text-center">
          <FileText size={44} className="text-ci-muted" />
          <div>
            <p className="text-white font-semibold">No reports available</p>
            <p className="text-ci-muted text-sm mt-1">
              Run a scan first — reports are generated automatically when a scan completes.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reports.map((report) => (
            <div key={report.scan_id} className="glass rounded-2xl p-5 flex flex-col gap-4">

              {/* Top row: title + download button */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield size={15} className="text-ci-accent" />
                    <h3 className="text-sm font-bold text-white">
                      {report.account_name}
                    </h3>
                    <span className="text-[10px] font-mono text-ci-muted bg-white/5 rounded px-2 py-0.5">
                      {report.aws_account_id}
                    </span>
                    <Badge variant="low" className="text-[10px]">Completed</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-ci-muted">
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {new Date(report.scan_date).toLocaleString()}
                    </span>
                    <span>Region: {report.region}</span>
                    {report.duration && (
                      <span>Duration: {Math.round(report.duration)}s</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDownload(report.scan_id, report.account_name, report.scan_date)}
                  disabled={downloading === report.scan_id}
                  className="flex items-center gap-2 bg-ci-accent text-ci-bg font-semibold text-xs px-4 py-2 rounded-lg hover:bg-ci-glow transition-colors disabled:opacity-50 shrink-0"
                >
                  {downloading === report.scan_id ? (
                    <><Spinner className="w-4 h-4" /> Generating...</>
                  ) : (
                    <><Download size={14} /> Download PDF</>
                  )}
                </button>
              </div>

              {/* Metrics row */}
              <div className="flex flex-wrap gap-3">
                <MetricPill
                  label="Findings"
                  value={report.findings_count}
                  color={report.findings_count > 0 ? "text-ci-warning" : "text-ci-secure"}
                />
                <MetricPill
                  label="Critical"
                  value={report.critical_count}
                  color={report.critical_count > 0 ? "text-ci-critical" : "text-ci-secure"}
                />
                <MetricPill
                  label="Attack Paths"
                  value={report.attack_paths_count}
                  color={report.attack_paths_count > 0 ? "text-ci-warning" : "text-ci-secure"}
                />
                <MetricPill
                  label="Recommendations"
                  value={report.recommendations_count}
                  color="text-ci-accent"
                />
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
