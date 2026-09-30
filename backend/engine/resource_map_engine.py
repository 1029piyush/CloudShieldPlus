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

    def add_edge(source, target, relationship, evidence=None):
        if not source or not target or source not in nodes or target not in nodes:
            return
        edge = {
            "source": source,
            "target": target,
            "relationship": relationship,
            "evidence": evidence or [],
        }
        if not any(
            existing["source"] == source
            and existing["target"] == target
            and existing["relationship"] == relationship
            for existing in edges
        ):
            edges.append(edge)

    def resource_identifier(resource):
        for key in (
            "resource_id", "instance_id", "bucket_name", "function_name",
            "db_instance_id", "group_id", "vpc_id", "subnet_id",
            "route_table_id", "internet_gateway_id", "nat_gateway_id",
            "endpoint_id", "network_acl_id", "user_name", "username",
            "load_balancer_name", "target_group_name", "api_id", "arn",
        ):
            if resource.get(key):
                return str(resource[key])
        return None

    def add_generic_resources():
        """Fill gaps for services and nested boto3 resources not handled above."""
        has_public = False
        deferred_edges = []

        def add_resource(resource, service, resource_type, parent_id=None, relationship=None):
            nonlocal has_public
            resource_id = resource_identifier(resource)
            if not resource_id:
                return None
            prefix = service.lower()
            if resource_type == "SecurityGroup":
                prefix = "sg"
            elif resource_type == "Subnet":
                prefix = "vpc-subnet"
            elif resource_type == "TargetGroup":
                prefix = "elb-target-group"
            node_id = f"{prefix}:{resource_id}"
            public = bool(
                resource.get("public_ip")
                or resource.get("publicly_accessible")
                or resource.get("public")
                or resource.get("url_public")
            )
            add_node(
                node_id=node_id,
                resource_id=resource_id,
                resource_type=resource_type,
                service=service,
                name=resource_id,
                region=resource.get("region") or resource.get("availability_zone", "us-east-1"),
                arn=resource.get("arn") or resource.get("role_arn"),
                exposure="public" if public else "private",
            )
            has_public = has_public or public
            if parent_id and relationship:
                add_edge(parent_id, node_id, relationship, [f"{resource_type} {resource_id} discovered from boto3"])
            return node_id

        for service_key, result in scan_services.items():
            if not isinstance(result, dict):
                continue
            service = result.get("service") or service_key.upper()
            resource_type = service.rstrip("s")
            for resource in result.get("resources") or []:
                if not isinstance(resource, dict):
                    continue
                node_id = add_resource(resource, service, resource_type)

                if resource.get("vpc_id"):
                    deferred_edges.append((node_id, f"vpc:{resource['vpc_id']}", "IN_VPC"))
                if resource.get("subnet_id"):
                    deferred_edges.append((node_id, f"vpc-subnet:{resource['subnet_id']}", "IN_SUBNET"))
                for sg_id in resource.get("security_groups") or []:
                    sg_id = sg_id.get("GroupId") if isinstance(sg_id, dict) else sg_id
                    deferred_edges.append((node_id, f"sg:{sg_id}", "ATTACHED_SECURITY_GROUP"))
                role = resource.get("iam_role") or resource.get("role")
                if role:
                    role_id = str(role).split("/")[-1]
                    role_node_id = f"iam-role:{role_id}"
                    add_node(
                        role_node_id,
                        role_id,
                        "IAMRole",
                        "IAM",
                        role_id,
                        arn=role if str(role).startswith("arn:") else None,
                    )
                    add_edge(node_id, role_node_id, "ASSUMES_ROLE")

                if service_key.lower() == "vpc":
                    for child, child_type, relationship in (
                        (resource.get("subnets"), "Subnet", "CONTAINS"),
                        (resource.get("nacls"), "NetworkACL", "PROTECTED_BY"),
                        (resource.get("endpoints"), "VPCEndpoint", "PROVIDES_ENDPOINT"),
                    ):
                        for nested in child or []:
                            if isinstance(nested, dict):
                                child_node = add_resource(nested, "VPC", child_type, node_id, relationship)
                                if child_type == "Subnet" and nested.get("route_table_id"):
                                    route_table_id = nested["route_table_id"]
                                    route_table_node = add_resource(
                                        {"route_table_id": route_table_id},
                                        "VPC",
                                        "RouteTable",
                                    )
                                    add_edge(child_node, route_table_node, "USES_ROUTE_TABLE")
                    if resource.get("internet_gateway_id"):
                        add_resource(
                            {"internet_gateway_id": resource["internet_gateway_id"]},
                            "VPC",
                            "InternetGateway",
                            node_id,
                            "ATTACHED_GATEWAY",
                        )

                if service_key.lower() == "elb":
                    for target_group in resource.get("target_groups") or []:
                        if not isinstance(target_group, dict):
                            continue
                        target_group_node = add_resource(
                            target_group,
                            "ELB",
                            "TargetGroup",
                            node_id,
                            "ROUTES_TO",
                        )
                        for target_id in target_group.get("targets") or []:
                            deferred_edges.append(
                                (target_group_node, f"ec2:{target_id}", "TARGETS")
                            )

        for source, target, relationship in deferred_edges:
            add_edge(source, target, relationship)

        return has_public

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

    if add_generic_resources():
        has_public_resources = True

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
