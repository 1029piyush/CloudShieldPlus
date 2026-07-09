from engine.findings import Finding


def analyze_password_policy(resources):

    findings = []

    if len(resources) == 0:

        findings.append(

            Finding(
                rule_id="PP001",
                service="IAM",
                resource="AWS Account",
                severity="High",
                title="No Password Policy Configured",
                description="No IAM password policy is configured.",
                recommendation="Create a strong IAM password policy.",
                business_impact="Weak passwords increase the risk of unauthorized access."
            ).to_dict()

        )

    return findings