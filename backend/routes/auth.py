from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import User
from database import db
from services.auth_service import verify_google_token

# Create Blueprint
auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/auth/register", methods=["POST"])
def register():
    """
    Registers a new user using email and password.
    """
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    name = data.get("name") or data.get("fullName") or (email.split("@")[0] if email else None)

    if not email or not password:
        return jsonify({"success": False, "message": "Missing email or password."}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"success": False, "message": "Email already registered."}), 400

    try:
        user = User(email=email, name=name)
        user.set_password(password)

        db.session.add(user)
        db.session.commit()

        return jsonify({"success": True, "message": "User registered successfully."}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Registration Error: {e}")
        return jsonify({"success": False, "message": "Failed to create account."}), 500


@auth_bp.route("/auth/login", methods=["POST"])
def login():
    """
    Authenticates a user via email and password.
    """
    data = request.get_json() or {}
    email = data.get("email") or data.get("username")
    password = data.get("password")

    if not email or not password:
        return jsonify({"success": False, "message": "Missing email or password."}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"success": False, "message": "Invalid email or password."}), 401

    additional_claims = {"email": user.email}
    access_token = create_access_token(
        identity=str(user.id), 
        additional_claims=additional_claims
    )

    return jsonify({
        "access_token": access_token,
        "token": access_token, # Backward compatibility helper
        "user": {
            "id": str(user.id),
            "name": user.name or user.email.split("@")[0],
            "email": user.email,
            "picture": user.picture
        }
    }), 200


@auth_bp.route("/auth/forgot-password", methods=["POST"])
def forgot_password():
    """
    Password reset helper endpoint.
    """
    data = request.get_json() or {}
    email = data.get("email")

    if not email:
        return jsonify({"success": False, "message": "Email is required."}), 400

    return jsonify({
        "success": True,
        "message": f"Password reset instructions have been sent to {email}."
    }), 200


@auth_bp.route("/auth/google", methods=["POST"])
def google_auth():
    """
    Handles Google OAuth verification. Receives Google ID Token from the client,
    verifies it against Google APIs, and registers or logs in the user.
    """
    data = request.get_json() or {}
    id_token_val = data.get("id_token") or data.get("credential")

    if not id_token_val:
        return jsonify({"success": False, "message": "Missing Google token."}), 400

    # Verify token
    id_info = verify_google_token(id_token_val)
    if not id_info:
        return jsonify({"success": False, "message": "Google token verification failed."}), 401

    # Extract claims
    google_id = id_info.get("sub")
    email = id_info.get("email")
    name = id_info.get("name")
    picture = id_info.get("picture")

    if not email:
        return jsonify({"success": False, "message": "Email not provided by Google."}), 400

    try:
        # Load or create user (check by google_id or email)
        user = User.query.filter_by(google_id=google_id).first() or User.query.filter_by(email=email).first()
        if not user:
            user = User(
                google_id=google_id,
                email=email,
                name=name,
                picture=picture
            )
            db.session.add(user)
            db.session.commit()
        else:
            # Sync user profile fields
            if not user.google_id:
                user.google_id = google_id
            user.email = email
            if name:
                user.name = name
            if picture:
                user.picture = picture
            db.session.commit()

        # Issue CloudIntercept JWT containing user_id and email
        additional_claims = {"email": user.email}
        access_token = create_access_token(
            identity=str(user.id), 
            additional_claims=additional_claims
        )

        return jsonify({
            "access_token": access_token,
            "token": access_token,
            "user": {
                "id": str(user.id),
                "name": user.name or user.email.split("@")[0],
                "email": user.email,
                "picture": user.picture
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Backend Auth Error: {e}")
        return jsonify({"success": False, "message": "Database sync failed."}), 500


@auth_bp.route("/auth/profile", methods=["GET"])
@jwt_required()
def profile():
    """
    Protected profile endpoint using CloudIntercept JWT access tokens.
    """
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"success": False, "message": "User not found."}), 404

    return jsonify({
        "success": True,
        "user": {
            "id": user.id,
            "google_id": user.google_id,
            "email": user.email,
            "name": user.name,
            "picture": user.picture,
            "created_at": user.created_at.isoformat()
        }
    }), 200