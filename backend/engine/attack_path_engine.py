"""Deterministic correlation of normalized findings into attack paths.

This module intentionally has no AWS SDK imports or service calls. It only
correlates findings supplied by the rule engine or finding aggregator.
"""

from collections.abc import Mapping

from engine.attack_rules import ATTACK_RULES


class AttackContext:
    """Read-only indexes over finding dictionaries or Finding dataclasses."""

    def __init__(self, findings):
        self.findings = list(findings or [])
        self.by_rule_id = {}
        self.by_correlation_tag = {}

        for finding in self.findings:
            rule_id = self._value(finding, "rule_id")
            if rule_id:
                self.by_rule_id.setdefault(rule_id, []).append(finding)

            for tag in self._value(finding, "correlation_tags", []) or []:
                self.by_correlation_tag.setdefault(tag, []).append(finding)

    @staticmethod
    def _value(finding, name, default=None):
        if isinstance(finding, Mapping):
            return finding.get(name, default)
        return getattr(finding, name, default)

    def has(self, rule_id):
        return rule_id in self.by_rule_id

    def has_any(self, rule_ids):
        return any(self.has(rule_id) for rule_id in rule_ids)

    def has_tag(self, tag):
        """Reserved for future tag-driven attack rules."""
        return tag in self.by_correlation_tag

    def related(self, rule_ids):
        """Return present rule IDs in a stable order for attack-path evidence."""
        return [rule_id for rule_id in rule_ids if self.has(rule_id)]


def analyze_attack_paths(findings):
    """Return AttackPath objects created by the registered deterministic rules."""
    context = AttackContext(findings)
    paths = []

    for rule in ATTACK_RULES:
        attack_path = rule(context)
        if attack_path:
            paths.append(attack_path)

    return paths
