from engine.findings import Finding


def analyze_cloudtrail(resources):

    findings = []

    if len(resources) == 0:

        findings.append(

            Finding(
                rule_id="CT001",
                service="CloudTrail",
                resource="AWS Account",
                severity="Critical",
                title="CloudTrail Not Configured",
                description="No CloudTrail trail was found.",
                recommendation="Enable AWS CloudTrail with multi-region logging.",
                business_impact="Security events cannot be audited or investigated."
            ).to_dict()

        )

    return findings