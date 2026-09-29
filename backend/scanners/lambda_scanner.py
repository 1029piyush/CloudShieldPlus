from botocore.exceptions import ClientError
from services.session_manager import get_session
from engine.rules.lambda_rules import analyze_lambda


def discover_lambda():
    session = get_session()
    if session is None:
        return {"service": "Lambda", "resources": [], "findings": []}

    resources = []
    try:
        lam = session.client("lambda")
        paginator = lam.get_paginator("list_functions")
        for page in paginator.paginate():
            for fn in page.get("Functions", []):
                fn_name = fn.get("FunctionName")
                fn_arn = fn.get("FunctionArn")
                role = fn.get("Role")
                runtime = fn.get("Runtime")
                
                # Check for public Function URL
                url_public = False
                try:
                    url_configs = lam.list_function_url_configs(FunctionName=fn_name).get("FunctionUrlConfigs", [])
                    for uc in url_configs:
                        if uc.get("AuthType") == "NONE":
                            url_public = True
                            break
                except Exception:
                    pass

                # Check resource policy for public principal
                policy_public = False
                try:
                    policy_res = lam.get_policy(FunctionName=fn_name).get("Policy", "")
                    if '"Principal":"*"' in policy_res or '"Principal":{"AWS":"*"}' in policy_res:
                        policy_public = True
                except Exception:
                    pass

                # Environment variables inspection
                env_vars = fn.get("Environment", {}).get("Variables", {})
                env_keys = list(env_vars.keys())

                vpc_config = fn.get("VpcConfig", {})
                vpc_id = vpc_config.get("VpcId")
                security_groups = vpc_config.get("SecurityGroupIds", [])
                subnets = vpc_config.get("SubnetIds", [])

                resources.append({
                    "function_name": fn_name,
                    "arn": fn_arn,
                    "role": role,
                    "runtime": runtime,
                    "handler": fn.get("Handler"),
                    "code_size": fn.get("CodeSize"),
                    "memory_size": fn.get("MemorySize"),
                    "timeout": fn.get("Timeout"),
                    "url_public": url_public,
                    "policy_public": policy_public,
                    "env_keys": env_keys,
                    "vpc_id": vpc_id,
                    "security_groups": security_groups,
                    "subnets": subnets,
                })
    except Exception as e:
        print(f"[Lambda Scanner Error] {e}")

    findings = analyze_lambda(resources)
    return {
        "service": "Lambda",
        "resources": resources,
        "findings": findings,
    }
