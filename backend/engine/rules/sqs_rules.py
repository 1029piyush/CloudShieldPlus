from engine.findings import Finding
from engine.rules.severity import severity_for_rule


def _finding(rule_id, q, title, description, recommendation,
             business_impact, evidence, exploitability, correlation_tags):
    return Finding(
        rule_id=rule_id,
        service="SQS",
        resource=q["queue_name"],
        severity=severity_for_rule(rule_id),
        title=title,
        description=description,
        recommendation=recommendation,
        business_impact=business_impact,
        evidence=evidence,
        exploitability=exploitability,
        correlation_tags=correlation_tags,
    ).to_dict()


def sqs001(q):
    if not q.get("policy_public", False):
        return None
    return _finding(
        "SQS001", q,
        "Publicly Accessible SQS Queue Policy",
        f"SQS queue '{q['queue_name']}' permits wildcard or public access principals in its policy.",
        "Restrict queue policy permissions to authorized IAM roles or specific AWS account IDs.",
        "Unauthorized entities can send, receive, or purge messages from the queue, disrupting application workflows.",
        [f"Queue: {q['queue_name']}", "Policy Public: True"],
        8,
        ["public_exposure", "messaging"],
    )


RULES = [sqs001]


def analyze_sqs(resources):
    findings = []
    for q in resources:
        for rule in RULES:
            res = rule(q)
            if res:
                findings.append(res)
    return findings
