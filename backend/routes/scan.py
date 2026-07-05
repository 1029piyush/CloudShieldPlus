from flask import Blueprint, jsonify

from scanners.iam_scanner import list_iam_users

scan_bp = Blueprint("scan", __name__)


@scan_bp.route("/scan/iam", methods=["GET"])
def scan_iam():

    result = list_iam_users()

    return jsonify(result)