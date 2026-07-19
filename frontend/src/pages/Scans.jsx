import { useEffect, useState } from "react";
import api from "../services/api";
import {
    Activity,
    Play,
    Eye,
    CheckCircle,
    XCircle,
    Loader2,
    Calendar,
    Clock,
    AlertTriangle,
    Shield,
    Key,
    UserCheck,
} from "lucide-react";

function Scans({ selectedAccountId, onScanCompleted }) {
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedScan, setSelectedScan] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    // Scan execution progress states
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressText, setProgressText] = useState("");
    const [scanError, setScanError] = useState("");

    const loadScans = async () => {
        setLoading(true);
        try {
            const res = await api.get("/scans");
            setScans(res.data.scans || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadScans();
    }, [selectedAccountId]);

    const runSimulatedProgress = (finishPromise) => {
        setScanning(true);
        setScanError("");
        setProgress(5);
        setProgressText("Initializing security context...");

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) {
                    clearInterval(interval);
                    return 95;
                }
                const nextVal = prev + Math.floor(Math.random() * 8) + 3;
                if (nextVal < 20) setProgressText("Authenticating environment...");
                else if (nextVal < 40) setProgressText("Connecting AWS Session...");
                else if (nextVal < 60) setProgressText("Scanning resources (Discovery Engine)...");
                else if (nextVal < 80) setProgressText("Evaluating security rules...");
                else if (nextVal < 95) setProgressText("Correlating threat scenarios (Attack Path Engine)...");
                return nextVal;
            });
        }, 300);

        finishPromise
            .then((res) => {
                clearInterval(interval);
                setProgress(100);
                setProgressText("Scan stored successfully!");
                setTimeout(() => {
                    setScanning(false);
                    loadScans();
                    if (onScanCompleted) {
                        onScanCompleted();
                    }
                }, 1000);
            })
            .catch((err) => {
                clearInterval(interval);
                setScanning(false);
                setScanError(err.response?.data?.message || "AWS scanning failed.");
            });
    };

    const handleStartScan = () => {
        if (!selectedAccountId) return;
        const promise = api.post("/scans", { aws_account_id: selectedAccountId });
        runSimulatedProgress(promise);
    };

    const handleViewDetails = async (id) => {
        setDetailsLoading(true);
        try {
            const res = await api.get(`/scans/${id}`);
            setSelectedScan(res.data.scan);
        } catch (err) {
            console.error(err);
        } finally {
            setDetailsLoading(false);
        }
    };

    return (
        <div style={{ padding: "30px", color: "#F1F5F9", fontFamily: "Inter, sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                <div>
                    <h1 style={{ fontSize: "28px", fontWeight: "700", color: "white", margin: 0 }}>
                        Security Scans
                    </h1>
                    <p style={{ fontSize: "14px", color: "#94A3B8", marginTop: "4px" }}>
                        Initiate scans, monitor execution stages, and view historical scan reports.
                    </p>
                </div>

                {selectedAccountId && !scanning && (
                    <button
                        onClick={handleStartScan}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px 18px",
                            backgroundColor: "#38BDF8",
                            color: "#0F172A",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => (e.target.style.backgroundColor = "#7DD3FC")}
                        onMouseLeave={(e) => (e.target.style.backgroundColor = "#38BDF8")}
                    >
                        <Play size={16} /> Run Security Scan
                    </button>
                )}
            </div>

            {/* Scan Error Message */}
            {scanError && (
                <div style={{ backgroundColor: "#881337", color: "#FDA4AF", padding: "12px 16px", borderRadius: "8px", fontSize: "14px", marginBottom: "20px" }}>
                    <strong style={{ display: "block", marginBottom: "4px" }}>Scan Failure</strong>
                    {scanError}
                </div>
            )}

            {/* Scanning Progress Bar */}
            {scanning && (
                <div style={{ backgroundColor: "#0F172A", border: "1px solid #334155", padding: "24px", borderRadius: "10px", marginBottom: "30px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", alignItems: "center" }}>
                        <span style={{ fontSize: "14px", color: "#94A3B8", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Loader2 size={16} className="animate-spin" style={{ color: "#38BDF8" }} />
                            {progressText}
                        </span>
                        <span style={{ fontSize: "14px", fontWeight: "bold", color: "white" }}>{progress}%</span>
                    </div>
                    <div style={{ height: "8px", backgroundColor: "#1E293B", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ width: `${progress}%`, height: "100%", backgroundColor: "#38BDF8", transition: "width 0.2s ease-out" }}></div>
                    </div>
                </div>
            )}

            {/* Scan History list */}
            <div style={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px", padding: "25px" }}>
                <h3 style={{ fontSize: "18px", color: "white", margin: "0 0 20px 0", borderBottom: "1px solid #1E293B", paddingBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Activity size={18} style={{ color: "#38BDF8" }} /> Historical Scan Reports
                </h3>

                {loading ? (
                    <div style={{ color: "#94A3B8", textAlign: "center", padding: "40px" }}>Loading scan history...</div>
                ) : scans.length === 0 ? (
                    <div style={{ color: "#94A3B8", textAlign: "center", padding: "40px" }}>
                        No scans recorded. Use the "Run Security Scan" button to scan the active environment.
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #334155", color: "#94A3B8" }}>
                                    <th style={{ padding: "10px" }}>Scan ID</th>
                                    <th style={{ padding: "10px" }}>Environment</th>
                                    <th style={{ padding: "10px" }}>Status</th>
                                    <th style={{ padding: "10px" }}>Triggered At</th>
                                    <th style={{ padding: "10px" }}>Duration</th>
                                    <th style={{ padding: "10px", textAlign: "right" }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scans.map((s) => (
                                    <tr key={s.id} style={{ borderBottom: "1px solid #1E293B" }}>
                                        <td style={{ padding: "14px 10px", fontWeight: "600", color: "white" }}>#{s.id}</td>
                                        <td style={{ padding: "14px 10px" }}>{s.account_name}</td>
                                        <td style={{ padding: "14px 10px" }}>
                                            <span style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "6px",
                                                fontSize: "12px",
                                                fontWeight: "600",
                                                padding: "4px 8px",
                                                borderRadius: "4px",
                                                backgroundColor: s.status === "Completed" ? "#064E3B" : "#7F1D1D",
                                                color: s.status === "Completed" ? "#A7F3D0" : "#FCA5A5",
                                            }}>
                                                {s.status === "Completed" ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                {s.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: "14px 10px", color: "#94A3B8" }}>
                                            {new Date(s.started_at).toLocaleString()}
                                        </td>
                                        <td style={{ padding: "14px 10px", color: "#94A3B8" }}>
                                            {s.duration?.toFixed(1)}s
                                        </td>
                                        <td style={{ padding: "14px 10px", textAlign: "right" }}>
                                            <button
                                                onClick={() => handleViewDetails(s.id)}
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                    padding: "6px 12px",
                                                    backgroundColor: "#1E293B",
                                                    color: "#38BDF8",
                                                    border: "1px solid #334155",
                                                    borderRadius: "6px",
                                                    cursor: "pointer",
                                                    fontSize: "13px",
                                                    fontWeight: "500",
                                                }}
                                                onMouseEnter={(e) => (e.target.style.backgroundColor = "#334155")}
                                                onMouseLeave={(e) => (e.target.style.backgroundColor = "#1E293B")}
                                            >
                                                Inspect <Eye size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Scan Report Detail Modal Overlay */}
            {selectedScan && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.8)", display: "flex", justifyContent: "flex-end", zIndex: 1000 }}>
                    <div style={{ width: "700px", backgroundColor: "#0F172A", borderLeft: "1px solid #1E293B", height: "100%", padding: "40px", overflowY: "auto", boxSizing: "border-box" }}>
                        {/* Modal Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "30px", borderBottom: "1px solid #1E293B", paddingBottom: "20px" }}>
                            <div>
                                <span style={{ fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", color: "#38BDF8" }}>
                                    Historical Scan Snapshot
                                </span>
                                <h2 style={{ fontSize: "22px", color: "white", margin: "6px 0 0 0" }}>
                                    Scan #{selectedScan.id} - {selectedScan.account_name}
                                </h2>
                            </div>
                            <button
                                onClick={() => setSelectedScan(null)}
                                style={{ backgroundColor: "#1E293B", color: "#94A3B8", border: "1px solid #334155", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}
                            >
                                Close Report
                            </button>
                        </div>

                        {/* Scan Metadata */}
                        <div style={{ display: "flex", gap: "25px", marginBottom: "30px", backgroundColor: "#1E293B", padding: "16px 20px", borderRadius: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                                <Calendar size={16} style={{ color: "#94A3B8" }} />
                                <span>{new Date(selectedScan.started_at).toLocaleString()}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                                <Clock size={16} style={{ color: "#94A3B8" }} />
                                <span>Duration: {selectedScan.duration?.toFixed(1)}s</span>
                            </div>
                        </div>

                        {/* Critical Scenarios */}
                        <div style={{ marginBottom: "30px" }}>
                            <h3 style={{ fontSize: "16px", color: "white", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                                <Shield size={16} style={{ color: "#EF4444" }} /> Identified Attack Scenarios ({selectedScan.attack_paths.length})
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {selectedScan.attack_paths.map((ap) => (
                                    <div key={ap.id} style={{ backgroundColor: "#1E293B", padding: "16px", borderRadius: "8px", borderLeft: "4px solid #EF4444" }}>
                                        <h4 style={{ fontSize: "14px", fontWeight: "600", color: "white", margin: "0 0 6px 0" }}>{ap.title}</h4>
                                        <p style={{ fontSize: "13px", color: "#94A3B8", margin: "0 0 10px 0" }}>{ap.description}</p>
                                        <span style={{ fontSize: "11px", color: "#EF4444", fontWeight: "bold" }}>Risk Level: {ap.risk}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Findings list */}
                        <div>
                            <h3 style={{ fontSize: "16px", color: "white", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                                <AlertTriangle size={16} style={{ color: "#F59E0B" }} /> Security Findings ({selectedScan.findings.length})
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {selectedScan.findings.map((f) => (
                                    <div key={f.id} style={{ backgroundColor: "#1E293B", padding: "16px", borderRadius: "8px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                            <h4 style={{ fontSize: "14px", fontWeight: "600", color: "white" }}>{f.title}</h4>
                                            <span style={{ fontSize: "11px", color: f.severity === "Critical" ? "#EF4444" : "#F59E0B", fontWeight: "bold" }}>
                                                {f.severity}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "8px" }}>
                                            Resource: <span style={{ color: "white" }}>{f.resource}</span> | Service: <span style={{ color: "white" }}>{f.service}</span>
                                        </div>
                                        <p style={{ fontSize: "13px", color: "#E2E8F0" }}>{f.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Scans;
