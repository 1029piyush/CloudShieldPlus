from engine.findings import Finding


def analyze_iam(resources):

    findings = []

    for user in resources:

        policies = user.get("policies", [])

        # IAM001 - AdministratorAccess Attached
        if "AdministratorAccess" in policies:

            findings.append(

                Finding(
                    rule_id="IAM001",
                    service="IAM",
                    resource=user["username"],
                    severity="Critical",
                    title="AdministratorAccess Attached",
                    description="IAM user has AdministratorAccess policy attached.",
                    recommendation="Replace AdministratorAccess with a least-privilege policy.",
                    business_impact="Compromise of this user may lead to full AWS account takeover."
                ).to_dict()

            )

        # IAM002 - MFA Not Enabled
        if not user.get("mfa_enabled", False):

            findings.append(

                Finding(
                    rule_id="IAM002",
                    service="IAM",
                    resource=user["username"],
                    severity="High",
                    title="MFA Not Enabled",
                    description="IAM user does not have Multi-Factor Authentication enabled.",
                    recommendation="Enable MFA for this IAM user.",
                    business_impact="An attacker can access the account using only the stolen password or access keys."
                ).to_dict()

            )

    return findings