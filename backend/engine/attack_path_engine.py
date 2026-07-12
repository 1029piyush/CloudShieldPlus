from engine.attack_path import AttackPath


def analyze_attack_paths(findings):

    attack_paths = []

    rule_ids = {
        finding["rule_id"]
        for finding in findings
    }

    # AP001 - Credential Theft
    if "IAM002" in rule_ids:

        attack_paths.append(

            AttackPath(

                attack_id="AP001",

                title="Credential Theft Attack",

                risk="High",

                description="IAM users without MFA are vulnerable to credential theft attacks.",

                likelihood="High",

                impact="High",

                related_findings=[
                    "IAM002"
                ],

                mitigation="Enable MFA for all IAM users."

            ).to_dict()

        )

    # AP002 - Public Data Exposure
    if "S3001" in rule_ids:

        attack_paths.append(

            AttackPath(

                attack_id="AP002",

                title="Public Data Exposure",

                risk="Critical",

                description="An S3 bucket without Block Public Access may expose sensitive information.",

                likelihood="Medium",

                impact="Critical",

                related_findings=[
                    "S3001",
                    "S3002"
                ],

                mitigation="Enable Block Public Access and Versioning."

            ).to_dict()

        )

    # AP003 - Stealth Credential Compromise
    if "IAM002" in rule_ids and "CT001" in rule_ids:

        attack_paths.append(

            AttackPath(

                attack_id="AP003",

                title="Stealth Credential Compromise",

                risk="Critical",

                description="An attacker can compromise an IAM account without MFA while remaining difficult to detect because CloudTrail is not configured.",

                likelihood="High",

                impact="Critical",

                related_findings=[
                    "IAM002",
                    "CT001"
                ],

                mitigation="Enable MFA and configure CloudTrail."

            ).to_dict()

        )

    return attack_paths