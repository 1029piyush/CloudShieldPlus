"""Resource Map Engine: Generates normalized nodes and edges from scanner evidence."""


def build_resource_map(scan_services, findings, attack_paths):
    nodes = {}
    edges = []

    # Map findings by resource name
    findings_by_resource = {}
    for f in findings:
        res = f.get("resource")
        if res:
            if res not in findings_by_resource:
                findings_by_resource[res] = []
            findings_by_resource[res].append(f)

    # Map attack paths by resource
    attack_paths_by_resource = {}
    for ap in attack_paths:
        ap_dict = ap.to_dict() if hasattr(ap, "to_dict") else ap
        ap_id = ap_dict.get("attack_id")
        for res in ap_dict.get("affected_resources", []):
            if res not in attack_paths_by_resource:
                attack_paths_by_resource[res] = []
            if ap_id not in attack_paths_by_resource[res]:
                attack_paths_by_resource[res].append(ap_id)

    def get_security_status(res_name):
        res_findings = findings_by_resource.get(res_name, [])
        if not res_findings:
            return "Clean"
        severities = {f.get("severity") for f in res_findings}
        if "Critical" in severities:
            return "Critical"
        if "High" in severities:
            return "High"
        if "Medium" in severities:
            return "Medium"
        return "Low"

    def get_related_rule_ids(res_name):
        return [f.get("rule_id") for f in findings_by_resource.get(res_name, [])]

    # Helper to add a node safely
    def add_node(node_id, resource_id, resource_type, service, name, region="us-east-1", arn=None, exposure="private"):
        if node_id not in nodes:
            rule_ids = get_related_rule_ids(name)
            ap_ids = attack_paths_by_resource.get(name, [])
            sec_status = get_security_status(name)

            nodes[node_id] = {
                "node_id": node_id,
                "resource_id": resource_id,
                "resource_type": resource_type,
                "service": service,
                "name": name,
                "region": region,
                "arn": arn or f"arn:aws:{service.lower()}:::{resource_id}",
                "exposure": exposure,
                "security_status": sec_status,
                "related_findings": rule_ids,
                "related_attack_paths": ap_ids,
            }

    # Add Internet Gateway / Public Internet node
    has_public_resources = False

    # 1. EC2 & Security Groups
    ec2_data = scan_services.get("ec2", {}).get("resources", [])
    for inst in ec2_data:
        inst_id = inst.get("instance_id")
        node_id = f"ec2:{inst_id}"
        exposure = "public" if inst.get("public_ip") else "private"
        if exposure == "public":
            has_public_resources = True

        add_node(
            node_id=node_id,
            resource_id=inst_id,
            resource_type="EC2",
            service="EC2",
            name=inst_id,
            region=inst.get("region", "us-east-1"),
            arn=inst.get("arn"),
            exposure=exposure,
        )

        if exposure == "public":
            edges.append({
                "source": "internet:public",
                "target": node_id,
                "relationship": "INTERNET_EXPOSED",
                "evidence": [f"Public IP: {inst.get('public_ip')}"],
            })

        for sg_id in inst.get("security_groups", []):
            sg_node_id = f"sg:{sg_id}"
            add_node(
                node_id=sg_node_id,
                resource_id=sg_id,
                resource_type="SecurityGroup",
                service="EC2",
                name=sg_id,
                exposure="public" if exposure == "public" else "private",
            )
            edges.append({
                "source": node_id,
                "target": sg_node_id,
                "relationship": "ATTACHED_SECURITY_GROUP",
                "evidence": [f"EC2 Instance {inst_id} attached to Security Group {sg_id}"],
            })

        iam_profile = inst.get("iam_instance_profile")
        if iam_profile:
            role_node_id = f"iam-role:{iam_profile}"
            add_node(
                node_id=role_node_id,
                resource_id=iam_profile,
                resource_type="IAMRole",
                service="IAM",
                name=iam_profile,
            )
            edges.append({
                "source": node_id,
                "target": role_node_id,
                "relationship": "ASSUMES_ROLE",
                "evidence": [f"EC2 Instance Profile: {iam_profile}"],
            })

    # 2. S3 Buckets
    s3_data = scan_services.get("s3", {}).get("resources", [])
    for bkt in s3_data:
        bkt_name = bkt.get("bucket_name")
        node_id = f"s3:{bkt_name}"
        is_public = bkt.get("public_access_block") is False or len(bkt.get("public_acl_permissions", [])) > 0
        exposure = "public" if is_public else "private"
        if is_public:
            has_public_resources = True

        add_node(
            node_id=node_id,
            resource_id=bkt_name,
            resource_type="S3",
            service="S3",
            name=bkt_name,
            region=bkt.get("region", "us-east-1"),
            arn=bkt.get("arn"),
            exposure=exposure,
        )

        if is_public:
            edges.append({
                "source": "internet:public",
                "target": node_id,
                "relationship": "INTERNET_EXPOSED",
                "evidence": ["S3 Block Public Access Disabled or Public ACL Grants"],
            })

        if bkt.get("kms_key"):
            kms_id = bkt.get("kms_key")
            kms_node_id = f"kms:{kms_id}"
            add_node(
                node_id=kms_node_id,
                resource_id=kms_id,
                resource_type="KMS",
                service="KMS",
                name=kms_id,
            )
            edges.append({
                "source": node_id,
                "target": kms_node_id,
                "relationship": "ENCRYPTED_WITH_KMS",
                "evidence": [f"S3 Default KMS Encryption Key: {kms_id}"],
            })

    # 3. RDS Instances
    rds_data = scan_services.get("rds", {}).get("resources", [])
    for db in rds_data:
        db_id = db.get("db_instance_id")
        node_id = f"rds:{db_id}"
        exposure = "public" if db.get("publicly_accessible") else "private"
        if db.get("publicly_accessible"):
            has_public_resources = True

        add_node(
            node_id=node_id,
            resource_id=db_id,
            resource_type="RDS",
            service="RDS",
            name=db_id,
            arn=db.get("arn"),
            exposure=exposure,
        )

        if db.get("publicly_accessible"):
            edges.append({
                "source": "internet:public",
                "target": node_id,
                "relationship": "INTERNET_EXPOSED",
                "evidence": [f"PubliclyAccessible: True, Endpoint: {db.get('endpoint_address')}"],
            })

        for sg_id in db.get("security_groups", []):
            sg_node_id = f"sg:{sg_id}"
            add_node(
                node_id=sg_node_id,
                resource_id=sg_id,
                resource_type="SecurityGroup",
                service="EC2",
                name=sg_id,
                exposure=exposure,
            )
            edges.append({
                "source": node_id,
                "target": sg_node_id,
                "relationship": "ATTACHED_SECURITY_GROUP",
                "evidence": [f"RDS Instance {db_id} attached to Security Group {sg_id}"],
            })

    # 4. Lambda Functions
    lambda_data = scan_services.get("lambda", {}).get("resources", [])
    for fn in lambda_data:
        fn_name = fn.get("function_name")
        node_id = f"lambda:{fn_name}"
        exposure = "public" if (fn.get("url_public") or fn.get("policy_public")) else "private"
        if exposure == "public":
            has_public_resources = True

        add_node(
            node_id=node_id,
            resource_id=fn_name,
            resource_type="Lambda",
            service="Lambda",
            name=fn_name,
            arn=fn.get("arn"),
            exposure=exposure,
        )

        if exposure == "public":
            edges.append({
                "source": "internet:public",
                "target": node_id,
                "relationship": "INTERNET_EXPOSED",
                "evidence": ["Function URL AuthType: NONE or Public Resource Policy"],
            })

        role_arn = fn.get("role")
        if role_arn:
            role_name = role_arn.split("/")[-1]
            role_node_id = f"iam-role:{role_name}"
            add_node(
                node_id=role_node_id,
                resource_id=role_name,
                resource_type="IAMRole",
                service="IAM",
                name=role_name,
                arn=role_arn,
            )
            edges.append({
                "source": node_id,
                "target": role_node_id,
                "relationship": "EXECUTION_ROLE",
                "evidence": [f"Lambda Execution Role: {role_arn}"],
            })

    # 5. VPCs
    vpc_data = scan_services.get("vpc", {}).get("resources", [])
    for vpc in vpc_data:
        vpc_id = vpc.get("vpc_id")
        node_id = f"vpc:{vpc_id}"
        add_node(
            node_id=node_id,
            resource_id=vpc_id,
            resource_type="VPC",
            service="VPC",
            name=vpc_id,
            exposure="public" if vpc.get("has_internet_gateway") else "private",
        )

    # Add Internet Node if any public resources exist
    if has_public_resources or len(nodes) > 0:
        nodes["internet:public"] = {
            "node_id": "internet:public",
            "resource_id": "Internet",
            "resource_type": "Internet",
            "service": "Network",
            "name": "Public Internet",
            "region": "Global",
            "arn": "arn:aws:network:::internet",
            "exposure": "public",
            "security_status": "Clean",
            "related_findings": [],
            "related_attack_paths": [],
        }

    return {
        "nodes": list(nodes.values()),
        "edges": edges,
    }
