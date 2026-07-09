def aggregate_findings(scan_results):

    findings = []

    for service in scan_results.values():

        findings.extend(
            service.get("findings", [])
        )

    return findings