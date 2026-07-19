from engine.findings import Finding

from engine.rules.helpers import (
    has_mfa,
    has_console_login,
    has_active_access_keys,
    active_access_key_count,
    has_permissions_boundary,
    has_inline_policies,
    has_groups,
    is_admin,
    access_key_age_days
)

from engine.rules.severity import severity_for_rule

from engine.rules.policy_analyzer import (

    has_wildcard_action,

    has_wildcard_resource,

    has_full_admin,

    get_dangerous_actions

)

# ============================================================
# IAM001 - Administrator Access
# ============================================================

def iam001(user):

    if not is_admin(user):
        return None

    return Finding(

        rule_id="IAM001",

        service="IAM",

        resource=user["username"],

        severity=severity_for_rule("IAM001"),

        title="AdministratorAccess Attached",

        description="IAM user has the AdministratorAccess managed policy attached.",

        recommendation="Replace AdministratorAccess with least-privilege permissions.",

        business_impact="Compromise of this identity may lead to complete AWS account takeover.",

        evidence=[
            "AdministratorAccess attached"
        ],

        exploitability=9,

        correlation_tags=[
            "privilege_escalation",
            "account_takeover"
        ]

    ).to_dict()


# ============================================================
# IAM002 - MFA Disabled
# ============================================================

def iam002(user):

    if has_mfa(user):
        return None

    return Finding(

        rule_id="IAM002",

        service="IAM",

        resource=user["username"],

        severity=severity_for_rule("IAM002"),

        title="MFA Not Enabled",

        description="IAM user does not have Multi-Factor Authentication enabled.",

        recommendation="Enable MFA for this IAM user.",

        business_impact="Credentials can be abused if compromised.",

        evidence=[
            "No MFA devices registered"
        ],

        exploitability=8,

        correlation_tags=[
            "credential_theft",
            "account_takeover"
        ]

    ).to_dict()


# ============================================================
# IAM003 - Multiple Active Access Keys
# ============================================================

def iam003(user):

    if active_access_key_count(user) <= 1:
        return None

    return Finding(

        rule_id="IAM003",

        service="IAM",

        resource=user["username"],

        severity=severity_for_rule("IAM003"),

        title="Multiple Active Access Keys",

        description="IAM user has more than one active access key.",

        recommendation="Remove unused access keys.",

        business_impact="Multiple active credentials increase attack surface.",

        evidence=[
            f"{active_access_key_count(user)} active access keys"
        ],

        exploitability=7,

        correlation_tags=[
            "credential_management"
        ]

    ).to_dict()


# ============================================================
# IAM004 - Old Access Keys
# ============================================================

def iam004(user):

    for key in user.get("access_keys", []):

        age = access_key_age_days(key)

        if age is not None and age > 90:

            return Finding(

                rule_id="IAM004",

                service="IAM",

                resource=user["username"],

                severity=severity_for_rule("IAM004"),

                title="Old Access Key",

                description=f"Access key is {age} days old.",

                recommendation="Rotate the access key.",

                business_impact="Old credentials increase compromise risk.",

                evidence=[
                    f"Key age: {age} days"
                ],

                exploitability=6,

                correlation_tags=[
                    "credential_management"
                ]

            ).to_dict()

    return None


# ============================================================
# IAM005 - Console Login Without MFA
# ============================================================

def iam005(user):

    if not has_console_login(user):
        return None

    if has_mfa(user):
        return None

    return Finding(

        rule_id="IAM005",

        service="IAM",

        resource=user["username"],

        severity=severity_for_rule("IAM006"),

        title="Console Login Without MFA",

        description="Console access is enabled but MFA is disabled.",

        recommendation="Enable MFA before allowing console login.",

        business_impact="Interactive account compromise becomes significantly easier.",

        evidence=[
            "Console login enabled",
            "MFA disabled"
        ],

        exploitability=9,

        correlation_tags=[
            "credential_theft"
        ]

    ).to_dict()


# ============================================================
# IAM006 - Missing Permissions Boundary
# ============================================================

def iam006(user):

    if has_permissions_boundary(user):
        return None

    if not is_admin(user):
        return None

    return Finding(

        rule_id="IAM006",

        service="IAM",

        resource=user["username"],

        severity=severity_for_rule("IAM005"),

        title="No Permissions Boundary",

        description="Administrative IAM user has no permissions boundary.",

        recommendation="Apply a permissions boundary where appropriate.",

        business_impact="Permissions cannot be effectively constrained.",

        evidence=[
            "Permissions boundary missing"
        ],

        exploitability=6,

        correlation_tags=[
            "privilege_escalation"
        ]

    ).to_dict()


# ============================================================
# IAM007 - Inline Policies
# ============================================================

def iam007(user):

    if not has_inline_policies(user):
        return None

    return Finding(

        rule_id="IAM007",

        service="IAM",

        resource=user["username"],

        severity="Medium",

        title="Inline Policies Present",

        description="IAM user has inline policies attached.",

        recommendation="Prefer managed policies for easier governance.",

        business_impact="Inline policies are harder to audit and maintain.",

        evidence=user["inline_policies"],

        exploitability=3,

        correlation_tags=[
            "policy_management"
        ]

    ).to_dict()


# ============================================================
# IAM008 - User Without Groups
# ============================================================

def iam008(user):

    if has_groups(user):
        return None

    return Finding(

        rule_id="IAM008",

        service="IAM",

        resource=user["username"],

        severity="Low",

        title="User Not Assigned To Any Group",

        description="IAM user has no group memberships.",

        recommendation="Manage permissions using IAM groups where appropriate.",

        business_impact="Permission management becomes inconsistent.",

        evidence=[],

        exploitability=2,

        correlation_tags=[
            "identity_management"
        ]

    ).to_dict()


# ============================================================
# IAM009 - Access Key Never Used
# ============================================================

def iam009(user):

    for key in user.get("access_keys", []):

        if (
            key.get("status") == "Active"
            and key.get("last_used") in [None, "None"]
        ):

            return Finding(

                rule_id="IAM009",

                service="IAM",

                resource=user["username"],

                severity=severity_for_rule("IAM009"),

                title="Unused Access Key",

                description="Active access key has never been used.",

                recommendation="Delete unused access keys.",

                business_impact="Unused credentials increase attack surface.",

                evidence=[
                    f"Access Key: {key['access_key_id']}"
                ],

                exploitability=5,

                correlation_tags=["credential_management"]

            ).to_dict()

    return None


# ============================================================
# IAM010 - Inactive Access Key
# ============================================================

def iam010(user):

    for key in user.get("access_keys", []):

        if key["status"] == "Inactive":

            return Finding(

                rule_id="IAM010",

                service="IAM",

                resource=user["username"],

                severity=severity_for_rule("IAM010"),

                title="Inactive Access Key",

                description="Inactive access key detected.",

                recommendation="Delete inactive access keys.",

                business_impact="Inactive credentials should not remain.",

                evidence=[key["access_key_id"]],

                exploitability=2,

                correlation_tags=["credential_management"]

            ).to_dict()

    return None


# ============================================================
# IAM011 - No Managed Policies
# ============================================================

def iam011(user):

    if user.get("managed_policies") or user.get("inline_policies"):
        return None

    return Finding(

        rule_id="IAM011",

        service="IAM",

        resource=user["username"],

        severity=severity_for_rule("IAM011"),

        title="No Managed Policies",

        description="IAM user has no managed policies attached.",

        recommendation="Verify whether this identity is still required.",

        business_impact="Unused identities increase governance complexity.",

        evidence=[],

        exploitability=1,

        correlation_tags=["identity_management"]

    ).to_dict()


# ============================================================
# IAM012 - Password Never Used
# ============================================================

def iam012(user):

    if not has_console_login(user):
        return None

    if user.get("password_last_used") not in [None, "None"]:
        return None

    return Finding(

        rule_id="IAM012",

        service="IAM",

        resource=user["username"],

        severity=severity_for_rule("IAM012"),

        title="Password Never Used",

        description="Console password exists but has never been used.",

        recommendation="Verify if console access is required.",

        business_impact="Unused credentials should be removed.",

        evidence=[],

        exploitability=3,

        correlation_tags=["identity_management"]

    ).to_dict()


# ============================================================
# IAM013 - Console Login + Active Access Keys
# ============================================================

def iam013(user):

    if not has_console_login(user):
        return None

    if not has_active_access_keys(user):
        return None

    return Finding(

        rule_id="IAM013",

        service="IAM",

        resource=user["username"],

        severity=severity_for_rule("IAM013"),

        title="Console Login And API Access",

        description="IAM user has both console and programmatic access.",

        recommendation="Verify whether both access methods are necessary.",

        business_impact="Multiple authentication paths increase attack surface.",

        evidence=[],

        exploitability=6,

        correlation_tags=["credential_theft"]

    ).to_dict()


# ============================================================
# IAM020 - Administrator Without MFA
# ============================================================

def iam020(user):

    if not is_admin(user):
        return None

    if has_mfa(user):
        return None

    return Finding(

        rule_id="IAM020",

        service="IAM",

        resource=user["username"],

        severity=severity_for_rule("IAM020"),

        title="Administrator Without MFA",

        description="Administrative IAM user does not have MFA enabled.",

        recommendation="Enable MFA immediately.",

        business_impact="Administrator account compromise can lead to full AWS account takeover.",

        evidence=[
            "AdministratorAccess attached",
            "No MFA devices"
        ],

        exploitability=10,

        correlation_tags=[
            "credential_theft",
            "account_takeover",
            "privilege_escalation"
        ]

    ).to_dict()

# ============================================================
# IAM016 - Wildcard Actions
# ============================================================

def iam016(user):

    for policy in user.get("managed_policies", []):

        if has_wildcard_action(policy["document"]):

            return Finding(

                rule_id="IAM016",

                service="IAM",

                resource=user["username"],

                severity=severity_for_rule("IAM016"),

                title="Wildcard Actions Detected",

                description="Managed policy grants Action: '*'.",

                recommendation="Replace wildcard actions with least-privilege permissions.",

                business_impact="Wildcard actions allow excessive permissions and increase privilege escalation risk.",

                evidence=[
                    policy["name"],
                    "Action: *"
                ],

                exploitability=9,

                correlation_tags=[
                    "privilege_escalation",
                    "least_privilege"
                ]

            ).to_dict()

    return None


# ============================================================
# IAM017 - Wildcard Resources
# ============================================================

def iam017(user):

    for policy in user.get("managed_policies", []):

        if has_wildcard_resource(policy["document"]):

            return Finding(

                rule_id="IAM017",

                service="IAM",

                resource=user["username"],

                severity=severity_for_rule("IAM017"),

                title="Wildcard Resources Detected",

                description="Managed policy grants access to Resource: '*'.",

                recommendation="Restrict resource access to only required AWS resources.",

                business_impact="Unrestricted resource access significantly increases attack impact.",

                evidence=[
                    policy["name"],
                    "Resource: *"
                ],

                exploitability=8,

                correlation_tags=[
                    "least_privilege"
                ]

            ).to_dict()

    return None


# ============================================================
# IAM018 - Full Administrator Policy
# ============================================================

def iam018(user):

    for policy in user.get("managed_policies", []):

        if has_full_admin(policy["document"]):

            return Finding(

                rule_id="IAM018",

                service="IAM",

                resource=user["username"],

                severity=severity_for_rule("IAM018"),

                title="Full Administrator Policy",

                description="Managed policy grants unrestricted administrative access.",

                recommendation="Replace with scoped least-privilege permissions.",

                business_impact="Compromise of this identity may result in full AWS account compromise.",

                evidence=[
                    policy["name"],
                    "Action:*",
                    "Resource:*"
                ],

                exploitability=10,

                correlation_tags=[
                    "account_takeover",
                    "privilege_escalation"
                ]

            ).to_dict()

    return None


# ============================================================
# IAM019 - Dangerous IAM Permissions
# ============================================================

def iam019(user):

    dangerous_permissions = []

    for policy in user.get("managed_policies", []):

        dangerous_permissions.extend(

            get_dangerous_actions(
                policy["document"]
            )

        )

    dangerous_permissions = list(set(dangerous_permissions))

    if not dangerous_permissions:

        return None

    return Finding(

        rule_id="IAM019",

        service="IAM",

        resource=user["username"],

        severity=severity_for_rule("IAM019"),

        title="Dangerous IAM Permissions",

        description="Managed policy contains high-risk IAM permissions.",

        recommendation="Review and remove unnecessary high-risk permissions.",

        business_impact="Dangerous IAM permissions enable privilege escalation and persistence.",

        evidence=dangerous_permissions,

        exploitability=9,

        correlation_tags=[
            "privilege_escalation",
            "persistence"
        ]

    ).to_dict()


# ============================================================
# Rule Registry
# ============================================================

RULES = [
    iam001,
    iam002,
    iam003,
    iam004,
    iam005,
    iam006,
    iam007,
    iam008,
    iam009,
    iam010,
    iam011,
    iam012,
    iam013,
    iam016,
    iam017,
    iam018,
    iam019,
    iam020,
]


def analyze_iam(resources):
    """Run every IAM rule against every discovered IAM user."""
    findings = []
    for user in resources:
        for rule in RULES:
            finding = rule(user)
            if finding:
                findings.append(finding)
    return findings
