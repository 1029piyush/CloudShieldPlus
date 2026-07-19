"""Attack-path-first remediation plans for CloudShield+."""

from collections.abc import Mapping

from engine.recommendation import Recommendation


def _value(item, name, default=None):
    if isinstance(item, Mapping):
        return item.get(name, default)
    return getattr(item, name, default)


def _attack_path(attack_paths, attack_id):
    return next(
        (
            path
            for path in attack_paths
            if _value(path, "attack_id") == attack_id
        ),
        None,
    )


def _recommendation(recommendation_id, attack_path, service,
                    remediation_steps, risk_reduction, automation_guidance):
    return Recommendation(
        recommendation_id=recommendation_id,
        title=f"Mitigate: {_value(attack_path, 'title')}",
        description=_value(attack_path, "description"),
        priority=_value(attack_path, "risk"),
        service=service,
        related_findings=_value(attack_path, "related_findings", []),
        related_attack_paths=[_value(attack_path, "attack_id")],
        remediation_steps=remediation_steps,
        risk_reduction=risk_reduction,
        automation_guidance=automation_guidance,
    )


# REC001 - AP001 Public Data Exposure
def recommend_public_data_exposure(findings, attack_paths):
    attack_path = _attack_path(attack_paths, "AP001")
    if not attack_path:
        return None

    return _recommendation(
        "REC001", attack_path, "S3",
        [
            "Enable all four S3 Block Public Access settings.",
            "Remove unintended public ACL grants and bucket-policy statements.",
            "Use CloudFront with origin access control for intentionally public content.",
        ],
        "Eliminates the public-data-exposure attack path.",
        "Enforce account-level S3 Block Public Access and monitor policy drift with AWS Config.",
    )


# REC002 - AP002 Credential Theft
def recommend_credential_theft(findings, attack_paths):
    attack_path = _attack_path(attack_paths, "AP002")
    if not attack_path:
        return None

    return _recommendation(
        "REC002", attack_path, "IAM",
        [
            "Enable MFA for every IAM user with a console password.",
            "Remove console access from identities that only require programmatic access.",
            "Use least-privilege permissions to limit the impact of a compromised identity.",
        ],
        "Makes stolen passwords insufficient for AWS console access.",
        "Alert when a new console user is created without MFA and enforce MFA with IAM policy conditions.",
    )


# REC003 - AP003 Account Takeover
def recommend_account_takeover(findings, attack_paths):
    attack_path = _attack_path(attack_paths, "AP003")
    if not attack_path:
        return None

    return _recommendation(
        "REC003", attack_path, "IAM",
        [
            "Enable MFA immediately for administrative IAM identities.",
            "Remove AdministratorAccess and replace it with scoped, task-specific permissions.",
            "Rotate active access keys and remove keys that are unused or no longer required.",
        ],
        "Breaks the path from a stolen credential to full account control.",
        "Use permissions boundaries and SCPs to prevent broad administrative access from being reintroduced.",
    )


# REC004 - AP004 Stealth Credential Compromise
def recommend_stealth_credential_compromise(findings, attack_paths):
    attack_path = _attack_path(attack_paths, "AP004")
    if not attack_path:
        return None

    return _recommendation(
        "REC004", attack_path, "CloudTrail",
        [
            "Enforce MFA for IAM users with console access.",
            "Create a multi-Region CloudTrail trail and include global service events.",
            "Protect logs with validation and alert on high-risk IAM activity.",
        ],
        "Improves both prevention and detection of credential compromise.",
        "Deploy CloudTrail through infrastructure as code and protect it with an SCP against deletion or modification.",
    )


# REC005 - AP005 Internet to Compute
def recommend_internet_to_compute(findings, attack_paths):
    attack_path = _attack_path(attack_paths, "AP005")
    if not attack_path:
        return None

    return _recommendation(
        "REC005", attack_path, "EC2",
        [
            "Remove unnecessary public IP addresses and place workloads in private subnets.",
            "Restrict SSH ingress to trusted CIDRs, a bastion host, VPN, or Systems Manager Session Manager.",
            "Require IMDSv2 on all EC2 instances to reduce credential-theft exposure.",
        ],
        "Breaks the internet-to-compute intrusion path.",
        "Enforce approved launch-template and security-group patterns with AWS Config and infrastructure-as-code checks.",
    )


RECOMMENDATION_RULES = [
    recommend_public_data_exposure,
    recommend_credential_theft,
    recommend_account_takeover,
    recommend_stealth_credential_compromise,
    recommend_internet_to_compute,
]
