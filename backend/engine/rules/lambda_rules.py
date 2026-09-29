from engine.findings import Finding
from engine.rules.severity import severity_for_rule


def _finding(rule_id, fn, title, description, recommendation,
             business_impact, evidence, exploitability, correlation_tags):
    return Finding(
        rule_id=rule_id,
        service="Lambda",
        resource=fn["function_name"],
        severity=severity_for_rule(rule_id),
        title=title,
        description=description,
        recommendation=recommendation,
        business_impact=business_impact,
        evidence=evidence,
        exploitability=exploitability,
        correlation_tags=correlation_tags,
    ).to_dict()


def lam001(fn):
    if not (fn.get("url_public", False) or fn.get("policy_public", False)):
        return None
    return _finding(
        "LAM001", fn,
        "Publicly Exposed Lambda Function",
        f"Lambda function '{fn['function_name']}' is publicly accessible via Function URL (AuthType: NONE) or broad resource policy.",
        "Require IAM authentication for Function URLs or restrict the resource policy to specific AWS principals.",
        "Unauthenticated attackers on the internet can invoke the function, triggering compute charges or exploiting execution role permissions.",
        [f"Function: {fn['function_name']}", f"URL Public: {fn.get('url_public')}", f"Policy Public: {fn.get('policy_public')}"],
        9,
        ["public_exposure", "serverless", "unauthenticated_access"],
    )


def lam002(fn):
    # Check if env_keys contain sensitive keywords like SECRET, PASSWORD, KEY, TOKEN
    sensitive_keywords = ["SECRET", "PASSWORD", "PASS", "KEY", "TOKEN", "CREDENTIAL", "PRIVATE"]
    exposed_sensitive_keys = [k for k in fn.get("env_keys", []) if any(kw in k.upper() for kw in sensitive_keywords)]
    if not exposed_sensitive_keys:
        return None
    return _finding(
        "LAM002", fn,
        "Sensitive Secrets in Lambda Environment Variables",
        f"Lambda function '{fn['function_name']}' stores potential secrets in plain environment variables ({', '.join(exposed_sensitive_keys)}).",
        "Migrate sensitive credentials to AWS Secrets Manager or Systems Manager Parameter Store with KMS encryption.",
        "Users with read access to Lambda configuration or function logs can inspect plaintext API keys or credentials.",
        [f"Function: {fn['function_name']}", f"Sensitive Env Keys: {', '.join(exposed_sensitive_keys)}"],
        7,
        ["credential_exposure", "secrets_management"],
    )


def lam003(fn):
    if fn.get("vpc_id"):
        return None
    return _finding(
        "LAM003", fn,
        "Lambda Function Not Deployed in VPC",
        f"Lambda function '{fn['function_name']}' is not attached to a VPC.",
        "Configure VPC integration for Lambda functions accessing private resources or databases.",
        "The function executes in the AWS multi-tenant network space rather than inside isolated private subnets.",
        [f"Function: {fn['function_name']}", "VPC ID: None"],
        4,
        ["network_isolation", "architecture"],
    )


RULES = [lam001, lam002, lam003]


def analyze_lambda(resources):
    findings = []
    for fn in resources:
        for rule in RULES:
            res = rule(fn)
            if res:
                findings.append(res)
    return findings
