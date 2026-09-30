import { useEffect } from 'react';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ReportsPage() {
  useEffect(() => { document.title = 'CloudShieldPlus | Reports'; }, []);

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
          <p className="text-xs text-ci-muted">Complete findings, attack paths, and remediation recommendations.</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href="/api/reports/pdf" target="_blank" rel="noreferrer" className="flex items-center gap-2">
            <Download size={14} /> Download PDF
          </a>
        </Button>
      </div>
    </div>
  );
}
