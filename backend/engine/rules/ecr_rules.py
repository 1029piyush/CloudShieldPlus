from engine.findings import Finding
from engine.rules.severity import severity_for_rule


def _finding(rule_id, repo, title, description, recommendation,
             business_impact, evidence, exploitability, correlation_tags):
    return Finding(
        rule_id=rule_id,
        service="ECR",
        resource=repo["repository_name"],
        severity=severity_for_rule(rule_id),
        title=title,
        description=description,
        recommendation=recommendation,
        business_impact=business_impact,
        evidence=evidence,
        exploitability=exploitability,
        correlation_tags=correlation_tags,
    ).to_dict()


def ecr001(repo):
    if repo.get("scan_on_push", False):
        return None
    return _finding(
        "ECR001", repo,
        "ECR Image Vulnerability Scanning Disabled",
        f"ECR repository '{repo['repository_name']}' does not scan container images on push.",
        "Enable scanOnPush configuration on ECR repositories to identify image software vulnerabilities automatically.",
        "Vulnerable container images can be pushed to production without automated CVE detection.",
        [f"Repository: {repo['repository_name']}", "ScanOnPush: False"],
        6,
        ["vulnerability_scanning", "containers"],
    )


def ecr002(repo):
    if not repo.get("policy_public", False):
        return None
    return _finding(
        "ECR002", repo,
        "Publicly Accessible ECR Repository Policy",
        f"ECR repository '{repo['repository_name']}' grants anonymous or wildcard access via repository policy.",
        "Restrict repository policy permissions to explicit IAM roles and AWS account principals.",
        "Proprietary container image layers and embedded credentials can be pulled publicly by unauthorized users.",
        [f"Repository: {repo['repository_name']}", "Policy Public: True"],
        9,
        ["public_exposure", "data_exposure", "containers"],
    )


RULES = [ecr001, ecr002]


def analyze_ecr(resources):
    findings = []
    for repo in resources:
        for rule in RULES:
            res = rule(repo)
            if res:
                findings.append(res)
    return findings
