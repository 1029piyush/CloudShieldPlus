from engine.findings import Finding
from engine.rules.helpers import (
    has_public_ip,
    is_imdsv2_required,
    is_termination_protected,
)
from engine.rules.severity import severity_for_rule


def _finding(rule_id, instance, title, description, recommendation,
             business_impact, evidence, exploitability, correlation_tags):
    """Create a consistently shaped finding for an EC2 instance rule."""
    return Finding(
        rule_id=rule_id,
        service="EC2",
        resource=instance["instance_id"],
        severity=severity_for_rule(rule_id),
        title=title,
        description=description,
        recommendation=recommendation,
        business_impact=business_impact,
        evidence=evidence,
        exploitability=exploitability,
        correlation_tags=correlation_tags,
    ).to_dict()


# EC2001 - Public IP Assigned
def ec2001(instance):
    if not has_public_ip(instance):
        return None

    return _finding(
        "EC2001", instance,
        "EC2 Instance Has Public IP",
        "The instance is assigned a public IPv4 address.",
        "Move the workload to a private subnet, or restrict inbound access through a load balancer, bastion, or VPN.",
        "Internet-reachable compute increases the attack surface and exposure of hosted services.",
        [f"Public IPv4 address: {instance['public_ip']}"], 8,
        ["public_exposure", "network_exposure"],
    )


# EC2002 - IMDSv2 Not Enforced
def ec2002(instance):
    if is_imdsv2_required(instance):
        return None

    return _finding(
        "EC2002", instance,
        "IMDSv2 Not Enforced",
        "The instance metadata service permits IMDSv1 requests.",
        "Set HttpTokens to required and validate workloads before enforcing IMDSv2.",
        "SSRF flaws can be used to retrieve instance metadata and IAM role credentials.",
        ["Metadata HttpTokens: optional"], 8,
        ["credential_theft", "ssrf", "instance_metadata"],
    )


# EC2003 - Unencrypted EBS Volumes
def ec2003(instance):
    unencrypted = instance.get("unencrypted_ebs_volumes", [])
    if not unencrypted:
        return None

    return _finding(
        "EC2003", instance,
        "Unencrypted EBS Volume Attached",
        "One or more EBS volumes attached to the instance are not encrypted.",
        "Create encrypted replacement volumes or snapshots and migrate the instance data.",
        "Data on detached volumes, snapshots, or underlying storage may lack required protection.",
        [f"Unencrypted volumes: {', '.join(unencrypted)}"], 6,
        ["data_protection", "encryption", "ebs"],
    )


# EC2004 - Termination Protection Disabled
def ec2004(instance):
    if is_termination_protected(instance):
        return None

    return _finding(
        "EC2004", instance,
        "Termination Protection Disabled",
        "API termination protection is not enabled for this instance.",
        "Enable termination protection for production and other critical workloads.",
        "Accidental or compromised API access can terminate the workload and cause an outage.",
        ["DisableApiTermination: false"], 4,
        ["availability", "resilience"],
    )


# EC2005 - Detailed Monitoring Disabled
def ec2005(instance):
    if instance.get("monitoring") == "enabled":
        return None

    return _finding(
        "EC2005", instance,
        "Detailed EC2 Monitoring Disabled",
        "The instance is not using one-minute CloudWatch detailed monitoring.",
        "Enable detailed monitoring for production workloads that require faster operational detection.",
        "Resource spikes and availability issues may take longer to detect and investigate.",
        [f"Monitoring state: {instance.get('monitoring', 'disabled')}"], 3,
        ["monitoring", "availability"],
    )


# EC2006 - IMDS Hop Limit Too High
def ec2006(instance):
    hop_limit = instance.get("metadata_hop_limit")
    if hop_limit is None or hop_limit <= 1:
        return None

    return _finding(
        "EC2006", instance,
        "IMDS Hop Limit Exceeds One",
        "The instance metadata hop limit is greater than one.",
        "Set HttpPutResponseHopLimit to 1 unless a documented container or proxy workload requires a higher value.",
        "Metadata responses may be reachable through additional network hops, increasing SSRF exposure.",
        [f"Metadata hop limit: {hop_limit}"], 6,
        ["ssrf", "instance_metadata", "network_exposure"],
    )


# EC2007 - Instance Metadata Tags Enabled
def ec2007(instance):
    if not instance.get("metadata_tags_enabled", False):
        return None

    return _finding(
        "EC2007", instance,
        "Instance Metadata Tags Enabled",
        "Instance tags are exposed through the instance metadata service.",
        "Disable instance metadata tags unless workloads explicitly require them; never store sensitive values in tags.",
        "Application-accessible metadata can disclose internal ownership, environment, or operational details.",
        ["InstanceMetadataTags: enabled"], 4,
        ["information_disclosure", "instance_metadata"],
    )


# EC2008 - Public Instance Allows IMDSv1
def ec2008(instance):
    if not (has_public_ip(instance) and not is_imdsv2_required(instance)):
        return None

    return _finding(
        "EC2008", instance,
        "Public EC2 Instance Allows IMDSv1",
        "An internet-addressable instance also permits IMDSv1 requests.",
        "Remove the public IP where possible and require IMDSv2 to reduce credential-theft paths.",
        "A public-facing application with an SSRF flaw could expose instance metadata and role credentials.",
        [f"Public IPv4 address: {instance['public_ip']}", "Metadata HttpTokens: optional"], 9,
        ["public_exposure", "credential_theft", "ssrf", "attack_path"],
    )


RULES = [ec2001, ec2002, ec2003, ec2004, ec2005, ec2006, ec2007, ec2008]


def analyze_ec2(resources):
    """Run every EC2 rule against every discovered instance."""
    findings = []
    for instance in resources:
        for rule in RULES:
            finding = rule(instance)
            if finding:
                findings.append(finding)
    return findings
