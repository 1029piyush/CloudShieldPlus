from botocore.exceptions import ClientError

from services.session_manager import get_session
from engine.rule_engine import analyze_cloudtrail


def get_logging_status(client, trail_name):

    try:

        response = client.get_trail_status(
            Name=trail_name
        )

        return response.get("IsLogging", False)

    except ClientError:

        return False


def get_event_selectors(client, trail_name):

    try:

        response = client.get_event_selectors(
            TrailName=trail_name
        )

        return {
            "event_selectors": response.get("EventSelectors", []),
            "advanced_event_selectors": response.get(
                "AdvancedEventSelectors",
                []
            ),
        }

    except ClientError:

        return {
            "event_selectors": [],
            "advanced_event_selectors": [],
        }


def get_insight_selectors(client, trail_name):

    try:

        response = client.get_insight_selectors(
            TrailName=trail_name
        )

        return response.get("InsightSelectors", [])

    except ClientError:

        return []


def discover_cloudtrail():

    session = get_session()

    if session is None:

        resources = []

        return {

            "service": "CloudTrail",

            "resources": resources,

            "findings": analyze_cloudtrail(resources)

        }

    cloudtrail = session.client("cloudtrail")

    trails = cloudtrail.describe_trails().get(
        "trailList",
        []
    )

    resources = []

    for trail in trails:

        event_selectors = get_event_selectors(
            cloudtrail,
            trail.get("Name")
        )

        resources.append({

            "name": trail.get("Name"),

            "trail_arn": trail.get("TrailARN"),

            "home_region": trail.get("HomeRegion"),

            "is_multi_region": trail.get("IsMultiRegionTrail"),

            "is_organization_trail":
                trail.get("IsOrganizationTrail", False),

            "include_global_service_events":
                trail.get("IncludeGlobalServiceEvents"),

            "log_validation":
                trail.get("LogFileValidationEnabled"),

            "is_logging":
                get_logging_status(
                    cloudtrail,
                    trail.get("Name")
                ),

            "s3_bucket":
                trail.get("S3BucketName"),

            "s3_key_prefix":
                trail.get("S3KeyPrefix"),

            "kms_key":
                trail.get("KmsKeyId"),

            "cloudwatch_log_group":
                trail.get("CloudWatchLogsLogGroupArn"),

            "cloudwatch_role":
                trail.get("CloudWatchLogsRoleArn"),

            "sns_topic":
                trail.get("SnsTopicARN"),

            "event_selectors": event_selectors["event_selectors"],

            "advanced_event_selectors": event_selectors[
                "advanced_event_selectors"
            ],

            "insight_selectors":
                get_insight_selectors(
                    cloudtrail,
                    trail.get("Name")
                )

        })

    findings = analyze_cloudtrail(resources)

    return {

        "service": "CloudTrail",

        "resources": resources,

        "findings": findings

    }
