from engine.findings import Finding
from engine.rules.helpers import (
    is_bucket_encrypted,
    is_bucket_public,
    is_logging_enabled,
    is_versioning_enabled,
    is_website_enabled,
)
from engine.rules.severity import severity_for_rule


def _finding(rule_id, bucket, title, description, recommendation,
             business_impact, evidence, exploitability, correlation_tags):
    """Create a consistently shaped finding for an S3 bucket rule."""
    return Finding(
        rule_id=rule_id,
        service="S3",
        resource=bucket["bucket_name"],
        severity=severity_for_rule(rule_id),
        title=title,
        description=description,
        recommendation=recommendation,
        business_impact=business_impact,
        evidence=evidence,
        exploitability=exploitability,
        correlation_tags=correlation_tags,
    ).to_dict()


# S3001 - Block Public Access Disabled
def s3001(bucket):
    if not is_bucket_public(bucket):
        return None

    return _finding(
        "S3001", bucket,
        "S3 Block Public Access Disabled",
        "The bucket does not have all S3 Block Public Access protections enabled.",
        "Enable all four Block Public Access settings unless a documented exception is required.",
        "Bucket policies or ACLs could expose data to the public internet.",
        ["Block Public Access is not fully enabled"], 10,
        ["public_exposure", "data_exposure"],
    )


# S3002 - Versioning Disabled
def s3002(bucket):
    if is_versioning_enabled(bucket):
        return None

    return _finding(
        "S3002", bucket,
        "S3 Versioning Disabled",
        "Versioning is disabled for this bucket.",
        "Enable S3 Versioning and configure lifecycle rules for noncurrent versions.",
        "Accidentally deleted or overwritten objects cannot be readily recovered.",
        ["Versioning status: Disabled"], 3,
        ["data_resilience", "ransomware"],
    )


# S3003 - Default Encryption Disabled
def s3003(bucket):
    if is_bucket_encrypted(bucket):
        return None

    return _finding(
        "S3003", bucket,
        "S3 Default Encryption Disabled",
        "The bucket has no default server-side encryption configuration.",
        "Enable default encryption with SSE-S3 or SSE-KMS; use SSE-KMS for data requiring key controls.",
        "New objects may be stored without the account's intended encryption controls.",
        ["Default encryption: Not configured"], 7,
        ["data_protection", "encryption"],
    )


# S3004 - Server Access Logging Disabled
def s3004(bucket):
    if is_logging_enabled(bucket):
        return None

    return _finding(
        "S3004", bucket,
        "S3 Server Access Logging Disabled",
        "Server access logging is not enabled for this bucket.",
        "Enable server access logging or ensure equivalent CloudTrail S3 data-event logging is configured.",
        "Object-level access may be harder to investigate during a security incident.",
        ["Server access logging: Disabled"], 4,
        ["logging", "forensics"],
    )


# S3005 - Object Lock Disabled
def s3005(bucket):
    if bucket.get("object_lock", False):
        return None

    return _finding(
        "S3005", bucket,
        "S3 Object Lock Disabled",
        "S3 Object Lock is not enabled for this bucket.",
        "For backup, audit, and regulated data, create an Object Lock-enabled bucket with an appropriate retention policy.",
        "Protected records and backups may be deleted or altered by an attacker or administrator.",
        ["Object Lock: Disabled"], 5,
        ["ransomware", "data_resilience"],
    )


# S3006 - Bucket Owner Enforced Not Configured
def s3006(bucket):
    ownership = bucket.get("ownership")
    if ownership == "BucketOwnerEnforced":
        return None

    status = ownership or "Not configured"
    return _finding(
        "S3006", bucket,
        "S3 Object Ownership Not Enforced",
        "Bucket owner enforced object ownership is not configured.",
        "Set Object Ownership to Bucket owner enforced and migrate away from ACL-based access control.",
        "ACL-based permissions can lead to unexpected object ownership and access control.",
        [f"Object ownership: {status}"], 5,
        ["access_control", "data_exposure"],
    )


# S3007 - MFA Delete Disabled
def s3007(bucket):
    if not is_versioning_enabled(bucket) or bucket.get("mfa_delete", False):
        return None

    return _finding(
        "S3007", bucket,
        "S3 MFA Delete Disabled",
        "Versioning is enabled, but MFA Delete is not enabled.",
        "For high-value buckets, enable MFA Delete using the account root credentials and protect those credentials with MFA.",
        "A compromised privileged identity can permanently delete object versions.",
        ["Versioning: Enabled", "MFA Delete: Disabled"], 6,
        ["ransomware", "data_resilience"],
    )


# S3008 - Public ACL Detected
def s3008(bucket):
    public_permissions = bucket.get("public_acl_permissions", [])
    if not public_permissions:
        return None

    return _finding(
        "S3008", bucket,
        "Public S3 ACL Detected",
        "The bucket ACL grants permissions to AllUsers or AuthenticatedUsers.",
        "Remove public ACL grants and use narrowly scoped bucket policies or IAM policies instead.",
        "Bucket contents may be exposed to unauthenticated or broadly authenticated users.",
        [f"Public ACL permissions: {', '.join(public_permissions)}"], 9,
        ["public_exposure", "acl", "data_exposure"],
    )


# S3009 - Static Website Exposed Without Public-Access Guardrails
def s3009(bucket):
    if not (is_website_enabled(bucket) and is_bucket_public(bucket)):
        return None

    return _finding(
        "S3009", bucket,
        "S3 Static Website Has Reduced Public-Access Guardrails",
        "Static website hosting is enabled while Block Public Access is not fully enabled.",
        "Use CloudFront with an origin access control, or document and narrowly scope the required public access.",
        "Website content or unintended objects can become internet-accessible.",
        ["Static website hosting: Enabled", "Block Public Access: Not fully enabled"], 8,
        ["public_exposure", "web_hosting"],
    )


RULES = [s3001, s3002, s3003, s3004, s3005, s3006, s3007, s3008, s3009]


def analyze_s3(resources):
    """Run every S3 rule against every discovered bucket."""
    findings = []
    for bucket in resources:
        for rule in RULES:
            finding = rule(bucket)
            if finding:
                findings.append(finding)
    return findings
