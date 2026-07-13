import json


def is_administrator_policy(policy_document):

    statements = policy_document.get("Statement", [])

    if not isinstance(statements, list):
        statements = [statements]

    for statement in statements:

        actions = statement.get("Action", [])
        resources = statement.get("Resource", [])

        if isinstance(actions, str):
            actions = [actions]

        if isinstance(resources, str):
            resources = [resources]

        if "*" in actions and "*" in resources:
            return True

    return False


def has_wildcard_action(policy_document):

    statements = policy_document.get("Statement", [])

    if not isinstance(statements, list):
        statements = [statements]

    for statement in statements:

        actions = statement.get("Action", [])

        if isinstance(actions, str):
            actions = [actions]

        if "*" in actions:
            return True

    return False


def has_wildcard_resource(policy_document):

    statements = policy_document.get("Statement", [])

    if not isinstance(statements, list):
        statements = [statements]

    for statement in statements:

        resources = statement.get("Resource", [])

        if isinstance(resources, str):
            resources = [resources]

        if "*" in resources:
            return True

    return False


def has_full_iam_access(policy_document):

    statements = policy_document.get("Statement", [])

    if not isinstance(statements, list):
        statements = [statements]

    for statement in statements:

        actions = statement.get("Action", [])

        if isinstance(actions, str):
            actions = [actions]

        for action in actions:

            if action in ["iam:*", "*"]:
                return True

    return False


def get_allow_statements(policy_document):

    statements = policy_document.get("Statement", [])

    if not isinstance(statements, list):
        statements = [statements]

    return [

        statement

        for statement in statements

        if statement.get("Effect") == "Allow"

    ]

def get_statements(policy_document):

    statements = policy_document.get("Statement", [])

    if isinstance(statements, dict):
        statements = [statements]

    return statements


def has_wildcard_action(policy_document):

    for statement in get_statements(policy_document):

        actions = statement.get("Action", [])

        if isinstance(actions, str):
            actions = [actions]

        if "*" in actions:
            return True

    return False


def has_wildcard_resource(policy_document):

    for statement in get_statements(policy_document):

        resources = statement.get("Resource", [])

        if isinstance(resources, str):
            resources = [resources]

        if "*" in resources:
            return True

    return False


def has_full_admin(policy_document):

    for statement in get_statements(policy_document):

        actions = statement.get("Action", [])
        resources = statement.get("Resource", [])

        if isinstance(actions, str):
            actions = [actions]

        if isinstance(resources, str):
            resources = [resources]

        if "*" in actions and "*" in resources:
            return True

    return False


def get_dangerous_actions(policy_document):

    dangerous = {

        "iam:*",
        "sts:AssumeRole",
        "iam:PassRole",
        "iam:CreateUser",
        "iam:CreateAccessKey",
        "iam:AttachUserPolicy",
        "iam:PutUserPolicy",
        "iam:AttachRolePolicy",
        "kms:Decrypt",
        "organizations:*"

    }

    found = []

    for statement in get_statements(policy_document):

        actions = statement.get("Action", [])

        if isinstance(actions, str):
            actions = [actions]

        for action in actions:

            if action in dangerous:

                found.append(action)

    return list(set(found))


def allows_all_resources(policy_document):

    return has_wildcard_resource(policy_document)


def allows_all_actions(policy_document):

    return has_wildcard_action(policy_document)