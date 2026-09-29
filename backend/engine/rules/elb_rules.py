from engine.findings import Finding
from engine.rules.severity import severity_for_rule


def _finding(rule_id, lb, title, description, recommendation,
             business_impact, evidence, exploitability, correlation_tags):
    return Finding(
        rule_id=rule_id,
        service="ELB",
        resource=lb["load_balancer_name"],
        severity=severity_for_rule(rule_id),
        title=title,
        description=description,
        recommendation=recommendation,
        business_impact=business_impact,
        evidence=evidence,
        exploitability=exploitability,
        correlation_tags=correlation_tags,
    ).to_dict()


def elb001(lb):
    # Check if internet-facing ALB has unencrypted HTTP listeners without HTTPS redirect
    if lb.get("scheme") != "internet-facing":
        return None

    http_listeners = [l for l in lb.get("listeners", []) if l.get("protocol") == "HTTP"]
    if not http_listeners:
        return None

    return _finding(
        "ELB001", lb,
        "Internet-Facing Load Balancer Accepts Plaintext HTTP",
        f"Internet-facing load balancer '{lb['load_balancer_name']}' listens on plaintext HTTP without mandatory TLS redirection.",
        "Configure HTTPS listeners (port 443) with valid TLS certificates and redirect HTTP traffic to HTTPS.",
        "Sensors or attackers on public network paths can eavesdrop on session cookies, tokens, and sensitive data in transit.",
        [f"Load Balancer: {lb['load_balancer_name']}", f"Scheme: {lb.get('scheme')}", "HTTP Listeners Active"],
        8,
        ["public_exposure", "tls_encryption", "data_in_transit"],
    )


RULES = [elb001]


def analyze_elb(resources):
    findings = []
    for lb in resources:
        for rule in RULES:
            res = rule(lb)
            if res:
                findings.append(res)
    return findings
