from botocore.exceptions import ClientError
from services.session_manager import get_session
from engine.rules.ecs_rules import analyze_ecs


def discover_ecs():
    session = get_session()
    if session is None:
        return {"service": "ECS", "resources": [], "findings": []}

    resources = []
    try:
        ecs = session.client("ecs")
        clusters = ecs.list_clusters().get("clusterArns", [])
        if clusters:
            cluster_details = ecs.describe_clusters(clusters=clusters).get("clusters", [])
            for cl in cluster_details:
                cl_name = cl.get("clusterName")
                cl_arn = cl.get("clusterArn")
                services_list = ecs.list_services(cluster=cl_arn).get("serviceArns", [])
                
                service_details = []
                if services_list:
                    service_details = ecs.describe_services(cluster=cl_arn, services=services_list[:10]).get("services", [])

                for srv in service_details:
                    task_def = srv.get("taskDefinition")
                    assign_public_ip = srv.get("networkConfiguration", {}).get("awsvpcConfiguration", {}).get("assignPublicIp") == "ENABLED"
                    sec_groups = srv.get("networkConfiguration", {}).get("awsvpcConfiguration", {}).get("securityGroups", [])

                    resources.append({
                        "cluster_name": cl_name,
                        "service_name": srv.get("serviceName"),
                        "service_arn": srv.get("serviceArn"),
                        "task_definition": task_def,
                        "desired_count": srv.get("desiredCount"),
                        "running_count": srv.get("runningCount"),
                        "launch_type": srv.get("launchType"),
                        "assign_public_ip": assign_public_ip,
                        "security_groups": sec_groups,
                    })
    except Exception as e:
        print(f"[ECS Scanner Error] {e}")

    findings = analyze_ecs(resources)
    return {
        "service": "ECS",
        "resources": resources,
        "findings": findings,
    }
