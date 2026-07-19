from collections.abc import Mapping


def value(item, name, default=None):
    """Retrieve a value from a mapping or object attribute."""
    if isinstance(item, Mapping):
        return item.get(name, default)
    return getattr(item, name, default)


def get_rule_ids(findings):
    """Extract unique rule IDs from findings."""
    return {
        value(finding, "rule_id")
        for finding in findings
        if value(finding, "rule_id")
    }


def get_attack_ids(attack_paths):
    """Extract unique attack IDs from attack paths."""
    return {
        value(path, "attack_id")
        for path in attack_paths
        if value(path, "attack_id")
    }


def related_findings(findings, required_rule_ids):
    """Return finding rule IDs that are present."""
    present_rule_ids = get_rule_ids(findings)
    return [rule_id for rule_id in required_rule_ids if rule_id in present_rule_ids]


def related_attack_paths(attack_paths, required_attack_ids):
    """Return attack path IDs that are present."""
    present_attack_ids = get_attack_ids(attack_paths)
    return [attack_id for attack_id in required_attack_ids if attack_id in present_attack_ids]


def affected_resources(findings, required_rule_ids):
    """Collect deduplicated resources affected by findings with the required rule IDs."""
    resources = []
    for finding in findings:
        rule_id = value(finding, "rule_id")
        if rule_id in required_rule_ids:
            res = value(finding, "resource")
            if res and res not in resources:
                resources.append(res)
    return resources


def unique(list_data):
    """Deduplicate elements in a list while preserving order."""
    seen = set()
    result = []
    for item in list_data:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result
