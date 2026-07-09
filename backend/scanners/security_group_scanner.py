from services.session_manager import get_session
from engine.rules import analyze_security_groups


def discover_security_groups():

    session = get_session()

    if session is None:
        return {
            "service": "SecurityGroups",
            "resources": []
        }

    ec2 = session.client("ec2")

    response = ec2.describe_security_groups()

    resources = []

    for sg in response["SecurityGroups"]:

        inbound_rules = []

        for rule in sg.get("IpPermissions", []):

            inbound_rules.append({
                "protocol": rule.get("IpProtocol"),
                "from_port": rule.get("FromPort"),
                "to_port": rule.get("ToPort"),
                "ipv4": [
                    ip["CidrIp"]
                    for ip in rule.get("IpRanges", [])
                ],
                "ipv6": [
                    ip["CidrIpv6"]
                    for ip in rule.get("Ipv6Ranges", [])
                ]
            })

        outbound_rules = []

        for rule in sg.get("IpPermissionsEgress", []):

            outbound_rules.append({
                "protocol": rule.get("IpProtocol"),
                "from_port": rule.get("FromPort"),
                "to_port": rule.get("ToPort"),
                "ipv4": [
                    ip["CidrIp"]
                    for ip in rule.get("IpRanges", [])
                ],
                "ipv6": [
                    ip["CidrIpv6"]
                    for ip in rule.get("Ipv6Ranges", [])
                ]
            })

        resources.append({

            "group_id": sg["GroupId"],

            "group_name": sg["GroupName"],

            "description": sg["Description"],

            "vpc_id": sg.get("VpcId"),

            "inbound_rules": inbound_rules,

            "outbound_rules": outbound_rules

        })
        findings = analyze_security_groups(resources)
    return {
    "service": "SecurityGroups",
    "resources": resources,
    "findings": findings
}