from botocore.exceptions import ClientError
from services.session_manager import get_session
from engine.rules.sqs_rules import analyze_sqs


def discover_sqs():
    session = get_session()
    if session is None:
        return {"service": "SQS", "resources": [], "findings": []}

    resources = []
    try:
        sqs = session.client("sqs")
        urls = sqs.list_queues().get("QueueUrls", [])
        for url in urls:
            q_name = url.split("/")[-1]
            policy_public = False
            kms_master_key_id = None
            try:
                attrs = sqs.get_queue_attributes(QueueUrl=url, AttributeNames=["All"]).get("Attributes", {})
                pol = attrs.get("Policy", "")
                if '"Principal":"*"' in pol or '"Principal":{"AWS":"*"}' in pol:
                    policy_public = True
                kms_master_key_id = attrs.get("KmsMasterKeyId")
            except Exception:
                pass

            resources.append({
                "queue_name": q_name,
                "queue_url": url,
                "policy_public": policy_public,
                "kms_master_key_id": kms_master_key_id,
            })
    except Exception as e:
        print(f"[SQS Scanner Error] {e}")

    findings = analyze_sqs(resources)
    return {
        "service": "SQS",
        "resources": resources,
        "findings": findings,
    }
