from engine.findings import Finding
from engine.rules.severity import severity_for_rule


def _finding(rule_id, lg, title, description, recommendation,
             business_impact, evidence, exploitability, correlation_tags):
    return Finding(
        rule_id=rule_id,
        service="CloudWatch",
        resource=lg["log_group_name"],
        severity=severity_for_rule(rule_id),
        title=title,
        description=description,
        recommendation=recommendation,
        business_impact=business_impact,
        evidence=evidence,
        exploitability=exploitability,
        correlation_tags=correlation_tags,
    ).to_dict()


def cw001(lg):
    if lg.get("retention_in_days") is not None:
        return None
    return _finding(
        "CW001", lg,
        "CloudWatch Log Group Never Expires",
        f"Log group '{lg['log_group_name']}' is configured with Never Expire retention.",
        "Configure an explicit retention period (e.g. 90 days or 365 days) aligned with compliance policies.",
        "Indefinite retention increases storage costs and compliance exposure for stale operational logs.",
        [f"Log Group: {lg['log_group_name']}", "Retention: Never Expire"],
        3,
        ["logging", "cost_security"],
    )


RULES = [cw001]


def analyze_cloudwatch(resources):
    findings = []
    for lg in resources:
        for rule in RULES:
            res = rule(lg)
            if res:
                findings.append(res)
    return findings
