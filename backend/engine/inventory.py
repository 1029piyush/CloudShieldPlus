from datetime import date, datetime


def _json_safe(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, dict):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_json_safe(item) for item in value]
    return value


def _resource_id(resource):
    for key in (
        "resource_id",
        "id",
        "name",
        "instance_id",
        "bucket_name",
        "group_id",
        "user_name",
        "username",
        "arn",
    ):
        if resource.get(key):
            return str(resource[key])
    return "Unknown resource"


def build_inventory(scan_results, findings, attack_paths, recommendations):
    """Build a serializable discovery snapshot without changing scanner payloads."""
    inventory = []
    resources = []

    for service_key, result in scan_results.items():
        result = result or {}
        service_name = result.get("service") or service_key
        service_findings = [
            finding
            for finding in findings
            if (finding.get("service") or "").lower() in {
                service_key.lower(),
                service_name.lower(),
            }
        ]
        service_resources = result.get("resources") or []
        normalized_resources = []

        for raw_resource in service_resources:
            raw_resource = _json_safe(raw_resource)
            resource_id = _resource_id(raw_resource)
            resource_findings = [
                finding
                for finding in service_findings
                if finding.get("resource") == resource_id
            ]
            resource_attack_paths = [
                path.to_dict() if hasattr(path, "to_dict") else path
                for path in attack_paths
                if resource_id in (path.affected_resources or [])
            ]
            resource_recommendations = [
                recommendation.to_dict()
                if hasattr(recommendation, "to_dict")
                else recommendation
                for recommendation in recommendations
                if resource_id in (recommendation.affected_resources or [])
            ]
            normalized = {
                "resource_id": resource_id,
                "service": service_name,
                "data": raw_resource,
                "findings": resource_findings,
                "attack_paths": resource_attack_paths,
                "recommendations": resource_recommendations,
            }
            normalized_resources.append(normalized)
            resources.append(normalized)

        inventory.append(
            {
                "service": service_name,
                "service_key": service_key,
                "status": "analyzed",
                "resource_count": len(normalized_resources),
                "finding_count": len(service_findings),
                "attack_path_count": sum(
                    1
                    for path in attack_paths
                    if any(
                        finding.get("service") == service_name
                        for finding in findings
                        if finding.get("rule_id") in (path.related_findings or [])
                    )
                ),
                "resources": normalized_resources,
            }
        )

    return {
        "services": inventory,
        "resources": resources,
        "raw": _json_safe(scan_results),
    }