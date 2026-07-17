from engine.findings import Finding
from engine.rules.severity import severity_for_rule


def _finding(rule_id, title, description, recommendation, business_impact,
             evidence, exploitability, correlation_tags):
    return Finding(
        rule_id=rule_id,
        service="IAM",
        resource="AWS Account",
        severity=severity_for_rule(rule_id),
        title=title,
        description=description,
        recommendation=recommendation,
        business_impact=business_impact,
        evidence=evidence,
        exploitability=exploitability,
        correlation_tags=correlation_tags,
    ).to_dict()


# PP001 - No Password Policy
def pp001(resources):
    if resources:
        return None

    return _finding(
        "PP001",
        "No IAM Password Policy Configured",
        "No account-level IAM password policy is configured.",
        "Create an IAM password policy that meets your organisation's authentication standard and enforce MFA for console users.",
        "Console passwords may not meet minimum complexity, reuse, or expiry requirements.",
        ["Account password policy: Not configured"], 8,
        ["credential_theft", "brute_force", "identity_management"],
    )


# PP002 - Password Length Below 14
def pp002(policy):
    length = policy.get("minimum_length", 0)
    if length >= 14:
        return None

    return _finding(
        "PP002",
        "IAM Password Minimum Length Below 14 Characters",
        "The IAM password policy permits passwords shorter than 14 characters.",
        "Set MinimumPasswordLength to at least 14 characters.",
        "Short passwords are more susceptible to guessing, credential stuffing, and brute-force attacks.",
        [f"Minimum password length: {length}"], 6,
        ["credential_theft", "brute_force"],
    )


def _complexity_rule(rule_id, policy, field, label):
    if policy.get(field, False):
        return None

    return _finding(
        rule_id,
        f"IAM Password Policy Does Not Require {label}",
        f"The IAM password policy does not require at least one {label.lower()}.",
        f"Require at least one {label.lower()} in IAM user passwords.",
        "Reduced password complexity makes passwords easier to guess and attack.",
        [f"Require {label}: false"], 5,
        ["credential_theft", "brute_force"],
    )


# PP003 - Uppercase Not Required
def pp003(policy):
    return _complexity_rule("PP003", policy, "require_uppercase", "Uppercase Character")


# PP004 - Lowercase Not Required
def pp004(policy):
    return _complexity_rule("PP004", policy, "require_lowercase", "Lowercase Character")


# PP005 - Number Not Required
def pp005(policy):
    return _complexity_rule("PP005", policy, "require_numbers", "Number")


# PP006 - Symbol Not Required
def pp006(policy):
    return _complexity_rule("PP006", policy, "require_symbols", "Symbol")


# PP007 - Password Reuse Prevention Too Weak
def pp007(policy):
    history = policy.get("password_reuse_prevention") or 0
    if history >= 24:
        return None

    return _finding(
        "PP007",
        "IAM Password Reuse Prevention Below 24 Passwords",
        "The password history does not prevent reuse of the previous 24 passwords.",
        "Set PasswordReusePrevention to 24, or document an alternative policy requirement.",
        "Users can cycle through a short password history and return to a previously compromised password.",
        [f"Password reuse prevention: {history}"], 4,
        ["credential_theft", "password_management"],
    )


# PP008 - Password Expiry Disabled or Too Long
def pp008(policy):
    max_age = policy.get("max_password_age")
    if max_age is not None and 0 < max_age <= 90:
        return None

    displayed_age = "Disabled" if not max_age else str(max_age)
    return _finding(
        "PP008",
        "IAM Password Expiry Disabled or Exceeds 90 Days",
        "The IAM password policy does not require password rotation within 90 days.",
        "Set MaxPasswordAge to 90 days or less when required by your security standard.",
        "A compromised password can remain valid for an extended period without a forced rotation.",
        [f"Maximum password age: {displayed_age}"], 4,
        ["credential_theft", "password_management"],
    )


RULES = [pp002, pp003, pp004, pp005, pp006, pp007, pp008]


def analyze_password_policy(resources):
    """Run account-level password-policy checks."""
    no_policy = pp001(resources)
    if no_policy:
        return [no_policy]

    findings = []
    for policy in resources:
        for rule in RULES:
            finding = rule(policy)
            if finding:
                findings.append(finding)
    return findings
