from dataclasses import dataclass, asdict


@dataclass
class Finding:

    rule_id: str
    service: str
    resource: str
    severity: str
    title: str
    description: str
    recommendation: str
    business_impact: str

    def to_dict(self):
        return asdict(self)