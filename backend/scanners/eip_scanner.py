from botocore.exceptions import ClientError
from services.session_manager import get_session
from engine.rules.eip_rules import analyze_eip


def discover_eip():
    session = get_session()
    if session is None:
        return {"service": "ElasticIP", "resources": [], "findings": []}

    resources = []
    try:
        ec2 = session.client("ec2")
        addresses = ec2.describe_addresses().get("Addresses", [])
        for addr in addresses:
            resources.append({
                "allocation_id": addr.get("AllocationId"),
                "public_ip": addr.get("PublicIp"),
                "instance_id": addr.get("InstanceId"),
                "association_id": addr.get("AssociationId"),
                "network_interface_id": addr.get("NetworkInterfaceId"),
                "is_associated": addr.get("AssociationId") is not None,
            })
    except Exception as e:
        print(f"[EIP Scanner Error] {e}")

    findings = analyze_eip(resources)
    return {
        "service": "ElasticIP",
        "resources": resources,
        "findings": findings,
    }
