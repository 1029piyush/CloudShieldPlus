from engine.findings import Finding
from engine.rules.severity import severity_for_rule


def _finding(rule_id, org, title, description, recommendation,
             business_impact, evidence, exploitability, correlation_tags):
    return Finding(
        rule_id=rule_id,
        service="Organizations",
        resource=org["organization_id"],
        severity=severity_for_rule(rule_id),
        title=title,
        description=description,
        recommendation=recommendation,
        business_impact=business_impact,
        evidence=evidence,
        exploitability=exploitability,
        correlation_tags=correlation_tags,
    ).to_dict()


def org001(org):
    if org.get("feature_set") == "ALL":
        return None
    return _finding(
        "ORG001", org,
        "AWS Organizations Feature Set Restricted",
        f"AWS Organization '{org['organization_id']}' is not configured with ALL features enabled.",
        "Enable ALL features in AWS Organizations to enforce Service Control Policies (SCPs) across member accounts.",
        "Member accounts cannot be constrained using centralized governance policies or security control guardrails.",
        [f"Organization ID: {org['organization_id']}", f"FeatureSet: {org.get('feature_set')}"],
        6,
        ["governance", "organization_security"],
    )


RULES = [org001]


def analyze_organizations(resources):
    findings = []
    for org in resources:
        for rule in RULES:
            res = rule(org)
            if res:
                findings.append(res)
    return findings
