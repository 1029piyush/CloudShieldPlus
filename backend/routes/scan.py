from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from database import db
from models import (
    AWSAccount,
    Scan,
    ScanJob,
    FindingModel,
    AttackPathModel,
    RecommendationModel,
)
from services.credential_service import encrypt_credentials, decrypt_credentials

scan_bp = Blueprint("scan", __name__)


# ============================================================
# AWS Account Management
# ============================================================


@scan_bp.route("/aws-accounts", methods=["GET"])
@jwt_required()
def get_aws_accounts():
    user_id = int(get_jwt_identity())
    accounts = AWSAccount.query.filter_by(user_id=user_id).all()
    results = []
    for acc in accounts:
        latest = Scan.query.filter_by(aws_account_id=acc.id).order_by(Scan.started_at.desc()).first()
        results.append({
            "id": acc.id,
            "account_name": acc.account_name,
            "aws_account_id": acc.aws_account_id,
            "region": acc.region,
            "credential_type": acc.credential_type,
            "created_at": acc.created_at.isoformat(),
            "last_scan_time": latest.started_at.isoformat() if latest else None,
            "last_scan_status": latest.status if latest else "Never Scanned"
        })
    return (
        jsonify(
            {
                "success": True,
                "accounts": results,
            }
        ),
        200,
    )


@scan_bp.route("/aws-accounts", methods=["POST"])
@jwt_required()
def add_aws_account():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    account_name = data.get("account_name")
    access_key = data.get("access_key")
    secret_key = data.get("secret_key")
    region = data.get("region")

    if not access_key or not secret_key or not region:
        return jsonify({"success": False, "message": "Missing AWS credentials."}), 400

    # Validate AWS credentials by attempting a session connection
    from services.aws_session import connect_to_aws

    validation_result = connect_to_aws(access_key, secret_key, region)
    if not validation_result["success"]:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Invalid credentials: "
                    + validation_result.get("error", "Unknown connection error"),
                }
            ),
            400,
        )

    aws_account_id = validation_result["account_id"]

    # Encrypt credentials securely using Fernet service
    cred_type, cred_ref = encrypt_credentials(access_key, secret_key)

    account = AWSAccount(
        user_id=user_id,
        account_name=account_name or f"AWS Account {aws_account_id[-4:]}",
        aws_account_id=aws_account_id,
        region=region,
        credential_type=cred_type,
        credential_reference=cred_ref,
    )

    db.session.add(account)
    db.session.commit()

    return (
        jsonify(
            {
                "success": True,
                "message": "AWS account connected successfully.",
                "account": {
                    "id": account.id,
                    "account_name": account.account_name,
                    "aws_account_id": account.aws_account_id,
                    "region": account.region,
                    "created_at": account.created_at.isoformat(),
                },
            }
        ),
        201,
    )


@scan_bp.route("/aws-accounts/<int:account_id>", methods=["DELETE"])
@jwt_required()
def delete_aws_account(account_id):
    user_id = int(get_jwt_identity())
    account = AWSAccount.query.filter_by(id=account_id, user_id=user_id).first()

    if not account:
        return jsonify({"success": False, "message": "AWS account not found."}), 404

    db.session.delete(account)
    db.session.commit()

    return (
        jsonify({"success": True, "message": "AWS account disconnected successfully."}),
        200,
    )


# ============================================================
# Scanning Execution & History
# ============================================================


@scan_bp.route("/scans", methods=["POST"])
@jwt_required()
def start_scan():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    aws_account_id = data.get("aws_account_id")

    if not aws_account_id:
        return jsonify({"success": False, "message": "Missing aws_account_id."}), 400

    account = AWSAccount.query.filter_by(id=aws_account_id, user_id=user_id).first()
    if not account:
        return (
            jsonify(
                {"success": False, "message": "AWS account not found or access denied."}
            ),
            404,
        )

    # Initialize Scan and ScanJob snapshots
    scan = Scan(
        aws_account_id=account.id, status="Running", started_at=datetime.utcnow()
    )
    db.session.add(scan)
    db.session.commit()

    job = ScanJob(
        scan_id=scan.id, status="Running", progress=10, started_at=datetime.utcnow()
    )
    db.session.add(job)
    db.session.commit()

    try:
        # Decrypt Credentials
        access_key, secret_key = decrypt_credentials(
            account.credential_type, account.credential_reference
        )

        # Create AWS Session
        job.progress = 20
        db.session.commit()

        from services.aws_session import connect_to_aws

        session_result = connect_to_aws(access_key, secret_key, account.region)
        if not session_result["success"]:
            raise Exception(
                "AWS connection failed: " + session_result.get("error", "Unknown error")
            )

        # Run Discovery Engine
        job.progress = 40
        db.session.commit()

        from scanners.iam_scanner import list_iam_users
        from scanners.s3_scanner import discover_s3
        from scanners.ec2_scanner import discover_ec2
        from scanners.security_group_scanner import discover_security_groups
        from scanners.cloudtrail_scanner import discover_cloudtrail
        from scanners.password_policy_scanner import discover_password_policy

        services_results = {
            "iam": list_iam_users(),
            "s3": discover_s3(),
            "ec2": discover_ec2(),
            "security_groups": discover_security_groups(),
            "cloudtrail": discover_cloudtrail(),
            "password_policy": discover_password_policy(),
        }

        # Run Rule Engine
        job.progress = 60
        db.session.commit()

        from engine.finding_aggregator import aggregate_findings

        findings = aggregate_findings(services_results)

        # Run Attack Path Engine
        job.progress = 80
        db.session.commit()

        from engine.attack_path_engine import analyze_attack_paths

        attack_paths = analyze_attack_paths(findings)

        # Run Recommendation Engine
        job.progress = 95
        db.session.commit()

        from engine.recommendation_engine import generate_recommendations

        recommendations = generate_recommendations(findings, attack_paths)

        # Persist Snapshots to Database
        for f in findings:
            finding_db = FindingModel(
                scan_id=scan.id,
                rule_id=f.get("rule_id"),
                service=f.get("service"),
                resource=f.get("resource"),
                severity=f.get("severity"),
                title=f.get("title"),
                description=f.get("description"),
                recommendation=f.get("recommendation"),
                business_impact=f.get("business_impact"),
                evidence=f.get("evidence"),
                confidence=f.get("confidence", 100),
                exploitability=f.get("exploitability", 0),
                auto_fix=f.get("auto_fix", False),
                correlation_tags=f.get("correlation_tags"),
                references=f.get("references"),
            )
            db.session.add(finding_db)

        for ap in attack_paths:
            ap_dict = ap.to_dict()
            ap_db = AttackPathModel(
                scan_id=scan.id,
                attack_id=ap_dict.get("attack_id"),
                title=ap_dict.get("title"),
                description=ap_dict.get("description"),
                risk=ap_dict.get("risk"),
                likelihood=ap_dict.get("likelihood"),
                impact=ap_dict.get("impact"),
                related_findings=ap_dict.get("related_findings"),
                affected_resources=ap_dict.get("affected_resources"),
                attack_steps=ap_dict.get("attack_steps"),
                mitigation=ap_dict.get("mitigation"),
                references=ap_dict.get("references"),
            )
            db.session.add(ap_db)

        for rec in recommendations:
            rec_dict = rec.to_dict()
            rec_db = RecommendationModel(
                scan_id=scan.id,
                recommendation_id=rec_dict.get("recommendation_id"),
                title=rec_dict.get("title"),
                description=rec_dict.get("description"),
                priority=rec_dict.get("priority"),
                category=rec_dict.get("category"),
                business_impact=rec_dict.get("business_impact"),
                affected_resources=rec_dict.get("affected_resources"),
                related_findings=rec_dict.get("related_findings"),
                related_attack_paths=rec_dict.get("related_attack_paths"),
                implementation_steps=rec_dict.get("implementation_steps"),
                estimated_effort=rec_dict.get("estimated_effort"),
                expected_risk_reduction=rec_dict.get("expected_risk_reduction"),
                references=rec_dict.get("references"),
                auto_fix_supported=rec_dict.get("auto_fix_supported", False),
            )
            db.session.add(rec_db)

        # Complete Scan
        completed_at = datetime.utcnow()
        duration = (completed_at - scan.started_at).total_seconds()

        scan.status = "Completed"
        scan.completed_at = completed_at
        scan.duration = duration

        job.status = "Completed"
        job.progress = 100
        job.completed_at = completed_at

        db.session.commit()

        return (
            jsonify(
                {
                    "success": True,
                    "scan_id": scan.id,
                    "message": "Scan completed and stored successfully.",
                }
            ),
            201,
        )

    except Exception as e:
        completed_at = datetime.utcnow()

        scan.status = "Failed"
        scan.completed_at = completed_at

        job.status = "Failed"
        job.completed_at = completed_at
        job.error_message = str(e)

        db.session.commit()

        return jsonify({"success": False, "message": "Scan failed: " + str(e)}), 500


@scan_bp.route("/scans", methods=["GET"])
@jwt_required()
def get_scans():
    user_id = int(get_jwt_identity())
    accounts = AWSAccount.query.filter_by(user_id=user_id).all()
    account_ids = [acc.id for acc in accounts]

    if not account_ids:
        return jsonify({"success": True, "scans": []}), 200

    scans = (
        Scan.query.filter(Scan.aws_account_id.in_(account_ids))
        .order_by(Scan.started_at.desc())
        .all()
    )

    return (
        jsonify(
            {
                "success": True,
                "scans": [
                    {
                        "id": s.id,
                        "aws_account_id": s.aws_account_id,
                        "account_name": s.aws_account.account_name,
                        "status": s.status,
                        "started_at": s.started_at.isoformat(),
                        "completed_at": s.completed_at.isoformat()
                        if s.completed_at
                        else None,
                        "duration": s.duration,
                    }
                    for s in scans
                ],
            }
        ),
        200,
    )


@scan_bp.route("/scans/<int:scan_id>", methods=["GET"])
@jwt_required()
def get_scan_details(scan_id):
    user_id = int(get_jwt_identity())
    scan = Scan.query.get(scan_id)

    if not scan or scan.aws_account.user_id != user_id:
        return (
            jsonify({"success": False, "message": "Scan not found or access denied."}),
            404,
        )

    findings = [
        {
            "id": f.id,
            "rule_id": f.rule_id,
            "service": f.service,
            "resource": f.resource,
            "severity": f.severity,
            "title": f.title,
            "description": f.description,
            "recommendation": f.recommendation,
            "business_impact": f.business_impact,
            "evidence": f.evidence,
            "confidence": f.confidence,
            "exploitability": f.exploitability,
            "auto_fix": f.auto_fix,
            "correlation_tags": f.correlation_tags,
            "references": f.references,
        }
        for f in scan.findings
    ]

    attack_paths = [
        {
            "id": ap.id,
            "attack_id": ap.attack_id,
            "title": ap.title,
            "description": ap.description,
            "risk": ap.risk,
            "likelihood": ap.likelihood,
            "impact": ap.impact,
            "related_findings": ap.related_findings,
            "affected_resources": ap.affected_resources,
            "attack_steps": ap.attack_steps,
            "mitigation": ap.mitigation,
            "references": ap.references,
        }
        for ap in scan.attack_paths
    ]

    recommendations = [
        {
            "id": r.id,
            "recommendation_id": r.recommendation_id,
            "title": r.title,
            "description": r.description,
            "priority": r.priority,
            "category": r.category,
            "business_impact": r.business_impact,
            "affected_resources": r.affected_resources,
            "related_findings": r.related_findings,
            "related_attack_paths": r.related_attack_paths,
            "implementation_steps": r.implementation_steps,
            "estimated_effort": r.estimated_effort,
            "expected_risk_reduction": r.expected_risk_reduction,
            "references": r.references,
            "auto_fix_supported": r.auto_fix_supported,
        }
        for r in scan.recommendations
    ]

    return (
        jsonify(
            {
                "success": True,
                "scan": {
                    "id": scan.id,
                    "aws_account_id": scan.aws_account_id,
                    "account_name": scan.aws_account.account_name,
                    "status": scan.status,
                    "started_at": scan.started_at.isoformat(),
                    "completed_at": scan.completed_at.isoformat()
                    if scan.completed_at
                    else None,
                    "duration": scan.duration,
                    "findings": findings,
                    "attack_paths": attack_paths,
                    "recommendations": recommendations,
                },
            }
        ),
        200,
    )


# ============================================================
# Dashboard & Core Asset Retrival APIs
# ============================================================


def get_latest_scan(user_id, aws_account_id=None):
    query = AWSAccount.query.filter_by(user_id=user_id)
    if aws_account_id:
        query = query.filter_by(id=aws_account_id)
    accounts = query.all()
    if not accounts:
        return None

    account_ids = [acc.id for acc in accounts]
    latest_scan = (
        Scan.query.filter(
            Scan.aws_account_id.in_(account_ids), Scan.status == "Completed"
        )
        .order_by(Scan.started_at.desc())
        .first()
    )
    return latest_scan


@scan_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def get_dashboard():
    user_id = int(get_jwt_identity())
    aws_account_id = request.args.get("aws_account_id")

    latest_scan = get_latest_scan(user_id, aws_account_id)

    # Fetch scan history for authenticated user's accounts
    accounts = AWSAccount.query.filter_by(user_id=user_id).all()
    account_ids = [acc.id for acc in accounts]

    history_scans = []
    if account_ids:
        history_scans = (
            Scan.query.filter(
                Scan.aws_account_id.in_(account_ids), Scan.status == "Completed"
            )
            .order_by(Scan.started_at.desc())
            .limit(10)
            .all()
        )

    scan_history = [
        {
            "id": s.id,
            "account_name": s.aws_account.account_name,
            "scan_time": s.started_at.isoformat(),
            "findings_count": len(s.findings),
            "critical_findings": len(
                [f for f in s.findings if f.severity == "Critical"]
            ),
            "attack_paths_count": len(s.attack_paths),
        }
        for s in history_scans
    ]

    if not latest_scan:
        return (
            jsonify(
                {
                    "summary": {
                        "resources": 0,
                        "services": 0,
                        "findings": 0,
                        "critical_findings": 0,
                        "attack_paths": 0,
                        "last_scan": None,
                        "scan_duration": 0.0,
                    },
                    "hero_attack": {},
                    "top_recommendations": [],
                    "services": [],
                    "recent_findings": [],
                    "scan_history": scan_history,
                }
            ),
            200,
        )

    # Compute values from database findings snapshot
    services_set = {f.service for f in latest_scan.findings}
    resources_set = {f.resource for f in latest_scan.findings}

    critical_findings_count = len(
        [f for f in latest_scan.findings if f.severity == "Critical"]
    )
    high_findings_count = len(
        [f for f in latest_scan.findings if f.severity == "High"]
    )

    # Hero attack: Highest severity active attack path
    hero_attack = {}
    if latest_scan.attack_paths:
        sorted_paths = sorted(
            latest_scan.attack_paths,
            key=lambda ap: 1
            if ap.risk == "Low"
            else (
                2
                if ap.risk == "Medium"
                else (3 if ap.risk == "High" else 4)
            ),
            reverse=True,
        )
        ap = sorted_paths[0]
        hero_attack = {
            "id": ap.id,
            "attack_id": ap.attack_id,
            "title": ap.title,
            "description": ap.description,
            "risk": ap.risk,
            "likelihood": ap.likelihood,
            "impact": ap.impact,
            "related_findings": ap.related_findings,
            "affected_resources": ap.affected_resources,
            "attack_steps": ap.attack_steps,
            "mitigation": ap.mitigation,
            "references": ap.references,
        }

    # Top recommendations: Limit to 5
    top_recommendations = [
        {
            "id": r.id,
            "recommendation_id": r.recommendation_id,
            "title": r.title,
            "description": r.description,
            "priority": r.priority,
            "category": r.category,
            "business_impact": r.business_impact,
            "affected_resources": r.affected_resources,
            "related_findings": r.related_findings,
            "related_attack_paths": r.related_attack_paths,
            "implementation_steps": r.implementation_steps,
            "estimated_effort": r.estimated_effort,
            "expected_risk_reduction": r.expected_risk_reduction,
            "references": r.references,
            "auto_fix_supported": r.auto_fix_supported,
        }
        for r in latest_scan.recommendations[:5]
    ]

    # Recent findings: Limit to 5
    recent_findings = [
        {
            "id": f.id,
            "rule_id": f.rule_id,
            "service": f.service,
            "resource": f.resource,
            "severity": f.severity,
            "title": f.title,
            "description": f.description,
            "recommendation": f.recommendation,
            "business_impact": f.business_impact,
            "evidence": f.evidence,
            "confidence": f.confidence,
            "exploitability": f.exploitability,
            "auto_fix": f.auto_fix,
            "correlation_tags": f.correlation_tags,
            "references": f.references,
        }
        for f in latest_scan.findings[:5]
    ]

    return (
        jsonify(
            {
                "summary": {
                    "resources": len(resources_set),
                    "services": len(services_set),
                    "findings": len(latest_scan.findings),
                    "critical_findings": critical_findings_count,
                    "attack_paths": len(latest_scan.attack_paths),
                    "last_scan": latest_scan.started_at.isoformat(),
                    "scan_duration": latest_scan.duration,
                },
                "hero_attack": hero_attack,
                "top_recommendations": top_recommendations,
                "services": sorted(list(services_set)),
                "recent_findings": recent_findings,
                "scan_history": scan_history,
            }
        ),
        200,
    )


@scan_bp.route("/findings", methods=["GET"])
@jwt_required()
def get_findings():
    user_id = int(get_jwt_identity())
    aws_account_id = request.args.get("aws_account_id")

    latest_scan = get_latest_scan(user_id, aws_account_id)
    if not latest_scan:
        return jsonify({"success": True, "findings": []}), 200

    return (
        jsonify(
            {
                "success": True,
                "findings": [
                    {
                        "id": f.id,
                        "rule_id": f.rule_id,
                        "service": f.service,
                        "resource": f.resource,
                        "severity": f.severity,
                        "title": f.title,
                        "description": f.description,
                        "recommendation": f.recommendation,
                        "business_impact": f.business_impact,
                        "evidence": f.evidence,
                        "confidence": f.confidence,
                        "exploitability": f.exploitability,
                        "auto_fix": f.auto_fix,
                        "correlation_tags": f.correlation_tags,
                        "references": f.references,
                    }
                    for f in latest_scan.findings
                ],
            }
        ),
        200,
    )


@scan_bp.route("/attack-paths", methods=["GET"])
@jwt_required()
def get_attack_paths():
    user_id = int(get_jwt_identity())
    aws_account_id = request.args.get("aws_account_id")

    latest_scan = get_latest_scan(user_id, aws_account_id)
    if not latest_scan:
        return jsonify({"success": True, "attack_paths": []}), 200

    return (
        jsonify(
            {
                "success": True,
                "attack_paths": [
                    {
                        "id": ap.id,
                        "attack_id": ap.attack_id,
                        "title": ap.title,
                        "description": ap.description,
                        "risk": ap.risk,
                        "likelihood": ap.likelihood,
                        "impact": ap.impact,
                        "related_findings": ap.related_findings,
                        "affected_resources": ap.affected_resources,
                        "attack_steps": ap.attack_steps,
                        "mitigation": ap.mitigation,
                        "references": ap.references,
                    }
                    for ap in latest_scan.attack_paths
                ],
            }
        ),
        200,
    )


@scan_bp.route("/recommendations", methods=["GET"])
@jwt_required()
def get_recommendations():
    user_id = int(get_jwt_identity())
    aws_account_id = request.args.get("aws_account_id")

    latest_scan = get_latest_scan(user_id, aws_account_id)
    if not latest_scan:
        return jsonify({"success": True, "recommendations": []}), 200

    return (
        jsonify(
            {
                "success": True,
                "recommendations": [
                    {
                        "id": r.id,
                        "recommendation_id": r.recommendation_id,
                        "title": r.title,
                        "description": r.description,
                        "priority": r.priority,
                        "category": r.category,
                        "business_impact": r.business_impact,
                        "affected_resources": r.affected_resources,
                        "related_findings": r.related_findings,
                        "related_attack_paths": r.related_attack_paths,
                        "implementation_steps": r.implementation_steps,
                        "estimated_effort": r.estimated_effort,
                        "expected_risk_reduction": r.expected_risk_reduction,
                        "references": r.references,
                        "auto_fix_supported": r.auto_fix_supported,
                    }
                    for r in latest_scan.recommendations
                ],
            }
        ),
        200,
    )