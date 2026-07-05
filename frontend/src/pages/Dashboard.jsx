import { useEffect, useState } from "react";
import api from "../services/api";

function Dashboard() {
    const [metrics, setMetrics] = useState(null);

    const loadMetrics = async () => {
        try {
            const res = await api.get("/metrics");
            setMetrics(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadMetrics();

        const interval = setInterval(loadMetrics, 5000);

        return () => clearInterval(interval);
    }, []);

    if (!metrics) {
        return <h2>Loading...</h2>;
    }

    return (
        <div style={{ padding: "30px" }}>
            <h1>CloudShield+</h1>

            <h2>Live System Metrics</h2>

            <p>CPU : {metrics.cpu}%</p>

            <p>Memory : {metrics.memory}%</p>

            <p>Disk : {metrics.disk}%</p>

            <p>Network Sent : {metrics.network_sent} MB</p>

            <p>Network Received : {metrics.network_recv} MB</p>

            <p>Status : {metrics.status}</p>
        </div>
    );
}

export default Dashboard;