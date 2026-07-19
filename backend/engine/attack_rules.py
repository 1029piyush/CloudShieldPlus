from engine.attack_path import AttackPath
from engine.attack_utils import (
    get_rule_ids,
    related_findings,
    affected_resources,
)


def _attack_path(attack_id, title, description, risk, likelihood, impact,
                 findings, required_rule_ids, attack_steps, mitigation):
    """Internal helper to construct deterministic AttackPath objects."""
    return AttackPath(
        attack_id=attack_id,
        title=title,
        description=description,
        risk=risk,
        likelihood=likelihood,
        impact=impact,
        related_findings=related_findings(findings, required_rule_ids),
        affected_resources=affected_resources(findings, required_rule_ids),
        attack_steps=attack_steps,
        mitigation=mitigation,
    )


# ============================================================
# AP001 - Public Data Exposure
# ============================================================
def attack_public_data_exposure(findings):
    """S3 bucket Block Public Access disabled."""
    required = ["S3001"]
    if not set(required).issubset(get_rule_ids(findings)):
        return None

    return _attack_path(
        "AP001",
        "Public Data Exposure",
        "An S3 bucket has Block Public Access disabled, creating a path for unintended public data exposure.",
        "Critical",
        "High",
        "Critical",
        findings,
        required,
        [
            {
                "step": 1,
                "title": "Discovery",
                "description": "Attacker identifies a bucket with Block Public Access disabled.",
            },
            {
                "step": 2,
                "title": "Enumeration",
                "description": "Attacker tests bucket policies or ACLs for anonymous object access.",
            },
            {
                "step": 3,
                "title": "Data Access",
                "description": "Exposed objects are read, copied, or used to support additional attacks.",
            },
        ],
        "Enable all S3 Block Public Access settings and remove unintended public bucket policies and ACLs.",
    )


# ============================================================
# AP002 - Credential Theft
# ============================================================
def attack_credential_theft(findings):
    """IAM user does not have MFA enabled."""
    required = ["IAM002"]
    if not set(required).issubset(get_rule_ids(findings)):
        return None

    return _attack_path(
        "AP002",
        "Credential Theft",
        "An IAM user does not have MFA enabled, increasing the chance that a stolen password can be used successfully.",
        "High",
        "High",
        "High",
        findings,
        required,
        [
            {
                "step": 1,
                "title": "Credential Access",
                "description": "An attacker obtains an IAM user's password through phishing, reuse, or malware.",
            },
            {
                "step": 2,
                "title": "Authentication",
                "description": "The attacker signs in without needing to satisfy a second authentication factor.",
            },
            {
                "step": 3,
                "title": "Resource Access",
                "description": "The attacker uses the IAM user's permissions to access AWS resources.",
            },
        ],
        "Require MFA for IAM users, remove unnecessary console access, and use least-privilege permissions.",
    )


# ============================================================
# AP003 - Administrator Account Takeover
# ============================================================
def attack_account_takeover(findings):
    """Administrative IAM account lacks MFA."""
    required = ["IAM020", "IAM002"]
    if not set(required).issubset(get_rule_ids(findings)):
        return None

    return _attack_path(
        "AP003",
        "Administrator Account Takeover",
        "An administrative IAM account lacks MFA, allowing stolen credentials to become account-wide control.",
        "Critical",
        "High",
        "Critical",
        findings,
        required,
        [
            {
                "step": 1,
                "title": "Credential Access",
                "description": "An attacker obtains the administrator's password or authenticated session.",
            },
            {
                "step": 2,
                "title": "Authentication",
                "description": "The absence of MFA permits authentication without a second factor.",
            },
            {
                "step": 3,
                "title": "Account Control",
                "description": "Administrative permissions allow the attacker to change account configuration and retain control.",
            },
        ],
        "Enable MFA immediately for administrative identities and replace broad administrator access with least-privilege permissions.",
    )


# ============================================================
# AP004 - Stealth Credential Compromise
# ============================================================
def attack_stealth_compromise(findings):
    """IAM account without MFA compromised while CloudTrail is absent/disabled."""
    required = ["IAM002", "CT001"]
    if not set(required).issubset(get_rule_ids(findings)):
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
            {
                "step": 1,
                "title": "Credential Access",
                "description": "An attacker compromises an IAM user that does not require MFA.",
            },
            {
                "step": 2,
                "title": "Stealth Operations",
                "description": "The attacker performs AWS API actions using the compromised identity.",
            },
            {
                "step": 3,
                "title": "Defense Evasion",
                "description": "Without CloudTrail, the account lacks an authoritative record for detection and investigation.",
            },
        ],
        "Enforce MFA for IAM users and configure a multi-Region CloudTrail trail with protected log storage.",
    )


# ============================================================
# AP005 - Internet to Compute
# ============================================================
def attack_internet_to_compute(findings):
    """Public EC2 instance security group exposes SSH to the internet."""
    required = ["SG001", "EC2001"]
    if not set(required).issubset(get_rule_ids(findings)):
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
            {
                "step": 1,
                "title": "Discovery",
                "description": "An attacker discovers the EC2 instance's public IP address.",
            },
            {
                "step": 2,
                "title": "Access Attempt",
                "description": "The attacker identifies SSH access exposed through a security group.",
            },
            {
                "step": 3,
                "title": "Compromise",
                "description": "The attacker attempts credential attacks or exploits against the exposed service.",
            },
        ],
        "Remove unnecessary public IPs and restrict SSH to trusted CIDRs, a bastion host, VPN, or Systems Manager Session Manager.",
    )


ATTACK_RULES = [
    attack_public_data_exposure,
    attack_credential_theft,
    attack_account_takeover,
    attack_stealth_compromise,
    attack_internet_to_compute,
]
