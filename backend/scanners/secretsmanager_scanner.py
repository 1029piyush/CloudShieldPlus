from botocore.exceptions import ClientError
from services.session_manager import get_session
from engine.rules.secretsmanager_rules import analyze_secretsmanager


def discover_secretsmanager():
    session = get_session()
    if session is None:
        return {"service": "SecretsManager", "resources": [], "findings": []}

    resources = []
    try:
        sm = session.client("secretsmanager")
        paginator = sm.get_paginator("list_secrets")
        for page in paginator.paginate():
            for sec in page.get("SecretList", []):
                sec_name = sec.get("Name")
                sec_arn = sec.get("ARN")
                rotation_enabled = sec.get("RotationEnabled", False)

                policy_public = False
                try:
                    pol = sm.get_resource_policy(SecretId=sec_arn).get("ResourcePolicy", "")
                    if '"Principal":"*"' in pol or '"Principal":{"AWS":"*"}' in pol:
                        policy_public = True
                except Exception:
                    pass

                resources.append({
                    "secret_name": sec_name,
                    "arn": sec_arn,
                    "rotation_enabled": rotation_enabled,
                    "kms_key_id": sec.get("KmsKeyId"),
                    "policy_public": policy_public,
                    "last_accessed_date": str(sec.get("LastAccessedDate")),
                })
    except Exception as e:
        print(f"[SecretsManager Scanner Error] {e}")

    findings = analyze_secretsmanager(resources)
    return {
        "service": "SecretsManager",
        "resources": resources,
        "findings": findings,
    }
