"""Run deterministic attack-path rules against normalized findings.

This module has no AWS SDK dependency. Discovery and rule evaluation are
completed before findings reach this engine.
"""

from engine.attack_rules import ATTACK_RULES


def analyze_attack_paths(findings):
    """Return AttackPath objects produced by each registered attack rule."""
    attack_paths = []

    for rule in ATTACK_RULES:
        attack_path = rule(findings)

        if attack_path:
            attack_paths.append(attack_path)

    return attack_paths
