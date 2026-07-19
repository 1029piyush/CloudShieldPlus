from engine.recommendation import Recommendation
from engine.recommendation_utils import (
    get_attack_ids,
    related_findings,
    related_attack_paths,
    affected_resources,
)


def _recommendation(recommendation_id, title, description, priority, category,
                    business_impact, findings, required_rule_ids, attack_paths,
                    required_attack_ids, implementation_steps, estimated_effort,
                    expected_risk_reduction, auto_fix_supported, references=None):
    """Internal helper to construct deterministic Recommendation objects."""
    return Recommendation(
        recommendation_id=recommendation_id,
        title=title,
        description=description,
        priority=priority,
        category=category,
        business_impact=business_impact,
        affected_resources=affected_resources(findings, required_rule_ids),
        related_findings=related_findings(findings, required_rule_ids),
        related_attack_paths=related_attack_paths(attack_paths, required_attack_ids),
        implementation_steps=implementation_steps,
        estimated_effort=estimated_effort,
        expected_risk_reduction=expected_risk_reduction,
        references=references or [],
        auto_fix_supported=auto_fix_supported,
    )


# ============================================================
# REC001 - Enable MFA (Identity)
# ============================================================
def recommend_enable_mfa(findings, attack_paths):
    """Enforce MFA for user identities if credential-related threat scenarios are active."""
    required_attacks = ["AP002", "AP003", "AP004"]
    active_attacks = get_attack_ids(attack_paths)

    # Check if any associated attack path is present
    if not any(attack in active_attacks for attack in required_attacks):
        return None

    # Priority determination based on severity of active threats
    priority = "High"
    if "AP003" in active_attacks or "AP004" in active_attacks:
        priority = "Critical"

    return _recommendation(
        recommendation_id="REC001",
        title="Enable MFA",
        description="Enforce Multi-Factor Authentication (MFA) for administrative and standard console users.",
        priority=priority,
        category="Identity",
        business_impact="Password-only console logins allow attackers to easily compromise user accounts and escalate privileges to administrative control.",
        findings=findings,
        required_rule_ids=["IAM002", "IAM005"],
        attack_paths=attack_paths,
        required_attack_ids=required_attacks,
        implementation_steps=[
            {
                "step": 1,
                "title": "Enable MFA",
                "description": "Enable multi-factor authentication for all affected IAM users.",
            },
            {
                "step": 2,
                "title": "Verify",
                "description": "Confirm every affected IAM user has MFA enabled.",
            },
        ],
        estimated_effort="Medium",
        expected_risk_reduction="Very High",
        auto_fix_supported=False,
    )


# ============================================================
# REC002 - Enable S3 Block Public Access (Storage)
# ============================================================
def recommend_enable_s3_block_public_access(findings, attack_paths):
    """Enable S3 BPA if public exposure risk is identified."""
    required_attacks = ["AP001"]
    active_attacks = get_attack_ids(attack_paths)

    if not any(attack in active_attacks for attack in required_attacks):
        return None

    return _recommendation(
        recommendation_id="REC002",
        title="Enable S3 Block Public Access",
        description="Enable S3 Block Public Access to prevent public exposure of S3 bucket contents.",
        priority="Critical",
        category="Storage",
        business_impact="Unintended public buckets allow anonymous internet users to read, download, or modify sensitive business data.",
        findings=findings,
        required_rule_ids=["S3001"],
        attack_paths=attack_paths,
        required_attack_ids=required_attacks,
        implementation_steps=[
            {
                "step": 1,
                "title": "Enable Block Public Access",
                "description": "Enable S3 Block Public Access settings at the bucket or account level.",
            },
            {
                "step": 2,
                "title": "Verify",
                "description": "Verify that public access is blocked for all affected buckets.",
            },
        ],
        estimated_effort="Low",
        expected_risk_reduction="High",
        auto_fix_supported=True,
    )


# ============================================================
# REC003 - Enable CloudTrail (Monitoring)
# ============================================================
def recommend_enable_cloudtrail(findings, attack_paths):
    """Enable CloudTrail if stealth operations threat scenario is active."""
    required_attacks = ["AP004"]
    active_attacks = get_attack_ids(attack_paths)

    if not any(attack in active_attacks for attack in required_attacks):
        return None

    return _recommendation(
        recommendation_id="REC003",
        title="Enable CloudTrail",
        description="Configure and enable a multi-region AWS CloudTrail trail to log all API activity.",
        priority="High",
        category="Monitoring",
        business_impact="Without audit logging, security incidents cannot be traced, analyzed, or detected in a timely manner.",
        findings=findings,
        required_rule_ids=["CT001"],
        attack_paths=attack_paths,
        required_attack_ids=required_attacks,
        implementation_steps=[
            {
                "step": 1,
                "title": "Enable CloudTrail",
                "description": "Configure a multi-region trail that records all management events.",
            },
            {
                "step": 2,
                "title": "Verify",
                "description": "Confirm logs are being delivered to the destination bucket.",
            },
        ],
        estimated_effort="Low",
        expected_risk_reduction="High",
        auto_fix_supported=True,
    )


# ============================================================
# REC004 - Restrict Public SSH Access (Network)
# ============================================================
def recommend_remove_public_ssh(findings, attack_paths):
    """Restrict SSH access if compute exposure risk is present."""
    required_attacks = ["AP005"]
    active_attacks = get_attack_ids(attack_paths)

    if not any(attack in active_attacks for attack in required_attacks):
        return None

    return _recommendation(
        recommendation_id="REC004",
        title="Restrict Public SSH Access",
        description="Remove unrestricted security group rules permitting SSH ingress from the public internet.",
        priority="High",
        category="Network",
        business_impact="Exposing SSH publicly permits brute-forcing attacks or exploitation of host services.",
        findings=findings,
        required_rule_ids=["SG001"],
        attack_paths=attack_paths,
        required_attack_ids=required_attacks,
        implementation_steps=[
            {
                "step": 1,
                "title": "Restrict SSH",
                "description": "Update security group rules to restrict SSH access to trusted IP ranges or bastions.",
            },
            {
                "step": 2,
                "title": "Verify",
                "description": "Verify that SSH port is no longer open to the public internet.",
            },
        ],
        estimated_effort="Low",
        expected_risk_reduction="High",
        auto_fix_supported=True,
    )


# ============================================================
# REC005 - Enforce IMDSv2 (Compute)
# ============================================================
def recommend_enable_imdsv2(findings, attack_paths):
    """Enforce IMDSv2 if compute intrusion risk is active."""
    required_attacks = ["AP005"]
    active_attacks = get_attack_ids(attack_paths)

    if not any(attack in active_attacks for attack in required_attacks):
        return None

    return _recommendation(
        recommendation_id="REC005",
        title="Enforce IMDSv2",
        description="Configure EC2 instances to require the use of Instance Metadata Service Version 2 (IMDSv2).",
        priority="High",
        category="Compute",
        business_impact="IMDSv1 permits attackers to extract AWS credentials via SSRF (Server-Side Request Forgery) vulnerabilities.",
        findings=findings,
        required_rule_ids=["EC2001"],
        attack_paths=attack_paths,
        required_attack_ids=required_attacks,
        implementation_steps=[
            {
                "step": 1,
                "title": "Enforce IMDSv2",
                "description": "Update EC2 instances to require IMDSv2 session-oriented requests.",
            },
            {
                "step": 2,
                "title": "Verify",
                "description": "Verify that IMDSv1 is disabled on the EC2 instances.",
            },
        ],
        estimated_effort="Low",
        expected_risk_reduction="High",
        auto_fix_supported=True,
    )


RECOMMENDATION_RULES = [
    recommend_enable_mfa,
    recommend_enable_s3_block_public_access,
    recommend_enable_cloudtrail,
    recommend_remove_public_ssh,
    recommend_enable_imdsv2,
]
