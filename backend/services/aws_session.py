import boto3
from botocore.exceptions import ClientError, NoCredentialsError

from services.session_manager import set_session


def connect_to_aws(access_key, secret_key, region):
    try:
        session = boto3.Session(
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region
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
            "region": region
        }

    except (ClientError, NoCredentialsError) as e:
        return {
            "success": False,
            "error": str(e)
        }