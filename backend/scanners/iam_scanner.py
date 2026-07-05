from services.session_manager import get_session


def list_iam_users():

    session = get_session()

    if session is None:
        return {
            "success": False,
            "service": "IAM",
            "resource_count": 0,
            "resources": [],
            "message": "AWS session not found"
        }

    try:

        iam = session.client("iam")

        response = iam.list_users()

        resources = []

        for user in response["Users"]:

            resources.append({
                "username": user["UserName"],
                "arn": user["Arn"],
                "created": str(user["CreateDate"])
            })

        return {
            "success": True,
            "service": "IAM",
            "resource_count": len(resources),
            "resources": resources
        }

    except Exception as e:

        return {
            "success": False,
            "service": "IAM",
            "resource_count": 0,
            "resources": [],
            "message": str(e)
        }