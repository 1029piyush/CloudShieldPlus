from datetime import datetime, timezone


# ==========================================================
# Generic Helpers
# ==========================================================

def ensure_list(value):

    if isinstance(value, list):
        return value

    return [value]


# ==========================================================
# IAM Helpers
# ==========================================================

DANGEROUS_ACTION_PREFIXES = (

    "iam:",
    "ec2:",
    "s3:",
    "kms:",
    "lambda:",
    "cloudformation:",
    "organizations:",
    "sts:"

)

READ_ONLY_PREFIXES = (

    "Get",
    "List",
    "Describe"

)


def has_mfa(user):
    return user.get("mfa_enabled", False)


def has_console_login(user):
    return user.get("console_login", False)


def has_active_access_keys(user):

    return any(

        key["status"] == "Active"

        for key in user.get("access_keys", [])

    )


def active_access_key_count(user):

    return sum(

        1

        for key in user.get("access_keys", [])

        if key["status"] == "Active"

    )


def has_permissions_boundary(user):

    return user.get("permissions_boundary") is not None


def is_admin(user):

    for policy in user.get("managed_policies", []):

        if policy["name"] == "AdministratorAccess":

            return True

    return False


def has_inline_policies(user):

    return len(user.get("inline_policies", [])) > 0


def has_groups(user):

    return len(user.get("groups", [])) > 0


def access_key_age_days(access_key):

    created = access_key.get("created")

    if not created:

        return None

    if isinstance(created, str):

        created = datetime.fromisoformat(

            created.replace("Z", "+00:00")

        )

    return (

        datetime.now(timezone.utc) - created

    ).days


# ==========================================================
# IAM Policy Helpers
# ==========================================================

def action_is_read_only(action):

    if ":" not in action:

        return False

    permission = action.split(":")[1]

    return permission.startswith(READ_ONLY_PREFIXES)


def statement_has_dangerous_action(statement):

    actions = ensure_list(

        statement.get("Action", [])

    )

    for action in actions:

        if action == "*":

            return True

        action_lower = action.lower()

        if action_lower == "iam:*":

            return True

        if action.endswith("*"):

            if not action_is_read_only(action):

                return True

    return False


def statement_has_wildcard_resource(statement):

    resources = ensure_list(

        statement.get("Resource", [])

    )

    return "*" in resources


def is_dangerous_statement(statement):

    return (

        statement.get("Effect") == "Allow"

        and

        statement_has_wildcard_resource(statement)

        and

        statement_has_dangerous_action(statement)

    )


# ==========================================================
# S3 Helpers
# ==========================================================

def is_bucket_public(bucket):

    return not bucket.get(

        "public_access_block",

        True

    )


def is_bucket_encrypted(bucket):

    return bucket.get(

        "encryption",

        False

    )


def is_versioning_enabled(bucket):

    return bucket.get(

        "versioning",

        False

    )


def is_logging_enabled(bucket):

    return bucket.get(

        "logging_enabled",

        False

    )


def is_website_enabled(bucket):

    return bucket.get(

        "website_enabled",

        False

    )


# ==========================================================
# EC2 Helpers
# ==========================================================

def has_public_ip(instance):

    return instance.get("public_ip") is not None


def has_iam_role(instance):

    return instance.get("iam_role") is not None


def is_imdsv2_required(instance):

    return instance.get(

        "imdsv2_required",

        False

    )


def is_termination_protected(instance):

    return instance.get(

        "termination_protection",

        False

    )


# ==========================================================
# Security Groups
# ==========================================================

def allows_port(group, port):

    for rule in group.get(

        "inbound_rules",

        []

    ):

        if (

            rule.get("from_port") == port

            or

            rule.get("to_port") == port

        ):

            if "0.0.0.0/0" in rule.get(

                "ipv4",

                []

            ):

                return True

    return False


# ==========================================================
# CloudTrail
# ==========================================================

def is_cloudtrail_logging(trail):

    return trail.get(

        "is_logging",

        False

    )


def is_multi_region(trail):

    return trail.get(

        "is_multi_region",

        False

    )


# ==========================================================
# Password Policy
# ==========================================================

def has_strong_password_policy(policy):

    if not policy:

        return False

    return all([

        policy.get("minimum_length", 0) >= 12,

        policy.get("require_symbols"),

        policy.get("require_numbers"),

        policy.get("require_uppercase"),

        policy.get("require_lowercase")

    ])