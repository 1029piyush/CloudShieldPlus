import { useEffect } from 'react';
import { Server, Trash2, Plus } from 'lucide-react';
import { useDashboard } from '@/context/DashboardContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AccountsPage() {
  useEffect(() => { document.title = 'CloudShieldPlus | AWS Accounts'; }, []);
  const {
    accounts, handleDeleteAccount, handleConnectAccount,
    accountName, setAccountName, accessKey, setAccessKey,
    secretKey, setSecretKey, region, setRegion,
    formLoading, formMessage,
  } = useDashboard();

  return (
    <div className="flex flex-col gap-6">
      <div className="glass rounded-2xl p-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
          <Server size={18} className="text-ci-accent" />
          Connected AWS Environments ({accounts.length})
        </h2>
        {accounts.length === 0 ? (
          <p className="text-sm text-ci-muted">No AWS accounts connected yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {['Name','Account ID','Region','Last Scan','Status',''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-ci-muted uppercase tracking-wider font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {accounts.map(acc => (
                  <tr key={acc.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="px-4 py-3 font-semibold text-white">{acc.account_name}</td>
                    <td className="px-4 py-3 font-mono text-ci-muted text-xs">{acc.aws_account_id}</td>
                    <td className="px-4 py-3 text-ci-muted">{acc.region}</td>
                    <td className="px-4 py-3 text-ci-muted text-xs">{acc.last_scan_time ? new Date(acc.last_scan_time).toLocaleString() : 'Never'}</td>
                    <td className="px-4 py-3"><Badge variant={acc.last_scan_status === 'Completed' ? 'low' : 'critical'}>{acc.last_scan_status || 'Never'}</Badge></td>
                    <td className="px-4 py-3 text-right"><button onClick={() => handleDeleteAccount(acc.id)} className="text-ci-muted hover:text-ci-critical p-1"><Trash2 size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="glass rounded-2xl p-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
          <Plus size={18} className="text-ci-accent" /> Connect New AWS Account
        </h2>
        {formMessage && (
          <div className={formMessage.includes('successfully') ? 'rounded-lg px-4 py-2 text-xs font-semibold mb-4 bg-ci-secure/15 text-ci-secure border border-ci-secure/30' : 'rounded-lg px-4 py-2 text-xs font-semibold mb-4 bg-ci-critical/15 text-ci-critical border border-ci-critical/30'}>{formMessage}</div>
        )}
        <form onSubmit={handleConnectAccount} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-ci-muted font-semibold">Connection Name</label>
            <input type="text" value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Production Workloads" required className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-ci-accent/60 transition-colors" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-ci-muted font-semibold">AWS Access Key ID</label>
            <input type="text" value={accessKey} onChange={e => setAccessKey(e.target.value)} placeholder="AKIA..." required className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-ci-accent/60 transition-colors" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-ci-muted font-semibold">AWS Secret Access Key</label>
            <input type="password" value={secretKey} onChange={e => setSecretKey(e.target.value)} placeholder="..." required className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-ci-accent/60 transition-colors" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-ci-muted font-semibold">AWS Region</label>
            <select value={region} onChange={e => setRegion(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-ci-accent/60 transition-colors">
              {['us-east-1','us-east-2','us-west-1','us-west-2','eu-central-1','eu-west-1','ap-south-1'].map(r => (<option key={r} value={r}>{r}</option>))}
            </select>
          </div>
          <div className="sm:col-span-2 flex justify-end mt-2">
            <Button type="submit" disabled={formLoading}>{formLoading ? 'Validating...' : 'Connect AWS Account'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
