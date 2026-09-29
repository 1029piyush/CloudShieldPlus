from botocore.exceptions import ClientError
from services.session_manager import get_session
from engine.rules.cloudwatch_rules import analyze_cloudwatch


def discover_cloudwatch():
    session = get_session()
    if session is None:
        return {"service": "CloudWatch", "resources": [], "findings": []}

    resources = []
    try:
        logs = session.client("logs")
        paginator = logs.get_paginator("describe_log_groups")
        for page in paginator.paginate():
            for lg in page.get("logGroups", []):
                resources.append({
                    "log_group_name": lg.get("logGroupName"),
                    "arn": lg.get("arn"),
                    "retention_in_days": lg.get("retentionInDays"),
                    "kms_key_id": lg.get("kmsKeyId"),
                    "stored_bytes": lg.get("storedBytes"),
                })
    except Exception as e:
        print(f"[CloudWatch Scanner Error] {e}")

    findings = analyze_cloudwatch(resources)
    return {
        "service": "CloudWatch",
        "resources": resources,
        "findings": findings,
    }
