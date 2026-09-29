from botocore.exceptions import ClientError
from services.session_manager import get_session
from engine.rules.kms_rules import analyze_kms


def discover_kms():
    session = get_session()
    if session is None:
        return {"service": "KMS", "resources": [], "findings": []}

    resources = []
    try:
        kms = session.client("kms")
        keys = kms.list_keys().get("Keys", [])
        for k in keys:
            key_id = k.get("KeyId")
            try:
                meta = kms.describe_key(KeyId=key_id).get("KeyMetadata", {})
                if meta.get("KeyManager") == "AWS":
                    continue  # Skip AWS managed keys
                
                rotation_enabled = False
                try:
                    rotation_enabled = kms.get_key_rotation_status(KeyId=key_id).get("KeyRotationEnabled", False)
                except Exception:
                    pass

                policy_public = False
                try:
                    pol = kms.get_key_policy(KeyId=key_id, PolicyName="default").get("Policy", "")
                    if '"Principal":"*"' in pol or '"Principal":{"AWS":"*"}' in pol:
                        policy_public = True
                except Exception:
                    pass

                resources.append({
                    "key_id": key_id,
                    "arn": meta.get("Arn"),
                    "key_state": meta.get("KeyState"),
                    "key_usage": meta.get("KeyUsage"),
                    "rotation_enabled": rotation_enabled,
                    "policy_public": policy_public,
                })
            except Exception:
                pass
    except Exception as e:
        print(f"[KMS Scanner Error] {e}")

    findings = analyze_kms(resources)
    return {
        "service": "KMS",
        "resources": resources,
        "findings": findings,
    }
