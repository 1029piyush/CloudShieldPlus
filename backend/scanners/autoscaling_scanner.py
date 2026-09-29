from botocore.exceptions import ClientError
from services.session_manager import get_session
from engine.rules.autoscaling_rules import analyze_autoscaling


def discover_autoscaling():
    session = get_session()
    if session is None:
        return {"service": "AutoScaling", "resources": [], "findings": []}

    resources = []
    try:
        asg_client = session.client("autoscaling")
        paginator = asg_client.get_paginator("describe_auto_scaling_groups")
        for page in paginator.paginate():
            for group in page.get("AutoScalingGroups", []):
                resources.append({
                    "auto_scaling_group_name": group.get("AutoScalingGroupName"),
                    "arn": group.get("AutoScalingGroupARN"),
                    "min_size": group.get("MinSize"),
                    "max_size": group.get("MaxSize"),
                    "desired_capacity": group.get("DesiredCapacity"),
                    "vpc_zone_identifier": group.get("VPCZoneIdentifier"),
                    "health_check_type": group.get("HealthCheckType"),
                })
    except Exception as e:
        print(f"[AutoScaling Scanner Error] {e}")

    findings = analyze_autoscaling(resources)
    return {
        "service": "AutoScaling",
        "resources": resources,
        "findings": findings,
    }
