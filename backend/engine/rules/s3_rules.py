from engine.findings import Finding


def analyze_s3(resources):

    findings = []

    for bucket in resources:

        # S3001 - Block Public Access Disabled
        if not bucket.get("public_access_block", True):

            findings.append(

                Finding(
                    rule_id="S3001",
                    service="S3",
                    resource=bucket["bucket_name"],
                    severity="Critical",
                    title="S3 Block Public Access Disabled",
                    description="The S3 bucket does not have Block Public Access enabled.",
                    recommendation="Enable Block Public Access for the bucket.",
                    business_impact="Sensitive data may become publicly accessible."
                ).to_dict()

            )

        # S3002 - Versioning Disabled
        if not bucket.get("versioning", False):

            findings.append(

                Finding(
                    rule_id="S3002",
                    service="S3",
                    resource=bucket["bucket_name"],
                    severity="Medium",
                    title="S3 Versioning Disabled",
                    description="Versioning is disabled for the S3 bucket.",
                    recommendation="Enable Versioning.",
                    business_impact="Deleted objects cannot be recovered."
                ).to_dict()

            )

    return findings