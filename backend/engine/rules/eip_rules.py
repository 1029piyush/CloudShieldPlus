from engine.findings import Finding
from engine.rules.severity import severity_for_rule


def _finding(rule_id, eip, title, description, recommendation,
             business_impact, evidence, exploitability, correlation_tags):
    return Finding(
        rule_id=rule_id,
        service="ElasticIP",
        resource=f"{eip['public_ip']} ({eip.get('allocation_id', 'N/A')})",
        severity=severity_for_rule(rule_id),
        title=title,
        description=description,
        recommendation=recommendation,
        business_impact=business_impact,
        evidence=evidence,
        exploitability=exploitability,
        correlation_tags=correlation_tags,
    ).to_dict()


def eip001(eip):
    if eip.get("is_associated", False):
        return None
    return _finding(
        "EIP001", eip,
        "Unassociated Elastic IP Address",
        f"Elastic IP '{eip['public_ip']}' is allocated to the account but unassociated with any instance or ENI.",
        "Release unassociated Elastic IP addresses to avoid idle hourly charges and prevent accidental association.",
        "Unused public IPs incur continuous cost charges and can be assigned to unexpected resources.",
        [f"Public IP: {eip['public_ip']}", "Associated: False"],
        4,
        ["cost_security", "public_exposure"],
    )


RULES = [eip001]


def analyze_eip(resources):
    findings = []
    for eip in resources:
        for rule in RULES:
            res = rule(eip)
            if res:
                findings.append(res)
    return findings
