from dataclasses import dataclass, asdict


@dataclass
class Finding:
    service: str
    resource: str
    severity: str
    title: str
    description: str
    recommendation: str

    def to_dict(self):
        return asdict(self)