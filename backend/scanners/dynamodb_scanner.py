from botocore.exceptions import ClientError
from services.session_manager import get_session
from engine.rules.dynamodb_rules import analyze_dynamodb


def discover_dynamodb():
    session = get_session()
    if session is None:
        return {"service": "DynamoDB", "resources": [], "findings": []}

    resources = []
    try:
        ddb = session.client("dynamodb")
        table_names = ddb.list_tables().get("TableNames", [])
        for name in table_names:
            desc = ddb.describe_table(TableName=name).get("Table", {})
            sse_description = desc.get("SSEDescription", {})
            sse_status = sse_description.get("Status") == "ENABLED"
            sse_type = sse_description.get("SSEType")

            pitr_enabled = False
            try:
                pitr = ddb.describe_continuous_backups(TableName=name)
                pitr_enabled = pitr.get("ContinuousBackupsDescription", {}).get("PointInTimeRecoveryDescription", {}).get("PointInTimeRecoveryStatus") == "ENABLED"
            except Exception:
                pass

            resources.append({
                "table_name": name,
                "arn": desc.get("TableArn"),
                "status": desc.get("TableStatus"),
                "item_count": desc.get("ItemCount"),
                "sse_enabled": sse_status,
                "sse_type": sse_type,
                "pitr_enabled": pitr_enabled,
            })
    except Exception as e:
        print(f"[DynamoDB Scanner Error] {e}")

    findings = analyze_dynamodb(resources)
    return {
        "service": "DynamoDB",
        "resources": resources,
        "findings": findings,
    }
