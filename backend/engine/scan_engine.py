from scanners.iam_scanner import list_iam_users
from scanners.s3_scanner import discover_s3
from scanners.ec2_scanner import discover_ec2
from scanners.security_group_scanner import discover_security_groups
from scanners.cloudtrail_scanner import discover_cloudtrail
from scanners.password_policy_scanner import discover_password_policy
from scanners.vpc_scanner import discover_vpc

from engine.finding_aggregator import aggregate_findings
from engine.attack_path_engine import analyze_attack_paths
from engine.recommendation_engine import generate_recommendations
from engine.report_engine import build_report


def run_full_scan():
    services = {
        "iam": list_iam_users(),
        "s3": discover_s3(),
        "ec2": discover_ec2(),
        "security_groups": discover_security_groups(),
        "cloudtrail": discover_cloudtrail(),
        "password_policy": discover_password_policy(),
        "vpc": discover_vpc(),
    }

    findings = aggregate_findings(services)
    attack_paths = analyze_attack_paths(findings)
    recommendations = generate_recommendations(findings, attack_paths)
    report = build_report(services, findings, attack_paths, recommendations)

    return {
        "services": services,
        "findings": findings,
        "attack_paths": [ap.to_dict() for ap in attack_paths],
        "recommendations": [rec.to_dict() for rec in recommendations],
        "report": report,
    }

