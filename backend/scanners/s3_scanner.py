from botocore.exceptions import ClientError

from services.session_manager import get_session
from engine.rule_engine import analyze_s3


def get_bucket_region(s3, bucket_name):
    try:
        response = s3.get_bucket_location(Bucket=bucket_name)
        return response.get("LocationConstraint") or "us-east-1"
    except Exception:
        return None


def get_bucket_versioning(s3, bucket_name):
    try:
        response = s3.get_bucket_versioning(Bucket=bucket_name)

        return {
            "enabled": response.get("Status") == "Enabled",
            "mfa_delete": response.get("MFADelete") == "Enabled"
        }

    except Exception:
        return {
            "enabled": False,
            "mfa_delete": False
        }


def get_bucket_encryption(s3, bucket_name):
    try:
        response = s3.get_bucket_encryption(Bucket=bucket_name)

        rule = response["ServerSideEncryptionConfiguration"]["Rules"][0]

        encryption = rule["ApplyServerSideEncryptionByDefault"]

        return {
            "enabled": True,
            "algorithm": encryption.get("SSEAlgorithm"),
            "kms_key": encryption.get("KMSMasterKeyID")
        }

    except Exception:
        return {
            "enabled": False,
            "algorithm": None,
            "kms_key": None
        }


def get_public_access_block(s3, bucket_name):
    try:

        config = s3.get_public_access_block(
            Bucket=bucket_name
        )["PublicAccessBlockConfiguration"]

        return {
            "enabled": (
                config["BlockPublicAcls"]
                and config["IgnorePublicAcls"]
                and config["BlockPublicPolicy"]
                and config["RestrictPublicBuckets"]
            ),
            "configuration": config
        }

    except Exception:
        return {
            "enabled": False,
            "configuration": {}
        }


def get_bucket_policy(s3, bucket_name):
    try:
        s3.get_bucket_policy(Bucket=bucket_name)
        return True
    except ClientError:
        return False


def get_bucket_acl(s3, bucket_name):
    try:
        acl = s3.get_bucket_acl(Bucket=bucket_name)

        return [
            grant["Permission"]
            for grant in acl["Grants"]
        ]

    except Exception:
        return []


def get_bucket_logging(s3, bucket_name):
    try:
        response = s3.get_bucket_logging(Bucket=bucket_name)
        return "LoggingEnabled" in response
    except Exception:
        return False


def get_bucket_tags(s3, bucket_name):
    try:
        response = s3.get_bucket_tagging(Bucket=bucket_name)

        return {
            tag["Key"]: tag["Value"]
            for tag in response["TagSet"]
        }

    except Exception:
        return {}


def get_bucket_website(s3, bucket_name):
    try:
        s3.get_bucket_website(Bucket=bucket_name)
        return True
    except Exception:
        return False


def get_object_lock(s3, bucket_name):
    try:
        response = s3.get_object_lock_configuration(
            Bucket=bucket_name
        )

        return response["ObjectLockConfiguration"].get(
            "ObjectLockEnabled"
        ) == "Enabled"

    except Exception:
        return False


def get_ownership_controls(s3, bucket_name):
    try:
        response = s3.get_bucket_ownership_controls(
            Bucket=bucket_name
        )

        return response["OwnershipControls"]["Rules"][0]["ObjectOwnership"]

    except Exception:
        return None


def discover_s3():

    session = get_session()

    if session is None:
        return {
            "service": "S3",
            "resources": [],
            "findings": []
        }

    s3 = session.client("s3")

    buckets = s3.list_buckets()["Buckets"]

    resources = []

    for bucket in buckets:

        name = bucket["Name"]

        versioning = get_bucket_versioning(s3, name)
        encryption = get_bucket_encryption(s3, name)
        public_access = get_public_access_block(s3, name)

        resources.append({

            "bucket_name": name,

            "creation_date": str(bucket["CreationDate"]),

            "arn": f"arn:aws:s3:::{name}",

            "region": get_bucket_region(s3, name),

            "versioning": versioning["enabled"],

            "mfa_delete": versioning["mfa_delete"],

            "encryption": encryption["enabled"],

            "encryption_algorithm": encryption["algorithm"],

            "kms_key": encryption["kms_key"],

            "public_access_block": public_access["enabled"],

            "public_access_configuration": public_access["configuration"],

            "bucket_policy": get_bucket_policy(s3, name),

            "acl_permissions": get_bucket_acl(s3, name),

            "logging_enabled": get_bucket_logging(s3, name),

            "website_enabled": get_bucket_website(s3, name),

            "object_lock": get_object_lock(s3, name),

            "ownership": get_ownership_controls(s3, name),

            "tags": get_bucket_tags(s3, name)

        })

    findings = analyze_s3(resources)

    return {
        "service": "S3",
        "resources": resources,
        "findings": findings
    }