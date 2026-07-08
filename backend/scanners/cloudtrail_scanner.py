from services.session_manager import get_session


def discover_cloudtrail():

    session = get_session()

    if session is None:
        return {
            "service": "CloudTrail",
            "resources": []
        }

    cloudtrail = session.client("cloudtrail")

    response = cloudtrail.describe_trails()

    resources = []

    for trail in response.get("trailList", []):

        resources.append({

            "name": trail.get("Name"),

            "is_multi_region": trail.get("IsMultiRegionTrail"),

            "log_validation": trail.get("LogFileValidationEnabled"),

            "s3_bucket": trail.get("S3BucketName"),

            "kms_key": trail.get("KmsKeyId"),

            "is_logging": True

        })

    return {
        "service": "CloudTrail",
        "resources": resources
    }