from botocore.exceptions import ClientError
from services.session_manager import get_session
from engine.rules.route53_rules import analyze_route53


def discover_route53():
    session = get_session()
    if session is None:
        return {"service": "Route53", "resources": [], "findings": []}

    resources = []
    try:
        r53 = session.client("route53")
        paginator = r53.get_paginator("list_hosted_zones")
        for page in paginator.paginate():
            for hz in page.get("HostedZones", []):
                resources.append({
                    "zone_id": hz.get("Id"),
                    "name": hz.get("Name"),
                    "private_zone": hz.get("Config", {}).get("PrivateZone", False),
                    "resource_record_set_count": hz.get("ResourceRecordSetCount"),
                })
    except Exception as e:
        print(f"[Route53 Scanner Error] {e}")

    findings = analyze_route53(resources)
    return {
        "service": "Route53",
        "resources": resources,
        "findings": findings,
    }
