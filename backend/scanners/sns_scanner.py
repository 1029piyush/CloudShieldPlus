from botocore.exceptions import ClientError
from services.session_manager import get_session
from engine.rules.sns_rules import analyze_sns


def discover_sns():
    session = get_session()
    if session is None:
        return {"service": "SNS", "resources": [], "findings": []}

    resources = []
    try:
        sns = session.client("sns")
        paginator = sns.get_paginator("list_topics")
        for page in paginator.paginate():
            for top in page.get("Topics", []):
                arn = top.get("TopicArn")
                topic_name = arn.split(":")[-1]
                
                policy_public = False
                kms_master_key_id = None
                try:
                    attrs = sns.get_topic_attributes(TopicArn=arn).get("Attributes", {})
                    pol = attrs.get("Policy", "")
                    if '"Principal":"*"' in pol or '"Principal":{"AWS":"*"}' in pol:
                        policy_public = True
                    kms_master_key_id = attrs.get("KmsMasterKeyId")
                except Exception:
                    pass

                resources.append({
                    "topic_name": topic_name,
                    "arn": arn,
                    "policy_public": policy_public,
                    "kms_master_key_id": kms_master_key_id,
                })
    except Exception as e:
        print(f"[SNS Scanner Error] {e}")

    findings = analyze_sns(resources)
    return {
        "service": "SNS",
        "resources": resources,
        "findings": findings,
    }
