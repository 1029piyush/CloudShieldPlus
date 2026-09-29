from engine.findings import Finding
from engine.rules.severity import severity_for_rule


def _finding(rule_id, hz, title, description, recommendation,
             business_impact, evidence, exploitability, correlation_tags):
    return Finding(
        rule_id=rule_id,
        service="Route53",
        resource=hz["name"],
        severity=severity_for_rule(rule_id),
        title=title,
        description=description,
        recommendation=recommendation,
        business_impact=business_impact,
        evidence=evidence,
        exploitability=exploitability,
        correlation_tags=correlation_tags,
    ).to_dict()


def r53001(hz):
    # Route53 informational rule
    return None


RULES = [r53001]


def analyze_route53(resources):
    findings = []
    for hz in resources:
        for rule in RULES:
            res = rule(hz)
            if res:
                findings.append(res)
    return findings
