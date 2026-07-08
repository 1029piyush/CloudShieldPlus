from scanners.iam_scanner import list_iam_users


def run_full_scan():

    results = {
        "iam": list_iam_users()
    }

    return results