from scanners.iam_scanner import list_iam_users
from scanners.s3_scanner import discover_s3
from scanners.ec2_scanner import discover_ec2
from scanners.security_group_scanner import discover_security_groups
from scanners.cloudtrail_scanner import discover_cloudtrail
from scanners.password_policy_scanner import discover_password_policy

from engine.finding_aggregator import aggregate_findings
from engine.attack_path_engine import analyze_attack_paths
from engine.recommendation_engine import analyze_recommendations
from engine.report_engine import build_report


def run_full_scan():

    services = {

        "iam": list_iam_users(),

        "s3": discover_s3(),

        "ec2": discover_ec2(),

        "security_groups": discover_security_groups(),

        "cloudtrail": discover_cloudtrail(),

        "password_policy": discover_password_policy()

    }

    # Collect all findings from every service
    findings = aggregate_findings(services)
    attack_paths = analyze_attack_paths(findings)
    recommendations = analyze_recommendations(findings, attack_paths)
    report = build_report(services, findings, attack_paths, recommendations)

    return {

        "services": services,

        "findings": findings,

        "attack_paths": [
            attack_path.to_dict()
            for attack_path in attack_paths
        ],

        "recommendations": [
            recommendation.to_dict()
            for recommendation in recommendations
        ],

        "report": report

    }
