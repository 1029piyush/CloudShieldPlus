import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import api from "@/services/api";

// ── sessionStorage helpers (module-level so they are always defined first) ───
function restoreCache(key, fallback) {
  try {
    const v = sessionStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function saveCache(key, value) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch {}
}

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {

  // ── State ──────────────────────────────────────────────────────────────────
  const [accounts,        setAccounts]        = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(() => {
    try { const v = sessionStorage.getItem("csp_accountId"); return v ? parseInt(v, 10) : null; } catch { return null; }
  });
  const [summary,         setSummary]         = useState(() => restoreCache("csp_summary", {}));
  const [findings,        setFindings]        = useState(() => restoreCache("csp_findings", []));
  const [attackPaths,     setAttackPaths]     = useState(() => restoreCache("csp_attackPaths", []));
  const [recommendations, setRecommendations] = useState(() => restoreCache("csp_recommendations", []));
  const [services,        setServices]        = useState(() => restoreCache("csp_services", []));
  const [mapNodes,        setMapNodes]        = useState(() => restoreCache("csp_mapNodes", []));
  const [mapEdges,        setMapEdges]        = useState(() => restoreCache("csp_mapEdges", []));
  const [scans,           setScans]           = useState(() => restoreCache("csp_scans", []));
  const [loading,         setLoading]         = useState(false);
  const [scanning,        setScanning]        = useState(false);
  const [scanProgress,    setScanProgress]    = useState(0);
  const [scanStage,       setScanStage]       = useState("");
  const [error,           setError]           = useState(null);
  const [selectedDrawerResource, setSelectedDrawerResource] = useState(null);
  const refreshRef = useRef(null);

  // ── Persist to sessionStorage whenever data changes ────────────────────────
  useEffect(() => { saveCache("csp_findings",        findings);        }, [findings]);
  useEffect(() => { saveCache("csp_attackPaths",     attackPaths);     }, [attackPaths]);
  useEffect(() => { saveCache("csp_recommendations", recommendations); }, [recommendations]);
  useEffect(() => { saveCache("csp_services",        services);        }, [services]);
  useEffect(() => { saveCache("csp_mapNodes",        mapNodes);        }, [mapNodes]);
  useEffect(() => { saveCache("csp_mapEdges",        mapEdges);        }, [mapEdges]);
  useEffect(() => { saveCache("csp_scans",           scans);           }, [scans]);
  useEffect(() => { saveCache("csp_summary",         summary);         }, [summary]);
  useEffect(() => {
    try { if (selectedAccountId) sessionStorage.setItem("csp_accountId", String(selectedAccountId)); } catch {}
  }, [selectedAccountId]);

  // ── loadAccounts ───────────────────────────────────────────────────────────
  const loadAccounts = useCallback(async () => {
    try {
      const res = await api.get("/aws-accounts");
      const list = res.data?.accounts ?? [];
      setAccounts(list);
      setSelectedAccountId(prev => prev ?? (list.length > 0 ? list[0].id : null));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load AWS accounts.");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── loadData ───────────────────────────────────────────────────────────────
  const loadData = useCallback(async (accountId, silent = false) => {
    if (!accountId) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [findingsRes, attackPathsRes, recsRes, dashboardRes, mapRes, scansRes] =
        await Promise.allSettled([
          api.get(`/findings?aws_account_id=${accountId}`),
          api.get(`/attack-paths?aws_account_id=${accountId}`),
          api.get(`/recommendations?aws_account_id=${accountId}`),
          api.get(`/dashboard?aws_account_id=${accountId}`),
          api.get(`/resource-map?aws_account_id=${accountId}`),
          api.get(`/scans`),
        ]);

      if (findingsRes.status        === "fulfilled") setFindings(findingsRes.value.data?.findings ?? []);
      if (attackPathsRes.status     === "fulfilled") setAttackPaths(attackPathsRes.value.data?.attack_paths ?? []);
      if (recsRes.status            === "fulfilled") setRecommendations(recsRes.value.data?.recommendations ?? []);
      if (dashboardRes.status       === "fulfilled") {
        setSummary(dashboardRes.value.data ?? {});
        setServices(dashboardRes.value.data?.services ?? []);
      }
      if (mapRes.status             === "fulfilled") {
        setMapNodes(mapRes.value.data?.nodes ?? []);
        setMapEdges(mapRes.value.data?.edges ?? []);
      }
      if (scansRes.status           === "fulfilled") setScans(scansRes.value.data?.scans ?? []);

      const failed = [findingsRes, attackPathsRes, recsRes, dashboardRes, mapRes, scansRes]
        .filter(r => r.status === "rejected");
      if (failed.length > 0 && !silent) {
        toast.error(failed[0].reason?.response?.data?.message || "Some data could not be loaded.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load security data.";
      setError(msg);
      if (!silent) toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── handleRunScan ──────────────────────────────────────────────────────────
  const handleRunScan = useCallback(async () => {
    if (!selectedAccountId || scanning) return;
    setScanning(true);
    setScanProgress(0);
    setScanStage("Initializing scan...");

    const stages = [
      { label: "Collecting AWS inventory...",        progress: 15 },
      { label: "Analyzing security configurations...", progress: 35 },
      { label: "Running security rules...",          progress: 55 },
      { label: "Correlating attack paths...",        progress: 70 },
      { label: "Generating recommendations...",      progress: 85 },
      { label: "Finalizing report...",               progress: 95 },
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < stages.length) { setScanStage(stages[i].label); setScanProgress(stages[i].progress); i++; }
    }, 1500);

    try {
      await api.post("/scans", { aws_account_id: selectedAccountId });
      setScanProgress(100); setScanStage("Scan complete");
      toast.success("Scan completed successfully.");
      await loadData(selectedAccountId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Scan failed. Please try again.");
    } finally {
      clearInterval(interval);
      setTimeout(() => { setScanning(false); setScanProgress(0); setScanStage(""); }, 1500);
    }
  }, [selectedAccountId, scanning, loadData]);

  // ── handleConnectAccount ───────────────────────────────────────────────────
  const handleConnectAccount = useCallback(async (form) => {
    try {
      await api.post("/aws-accounts", form);
      toast.success("AWS account connected successfully.");
      await loadAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to connect AWS account.");
      throw err;
    }
  }, [loadAccounts]);

  // ── handleDeleteAccount ────────────────────────────────────────────────────
  const handleDeleteAccount = useCallback(async (id) => {
    try {
      await api.delete(`/aws-accounts/${id}`);
      toast.success("AWS account removed.");
      if (selectedAccountId === id) {
        setSelectedAccountId(null);
        setFindings([]); setAttackPaths([]); setRecommendations([]);
        setServices([]); setMapNodes([]); setMapEdges([]); setScans([]); setSummary({});
      }
      await loadAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove AWS account.");
    }
  }, [selectedAccountId, loadAccounts]);

  // ── Resource drawer ────────────────────────────────────────────────────────
  const handleOpenResourceDrawer  = useCallback((resourceId, serviceName) => {
    setSelectedDrawerResource(resourceId ? { resourceId, serviceName } : null);
  }, []);
  const handleCloseResourceDrawer = useCallback(() => setSelectedDrawerResource(null), []);

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => { loadAccounts(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedAccountId) loadData(selectedAccountId);
  }, [selectedAccountId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Background refresh every 60s (silent - no loading flash)
  useEffect(() => {
    if (refreshRef.current) clearInterval(refreshRef.current);
    if (selectedAccountId) {
      refreshRef.current = setInterval(() => loadData(selectedAccountId, true), 60000);
    }
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, [selectedAccountId, loadData]);

  // ── Context value ──────────────────────────────────────────────────────────
  const value = {
    accounts, selectedAccountId, setSelectedAccountId,
    summary, findings, attackPaths, recommendations, services, mapNodes, mapEdges, scans,
    loading, scanning, scanProgress, scanStage, error,
    selectedDrawerResource,
    handleOpenResourceDrawer, handleCloseResourceDrawer,
    handleRunScan, handleConnectAccount, handleDeleteAccount,
    loadAccounts, loadData,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within a DashboardProvider");
  return ctx;
}

export default DashboardContext;
