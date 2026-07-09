from engine.findings import Finding


def analyze_security_groups(resources):

    findings = []

    for sg in resources:

        for rule in sg.get("inbound_rules", []):

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
                        description="Port 22 is open to the Internet.",
                        recommendation="Restrict SSH access to trusted IP addresses only.",
                        business_impact="Attackers can brute-force SSH credentials."
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
                        description="Port 3389 is open to the Internet.",
                        recommendation="Restrict RDP access to trusted IP addresses.",
                        business_impact="Public RDP access increases attack risk."
                    ).to_dict()

                )

    return findings