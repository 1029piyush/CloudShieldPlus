import psutil
from datetime import datetime

def get_system_metrics():
    net = psutil.net_io_counters()

    metrics = {
        "timestamp": datetime.now(),
        "cpu": psutil.cpu_percent(interval=1),
        "memory": psutil.virtual_memory().percent,
        "disk": psutil.disk_usage("/").percent,
        "network_sent": round(net.bytes_sent / (1024 * 1024), 2),   # MB
        "network_recv": round(net.bytes_recv / (1024 * 1024), 2),   # MB
        "latency": 0.0,  # Placeholder for now
        "status": "Normal"
    }

    return metrics