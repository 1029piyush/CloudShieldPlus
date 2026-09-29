from engine.findings import Finding
from engine.rules.severity import severity_for_rule


def _finding(rule_id, db, title, description, recommendation,
             business_impact, evidence, exploitability, correlation_tags):
    return Finding(
        rule_id=rule_id,
        service="RDS",
        resource=db["db_instance_id"],
        severity=severity_for_rule(rule_id),
        title=title,
        description=description,
        recommendation=recommendation,
        business_impact=business_impact,
        evidence=evidence,
        exploitability=exploitability,
        correlation_tags=correlation_tags,
    ).to_dict()


def rds001(db):
    if not db.get("publicly_accessible", False):
        return None
    return _finding(
        "RDS001", db,
        "Publicly Accessible Database Instance",
        f"RDS instance '{db['db_instance_id']}' is configured to accept public connections directly from the internet.",
        "Modify the database instance to set PubliclyAccessible to False and place it inside a private subnet.",
        "Unauthenticated attackers on the internet can attempt brute-force or exploit database vulnerabilities to exfiltrate data.",
        [f"DB Instance: {db['db_instance_id']}", "PubliclyAccessible: True", f"Endpoint: {db.get('endpoint_address')}"],
        9,
        ["public_exposure", "database", "data_exposure"],
    )


def rds002(db):
    if db.get("storage_encrypted", False):
        return None
    return _finding(
        "RDS002", db,
        "RDS Storage Encryption Disabled",
        f"RDS instance '{db['db_instance_id']}' does not have storage encryption enabled.",
        "Enable storage encryption using AWS KMS keys. Note that encryption must be enabled at instance creation or via snapshot restore.",
        "Data stored on underlying storage volumes, automated backups, and snapshots remain unencrypted at rest.",
        [f"DB Instance: {db['db_instance_id']}", "StorageEncrypted: False"],
        7,
        ["encryption", "data_protection"],
    )


def rds003(db):
    if db.get("deletion_protection", False):
        return None
    return _finding(
        "RDS003", db,
        "RDS Deletion Protection Disabled",
        f"RDS instance '{db['db_instance_id']}' has deletion protection turned off.",
        "Enable deletion protection on production databases to prevent accidental or malicious deletion.",
        "An attacker or misconfigured script with delete permissions can permanently destroy the database instance.",
        [f"DB Instance: {db['db_instance_id']}", "DeletionProtection: False"],
        5,
        ["data_resilience", "destructive_action"],
    )


def rds004(db):
    if db.get("backup_retention_period", 0) > 0:
        return None
    return _finding(
        "RDS004", db,
        "RDS Automated Backups Disabled",
        f"RDS instance '{db['db_instance_id']}' has a backup retention period of 0 days.",
        "Set backup retention period to at least 7 days to ensure point-in-time recovery capability.",
        "Database corruption or ransomware attack cannot be recovered using automated snapshots.",
        [f"DB Instance: {db['db_instance_id']}", "BackupRetentionPeriod: 0"],
        6,
        ["data_resilience", "backup"],
    )


RULES = [rds001, rds002, rds003, rds004]


def analyze_rds(resources):
    findings = []
    for db in resources:
        for rule in RULES:
            res = rule(db)
            if res:
                findings.append(res)
    return findings
