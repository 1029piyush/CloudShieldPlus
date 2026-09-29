from botocore.exceptions import ClientError
from services.session_manager import get_session
from engine.rules.organizations_rules import analyze_organizations


def discover_organizations():
    session = get_session()
    if session is None:
        return {"service": "Organizations", "resources": [], "findings": []}

    resources = []
    try:
        org_client = session.client("organizations")
        try:
            org = org_client.describe_organization().get("Organization", {})
            resources.append({
                "organization_id": org.get("Id"),
                "arn": org.get("Arn"),
                "master_account_id": org.get("MasterAccountId"),
                "master_account_email": org.get("MasterAccountEmail"),
                "feature_set": org.get("FeatureSet"),
            })
        except Exception:
            pass
    except Exception as e:
        print(f"[Organizations Scanner Error] {e}")

    findings = analyze_organizations(resources)
    return {
        "service": "Organizations",
        "resources": resources,
        "findings": findings,
    }
