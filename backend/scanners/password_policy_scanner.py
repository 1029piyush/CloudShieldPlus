from botocore.exceptions import ClientError
from services.session_manager import get_session
from engine.rule_engine import analyze_password_policy


def discover_password_policy():

    session = get_session()

    if session is None:
        resources = []
        findings = analyze_password_policy(resources)

        return {
            "service": "PasswordPolicy",
            "resources": resources,
            "findings": findings
        }

    iam = session.client("iam")

    try:

        response = iam.get_account_password_policy()

        policy = response["PasswordPolicy"]

        resources = [
            {
                "minimum_length": policy.get("MinimumPasswordLength"),
                "require_symbols": policy.get("RequireSymbols"),
                "require_numbers": policy.get("RequireNumbers"),
                "require_uppercase": policy.get("RequireUppercaseCharacters"),
                "require_lowercase": policy.get("RequireLowercaseCharacters"),
                "max_password_age": policy.get("MaxPasswordAge"),
                "password_reuse_prevention": policy.get("PasswordReusePrevention"),
                "allow_users_to_change_password": policy.get("AllowUsersToChangePassword")
            }
        ]

        findings = analyze_password_policy(resources)

        return {
            "service": "PasswordPolicy",
            "resources": resources,
            "findings": findings
        }

    except ClientError:

        resources = []

        findings = analyze_password_policy(resources)

        return {
            "service": "PasswordPolicy",
            "resources": resources,
            "findings": findings
        }