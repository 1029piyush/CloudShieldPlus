from engine.findings import Finding
from engine.rules.severity import severity_for_rule


def _finding(rule_id, top, title, description, recommendation,
             business_impact, evidence, exploitability, correlation_tags):
    return Finding(
        rule_id=rule_id,
        service="SNS",
        resource=top["topic_name"],
        severity=severity_for_rule(rule_id),
        title=title,
        description=description,
        recommendation=recommendation,
        business_impact=business_impact,
        evidence=evidence,
        exploitability=exploitability,
        correlation_tags=correlation_tags,
    ).to_dict()


def sns001(top):
    if not top.get("policy_public", False):
        return None
    return _finding(
        "SNS001", top,
        "Publicly Accessible SNS Topic Policy",
        f"SNS topic '{top['topic_name']}' permits anonymous or wildcard principals in its access policy.",
        "Restrict topic policy statements to specific AWS account IDs, IAM roles, or service principals.",
        "Unauthorized external entities can publish malicious messages or subscribe to sensitive event notifications.",
        [f"Topic: {top['topic_name']}", "Policy Public: True"],
        8,
        ["public_exposure", "messaging"],
    )


RULES = [sns001]


def analyze_sns(resources):
    findings = []
    for top in resources:
        for rule in RULES:
            res = rule(top)
            if res:
                findings.append(res)
    return findings
