from scanners.iam_scanner import list_iam_users
from scanners.s3_scanner import discover_s3
from scanners.ec2_scanner import discover_ec2
from scanners.security_group_scanner import discover_security_groups
from scanners.cloudtrail_scanner import discover_cloudtrail
from scanners.password_policy_scanner import discover_password_policy

from engine.finding_aggregator import aggregate_findings


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

    return {

        "services": services,

        "findings": findings

    }