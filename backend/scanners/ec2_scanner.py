from services.session_manager import get_session
from engine.rule_engine import analyze_ec2

def discover_ec2():

    session = get_session()

    if session is None:
        return {
            "service": "EC2",
            "resources": []
        }

    ec2 = session.client("ec2")

    response = ec2.describe_instances()

    resources = []

    for reservation in response["Reservations"]:

        for instance in reservation["Instances"]:

            instance_name = ""

            for tag in instance.get("Tags", []):

                if tag["Key"] == "Name":
                    instance_name = tag["Value"]

            resources.append ({

    "instance_id": instance["InstanceId"],

    "instance_name": instance_name,

    "state": instance["State"]["Name"],

    "instance_type": instance["InstanceType"],

    "public_ip": instance.get("PublicIpAddress"),

    "private_ip": instance.get("PrivateIpAddress"),

    "vpc_id": instance.get("VpcId"),

    "subnet_id": instance.get("SubnetId"),

    "iam_role": (
    instance["IamInstanceProfile"]["Arn"]
    if "IamInstanceProfile" in instance
    else None
),

"imdsv2_required": (
    instance.get("MetadataOptions", {})
    .get("HttpTokens") == "required"
),

    "security_groups": [
        sg["GroupId"]
        for sg in instance["SecurityGroups"]
    ],
    "monitoring": instance["Monitoring"]["State"],

    "tags": instance.get("Tags", [])
    

   })
    findings = analyze_ec2(resources)
    return {
        "service": "EC2",
        "resources": resources,
        "findings": findings
    }