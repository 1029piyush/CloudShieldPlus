"""Deterministic recommendation definitions for CloudShield+ findings."""

from collections.abc import Mapping

from engine.recommendation import Recommendation


def _value(item, name, default=None):
    if isinstance(item, Mapping):
        return item.get(name, default)
    return getattr(item, name, default)


def _ids(items, field):
    return {
        value
        for value in (_value(item, field) for item in items)
        if value
    }


def _related_ids(items, field, candidates):
    present = _ids(items, field)
    return [candidate for candidate in candidates if candidate in present]


def _recommendation(recommendation_id, title, description, priority, service,
                    findings, attack_paths, finding_ids, attack_ids,
                    remediation_steps, risk_reduction, automation_guidance):
    return Recommendation(
        recommendation_id=recommendation_id,
        title=title,
        description=description,
        priority=priority,
        service=service,
        related_findings=_related_ids(findings, "rule_id", finding_ids),
        related_attack_paths=_related_ids(attack_paths, "attack_id", attack_ids),
        remediation_steps=remediation_steps,
        risk_reduction=risk_reduction,
        automation_guidance=automation_guidance,
    )


# REC001 - Secure Public S3 Access
def recommend_s3_public_access(findings, attack_paths):
    finding_ids = ["S3001", "S3008", "S3009"]
    attack_ids = ["AP001"]
    if not (_related_ids(findings, "rule_id", finding_ids) or _related_ids(attack_paths, "attack_id", attack_ids)):
        return None

    return _recommendation(
        "REC001", "Secure Public S3 Access",
        "Restrict public bucket access to prevent unintended object exposure.",
        "Critical", "S3", findings, attack_paths, finding_ids, attack_ids,
        [
            "Enable all four S3 Block Public Access settings.",
            "Remove public ACL grants and bucket-policy statements unless a documented exception is required.",
            "Use CloudFront with origin access control for public content instead of direct bucket access.",
        ],
        "Eliminates the public data-exposure attack path.",
        "Use AWS Config managed rules and S3 Block Public Access at the account level to prevent recurrence.",
    )


# REC002 - Enforce MFA for IAM Users
def recommend_iam_mfa(findings, attack_paths):
    finding_ids = ["IAM002", "IAM005", "IAM020"]
    attack_ids = ["AP002", "AP003", "AP004"]
    if not (_related_ids(findings, "rule_id", finding_ids) or _related_ids(attack_paths, "attack_id", attack_ids)):
        return None

    return _recommendation(
        "REC002", "Enforce MFA for IAM Users",
        "Require MFA for IAM users with console access, prioritising administrative identities.",
        "Critical", "IAM", findings, attack_paths, finding_ids, attack_ids,
        [
            "Enable MFA for every IAM user with a console password.",
            "Remove console access for users that require programmatic access only.",
            "Apply an IAM policy or SCP that denies sensitive actions when MFA is absent.",
        ],
        "Reduces credential-theft and account-takeover risk.",
        "Monitor IAM.5/IAM.19 Security Hub controls and alert on new console users without MFA.",
    )


# REC003 - Restore CloudTrail Coverage
def recommend_cloudtrail_coverage(findings, attack_paths):
    finding_ids = ["CT001", "CT002", "CT003", "CT004", "CT005", "CT007"]
    attack_ids = ["AP004"]
    if not (_related_ids(findings, "rule_id", finding_ids) or _related_ids(attack_paths, "attack_id", attack_ids)):
        return None

    return _recommendation(
        "REC003", "Restore CloudTrail Coverage and Alerting",
        "Ensure AWS activity is recorded, protected, and available for near-real-time detection.",
        "High", "CloudTrail", findings, attack_paths, finding_ids, attack_ids,
        [
            "Create or start a multi-Region CloudTrail trail and include global service events.",
            "Enable log-file validation and deliver logs to a protected S3 bucket.",
            "Send events to CloudWatch Logs or an approved SIEM and alert on high-risk IAM changes.",
        ],
        "Improves detection, investigation, and containment of compromised identities.",
        "Deploy the trail through infrastructure as code and protect it with an SCP against deletion or modification.",
    )


# REC004 - Protect Public EC2 and Instance Metadata
def recommend_ec2_public_compute(findings, attack_paths):
    finding_ids = ["EC2001", "EC2002", "EC2006", "EC2008", "SG001", "SG002", "SG004"]
    attack_ids = ["AP005"]
    if not (_related_ids(findings, "rule_id", finding_ids) or _related_ids(attack_paths, "attack_id", attack_ids)):
        return None

    return _recommendation(
        "REC004", "Protect Public EC2 and Instance Metadata",
        "Reduce internet reachability and prevent metadata-based credential theft from EC2 workloads.",
        "High", "EC2", findings, attack_paths, finding_ids, attack_ids,
        [
            "Remove unnecessary public IP addresses and place workloads in private subnets.",
            "Restrict security-group ingress to approved sources and required ports only.",
            "Require IMDSv2 and set the metadata response hop limit to one unless documented otherwise.",
        ],
        "Reduces internet-to-compute exposure and SSRF-driven credential theft.",
        "Enforce IMDSv2 and approved security-group patterns through launch templates and AWS Config.",
    )


# REC005 - Reduce IAM Privilege Escalation
def recommend_iam_least_privilege(findings, attack_paths):
    finding_ids = ["IAM001", "IAM006", "IAM016", "IAM017", "IAM018", "IAM019"]
    if not _related_ids(findings, "rule_id", finding_ids):
        return None

    return _recommendation(
        "REC005", "Reduce IAM Privilege Escalation Paths",
        "Replace broad and dangerous IAM permissions with scoped access controls.",
        "Critical", "IAM", findings, attack_paths, finding_ids, [],
        [
            "Replace AdministratorAccess and wildcard actions or resources with task-specific permissions.",
            "Remove unnecessary IAM write permissions such as policy attachment, PassRole, and access-key creation.",
            "Apply permissions boundaries to delegated administrative identities.",
        ],
        "Limits an attacker’s ability to expand permissions or take over the account.",
        "Use IAM Access Analyzer policy generation and CI policy validation before deployment.",
    )


# REC006 - Protect S3 Recovery Controls
def recommend_s3_recovery(findings, attack_paths):
    finding_ids = ["S3002", "S3005", "S3007"]
    related = _related_ids(findings, "rule_id", finding_ids)
    if len(related) < 2:
        return None

    return _recommendation(
        "REC006", "Strengthen S3 Ransomware Recovery Controls",
        "Protect object recovery by combining versioning with an immutability control.",
        "High", "S3", findings, attack_paths, finding_ids, [],
        [
            "Enable S3 Versioning on critical buckets.",
            "Use Object Lock for backup, audit, or regulated data that requires immutable retention.",
            "Enable MFA Delete where operationally appropriate and test object recovery procedures.",
        ],
        "Improves resilience against destructive changes and ransomware.",
        "Apply versioning by default through infrastructure-as-code guardrails and monitor drift with AWS Config.",
    )


# REC007 - Strengthen IAM Password Policy
def recommend_password_policy(findings, attack_paths):
    finding_ids = ["PP001", "PP002", "PP003", "PP004", "PP005", "PP006", "PP007", "PP008"]
    if not _related_ids(findings, "rule_id", finding_ids):
        return None

    return _recommendation(
        "REC007", "Strengthen IAM Password Policy",
        "Apply a consistent account password policy for IAM console users.",
        "High", "IAM", findings, attack_paths, finding_ids, [],
        [
            "Require at least 14 characters with uppercase, lowercase, number, and symbol requirements.",
            "Prevent reuse of the previous 24 passwords.",
            "Set a password maximum age that meets the organisation's compliance requirements and enforce MFA.",
        ],
        "Reduces password guessing, reuse, and credential-stuffing risk.",
        "Manage the account password policy through infrastructure as code and periodically evaluate it with AWS Config.",
    )


RECOMMENDATION_RULES = [
    recommend_s3_public_access,
    recommend_iam_mfa,
    recommend_cloudtrail_coverage,
    recommend_ec2_public_compute,
    recommend_iam_least_privilege,
    recommend_s3_recovery,
    recommend_password_policy,
]
