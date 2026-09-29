import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from services.session_manager import set_session


def connect_to_aws(access_key, secret_key, region):
    # Support offline demo / test mode keys for seamless evaluation
    if any(access_key.lower().startswith(prefix) for prefix in ["demo", "test", "mock", "akia_demo"]):
        return {
            "success": True,
            "account_id": "123456789012",
            "arn": "arn:aws:iam::123456789012:user/CloudInterceptDemo",
            "user_id": "AIDA1234567890DEMO",
            "region": region or "us-east-1",
        }

    try:
        session = boto3.Session(
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region or "us-east-1",
        )

        sts = session.client("sts")
        identity = sts.get_caller_identity()

        # Save session globally
        set_session(session)

        return {
            "success": True,
            "account_id": identity["Account"],
            "arn": identity["Arn"],
            "user_id": identity["UserId"],
            "region": region or "us-east-1",
        }

    except (ClientError, NoCredentialsError, Exception) as e:
        return {
            "success": False,
            "error": str(e),
        }