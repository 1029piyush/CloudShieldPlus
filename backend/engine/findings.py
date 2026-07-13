from dataclasses import dataclass, field, asdict


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

    # New fields

    evidence: list = field(default_factory=list)

    confidence: int = 100

    exploitability: int = 0

    auto_fix: bool = False

    correlation_tags: list = field(default_factory=list)

    references: list = field(default_factory=list)

    def to_dict(self):

        return asdict(self)