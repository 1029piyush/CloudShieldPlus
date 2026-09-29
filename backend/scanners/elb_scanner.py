from botocore.exceptions import ClientError
from services.session_manager import get_session
from engine.rules.elb_rules import analyze_elb


def discover_elb():
    session = get_session()
    if session is None:
        return {"service": "ELB", "resources": [], "findings": []}

    resources = []
    try:
        elbv2 = session.client("elbv2")
        paginator = elbv2.get_paginator("describe_load_balancers")
        for page in paginator.paginate():
            for lb in page.get("LoadBalancers", []):
                lb_arn = lb.get("LoadBalancerArn")
                lb_name = lb.get("LoadBalancerName")
                scheme = lb.get("Scheme")  # 'internet-facing' or 'internal'
                vpc_id = lb.get("VpcId")
                sec_groups = lb.get("SecurityGroups", [])

                listeners = []
                try:
                    list_res = elbv2.describe_listeners(LoadBalancerArn=lb_arn).get("Listeners", [])
                    for l in list_res:
                        listeners.append({
                            "port": l.get("Port"),
                            "protocol": l.get("Protocol"),
                            "ssl_policy": l.get("SslPolicy"),
                        })
                except Exception:
                    pass

                resources.append({
                    "load_balancer_name": lb_name,
                    "arn": lb_arn,
                    "scheme": scheme,
                    "type": lb.get("Type"),
                    "vpc_id": vpc_id,
                    "security_groups": sec_groups,
                    "listeners": listeners,
                })
    except Exception as e:
        print(f"[ELB Scanner Error] {e}")

    findings = analyze_elb(resources)
    return {
        "service": "ELB",
        "resources": resources,
        "findings": findings,
    }
