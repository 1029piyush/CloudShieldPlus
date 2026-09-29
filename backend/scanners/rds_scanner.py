from botocore.exceptions import ClientError
from services.session_manager import get_session
from engine.rules.rds_rules import analyze_rds


def discover_rds():
    session = get_session()
    if session is None:
        return {"service": "RDS", "resources": [], "findings": []}

    resources = []
    try:
        rds = session.client("rds")
        paginator = rds.get_paginator("describe_db_instances")
        for page in paginator.paginate():
            for instance in page.get("DBInstances", []):
                db_id = instance.get("DBInstanceIdentifier")
                endpoint = instance.get("Endpoint", {})
                sec_groups = [
                    sg.get("VpcSecurityGroupId")
                    for sg in instance.get("VpcSecurityGroups", [])
                    if sg.get("Status") == "active"
                ]

                resources.append({
                    "db_instance_id": db_id,
                    "arn": instance.get("DBInstanceArn"),
                    "engine": instance.get("Engine"),
                    "engine_version": instance.get("EngineVersion"),
                    "status": instance.get("DBInstanceStatus"),
                    "allocated_storage": instance.get("AllocatedStorage"),
                    "publicly_accessible": instance.get("PubliclyAccessible", False),
                    "storage_encrypted": instance.get("StorageEncrypted", False),
                    "kms_key_id": instance.get("KmsKeyId"),
                    "multi_az": instance.get("MultiAZ", False),
                    "deletion_protection": instance.get("DeletionProtection", False),
                    "backup_retention_period": instance.get("BackupRetentionPeriod", 0),
                    "auto_minor_version_upgrade": instance.get("AutoMinorVersionUpgrade", False),
                    "security_groups": sec_groups,
                    "endpoint_address": endpoint.get("Address"),
                    "endpoint_port": endpoint.get("Port"),
                    "vpc_id": instance.get("DBSubnetGroup", {}).get("VpcId"),
                })
    except Exception as e:
        print(f"[RDS Scanner Error] {e}")

    findings = analyze_rds(resources)
    return {
        "service": "RDS",
        "resources": resources,
        "findings": findings,
    }
