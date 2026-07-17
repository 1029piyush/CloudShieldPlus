from dataclasses import dataclass, field


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
    attack_steps: list
    mitigation: str
    references: list = field(default_factory=list)

    def to_dict(self):
        return {
            "attack_id": self.attack_id,
            "title": self.title,
            "description": self.description,
            "risk": self.risk,
            "likelihood": self.likelihood,
            "impact": self.impact,
            "related_findings": self.related_findings,
            "attack_steps": self.attack_steps,
            "mitigation": self.mitigation,
            "references": self.references,
        }
