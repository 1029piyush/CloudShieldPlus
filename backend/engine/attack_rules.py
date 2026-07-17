"""Deterministic attack scenarios built from standardized rule findings.

Rules currently correlate primarily on rule IDs. AttackContext also exposes
correlation tags so future scenarios can combine findings without hard-coding
every service-specific rule ID.
"""

from engine.attack_path import AttackPath


def _path(attack_id, title, description, risk, likelihood, impact,
          related_findings, attack_steps, mitigation):
    return AttackPath(
        attack_id=attack_id,
        title=title,
        description=description,
        risk=risk,
        likelihood=likelihood,
        impact=impact,
        related_findings=related_findings,
        attack_steps=attack_steps,
        mitigation=mitigation,
    )


# AP001 - Public Data Exposure
def ap001_public_data_exposure(context):
    public_access = ["S3001", "S3008", "S3009"]
    data_protection_gap = ["S3003", "S3004"]
    if not (context.has_any(public_access) and context.has_any(data_protection_gap)):
        return None

    related = context.related(public_access + data_protection_gap)
    return _path(
        "AP001",
        "Public Data Exposure",
        "A bucket has reduced public-access guardrails and lacks a data-protection or access-auditing control.",
        "Critical",
        "High",
        "Critical",
        related,
        [
            "An attacker identifies a bucket with public-access controls disabled, a public ACL, or public website exposure.",
            "The attacker attempts anonymous or broadly authenticated access to objects.",
            "Missing default encryption or access logging increases the impact or reduces investigation capability.",
        ],
        "Enable S3 Block Public Access, remove public ACLs, enable default encryption, and record access activity.",
    )


# AP002 - Credential Theft Through Public Compute
def ap002_credential_theft(context):
    if not (context.has("EC2001") and context.has("EC2002")):
        return None

    related = context.related(["EC2001", "EC2002", "EC2006", "EC2007", "EC2008"])
    return _path(
        "AP002",
        "Credential Theft Through Public Compute",
        "A public EC2 instance permits IMDSv1, creating a credible SSRF-to-instance-credential theft path.",
        "High",
        "High",
        "High",
        related,
        [
            "An attacker discovers a publicly addressed workload.",
            "The attacker exploits an application flaw such as server-side request forgery.",
            "IMDSv1 access exposes instance metadata and potentially attached IAM role credentials.",
        ],
        "Remove unnecessary public IPs, require IMDSv2, and enforce a metadata hop limit of one.",
    )


# AP003 - Account Takeover
def ap003_account_takeover(context):
    if not (context.has("IAM001") and context.has("IAM002")):
        return None

    related = context.related(["IAM001", "IAM002", "IAM005", "IAM020"])
    return _path(
        "AP003",
        "Account Takeover",
        "An administrative IAM identity lacks MFA, allowing a stolen password or session to become account-wide control.",
        "Critical",
        "High",
        "Critical",
        related,
        [
            "An attacker obtains an administrative user's password or active session.",
            "The absence of MFA allows the attacker to authenticate without a second factor.",
            "Administrator permissions enable account-wide configuration changes and persistence.",
        ],
        "Remove AdministratorAccess where unnecessary, enforce MFA, and apply least-privilege permissions boundaries.",
    )


# AP004 - Privilege Escalation
def ap004_privilege_escalation(context):
    privilege_grant = ["IAM016", "IAM017", "IAM018", "IAM019"]
    weak_constraint = ["IAM006", "IAM007"]
    if not (context.has_any(privilege_grant) and context.has_any(weak_constraint)):
        return None

    related = context.related(privilege_grant + weak_constraint)
    return _path(
        "AP004",
        "Privilege Escalation",
        "Overly broad or dangerous IAM permissions combine with weak governance constraints, enabling an identity to gain additional privileges.",
        "Critical",
        "High",
        "Critical",
        related,
        [
            "An attacker compromises an IAM identity with broad or dangerous permissions.",
            "The identity creates, attaches, or modifies permissions to expand access.",
            "Missing boundaries or difficult-to-govern inline policies reduce containment of the escalation.",
        ],
        "Replace wildcard and dangerous permissions with least privilege, remove unnecessary IAM write actions, and apply permissions boundaries.",
    )


# AP005 - Stealth Persistence
def ap005_stealth_persistence(context):
    audit_gap = ["CT001", "CT002", "CT003", "CT004", "CT005", "CT007"]
    persistence_capability = ["IAM001", "IAM018", "IAM019", "IAM020"]
    if not (context.has_any(audit_gap) and context.has_any(persistence_capability)):
        return None

    related = context.related(audit_gap + persistence_capability)
    return _path(
        "AP005",
        "Stealth Persistence",
        "An identity with powerful IAM capabilities can establish persistence while CloudTrail coverage or alerting is incomplete.",
        "Critical",
        "Medium",
        "Critical",
        related,
        [
            "An attacker gains access to a highly privileged IAM identity.",
            "The attacker creates a backdoor user, access key, role, or policy attachment.",
            "CloudTrail logging, coverage, integrity, or real-time alerting gaps delay detection and response.",
        ],
        "Restore complete CloudTrail coverage and alerting, protect log integrity, and remove unnecessary IAM privilege-management permissions.",
    )


# AP006 - Ransomware Recovery Risk
def ap006_ransomware_recovery_risk(context):
    if not (context.has("S3002") and context.has_any(["S3005", "S3007"])):
        return None

    related = context.related(["S3002", "S3005", "S3007"])
    return _path(
        "AP006",
        "Ransomware Recovery Risk",
        "A bucket lacks versioning and an immutability control, leaving data vulnerable to destructive changes without a reliable recovery path.",
        "High",
        "Medium",
        "High",
        related,
        [
            "An attacker obtains write or delete access to bucket data.",
            "The attacker encrypts, overwrites, or deletes objects.",
            "Disabled versioning and Object Lock or MFA Delete prevent reliable rollback to protected copies.",
        ],
        "Enable versioning and use Object Lock or MFA Delete for high-value data, with tested cross-account backup and recovery procedures.",
    )


ATTACK_RULES = [
    ap001_public_data_exposure,
    ap002_credential_theft,
    ap003_account_takeover,
    ap004_privilege_escalation,
    ap005_stealth_persistence,
    ap006_ransomware_recovery_risk,
]
