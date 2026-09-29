from engine.findings import Finding
from engine.rules.severity import severity_for_rule


def _finding(rule_id, vpc, resource_id, title, description, recommendation,
             business_impact, evidence, exploitability, correlation_tags):
    return Finding(
        rule_id=rule_id,
        service="VPC",
        resource=resource_id,
        severity=severity_for_rule(rule_id),
        title=title,
        description=description,
        recommendation=recommendation,
        business_impact=business_impact,
        evidence=evidence,
        exploitability=exploitability,
        correlation_tags=correlation_tags,
    ).to_dict()


# VPC001 - VPC Flow Logs Not Enabled
def vpc001(vpc):
    # Only report if flow_log_status is disabled AND flow_log_api_verified is True
    if vpc.get("flow_log_api_verified") is not True:
        return None
    if vpc.get("flow_log_status") != "disabled":
        return None

    return _finding(
        "VPC001", vpc, vpc["vpc_id"],
        "VPC Flow Logs Not Enabled",
        f"VPC '{vpc['vpc_id']}' does not have active VPC Flow Logs enabled for network traffic auditing.",
        "Enable VPC Flow Logs to record IP traffic flow to CloudWatch Logs or S3.",
        "Network traffic anomalies, unauthorized access attempts, and lateral movement cannot be audited or investigated during incident response.",
        [f"VPC ID: {vpc['vpc_id']}", "Flow Logs Status: Disabled", "API Verification: Verified"],
        5,
        ["logging", "network_security", "forensics"],
    )


# VPC002 - Default VPC With Internet-Exposed Workload
def vpc002(vpc):
    if not vpc.get("is_default", False):
        return None

    # Require evidence of internet exposure AND active workload presence
    has_igw = vpc.get("has_internet_gateway", False)
    has_workload = vpc.get("has_active_workload", False)

    if not (has_igw and has_workload):
        return None

    return _finding(
        "VPC002", vpc, vpc["vpc_id"],
        "Default VPC In Use With Internet-Exposed Workloads",
        f"Default VPC '{vpc['vpc_id']}' contains active workloads and has an Internet Gateway attached.",
        "Migrate active workloads to a custom VPC configured with explicit private subnets and restricted routing.",
        "Default VPCs deploy resources in public subnets with default internet routing, increasing exposure to public scanning.",
        [f"VPC ID: {vpc['vpc_id']}", "IsDefault: True", f"Internet Gateway: {vpc.get('internet_gateway_id')}", "Active Workloads Detected: True"],
        7,
        ["network_security", "architecture", "public_exposure"],
    )


# VPC003 - Subnet Automatically Assigns Public IP
def vpc003(vpc):
    findings = []
    for subnet in vpc.get("subnets", []):
        # Generate ONLY if MapPublicIpOnLaunch is True AND route to Internet Gateway exists
        if subnet.get("map_public_ip_on_launch", False) and subnet.get("has_igw_route", False):
            finding = _finding(
                "VPC003", vpc, subnet["subnet_id"],
                "Subnet Automatically Assigns Public IP With Internet Route",
                f"Subnet '{subnet['subnet_id']}' in VPC '{vpc['vpc_id']}' auto-assigns public IPs and routes traffic to Internet Gateway '{subnet.get('igw_id_route')}'.",
                "Disable MapPublicIpOnLaunch for this subnet or restrict routing to a NAT Gateway for outbound egress.",
                "Resources launched into this subnet automatically receive public IP addresses accessible via the internet route.",
                [
                    f"VPC ID: {vpc['vpc_id']}",
                    f"Subnet ID: {subnet['subnet_id']}",
                    "MapPublicIpOnLaunch: True",
                    f"Route Table ID: {subnet.get('route_table_id')}",
                    f"Internet Gateway Route: {subnet.get('igw_id_route')}",
                ],
                8,
                ["public_exposure", "subnet_configuration", "network_exposure"],
            )
            findings.append(finding)
    return findings


# VPC004 - Unrestricted Network ACL Rule
def vpc004(vpc):
    findings = []
    sensitive_ports = {22, 3389, -1}  # SSH, RDP, or ALL protocols

    for nacl in vpc.get("nacls", []):
        nacl_id = nacl.get("network_acl_id")
        for entry in nacl.get("entries", []):
            # Inspect inbound (Egress == False) ALLOW rules from 0.0.0.0/0 or ::/0
            if entry.get("Egress") is False and entry.get("RuleAction") == "allow":
                cidr = entry.get("CidrBlock") or entry.get("Ipv6CidrBlock")
                if cidr in ["0.0.0.0/0", "::/0"]:
                    protocol = str(entry.get("Protocol"))
                    port_range = entry.get("PortRange", {})
                    from_port = port_range.get("From")
                    to_port = port_range.get("To")

                    # Check if rule targets sensitive ports or ALL protocols (-1)
                    is_sensitive = (
                        protocol == "-1"
                        or from_port in sensitive_ports
                        or to_port in sensitive_ports
                        or (from_port is None and to_port is None)
                    )

                    if is_sensitive:
                        port_label = "ALL" if protocol == "-1" or from_port is None else f"{from_port}-{to_port}"
                        finding = _finding(
                            "VPC004", vpc, nacl_id,
                            "Unrestricted Network ACL Rule For Sensitive Traffic",
                            f"Network ACL '{nacl_id}' rule #{entry.get('RuleNumber')} allows inbound {port_label} traffic from {cidr}.",
                            "Restrict Network ACL rules to specific trusted CIDRs or IP ranges for administrative ports.",
                            "Unrestricted inbound ACL rules permit network traffic from any internet location to associated subnets.",
                            [
                                f"NACL ID: {nacl_id}",
                                f"Rule Number: {entry.get('RuleNumber')}",
                                f"Protocol: {protocol}",
                                f"Port Range: {port_label}",
                                f"CIDR Block: {cidr}",
                                f"Associated Subnets: {', '.join(nacl.get('associations', []))}",
                            ],
                            8,
                            ["network_security", "nacl", "unrestricted_access"],
                        )
                        findings.append(finding)
    return findings


RULES = [vpc001, vpc002, vpc003, vpc004]


def analyze_vpc(resources):
    findings = []
    for vpc in resources:
        # VPC001 & VPC002 return single finding or None
        for rule in [vpc001, vpc002]:
            res = rule(vpc)
            if res:
                findings.append(res)

        # VPC003 & VPC004 return lists of findings
        for rule in [vpc003, vpc004]:
            res_list = rule(vpc)
            if res_list:
                findings.extend(res_list)

    return findings
