import sys
import os
import unittest
from unittest.mock import patch, MagicMock

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from engine.rules.vpc_rules import analyze_vpc, vpc001, vpc002, vpc003, vpc004
from engine.scan_engine import run_full_scan


class TestVPCModule(unittest.TestCase):

    def setUp(self):
        self.sample_vpc_base = {
            "vpc_id": "vpc-12345678",
            "cidr_block": "10.0.0.0/16",
            "ipv6_cidr_block_association_set": [],
            "is_default": False,
            "state": "available",
            "has_internet_gateway": True,
            "internet_gateway_id": "igw-87654321",
            "flow_log_status": "enabled",
            "flow_log_api_verified": True,
            "subnets": [],
            "nacls": [],
            "endpoints": [],
            "tags": {"Name": "TestVPC"},
        }

    # Test 1: VPC without flow logs -> expect finding VPC001
    def test_vpc001_no_flow_logs(self):
        vpc_data = dict(self.sample_vpc_base)
        vpc_data["flow_log_status"] = "disabled"
        vpc_data["flow_log_api_verified"] = True

        findings = analyze_vpc([vpc_data])
        rule_ids = [f["rule_id"] for f in findings]

        self.assertIn("VPC001", rule_ids)
        vpc001_finding = next(f for f in findings if f["rule_id"] == "VPC001")
        self.assertEqual(vpc001_finding["resource"], "vpc-12345678")
        self.assertEqual(vpc001_finding["severity"], "Medium")

    # Test 2: Flow logs API failure -> verify NO false-positive VPC001
    def test_vpc001_api_failure_no_false_positive(self):
        vpc_data = dict(self.sample_vpc_base)
        vpc_data["flow_log_status"] = "disabled"
        vpc_data["flow_log_api_verified"] = False  # API failed/permission denied

        findings = analyze_vpc([vpc_data])
        rule_ids = [f["rule_id"] for f in findings]

        self.assertNotIn("VPC001", rule_ids)

    # Test 3: Default VPC only (no active workload) -> verify NO false-positive VPC002
    def test_vpc002_default_vpc_no_workload(self):
        vpc_data = dict(self.sample_vpc_base)
        vpc_data["is_default"] = True
        vpc_data["has_internet_gateway"] = True
        vpc_data["has_active_workload"] = False

        findings = analyze_vpc([vpc_data])
        rule_ids = [f["rule_id"] for f in findings]

        self.assertNotIn("VPC002", rule_ids)

    # Test 4: Default VPC with active internet-exposed workload -> expect finding VPC002
    def test_vpc002_default_vpc_with_workload(self):
        vpc_data = dict(self.sample_vpc_base)
        vpc_data["is_default"] = True
        vpc_data["has_internet_gateway"] = True
        vpc_data["has_active_workload"] = True

        findings = analyze_vpc([vpc_data])
        rule_ids = [f["rule_id"] for f in findings]

        self.assertIn("VPC002", rule_ids)
        vpc002_finding = next(f for f in findings if f["rule_id"] == "VPC002")
        self.assertEqual(vpc002_finding["resource"], "vpc-12345678")
        self.assertEqual(vpc002_finding["severity"], "High")

    # Test 5: Subnet with MapPublicIpOnLaunch=True WITHOUT IGW route -> NO false-positive VPC003
    def test_vpc003_public_ip_no_igw_route(self):
        vpc_data = dict(self.sample_vpc_base)
        vpc_data["subnets"] = [
            {
                "subnet_id": "subnet-aaaa1111",
                "map_public_ip_on_launch": True,
                "has_igw_route": False,
                "igw_id_route": None,
                "route_table_id": "rtb-private",
            }
        ]

        findings = analyze_vpc([vpc_data])
        rule_ids = [f["rule_id"] for f in findings]

        self.assertNotIn("VPC003", rule_ids)

    # Test 6: Subnet with MapPublicIpOnLaunch=True WITH IGW route -> expect finding VPC003
    def test_vpc003_public_ip_with_igw_route(self):
        vpc_data = dict(self.sample_vpc_base)
        vpc_data["subnets"] = [
            {
                "subnet_id": "subnet-public111",
                "map_public_ip_on_launch": True,
                "has_igw_route": True,
                "igw_id_route": "igw-87654321",
                "route_table_id": "rtb-public",
            }
        ]

        findings = analyze_vpc([vpc_data])
        rule_ids = [f["rule_id"] for f in findings]

        self.assertIn("VPC003", rule_ids)
        vpc003_finding = next(f for f in findings if f["rule_id"] == "VPC003")
        self.assertEqual(vpc003_finding["resource"], "subnet-public111")
        self.assertEqual(vpc003_finding["severity"], "High")

    # Test 7: NACL rule allowing inbound traffic from 0.0.0.0/0 on sensitive port -> expect VPC004
    def test_vpc004_nacl_sensitive_port(self):
        vpc_data = dict(self.sample_vpc_base)
        vpc_data["nacls"] = [
            {
                "network_acl_id": "acl-bad12345",
                "is_default": False,
                "associations": ["subnet-public111"],
                "entries": [
                    {
                        "RuleNumber": 100,
                        "Protocol": "6",  # TCP
                        "RuleAction": "allow",
                        "Egress": False,  # Inbound
                        "CidrBlock": "0.0.0.0/0",
                        "PortRange": {"From": 22, "To": 22},
                    }
                ],
            }
        ]

        findings = analyze_vpc([vpc_data])
        rule_ids = [f["rule_id"] for f in findings]

        self.assertIn("VPC004", rule_ids)
        vpc004_finding = next(f for f in findings if f["rule_id"] == "VPC004")
        self.assertEqual(vpc004_finding["resource"], "acl-bad12345")
        self.assertEqual(vpc004_finding["severity"], "Critical")

    # Test 8: NACL non-sensitive broad rule -> verify NO false-positive VPC004
    def test_vpc004_nacl_non_sensitive_broad_rule(self):
        vpc_data = dict(self.sample_vpc_base)
        vpc_data["nacls"] = [
            {
                "network_acl_id": "acl-safe12345",
                "is_default": False,
                "associations": ["subnet-private111"],
                "entries": [
                    {
                        "RuleNumber": 100,
                        "Protocol": "6",  # TCP
                        "RuleAction": "allow",
                        "Egress": False,
                        "CidrBlock": "10.0.0.0/8",  # Private CIDR, not 0.0.0.0/0
                        "PortRange": {"From": 22, "To": 22},
                    },
                    {
                        "RuleNumber": 200,
                        "Protocol": "6",
                        "RuleAction": "allow",
                        "Egress": False,
                        "CidrBlock": "0.0.0.0/0",
                        "PortRange": {"From": 80, "To": 80},  # Non-sensitive HTTP port
                    },
                ],
            }
        ]

        findings = analyze_vpc([vpc_data])
        rule_ids = [f["rule_id"] for f in findings]

        self.assertNotIn("VPC004", rule_ids)

    # Test 9: Regression test existing baseline scanners alongside VPC
    @patch("engine.scan_engine.list_iam_users")
    @patch("engine.scan_engine.discover_s3")
    @patch("engine.scan_engine.discover_ec2")
    @patch("engine.scan_engine.discover_security_groups")
    @patch("engine.scan_engine.discover_cloudtrail")
    @patch("engine.scan_engine.discover_password_policy")
    @patch("engine.scan_engine.discover_vpc")
    def test_regression_all_active_scanners(
        self,
        mock_vpc,
        mock_pp,
        mock_ct,
        mock_sg,
        mock_ec2,
        mock_s3,
        mock_iam,
    ):
        mock_iam.return_value = {"service": "IAM", "users": [], "findings": []}
        mock_s3.return_value = {"service": "S3", "buckets": [], "findings": []}
        mock_ec2.return_value = {"service": "EC2", "instances": [], "findings": []}
        mock_sg.return_value = {"service": "SecurityGroups", "security_groups": [], "findings": []}
        mock_ct.return_value = {"service": "CloudTrail", "trails": [], "findings": []}
        mock_pp.return_value = {"service": "PasswordPolicy", "policy": {}, "findings": []}
        mock_vpc.return_value = {"service": "VPC", "resources": [self.sample_vpc_base], "findings": []}

        scan_output = run_full_scan()

        self.assertIn("services", scan_output)
        self.assertIn("findings", scan_output)
        self.assertIn("attack_paths", scan_output)
        self.assertIn("recommendations", scan_output)
        self.assertIn("report", scan_output)

        services_scanned = list(scan_output["services"].keys())
        expected_services = [
            "iam",
            "s3",
            "ec2",
            "security_groups",
            "cloudtrail",
            "password_policy",
            "vpc",
        ]
        self.assertEqual(sorted(services_scanned), sorted(expected_services))


if __name__ == "__main__":
    unittest.main()
