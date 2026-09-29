from engine.findings import Finding
from engine.rules.severity import severity_for_rule


def _finding(rule_id, srv, title, description, recommendation,
             business_impact, evidence, exploitability, correlation_tags):
    return Finding(
        rule_id=rule_id,
        service="ECS",
        resource=f"{srv['cluster_name']}/{srv['service_name']}",
        severity=severity_for_rule(rule_id),
        title=title,
        description=description,
        recommendation=recommendation,
        business_impact=business_impact,
        evidence=evidence,
        exploitability=exploitability,
        correlation_tags=correlation_tags,
    ).to_dict()


def ecs001(srv):
    if not srv.get("assign_public_ip", False):
        return None
    return _finding(
        "ECS001", srv,
        "ECS Service Assigns Public IP Automatically",
        f"ECS Service '{srv['service_name']}' in cluster '{srv['cluster_name']}' assigns public IP addresses to task network interfaces.",
        "Set assignPublicIp to DISABLED for task network configuration and route egress traffic via NAT Gateways.",
        "Container tasks acquire direct public IP addresses, opening attack surfaces if security groups permit inbound traffic.",
        [f"Cluster: {srv['cluster_name']}", f"Service: {srv['service_name']}", "assignPublicIp: ENABLED"],
        8,
        ["public_exposure", "containers", "network_exposure"],
    )


RULES = [ecs001]


def analyze_ecs(resources):
    findings = []
    for srv in resources:
        for rule in RULES:
            res = rule(srv)
            if res:
                findings.append(res)
    return findings
