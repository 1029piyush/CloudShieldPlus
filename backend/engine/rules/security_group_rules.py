from engine.findings import Finding
from engine.rules.severity import severity_for_rule


INTERNET_CIDRS = {"0.0.0.0/0", "::/0"}
DATABASE_PORTS = {
    1433: "Microsoft SQL Server",
    1521: "Oracle Database",
    3306: "MySQL/MariaDB",
    5432: "PostgreSQL",
    6379: "Redis",
    9200: "Elasticsearch",
    27017: "MongoDB",
}
LEGACY_SERVICE_PORTS = {
    21: "FTP",
    23: "Telnet",
    111: "RPCbind",
    445: "SMB",
    2049: "NFS",
}


def _finding(rule_id, group, title, description, recommendation,
             business_impact, evidence, exploitability, correlation_tags):
    return Finding(
        rule_id=rule_id,
        service="SecurityGroups",
        resource=group["group_id"],
        severity=severity_for_rule(rule_id),
        title=title,
        description=description,
        recommendation=recommendation,
        business_impact=business_impact,
        evidence=evidence,
        exploitability=exploitability,
        correlation_tags=correlation_tags,
    ).to_dict()


def _internet_cidrs(rule):
    return [
        cidr
        for cidr in rule.get("ipv4", []) + rule.get("ipv6", [])
        if cidr in INTERNET_CIDRS
    ]


def _allows_port(rule, port):
    if not _internet_cidrs(rule) or rule.get("protocol") not in {"tcp", "-1"}:
        return False

    if rule.get("protocol") == "-1":
        return True

    start = rule.get("from_port")
    end = rule.get("to_port")
    return start is not None and end is not None and start <= port <= end


def _has_unrestricted_rule(rule):
    return rule.get("protocol") == "-1" and bool(_internet_cidrs(rule))


# SG001 - SSH Open to Internet
def sg001(group):
    exposed = [rule for rule in group.get("inbound_rules", []) if _allows_port(rule, 22)]
    if not exposed:
        return None

    return _finding(
        "SG001", group,
        "SSH Open to Internet",
        "The security group permits internet access to SSH (TCP/22).",
        "Restrict SSH to trusted CIDRs, use AWS Systems Manager Session Manager, or access through a hardened bastion.",
        "Attackers can scan, brute-force, and exploit exposed SSH services.",
        [f"Public CIDRs: {', '.join(_internet_cidrs(exposed[0]))}", "Port: TCP/22"], 10,
        ["public_exposure", "remote_access", "brute_force"],
    )


# SG002 - RDP Open to Internet
def sg002(group):
    exposed = [rule for rule in group.get("inbound_rules", []) if _allows_port(rule, 3389)]
    if not exposed:
        return None

    return _finding(
        "SG002", group,
        "RDP Open to Internet",
        "The security group permits internet access to Remote Desktop Protocol (TCP/3389).",
        "Restrict RDP to trusted CIDRs and use a VPN, bastion, or Systems Manager for administration.",
        "Public RDP is frequently targeted for credential attacks and remote exploitation.",
        [f"Public CIDRs: {', '.join(_internet_cidrs(exposed[0]))}", "Port: TCP/3389"], 10,
        ["public_exposure", "remote_access", "brute_force"],
    )


# SG003 - Database Port Open to Internet
def sg003(group):
    exposed_services = []
    for port, service in DATABASE_PORTS.items():
        if any(_allows_port(rule, port) for rule in group.get("inbound_rules", [])):
            exposed_services.append(f"{service} (TCP/{port})")

    if not exposed_services:
        return None

    return _finding(
        "SG003", group,
        "Database Port Open to Internet",
        "The security group exposes one or more database services to the internet.",
        "Restrict database access to application security groups or private network ranges.",
        "Public database endpoints can expose sensitive records to unauthorised access and exploitation.",
        [f"Exposed services: {', '.join(exposed_services)}"], 9,
        ["public_exposure", "database", "data_exposure"],
    )


# SG004 - All Inbound Traffic Open to Internet
def sg004(group):
    exposed = [rule for rule in group.get("inbound_rules", []) if _has_unrestricted_rule(rule)]
    if not exposed:
        return None

    return _finding(
        "SG004", group,
        "All Inbound Traffic Open to Internet",
        "The security group allows all protocols and ports from the internet.",
        "Replace the all-traffic rule with the minimum required protocols, ports, and source CIDRs.",
        "Every service attached to this group may be exposed to internet-based attack.",
        [f"Public CIDRs: {', '.join(_internet_cidrs(exposed[0]))}", "Protocol: all", "Ports: all"], 10,
        ["public_exposure", "network_exposure", "attack_surface"],
    )


# SG005 - Legacy or File Service Open to Internet
def sg005(group):
    exposed_services = []
    for port, service in LEGACY_SERVICE_PORTS.items():
        if any(_allows_port(rule, port) for rule in group.get("inbound_rules", [])):
            exposed_services.append(f"{service} (TCP/{port})")

    if not exposed_services:
        return None

    return _finding(
        "SG005", group,
        "Legacy or File Service Open to Internet",
        "The security group exposes legacy administration or file-sharing services to the internet.",
        "Remove public access and limit the service to approved private CIDRs or security groups.",
        "These services are common targets for brute-force attacks, worms, and data theft.",
        [f"Exposed services: {', '.join(exposed_services)}"], 8,
        ["public_exposure", "legacy_service", "data_exposure"],
    )


# SG006 - Unrestricted Egress
def sg006(group):
    exposed = [rule for rule in group.get("outbound_rules", []) if _has_unrestricted_rule(rule)]
    if not exposed:
        return None

    return _finding(
        "SG006", group,
        "Unrestricted Security Group Egress",
        "The security group allows all outbound protocols and ports to the internet.",
        "Restrict egress to the destinations, protocols, and ports required by the workload.",
        "A compromised workload can freely reach command-and-control infrastructure or exfiltrate data.",
        [f"Internet destinations: {', '.join(_internet_cidrs(exposed[0]))}", "Protocol: all", "Ports: all"], 6,
        ["egress", "data_exfiltration", "command_and_control"],
    )


RULES = [sg001, sg002, sg003, sg004, sg005, sg006]


def analyze_security_groups(resources):
    """Run all Security Group rules against every discovered group."""
    findings = []
    for group in resources:
        for rule in RULES:
            finding = rule(group)
            if finding:
                findings.append(finding)
    return findings
