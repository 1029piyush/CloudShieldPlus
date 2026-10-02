import { useEffect, useState } from 'react';
import { FileText, Download, ShieldAlert, Target, BookmarkCheck, Layers3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboard } from '@/context/DashboardContext';
import api from '@/services/api';
import { toast } from 'sonner';

export default function ReportsPage() {
  useEffect(() => { document.title = 'CloudShieldPlus | Reports'; }, []);
  const { findings = [], attackPaths = [], recommendations = [], services = [], scans = [] } = useDashboard();
  const [downloading, setDownloading] = useState(false);
  const latestScan = scans.find((scan) => scan.status?.toLowerCase() === 'completed');

  const downloadReport = async () => {
    setDownloading(true);
    try {
      const response = await api.get('/reports/pdf', { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cloudshield-security-report-scan-${latestScan?.id || 'latest'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Security report downloaded.');
    } catch (error) {
      let message = error.response?.data?.message;
      if (!message && error.response?.data instanceof Blob) {
        try {
          const payload = JSON.parse(await error.response.data.text());
          message = payload.message;
        } catch {
          message = null;
        }
      }
      toast.error(message || 'Run a completed scan before downloading a report.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="glass rounded-2xl p-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
          <FileText size={18} className="text-ci-accent" />
          Security Reports
        </h2>
        <p className="text-xs text-ci-muted">Download comprehensive security posture reports.</p>
      </div>

      <div className="glass rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white mb-1">Full Security Assessment Report</h3>
          <p className="text-xs text-ci-muted">Complete findings, attack paths, remediation recommendations, and scan metadata.</p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadReport} disabled={downloading}>
          <Download size={14} /> {downloading ? 'Preparing...' : 'Download PDF'}
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ['Findings', findings.length, ShieldAlert, 'text-ci-critical'],
          ['Attack paths', attackPaths.length, Target, 'text-ci-warning'],
          ['Recommendations', recommendations.length, BookmarkCheck, 'text-ci-secure'],
          ['Services', services.length, Layers3, 'text-ci-accent'],
        ].map(([label, value, Icon, color]) => (
          <div key={label} className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-ci-muted">{label}</span>
              <Icon size={15} className={color} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {!latestScan && scans.length === 0 && <p className="text-xs text-ci-muted">Complete a scan to generate the downloadable report.</p>}
    </div>
  );
}
