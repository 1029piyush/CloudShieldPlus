"""Build a CSPM report from completed scan, attack-path, and remediation data."""

from collections import Counter
from collections.abc import Mapping


RISK_ORDER = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}


def _value(item, name, default=None):
    if isinstance(item, Mapping):
        return item.get(name, default)
    return getattr(item, name, default)


def _serialize(item):
    return item.to_dict() if hasattr(item, "to_dict") else item


def build_report(services, findings, attack_paths, recommendations):
    """Return a presentation-ready report without collecting additional AWS data."""
    severity_counts = Counter(
        _value(finding, "severity", "Unknown")
        for finding in findings
    )
    ranked_paths = sorted(
        attack_paths,
        key=lambda path: RISK_ORDER.get(_value(path, "risk"), 0),
        reverse=True,
    )

    return {
        "executive_summary": {
            "services_scanned": len(services),
            "total_findings": len(findings),
            "findings_by_severity": dict(severity_counts),
            "attack_paths_identified": len(attack_paths),
            "recommendations_available": len(recommendations),
        },
        "security_findings": [_serialize(finding) for finding in findings],
        "attack_paths": [_serialize(path) for path in attack_paths],
        "top_risks": [_serialize(path) for path in ranked_paths[:5]],
        "recommendations": [_serialize(recommendation) for recommendation in recommendations],
    }
