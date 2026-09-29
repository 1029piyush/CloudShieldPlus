from botocore.exceptions import ClientError
from services.session_manager import get_session
from engine.rules.apigateway_rules import analyze_apigateway


def discover_apigateway():
    session = get_session()
    if session is None:
        return {"service": "APIGateway", "resources": [], "findings": []}

    resources = []
    try:
        apg = session.client("apigateway")
        apis = apg.get_rest_apis().get("items", [])
        for api in apis:
            api_id = api.get("id")
            api_name = api.get("name")
            resources.append({
                "api_id": api_id,
                "name": api_name,
                "description": api.get("description"),
                "created_date": str(api.get("createdDate")),
                "api_key_source": api.get("apiKeySource"),
                "endpoint_types": api.get("endpointConfiguration", {}).get("types", []),
            })
    except Exception as e:
        print(f"[API Gateway Scanner Error] {e}")

    findings = analyze_apigateway(resources)
    return {
        "service": "APIGateway",
        "resources": resources,
        "findings": findings,
    }
