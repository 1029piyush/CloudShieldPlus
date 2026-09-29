from engine.findings import Finding
from engine.rules.severity import severity_for_rule


def _finding(rule_id, group, title, description, recommendation,
             business_impact, evidence, exploitability, correlation_tags):
    return Finding(
        rule_id=rule_id,
        service="AutoScaling",
        resource=group["auto_scaling_group_name"],
        severity=severity_for_rule(rule_id),
        title=title,
        description=description,
        recommendation=recommendation,
        business_impact=business_impact,
        evidence=evidence,
        exploitability=exploitability,
        correlation_tags=correlation_tags,
    ).to_dict()


def asg001(group):
    # AutoScaling informational rule
    return None


RULES = [asg001]


def analyze_autoscaling(resources):
    findings = []
    for group in resources:
        for rule in RULES:
            res = rule(group)
            if res:
                findings.append(res)
    return findings
