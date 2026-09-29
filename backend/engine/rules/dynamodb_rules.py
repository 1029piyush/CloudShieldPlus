from engine.findings import Finding
from engine.rules.severity import severity_for_rule


def _finding(rule_id, tbl, title, description, recommendation,
             business_impact, evidence, exploitability, correlation_tags):
    return Finding(
        rule_id=rule_id,
        service="DynamoDB",
        resource=tbl["table_name"],
        severity=severity_for_rule(rule_id),
        title=title,
        description=description,
        recommendation=recommendation,
        business_impact=business_impact,
        evidence=evidence,
        exploitability=exploitability,
        correlation_tags=correlation_tags,
    ).to_dict()


def ddb001(tbl):
    if tbl.get("pitr_enabled", False):
        return None
    return _finding(
        "DDB001", tbl,
        "DynamoDB Point-in-Time Recovery Disabled",
        f"DynamoDB table '{tbl['table_name']}' does not have Continuous Backups / Point-in-Time Recovery (PITR) enabled.",
        "Enable Point-in-Time Recovery (PITR) to protect table data against accidental write/delete operations or ransomware.",
        "Unintended data modification or table truncation cannot be restored to a precise previous timestamp.",
        [f"Table: {tbl['table_name']}", "PITR: Disabled"],
        5,
        ["data_resilience", "backup"],
    )


RULES = [ddb001]


def analyze_dynamodb(resources):
    findings = []
    for tbl in resources:
        for rule in RULES:
            res = rule(tbl)
            if res:
                findings.append(res)
    return findings
