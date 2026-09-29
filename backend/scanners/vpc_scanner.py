from botocore.exceptions import ClientError
from services.session_manager import get_session
from engine.rules.vpc_rules import analyze_vpc


def discover_vpc():
    session = get_session()
    if session is None:
        return {"service": "VPC", "resources": [], "findings": []}

    resources = []
    try:
        ec2 = session.client("ec2")
        
        # 1. Discover VPCs
        vpcs = []
        try:
            vpcs = ec2.describe_vpcs().get("Vpcs", [])
        except ClientError as e:
            print(f"[VPC Scanner Notice] DescribeVpcs failed: {e}")
            return {"service": "VPC", "resources": [], "findings": []}

        # 2. Discover Subnets
        subnets = []
        try:
            subnets = ec2.describe_subnets().get("Subnets", [])
        except ClientError as e:
            print(f"[VPC Scanner Notice] DescribeSubnets failed: {e}")

        # 3. Discover Route Tables
        route_tables = []
        try:
            route_tables = ec2.describe_route_tables().get("RouteTables", [])
        except ClientError as e:
            print(f"[VPC Scanner Notice] DescribeRouteTables failed: {e}")

        # 4. Discover Internet Gateways
        igws = []
        try:
            igws = ec2.describe_internet_gateways().get("InternetGateways", [])
        except ClientError as e:
            print(f"[VPC Scanner Notice] DescribeInternetGateways failed: {e}")

        # 5. Discover NAT Gateways
        nat_gateways = []
        try:
            nat_gateways = ec2.describe_nat_gateways().get("NatGateways", [])
        except ClientError as e:
            print(f"[VPC Scanner Notice] DescribeNatGateways failed: {e}")

        # 6. Discover Network ACLs
        nacls = []
        try:
            nacls = ec2.describe_network_acls().get("NetworkAcls", [])
        except ClientError as e:
            print(f"[VPC Scanner Notice] DescribeNetworkAcls failed: {e}")

        # 7. Discover VPC Endpoints
        vpc_endpoints = []
        try:
            vpc_endpoints = ec2.describe_vpc_endpoints().get("VpcEndpoints", [])
        except ClientError as e:
            print(f"[VPC Scanner Notice] DescribeVpcEndpoints failed: {e}")

        # 8. Discover Flow Logs (with verification status)
        flow_logs = []
        flow_log_api_verified = False
        try:
            flow_logs = ec2.describe_flow_logs().get("FlowLogs", [])
            flow_log_api_verified = True
        except ClientError as e:
            print(f"[VPC Scanner Notice] DescribeFlowLogs failed: {e}")
            flow_log_api_verified = False

        # Build lookup maps
        active_flow_log_vpcs = {
            fl.get("ResourceId")
            for fl in flow_logs
            if fl.get("FlowLogStatus") == "ACTIVE" and fl.get("ResourceType") == "VPC"
        }

        vpc_igw_map = {}
        for igw in igws:
            igw_id = igw.get("InternetGatewayId")
            for att in igw.get("Attachments", []):
                if att.get("State") in ["available", "attached"]:
                    vpc_igw_map[att.get("VpcId")] = igw_id

        # Map route tables to subnets and VPCs
        subnet_route_table_map = {}
        main_vpc_route_table_map = {}
        for rt in route_tables:
            rt_id = rt.get("RouteTableId")
            v_id = rt.get("VpcId")
            is_main = any(assoc.get("Main") for assoc in rt.get("Associations", []))
            if is_main:
                main_vpc_route_table_map[v_id] = rt

            for assoc in rt.get("Associations", []):
                s_id = assoc.get("SubnetId")
                if s_id:
                    subnet_route_table_map[s_id] = rt

        # Process each VPC
        for vpc in vpcs:
            vpc_id = vpc.get("VpcId")
            
            # Filter subnets belonging to this VPC
            vpc_subnets_data = [s for s in subnets if s.get("VpcId") == vpc_id]
            subnet_details = []
            
            for s in vpc_subnets_data:
                s_id = s.get("SubnetId")
                # Determine associated route table (subnet explicit association or main table)
                rt = subnet_route_table_map.get(s_id) or main_vpc_route_table_map.get(vpc_id)
                has_igw_route = False
                igw_id_route = None
                rt_id = None
                
                if rt:
                    rt_id = rt.get("RouteTableId")
                    for route in rt.get("Routes", []):
                        g_id = route.get("GatewayId", "")
                        if g_id.startswith("igw-") and route.get("DestinationCidrBlock") == "0.0.0.0/0" and route.get("State") in ["active", None]:
                            has_igw_route = True
                            igw_id_route = g_id
                            break

                subnet_details.append({
                    "subnet_id": s_id,
                    "vpc_id": vpc_id,
                    "cidr_block": s.get("CidrBlock"),
                    "ipv6_cidr_block_association_set": s.get("Ipv6CidrBlockAssociationSet", []),
                    "availability_zone": s.get("AvailabilityZone"),
                    "map_public_ip_on_launch": s.get("MapPublicIpOnLaunch", False),
                    "default_for_az": s.get("DefaultForAz", False),
                    "state": s.get("State"),
                    "route_table_id": rt_id,
                    "has_igw_route": has_igw_route,
                    "igw_id_route": igw_id_route,
                    "tags": {t["Key"]: t["Value"] for t in s.get("Tags", [])},
                })

            # Process NACLs for this VPC
            vpc_nacls = []
            for nacl in nacls:
                if nacl.get("VpcId") == vpc_id:
                    vpc_nacls.append({
                        "network_acl_id": nacl.get("NetworkAclId"),
                        "is_default": nacl.get("IsDefault", False),
                        "associations": [a.get("SubnetId") for a in nacl.get("Associations", [])],
                        "entries": nacl.get("Entries", []),
                    })

            # Process Endpoints for this VPC
            vpc_ep_list = [
                {
                    "endpoint_id": ep.get("VpcEndpointId"),
                    "service_name": ep.get("ServiceName"),
                    "endpoint_type": ep.get("VpcEndpointType"),
                    "state": ep.get("State"),
                }
                for ep in vpc_endpoints
                if ep.get("VpcId") == vpc_id
            ]

            # Flow log status for this VPC
            flow_log_status = "enabled" if vpc_id in active_flow_log_vpcs else "disabled"

            resources.append({
                "vpc_id": vpc_id,
                "cidr_block": vpc.get("CidrBlock"),
                "ipv6_cidr_block_association_set": vpc.get("Ipv6CidrBlockAssociationSet", []),
                "is_default": vpc.get("IsDefault", False),
                "state": vpc.get("State"),
                "has_internet_gateway": vpc_id in vpc_igw_map,
                "internet_gateway_id": vpc_igw_map.get(vpc_id),
                "flow_log_status": flow_log_status,
                "flow_log_api_verified": flow_log_api_verified,
                "subnets": subnet_details,
                "nacls": vpc_nacls,
                "endpoints": vpc_ep_list,
                "tags": {t["Key"]: t["Value"] for t in vpc.get("Tags", [])},
            })

    except Exception as e:
        print(f"[VPC Scanner Error] Unexpected discovery exception: {e}")

    findings = analyze_vpc(resources)
    return {
        "service": "VPC",
        "resources": resources,
        "findings": findings,
    }
