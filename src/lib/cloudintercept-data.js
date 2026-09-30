// Clearly-marked demonstration data for the CloudIntercept UI.
// Not real production statistics.

export const DEMO_NOTE = "Demo Data";

export const heroMetrics = [
  { label: "Security Status", value: "Protected", tone: "secure", dot: true },
  { label: "Threat Level", value: "Low", tone: "secure" },
  { label: "Active Monitoring", value: "24/7", tone: "neutral" },
  { label: "Events Today", value: "1,284", tone: "neutral" },
  { label: "Suspicious Activity", value: "7", tone: "warning" },
  { label: "Network Health", value: "98%", tone: "secure" },
];

export const trustIndicators = [
  { title: "Cloud Visibility", desc: "See every resource and connection across your environment." },
  { title: "Threat Monitoring", desc: "Continuous tracking of suspicious activity and signals." },
  { title: "Security Intelligence", desc: "Turn raw events into clear, prioritized insight." },
  { title: "Network Awareness", desc: "Understand traffic flows and exposure in real time." },
];

export const features = [
  { icon: "Activity", title: "Cloud Monitoring", desc: "Monitor cloud and network activity from a centralized interface." },
  { icon: "ShieldAlert", title: "Threat Detection", desc: "Identify suspicious patterns and potentially malicious activity." },
  { icon: "BarChart3", title: "Security Analytics", desc: "Transform raw security events into understandable insights." },
  { icon: "Network", title: "Network Visibility", desc: "Understand activity across monitored systems and connections." },
  { icon: "Siren", title: "Incident Awareness", desc: "Highlight unusual events that may require investigation." },
  { icon: "Database", title: "Data Intelligence", desc: "Organize security information into meaningful dashboards and reports." },
];

export const securityActivity = [
  { time: "00:00", events: 42, threats: 1 },
  { time: "03:00", events: 28, threats: 0 },
  { time: "06:00", events: 55, threats: 2 },
  { time: "09:00", events: 120, threats: 4 },
  { time: "12:00", events: 168, threats: 3 },
  { time: "15:00", events: 142, threats: 5 },
  { time: "18:00", events: 96, threats: 2 },
  { time: "21:00", events: 64, threats: 1 },
];

export const threatDistribution = [
  { name: "Suspicious", value: 38, color: "#F59E0B" },
  { name: "Informational", value: 47, color: "#20C4E8" },
  { name: "Warning", value: 11, color: "#7DE8FF" },
  { name: "Critical", value: 4, color: "#EF4444" },
];

export const securityEvents = [
  { type: "Suspicious Login Attempt", severity: "High", source: "203.0.113.44", time: "2 min ago", tone: "warning" },
  { type: "Unusual Network Traffic", severity: "Medium", source: "10.0.4.18", time: "8 min ago", tone: "warning" },
  { type: "Multiple Failed Requests", severity: "Medium", source: "198.51.100.7", time: "14 min ago", tone: "warning" },
  { type: "Unknown External Connection", severity: "Critical", source: "45.77.12.90", time: "21 min ago", tone: "critical" },
  { type: "Abnormal Data Transfer", severity: "High", source: "10.0.2.33", time: "33 min ago", tone: "warning" },
  { type: "Privilege Escalation Attempt", severity: "Critical", source: "iam-user:svc-7", time: "41 min ago", tone: "critical" },
  { type: "Configuration Drift Detected", severity: "Low", source: "S3-bucket-logs", time: "55 min ago", tone: "secure" },
];

export const dashboardMetrics = [
  { label: "Security Score", value: "87", unit: "/100", trend: "+4", icon: "ShieldCheck", tone: "secure" },
  { label: "Active Threats", value: "7", unit: "", trend: "-2", icon: "Siren", tone: "warning" },
  { label: "Events Monitored", value: "1.2M", unit: "", trend: "+12%", icon: "Activity", tone: "neutral" },
  { label: "Network Health", value: "98", unit: "%", trend: "stable", icon: "Network", tone: "secure" },
];

export const sidebarNav = [
  { label: "Overview", icon: "LayoutDashboard", active: true },
  { label: "Security Events", icon: "ShieldAlert" },
  { label: "Network Monitor", icon: "Network" },
  { label: "Threat Detection", icon: "Siren" },
  { label: "Analytics", icon: "BarChart3" },
  { label: "Alerts", icon: "Bell" },
  { label: "Reports", icon: "FileText" },
  { label: "Settings", icon: "Settings" },
];

export const architectureNodes = {
  source: { label: "CLOUD", sub: "Environment" },
  tier: [
    { label: "NETWORK", icon: "Network" },
    { label: "DATA", icon: "Database" },
    { label: "SERVICES", icon: "Boxes" },
  ],
  core: { label: "CLOUDINTERCEPT", sub: "Intelligence Core" },
  output: [
    { label: "MONITORING", icon: "Activity" },
    { label: "ANALYSIS", icon: "ScanSearch" },
    { label: "ALERTS", icon: "Bell" },
  ],
};