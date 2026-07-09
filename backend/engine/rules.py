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
                    business_impact="Sensitive data may become publicly accessible, leading to data exposure."
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
                    recommendation="Enable bucket versioning to protect against accidental deletion and ransomware.",
                    business_impact="Deleted or modified objects cannot be easily recovered."
                ).to_dict()

            )

     return findings

def analyze_security_groups(resources):

    findings = []

    for sg in resources:

        for rule in sg["inbound_rules"]:

            # SG001 - SSH Open to Internet
            if (
                rule.get("from_port") == 22
                and "0.0.0.0/0" in rule.get("ipv4", [])
            ):

                findings.append(

                    Finding(
                        rule_id="SG001",
                        service="SecurityGroups",
                        resource=sg["group_name"],
                        severity="Critical",
                        title="SSH Open to Internet",
                        description="Port 22 is open to 0.0.0.0/0.",
                        recommendation="Restrict SSH access to trusted IP addresses only.",
                        business_impact="Attackers can perform brute-force attacks and gain unauthorized access."
                    ).to_dict()

                )

            # SG002 - RDP Open to Internet
            if (
                rule.get("from_port") == 3389
                and "0.0.0.0/0" in rule.get("ipv4", [])
            ):

                findings.append(

                    Finding(
                        rule_id="SG002",
                        service="SecurityGroups",
                        resource=sg["group_name"],
                        severity="Critical",
                        title="RDP Open to Internet",
                        description="Port 3389 is open to 0.0.0.0/0.",
                        recommendation="Restrict RDP access to trusted IP addresses.",
                        business_impact="Public RDP access significantly increases the risk of unauthorized remote access."
                    ).to_dict()

                )

    return findings
 
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
                description="No CloudTrail trail was found in this AWS account.",
                recommendation="Enable AWS CloudTrail and configure multi-region logging.",
                business_impact="Security incidents cannot be properly detected, investigated, or audited."
            ).to_dict()

        )

    return findings

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
                description="The AWS account does not have an IAM password policy configured.",
                recommendation="Create a strong password policy with minimum length, complexity requirements, and password rotation.",
                business_impact="Weak passwords increase the risk of unauthorized access to AWS accounts."
            ).to_dict()

        )

    return findings

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
                    description="The EC2 instance is directly accessible from the Internet.",
                    recommendation="Place the instance in a private subnet or use a load balancer/bastion host.",
                    business_impact="Publicly accessible instances have a higher risk of unauthorized access."
                ).to_dict()

            )

        # EC2002 - IMDSv1 Enabled
        if not instance.get("imdsv2_required", False):

            findings.append(

                Finding(
                    rule_id="EC2002",
                    service="EC2",
                    resource=instance["instance_id"],
                    severity="High",
                    title="IMDSv2 Not Enforced",
                    description="The EC2 instance allows IMDSv1 requests.",
                    recommendation="Require IMDSv2 to protect against credential theft via SSRF attacks.",
                    business_impact="Attackers may steal IAM role credentials using SSRF vulnerabilities."
                ).to_dict()

            )

    return findings