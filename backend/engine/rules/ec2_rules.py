from engine.findings import Finding


def analyze_ec2(resources):

    findings = []

    for instance in resources:

        # EC2001 - Public IP Assigned
        if instance.get("public_ip"):

            findings.append(

                Finding(
                    rule_id="EC2001",
                    service="EC2",
                    resource=instance["instance_id"],
                    severity="High",
                    title="EC2 Instance Has Public IP",
                    description="The EC2 instance has a public IP address.",
                    recommendation="Move the instance to a private subnet or use a bastion host.",
                    business_impact="Publicly accessible instances increase the attack surface."
                ).to_dict()

            )

        # EC2002 - IMDSv2 Not Enforced
        if not instance.get("imdsv2_required", False):

            findings.append(

                Finding(
                    rule_id="EC2002",
                    service="EC2",
                    resource=instance["instance_id"],
                    severity="High",
                    title="IMDSv2 Not Enforced",
                    description="Instance Metadata Service Version 2 is not enforced.",
                    recommendation="Require IMDSv2 on all EC2 instances.",
                    business_impact="Attackers may steal IAM role credentials using SSRF attacks."
                ).to_dict()

            )

    return findings