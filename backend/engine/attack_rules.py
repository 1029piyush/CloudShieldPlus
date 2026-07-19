"""Attack-path definitions correlated from Rule Engine findings only.

Version 1 uses rule IDs. The helper functions also retain correlation tags,
so future rules can add tag-based matching without changing the engine.
"""

from collections.abc import Mapping

from engine.attack_path import AttackPath


def _value(finding, name, default=None):
    if isinstance(finding, Mapping):
        return finding.get(name, default)
    return getattr(finding, name, default)


def _rule_ids(findings):
    return {
        rule_id
        for rule_id in (_value(finding, "rule_id") for finding in findings)
        if rule_id
    }


def _related_findings(findings, required_rule_ids):
    present_rule_ids = _rule_ids(findings)
    return [rule_id for rule_id in required_rule_ids if rule_id in present_rule_ids]


def has_correlation_tag(findings, tag):
    """Future extension point for tag-based attack-path correlation."""
    return any(
        tag in (_value(finding, "correlation_tags", []) or [])
        for finding in findings
    )


def _attack_path(attack_id, title, description, risk, likelihood, impact,
                 findings, required_rule_ids, attack_steps, mitigation):
    return AttackPath(
        attack_id=attack_id,
        title=title,
        description=description,
        risk=risk,
        likelihood=likelihood,
        impact=impact,
        related_findings=_related_findings(findings, required_rule_ids),
        attack_steps=attack_steps,
        mitigation=mitigation,
    )


# ============================================================
# AP001 - Public Data Exposure
# ============================================================
def attack_public_data_exposure(findings):
    if "S3001" not in _rule_ids(findings):
        return None

    return _attack_path(
        "AP001",
        "Public Data Exposure",
        "An S3 bucket has Block Public Access disabled, creating a path for unintended public data exposure.",
        "Critical",
        "High",
        "Critical",
        findings,
        ["S3001"],
        [
            "An attacker identifies a bucket with Block Public Access disabled.",
            "The attacker tests bucket policies or ACLs for anonymous object access.",
            "Exposed objects are read, copied, or used to support additional attacks.",
        ],
        "Enable all S3 Block Public Access settings and remove unintended public bucket policies and ACLs.",
    )


# ============================================================
# AP002 - Credential Theft
# ============================================================
def attack_credential_theft(findings):
    if "IAM002" not in _rule_ids(findings):
        return None

    return _attack_path(
        "AP002",
        "Credential Theft",
        "An IAM user does not have MFA enabled, increasing the chance that a stolen password can be used successfully.",
        "High",
        "High",
        "High",
        findings,
        ["IAM002"],
        [
            "An attacker obtains an IAM user's password through phishing, reuse, or malware.",
            "The attacker signs in without needing to satisfy a second authentication factor.",
            "The attacker uses the IAM user's permissions to access AWS resources.",
        ],
        "Require MFA for IAM users, remove unnecessary console access, and use least-privilege permissions.",
    )


# ============================================================
# AP003 - Account Takeover
# ============================================================
def attack_account_takeover(findings):
    required = ["IAM020", "IAM002"]
    if not set(required).issubset(_rule_ids(findings)):
        return None

    return _attack_path(
        "AP003",
        "Account Takeover",
        "An administrative IAM account lacks MFA, allowing stolen credentials to become account-wide control.",
        "Critical",
        "High",
        "Critical",
        findings,
        required,
        [
            "An attacker obtains the administrator's password or authenticated session.",
            "The absence of MFA permits authentication without a second factor.",
            "Administrative permissions allow the attacker to change account configuration and retain control.",
        ],
        "Enable MFA immediately for administrative identities and replace broad administrator access with least-privilege permissions.",
    )


# ============================================================
# AP004 - Stealth Credential Compromise
# ============================================================
def attack_stealth_credential_compromise(findings):
    required = ["IAM002", "CT001"]
    if not set(required).issubset(_rule_ids(findings)):
        return None

    return _attack_path(
        "AP004",
        "Stealth Credential Compromise",
        "An IAM account without MFA can be compromised while CloudTrail is absent, reducing the chance of detection and investigation.",
        "Critical",
        "High",
        "Critical",
        findings,
        required,
        [
            "An attacker compromises an IAM user that does not require MFA.",
            "The attacker performs AWS API actions using the compromised identity.",
            "Without CloudTrail, the account lacks an authoritative record for detection and investigation.",
        ],
        "Enforce MFA for IAM users and configure a multi-Region CloudTrail trail with protected log storage.",
    )


# ============================================================
# AP005 - Internet to Compute
# ============================================================
def attack_internet_to_compute(findings):
    required = ["SG001", "EC2001"]
    if not set(required).issubset(_rule_ids(findings)):
        return None

    return _attack_path(
        "AP005",
        "Internet to Compute",
        "A public EC2 instance is associated with a security group that exposes SSH to the internet.",
        "Critical",
        "High",
        "High",
        findings,
        required,
        [
            "An attacker discovers the EC2 instance's public IP address.",
            "The attacker identifies SSH access exposed through a security group.",
            "The attacker attempts credential attacks or exploits against the exposed service.",
        ],
        "Remove unnecessary public IPs and restrict SSH to trusted CIDRs, a bastion host, VPN, or Systems Manager Session Manager.",
    )


ATTACK_RULES = [
    attack_public_data_exposure,
    attack_credential_theft,
    attack_account_takeover,
    attack_stealth_credential_compromise,
    attack_internet_to_compute,
]
