from engine.findings import Finding
from engine.rules.severity import severity_for_rule


def _finding(rule_id, api, title, description, recommendation,
             business_impact, evidence, exploitability, correlation_tags):
    return Finding(
        rule_id=rule_id,
        service="APIGateway",
        resource=f"{api['name']} ({api['api_id']})",
        severity=severity_for_rule(rule_id),
        title=title,
        description=description,
        recommendation=recommendation,
        business_impact=business_impact,
        evidence=evidence,
        exploitability=exploitability,
        correlation_tags=correlation_tags,
    ).to_dict()


def apg001(api):
    types = api.get("endpoint_types", [])
    if "PRIVATE" in types:
        return None
    return _finding(
        "APG001", api,
        "Public API Gateway Endpoint",
        f"REST API '{api['name']}' ({api['api_id']}) is configured with edge-optimized or regional public endpoints.",
        "Configure authorization (JWT, IAM, API Keys, WAF) on API routes or restrict backend APIs to Private VPC endpoints.",
        "Publicly exposed endpoints can be targeted for unauthenticated API fuzzing, injection attacks, or resource exhaustion.",
        [f"API Name: {api['name']}", f"Endpoint Types: {', '.join(types)}"],
        8,
        ["public_exposure", "api_security"],
    )


RULES = [apg001]


def analyze_apigateway(resources):
    findings = []
    for api in resources:
        for rule in RULES:
            res = rule(api)
            if res:
                findings.append(res)
    return findings
