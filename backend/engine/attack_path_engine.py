def analyze_attack_paths(findings):

    attack_paths = []

    rule_ids = {
        finding["rule_id"]
        for finding in findings
    }

    # AP001 - Credential Theft
    if "IAM002" in rule_ids:

        attack_paths.append({

            "attack_id": "AP001",

            "title": "Credential Theft Attack",

            "risk": "High",

            "description":
                "IAM users without MFA are vulnerable to credential theft attacks.",

            "related_findings": [
                "IAM002"
            ]

        })

    # AP002 - Public Data Exposure
    if "S3001" in rule_ids:

        attack_paths.append({

            "attack_id": "AP002",

            "title": "Public Data Exposure",

            "risk": "Critical",

            "description":
                "An S3 bucket without Block Public Access may expose sensitive data.",

            "related_findings": [
                "S3001"
            ]

        })

    # AP003 - Stealth Attack
    if "CT001" in rule_ids and "IAM002" in rule_ids:

        attack_paths.append({

            "attack_id": "AP003",

            "title": "Stealth Credential Compromise",

            "risk": "Critical",

            "description":
                "An attacker can compromise an IAM account without MFA, and the absence of CloudTrail reduces the chance of detection.",

            "related_findings": [
                "IAM002",
                "CT001"
            ]

        })

    return attack_paths