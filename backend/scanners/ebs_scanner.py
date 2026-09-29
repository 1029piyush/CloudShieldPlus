from botocore.exceptions import ClientError
from services.session_manager import get_session
from engine.rules.ebs_rules import analyze_ebs


def discover_ebs():
    session = get_session()
    if session is None:
        return {"service": "EBS", "resources": [], "findings": []}

    resources = []
    try:
        ec2 = session.client("ec2")
        paginator = ec2.get_paginator("describe_volumes")
        for page in paginator.paginate():
            for vol in page.get("Volumes", []):
                vol_id = vol.get("VolumeId")
                attachments = [
                    {
                        "instance_id": att.get("InstanceId"),
                        "device": att.get("Device"),
                        "state": att.get("State"),
                    }
                    for att in vol.get("Attachments", [])
                ]

                resources.append({
                    "volume_id": vol_id,
                    "size_gb": vol.get("Size"),
                    "volume_type": vol.get("VolumeType"),
                    "state": vol.get("State"),
                    "encrypted": vol.get("Encrypted", False),
                    "kms_key_id": vol.get("KmsKeyId"),
                    "attachments": attachments,
                    "availability_zone": vol.get("AvailabilityZone"),
                    "snapshot_id": vol.get("SnapshotId"),
                    "tags": {t["Key"]: t["Value"] for t in vol.get("Tags", [])},
                })
    except Exception as e:
        print(f"[EBS Scanner Error] {e}")

    findings = analyze_ebs(resources)
    return {
        "service": "EBS",
        "resources": resources,
        "findings": findings,
    }
