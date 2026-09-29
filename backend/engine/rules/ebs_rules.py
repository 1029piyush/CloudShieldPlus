from engine.findings import Finding
from engine.rules.severity import severity_for_rule


def _finding(rule_id, vol, title, description, recommendation,
             business_impact, evidence, exploitability, correlation_tags):
    return Finding(
        rule_id=rule_id,
        service="EBS",
        resource=vol["volume_id"],
        severity=severity_for_rule(rule_id),
        title=title,
        description=description,
        recommendation=recommendation,
        business_impact=business_impact,
        evidence=evidence,
        exploitability=exploitability,
        correlation_tags=correlation_tags,
    ).to_dict()


def ebs001(vol):
    if vol.get("encrypted", False):
        return None
    return _finding(
        "EBS001", vol,
        "EBS Volume Unencrypted",
        f"EBS Volume '{vol['volume_id']}' is not encrypted at rest.",
        "Enable default EBS encryption at the account level and encrypt unencrypted volumes via snapshot copy.",
        "Data stored on unencrypted block storage can be exposed if physical media, snapshots, or attached instances are compromised.",
        [f"Volume ID: {vol['volume_id']}", "Encrypted: False"],
        7,
        ["encryption", "data_protection"],
    )


def ebs002(vol):
    if vol.get("state") != "available":
        return None
    return _finding(
        "EBS002", vol,
        "Unattached EBS Volume",
        f"EBS Volume '{vol['volume_id']}' is detached and unattached ('available' state).",
        "Review unattached volumes and delete unnecessary volumes after creating an encrypted snapshot.",
        "Unattached volumes incur storage costs and may harbor sensitive residual data without active monitoring.",
        [f"Volume ID: {vol['volume_id']}", "State: available"],
        4,
        ["data_hygiene", "storage"],
    )


RULES = [ebs001, ebs002]


def analyze_ebs(resources):
    findings = []
    for vol in resources:
        for rule in RULES:
            res = rule(vol)
            if res:
                findings.append(res)
    return findings
