from services.session_manager import get_session
from engine.rule_engine import analyze_security_groups


def parse_rules(rules):

    parsed_rules = []

    for rule in rules:

        parsed_rules.append({

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
            ],

            "prefix_lists": [
                prefix["PrefixListId"]
                for prefix in rule.get("PrefixListIds", [])
            ],

            "referenced_security_groups": [

                {
                    "group_id": pair["GroupId"],
                    "user_id": pair.get("UserId")
                }

                for pair in rule.get("UserIdGroupPairs", [])

            ]

        })

    return parsed_rules


def discover_security_groups():

    session = get_session()

    if session is None:
        return {
            "service": "SecurityGroups",
            "resources": [],
            "findings": []
        }

    ec2 = session.client("ec2")

    response = ec2.describe_security_groups()

    resources = []

    for sg in response["SecurityGroups"]:

        tags = {

            tag["Key"]: tag["Value"]

            for tag in sg.get("Tags", [])

        }

        resources.append({

            "group_id": sg["GroupId"],

            "group_name": sg["GroupName"],

            "description": sg["Description"],

            "owner_id": sg["OwnerId"],

            "vpc_id": sg.get("VpcId"),

            "tags": tags,

            "inbound_rules": parse_rules(
                sg.get("IpPermissions", [])
            ),

            "outbound_rules": parse_rules(
                sg.get("IpPermissionsEgress", [])
            )

        })

    findings = analyze_security_groups(resources)

    return {

        "service": "SecurityGroups",

        "resources": resources,

        "findings": findings

    }