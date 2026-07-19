from database import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    google_id = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    name = db.Column(db.String(150), nullable=True)
    picture = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    accounts = db.relationship(
        "AWSAccount", backref="user", cascade="all, delete-orphan"
    )


class AWSAccount(db.Model):
    __tablename__ = "aws_accounts"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    account_name = db.Column(db.String(150), nullable=True)
    aws_account_id = db.Column(db.String(50), nullable=False)
    region = db.Column(db.String(50), nullable=False)
    credential_type = db.Column(db.String(50), nullable=False)
    credential_reference = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    scans = db.relationship("Scan", backref="aws_account", cascade="all, delete-orphan")


class Scan(db.Model):
    __tablename__ = "scans"
    id = db.Column(db.Integer, primary_key=True)
    aws_account_id = db.Column(
        db.Integer, db.ForeignKey("aws_accounts.id"), nullable=False
    )
    status = db.Column(db.String(50), default="Pending", nullable=False)
    started_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    completed_at = db.Column(db.DateTime, nullable=True)
    duration = db.Column(db.Float, default=0.0, nullable=False)

    # Relationships
    findings = db.relationship(
        "FindingModel", backref="scan", cascade="all, delete-orphan"
    )
    attack_paths = db.relationship(
        "AttackPathModel", backref="scan", cascade="all, delete-orphan"
    )
    recommendations = db.relationship(
        "RecommendationModel", backref="scan", cascade="all, delete-orphan"
    )
    jobs = db.relationship("ScanJob", backref="scan", cascade="all, delete-orphan")


class ScanJob(db.Model):
    __tablename__ = "scan_jobs"
    id = db.Column(db.Integer, primary_key=True)
    scan_id = db.Column(db.Integer, db.ForeignKey("scans.id"), nullable=True)
    status = db.Column(db.String(50), default="Queued", nullable=False)
    progress = db.Column(db.Integer, default=0, nullable=False)  # 0 to 100
    queued_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    started_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    error_message = db.Column(db.Text, nullable=True)


class FindingModel(db.Model):
    __tablename__ = "findings"
    id = db.Column(db.Integer, primary_key=True)
    scan_id = db.Column(db.Integer, db.ForeignKey("scans.id"), nullable=False)
    rule_id = db.Column(db.String(50), nullable=False)
    service = db.Column(db.String(100), nullable=False)
    resource = db.Column(db.String(255), nullable=False)
    severity = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    recommendation = db.Column(db.Text, nullable=False)
    business_impact = db.Column(db.Text, nullable=False)
    evidence = db.Column(db.JSON, nullable=True)
    confidence = db.Column(db.Integer, default=100)
    exploitability = db.Column(db.Integer, default=0)
    auto_fix = db.Column(db.Boolean, default=False)
    correlation_tags = db.Column(db.JSON, nullable=True)
    references = db.Column(db.JSON, nullable=True)


class AttackPathModel(db.Model):
    __tablename__ = "attack_paths"
    id = db.Column(db.Integer, primary_key=True)
    scan_id = db.Column(db.Integer, db.ForeignKey("scans.id"), nullable=False)
    attack_id = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    risk = db.Column(db.String(50), nullable=False)
    likelihood = db.Column(db.String(50), nullable=False)
    impact = db.Column(db.String(50), nullable=False)
    related_findings = db.Column(db.JSON, nullable=True)
    affected_resources = db.Column(db.JSON, nullable=True)
    attack_steps = db.Column(db.JSON, nullable=True)
    mitigation = db.Column(db.Text, nullable=False)
    references = db.Column(db.JSON, nullable=True)


class RecommendationModel(db.Model):
    __tablename__ = "recommendations"
    id = db.Column(db.Integer, primary_key=True)
    scan_id = db.Column(db.Integer, db.ForeignKey("scans.id"), nullable=False)
    recommendation_id = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    priority = db.Column(db.String(50), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    business_impact = db.Column(db.Text, nullable=False)
    affected_resources = db.Column(db.JSON, nullable=True)
    related_findings = db.Column(db.JSON, nullable=True)
    related_attack_paths = db.Column(db.JSON, nullable=True)
    implementation_steps = db.Column(db.JSON, nullable=True)
    estimated_effort = db.Column(db.String(50), nullable=False)
    expected_risk_reduction = db.Column(db.String(50), nullable=False)
    references = db.Column(db.JSON, nullable=True)
    auto_fix_supported = db.Column(db.Boolean, default=False)
