from engine.findings import Finding
from engine.rules.helpers import is_cloudtrail_logging, is_multi_region
from engine.rules.severity import severity_for_rule


def _finding(rule_id, trail, title, description, recommendation,
             business_impact, evidence, exploitability, correlation_tags):
    return Finding(
        rule_id=rule_id,
        service="CloudTrail",
        resource=trail.get("name", "AWS Account"),
        severity=severity_for_rule(rule_id),
        title=title,
        description=description,
        recommendation=recommendation,
        business_impact=business_impact,
        evidence=evidence,
        exploitability=exploitability,
        correlation_tags=correlation_tags,
    ).to_dict()


def _account_finding(rule_id, title, description, recommendation,
                     business_impact, evidence, exploitability, correlation_tags):
    return _finding(
        rule_id, {"name": "AWS Account"}, title, description, recommendation,
        business_impact, evidence, exploitability, correlation_tags,
    )


# CT001 - No CloudTrail Trail
def ct001(resources):
    if resources:
        return None

    return _account_finding(
        "CT001",
        "CloudTrail Not Configured",
        "No CloudTrail trail was found in the account.",
        "Create a multi-Region CloudTrail trail that delivers logs to a protected S3 bucket.",
        "Security events cannot be audited or investigated.",
        ["No CloudTrail trails discovered"], 8,
        ["logging", "forensics", "detection_gap"],
    )


# CT002 - Trail Not Logging
def ct002(trail):
    if is_cloudtrail_logging(trail):
        return None

    return _finding(
        "CT002", trail,
        "CloudTrail Logging Disabled",
        "The trail exists but is not actively recording events.",
        "Start logging and investigate why the trail was stopped.",
        "Changes and access activity may occur without an audit record.",
        ["IsLogging: false"], 8,
        ["logging", "forensics", "defense_evasion"],
    )


# CT003 - No Multi-Region Trail
def ct003(resources):
    if any(is_multi_region(trail) for trail in resources):
        return None

    return _account_finding(
        "CT003",
        "No Multi-Region CloudTrail Trail",
        "No discovered trail records activity from all AWS Regions.",
        "Enable a multi-Region trail and include global service events.",
        "Activity in unmonitored Regions may evade detection and investigation.",
        ["Multi-Region trails discovered: 0"], 7,
        ["logging", "regional_coverage", "detection_gap"],
    )


# CT004 - Global Service Events Excluded
def ct004(trail):
    if trail.get("include_global_service_events", False):
        return None

    return _finding(
        "CT004", trail,
        "CloudTrail Global Service Events Excluded",
        "The trail does not include global AWS service events.",
        "Enable IncludeGlobalServiceEvents for trails used for security monitoring.",
        "IAM and other global service activity may be missing from the audit trail.",
        ["IncludeGlobalServiceEvents: false"], 7,
        ["logging", "iam", "detection_gap"],
    )


# CT005 - Log File Validation Disabled
def ct005(trail):
    if trail.get("log_validation", False):
        return None

    return _finding(
        "CT005", trail,
        "CloudTrail Log File Validation Disabled",
        "CloudTrail log file integrity validation is disabled.",
        "Enable log file validation and retain digest files with the trail logs.",
        "Investigators cannot readily verify whether delivered log files were altered or deleted.",
        ["LogFileValidationEnabled: false"], 6,
        ["logging", "forensics", "integrity"],
    )


# CT006 - Customer Managed KMS Key Not Configured
def ct006(trail):
    if trail.get("kms_key"):
        return None

    return _finding(
        "CT006", trail,
        "CloudTrail Customer Managed KMS Key Not Configured",
        "The trail does not use a customer managed KMS key for log delivery.",
        "Configure a dedicated customer managed KMS key with tightly scoped key policies.",
        "Audit-log encryption cannot use customer-controlled key policies, rotation, and access auditing.",
        ["KmsKeyId: Not configured"], 4,
        ["encryption", "logging", "key_management"],
    )


# CT007 - CloudWatch Logs Integration Missing
def ct007(trail):
    if trail.get("cloudwatch_log_group"):
        return None

    return _finding(
        "CT007", trail,
        "CloudTrail CloudWatch Logs Integration Missing",
        "The trail does not deliver events to a CloudWatch Logs group.",
        "Configure CloudWatch Logs delivery and alarms for high-risk API activity, or document an equivalent SIEM integration.",
        "Near-real-time detection and alerting for suspicious API activity may be delayed.",
        ["CloudWatchLogsLogGroupArn: Not configured"], 5,
        ["monitoring", "alerting", "detection_gap"],
    )


def _captures_data_events(trail):
    for selector in trail.get("event_selectors", []):
        if selector.get("DataResources"):
            return True

    for selector in trail.get("advanced_event_selectors", []):
        for field_selector in selector.get("FieldSelectors", []):
            if field_selector.get("Field") != "eventCategory":
                continue
            values = field_selector.get("Equals", [])
            if "Data" in values:
                return True

    return False


# CT008 - Data Events Not Captured
def ct008(trail):
    if _captures_data_events(trail):
        return None

    return _finding(
        "CT008", trail,
        "CloudTrail Data Events Not Captured",
        "The trail has no S3, Lambda, or DynamoDB data-event selector.",
        "Add scoped data-event selectors for sensitive buckets, functions, and tables to balance visibility and cost.",
        "Object, function, and table access may not be available during an incident investigation.",
        ["Data event selectors: None"], 5,
        ["logging", "data_access", "forensics"],
    )


RULES = [ct002, ct004, ct005, ct006, ct007, ct008]


def analyze_cloudtrail(resources):
    """Run account-wide CloudTrail checks and each trail-specific rule."""
    findings = []
    no_trail = ct001(resources)
    if no_trail:
        return [no_trail]

    multi_region = ct003(resources)
    if multi_region:
        findings.append(multi_region)

    for trail in resources:
        for rule in RULES:
            finding = rule(trail)
            if finding:
                findings.append(finding)
    return findings
