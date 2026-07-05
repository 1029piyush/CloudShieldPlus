from flask import Blueprint, request, jsonify
from services.aws_session import connect_to_aws

# Create Blueprint
auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/connect", methods=["POST"])
def connect():

    data = request.get_json()

    access_key = data.get("access_key")
    secret_key = data.get("secret_key")
    region = data.get("region")

    # Validate input
    if not access_key or not secret_key or not region:
        return jsonify({
            "success": False,
            "message": "Missing AWS credentials."
        }), 400

    # Connect to AWS
    result = connect_to_aws(
        access_key,
        secret_key,
        region
    )

    # Authentication successful
    if result["success"]:
        return jsonify(result), 200

    # Authentication failed
    return jsonify(result), 401