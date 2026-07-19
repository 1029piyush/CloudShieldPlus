from dataclasses import dataclass, field, asdict


@dataclass
class AttackPath:
    """A deterministic, evidence-backed attacker objective."""

    attack_id: str
    title: str
    description: str
    risk: str
    likelihood: str
    impact: str
    related_findings: list
    affected_resources: list
    attack_steps: list
    mitigation: str
    references: list = field(default_factory=list)

    def to_dict(self):
        return asdict(self)
