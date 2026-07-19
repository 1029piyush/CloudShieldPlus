from dataclasses import dataclass, field, asdict


@dataclass
class Recommendation:
    """Prioritized remediation guidance backed by findings and attack paths."""

    recommendation_id: str
    title: str
    description: str
    priority: str
    category: str
    business_impact: str
    affected_resources: list
    related_findings: list
    related_attack_paths: list
    implementation_steps: list
    estimated_effort: str
    expected_risk_reduction: str
    references: list = field(default_factory=list)
    auto_fix_supported: bool = False

    def to_dict(self):
        return asdict(self)
