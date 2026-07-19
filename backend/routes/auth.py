from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import User
from database import db

# Create Blueprint
auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/auth/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"success": False, "message": "Missing required fields."}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"success": False, "message": "Username already exists."}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"success": False, "message": "Email already registered."}), 400

    user = User(username=username, email=email)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    return jsonify(
        {"success": True, "message": "User registered successfully."}
    ), 201


@auth_bp.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"success": False, "message": "Missing required fields."}), 400

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({"success": False, "message": "Invalid username or password."}), 401

    access_token = create_access_token(identity=str(user.id))

    return jsonify(
        {
            "success": True,
            "token": access_token,
            "user": {"id": user.id, "username": user.username, "email": user.email},
        }
    ), 200


@auth_bp.route("/auth/profile", methods=["GET"])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"success": False, "message": "User not found."}), 404

    return jsonify(
        {
            "success": True,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "created_at": user.created_at.isoformat(),
            },
        }
    ), 200


@auth_bp.route("/auth/google", methods=["POST"])
def google_auth():
    data = request.get_json() or {}
    credential = data.get("credential")

    if not credential:
        return jsonify({"success": False, "message": "Missing Google credential."}), 400

    try:
        import jwt
        import uuid

        # Decode the JWT token credential payload without signature validation for local/simulated OAuth
        payload = jwt.decode(credential, options={"verify_signature": False})

        email = payload.get("email")
        name = payload.get("name") or payload.get("given_name") or "Google User"

        if not email:
            return jsonify({"success": False, "message": "Email not found in Google token."}), 400

        # Check if user exists or auto-provision
        user = User.query.filter_by(email=email).first()
        if not user:
            # Auto-provision
            user = User(
                username=email.split("@")[0] + "_" + str(uuid.uuid4())[:4],
                email=email
            )
            user.set_password(str(uuid.uuid4()))
            db.session.add(user)
            db.session.commit()

        access_token = create_access_token(identity=str(user.id))

        return jsonify(
            {
                "success": True,
                "token": access_token,
                "user": {"id": user.id, "username": user.username, "email": user.email},
            }
        ), 200

    except Exception as e:
        return jsonify({"success": False, "message": "Google auth failed: " + str(e)}), 400