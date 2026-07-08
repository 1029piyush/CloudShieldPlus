from engine.findings import Finding


def analyze_iam(resources):

    findings = []

    for user in resources:

        policies = user.get("policies", [])

        if "AdministratorAccess" in policies:

            findings.append(

                Finding(
                    service="IAM",
                    resource=user["username"],
                    severity="Critical",
                    title="Administrator Access Attached",
                    description="User has full administrator privileges.",
                    recommendation="Replace AdministratorAccess with a least-privilege policy."
                ).to_dict()

            )

    return findings