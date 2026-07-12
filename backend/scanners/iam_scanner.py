from botocore.exceptions import ClientError

from services.session_manager import get_session
from engine.rule_engine import analyze_iam


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

        users = iam.list_users()["Users"]

        resources = []

        for user in users:

            username = user["UserName"]

            # ----------------------------
            # Managed Policies
            # ----------------------------
            managed_policies = iam.list_attached_user_policies(
                UserName=username
            )["AttachedPolicies"]

            # ----------------------------
            # Inline Policies
            # ----------------------------
            inline_policies = iam.list_user_policies(
                UserName=username
            )["PolicyNames"]

            # ----------------------------
            # Groups
            # ----------------------------
            groups = iam.list_groups_for_user(
                UserName=username
            )["Groups"]

            # ----------------------------
            # MFA
            # ----------------------------
            mfa_devices = iam.list_mfa_devices(
                UserName=username
            )["MFADevices"]

            # ----------------------------
            # Console Login
            # ----------------------------
            try:
                iam.get_login_profile(UserName=username)
                console_login = True
            except ClientError:
                console_login = False

            # ----------------------------
            # Access Keys
            # ----------------------------
            access_keys = []

            key_response = iam.list_access_keys(
                UserName=username
            )

            for key in key_response["AccessKeyMetadata"]:

                try:

                    last_used = iam.get_access_key_last_used(
                        AccessKeyId=key["AccessKeyId"]
                    )

                    usage = last_used.get(
                        "AccessKeyLastUsed",
                        {}
                    )

                except ClientError:

                    usage = {}

                access_keys.append({

                    "access_key_id": key["AccessKeyId"],

                    "status": key["Status"],

                    "created": str(key["CreateDate"]),

                    "last_used": str(
                        usage.get("LastUsedDate")
                    ),

                    "last_service": usage.get(
                        "ServiceName"
                    ),

                    "last_region": usage.get(
                        "Region"
                    )

                })

            # ----------------------------
            # Tags
            # ----------------------------
            tags = iam.list_user_tags(
                UserName=username
            )["Tags"]

            # ----------------------------
            # Resource Object
            # ----------------------------
            resources.append({

                "username": username,

                "user_id": user["UserId"],

                "arn": user["Arn"],

                "path": user["Path"],

                "created": str(user["CreateDate"]),

                "password_last_used": str(
                    user.get("PasswordLastUsed")
                ),

                "permissions_boundary":
                    user.get("PermissionsBoundary"),

                "managed_policies": [
                    p["PolicyName"]
                    for p in managed_policies
                ],

                "inline_policies": inline_policies,

                "groups": [
                    g["GroupName"]
                    for g in groups
                ],

                "mfa_enabled": len(
                    mfa_devices
                ) > 0,

                "mfa_devices": len(
                    mfa_devices
                ),

                "console_login": console_login,

                "access_keys": access_keys,

                "tags": tags

            })

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