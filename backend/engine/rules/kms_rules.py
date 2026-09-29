from engine.findings import Finding
from engine.rules.severity import severity_for_rule


def _finding(rule_id, key, title, description, recommendation,
             business_impact, evidence, exploitability, correlation_tags):
    return Finding(
        rule_id=rule_id,
        service="KMS",
        resource=key["key_id"],
        severity=severity_for_rule(rule_id),
        title=title,
        description=description,
        recommendation=recommendation,
        business_impact=business_impact,
        evidence=evidence,
        exploitability=exploitability,
        correlation_tags=correlation_tags,
    ).to_dict()


def kms001(key):
    if key.get("rotation_enabled", False):
        return None
    return _finding(
        "KMS001", key,
        "KMS Customer Managed Key Rotation Disabled",
        f"KMS Customer Managed Key '{key['key_id']}' does not have annual key rotation enabled.",
        "Enable automatic annual key rotation for customer managed keys in KMS configuration.",
        "Cryptographic material is not periodically rotated, increasing vulnerability window if key material is compromised.",
        [f"Key ID: {key['key_id']}", "RotationEnabled: False"],
        5,
        ["cryptography", "key_management"],
    )


def kms002(key):
    if not key.get("policy_public", False):
        return None
    return _finding(
        "KMS002", key,
        "Public / Wildcard Access in KMS Key Policy",
        f"KMS Key '{key['key_id']}' policy contains wildcard principal permissions.",
        "Restrict key policy principals to explicit IAM roles and trusted AWS account IDs.",
        "External principals or unauthorized identities can attempt decryption operations using the key.",
        [f"Key ID: {key['key_id']}", "Policy Public: True"],
        9,
        ["public_exposure", "key_management", "privilege_escalation"],
    )


RULES = [kms001, kms002]


def analyze_kms(resources):
    findings = []
    for key in resources:
        for rule in RULES:
            res = rule(key)
            if res:
                findings.append(res)
    return findings
