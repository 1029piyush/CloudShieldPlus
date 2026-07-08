from services.session_manager import get_session


def get_bucket_region(s3, bucket_name):

    try:
        response = s3.get_bucket_location(Bucket=bucket_name)

        region = response.get("LocationConstraint")

        if region is None:
            return "us-east-1"

        return region

    except Exception:
        return "Unknown"


def get_bucket_versioning(s3, bucket_name):

    try:
        response = s3.get_bucket_versioning(
            Bucket=bucket_name
        )

        status = response.get("Status")

        if status == "Enabled":
            return True

        return False

    except Exception:
        return False


def get_bucket_encryption(s3, bucket_name):

    try:
        s3.get_bucket_encryption(
            Bucket=bucket_name
        )

        return True

    except Exception:
        return False


def get_public_access_block(s3, bucket_name):

    try:

        response = s3.get_public_access_block(
            Bucket=bucket_name
        )

        config = response["PublicAccessBlockConfiguration"]

        return (
            config["BlockPublicAcls"] and
            config["IgnorePublicAcls"] and
            config["BlockPublicPolicy"] and
            config["RestrictPublicBuckets"]
        )

    except Exception:
        return False


def discover_s3():

    session = get_session()

    if session is None:
        return {
            "service": "S3",
            "resources": []
        }

    s3 = session.client("s3")

    response = s3.list_buckets()

    resources = []

    for bucket in response["Buckets"]:

        resources.append({
            "bucket_name": bucket["Name"],
            "region": get_bucket_region(s3, bucket["Name"]),
            "versioning": get_bucket_versioning(s3, bucket["Name"]),
            "encryption": get_bucket_encryption(s3, bucket["Name"]),
            "public_access_block": get_public_access_block(s3, bucket["Name"])
        })

    return {
        "service": "S3",
        "resources": resources
    }