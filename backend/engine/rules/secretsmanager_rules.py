from engine.findings import Finding
from engine.rules.severity import severity_for_rule


def _finding(rule_id, sec, title, description, recommendation,
             business_impact, evidence, exploitability, correlation_tags):
    return Finding(
        rule_id=rule_id,
        service="SecretsManager",
        resource=sec["secret_name"],
        severity=severity_for_rule(rule_id),
        title=title,
        description=description,
        recommendation=recommendation,
        business_impact=business_impact,
        evidence=evidence,
        exploitability=exploitability,
        correlation_tags=correlation_tags,
    ).to_dict()


def sm001(sec):
    if sec.get("rotation_enabled", False):
        return None
    return _finding(
        "SM001", sec,
        "Secrets Manager Secret Automatic Rotation Disabled",
        f"Secret '{sec['secret_name']}' does not have automatic rotation enabled.",
        "Configure automatic rotation using AWS Lambda rotation functions in Secrets Manager.",
        "Stale database or API credentials remain valid indefinitely, expanding impact if leaked.",
        [f"Secret: {sec['secret_name']}", "RotationEnabled: False"],
        6,
        ["secrets_management", "credential_exposure"],
    )


def sm002(sec):
    if not sec.get("policy_public", False):
        return None
    return _finding(
        "SM002", sec,
        "Public Resource Policy on Secret",
        f"Secret '{sec['secret_name']}' resource policy contains wildcard or public access principals.",
        "Remove public principals from the secret resource policy and restrict access via IAM.",
        "Secret values (database passwords, API tokens) can be read by unauthorized external entities.",
        [f"Secret: {sec['secret_name']}", "Policy Public: True"],
        9,
        ["public_exposure", "credential_exposure"],
    )


RULES = [sm001, sm002]


def analyze_secretsmanager(resources):
    findings = []
    for sec in resources:
        for rule in RULES:
            res = rule(sec)
            if res:
                findings.append(res)
    return findings
