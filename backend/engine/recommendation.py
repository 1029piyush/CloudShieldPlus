from dataclasses import dataclass, field, asdict


@dataclass
class Recommendation:
    """Prioritized remediation guidance backed by findings and attack paths."""

    recommendation_id: str
    title: str
    description: str
    priority: str
    service: str
    related_findings: list
    related_attack_paths: list
    remediation_steps: list
    risk_reduction: str
    automation_guidance: str = ""
    references: list = field(default_factory=list)

    def to_dict(self):
        return asdict(self)
