from botocore.exceptions import ClientError
from services.session_manager import get_session
from engine.rules.ecr_rules import analyze_ecr


def discover_ecr():
    session = get_session()
    if session is None:
        return {"service": "ECR", "resources": [], "findings": []}

    resources = []
    try:
        ecr = session.client("ecr")
        paginator = ecr.get_paginator("describe_repositories")
        for page in paginator.paginate():
            for repo in page.get("repositories", []):
                repo_name = repo.get("repositoryName")
                repo_arn = repo.get("repositoryArn")
                image_scanning = repo.get("imageScanningConfiguration", {}).get("scanOnPush", False)
                encryption_type = repo.get("encryptionConfiguration", {}).get("encryptionType")

                policy_public = False
                try:
                    pol = ecr.get_repository_policy(repositoryName=repo_name).get("policyText", "")
                    if '"Principal":"*"' in pol or '"Principal":{"AWS":"*"}' in pol:
                        policy_public = True
                except Exception:
                    pass

                resources.append({
                    "repository_name": repo_name,
                    "arn": repo_arn,
                    "uri": repo.get("repositoryUri"),
                    "scan_on_push": image_scanning,
                    "encryption_type": encryption_type,
                    "policy_public": policy_public,
                    "image_tag_mutability": repo.get("imageTagMutability"),
                })
    except Exception as e:
        print(f"[ECR Scanner Error] {e}")

    findings = analyze_ecr(resources)
    return {
        "service": "ECR",
        "resources": resources,
        "findings": findings,
    }
