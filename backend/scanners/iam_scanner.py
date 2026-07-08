from services.session_manager import get_session
from engine.rules import analyze_iam


def list_iam_users():

    session = get_session()

    if session is None:
        return {
            "success": False,
            "service": "IAM",
            "resource_count": 0,
            "resources": [],
            "findings": [],
            "message": "AWS session not found"
        }

    try:

        iam = session.client("iam")

        response = iam.list_users()

        resources = []

        for user in response["Users"]:

            username = user["UserName"]

            # Get attached managed policies
            attached = iam.list_attached_user_policies(
                UserName=username
            )

            policies = []

            for policy in attached["AttachedPolicies"]:
                policies.append(policy["PolicyName"])

            resources.append({
                "username": username,
                "arn": user["Arn"],
                "created": str(user["CreateDate"]),
                "policies": policies
            })

        # Analyze resources using Rule Engine
        findings = analyze_iam(resources)

        return {
            "success": True,
            "service": "IAM",
            "resource_count": len(resources),
            "resources": resources,
            "findings": findings
        }

    except Exception as e:

        return {
            "success": False,
            "service": "IAM",
            "resource_count": 0,
            "resources": [],
            "findings": [],
            "message": str(e)
        }