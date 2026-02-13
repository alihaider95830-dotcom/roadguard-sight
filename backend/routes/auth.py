from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, Operator, AuditLog
from datetime import datetime, timezone

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    operator = Operator.query.filter_by(email=email).first()

    if not operator:
        return jsonify({"error": "User not found"}), 401

    if not operator.check_password(password):
        return jsonify({"error": "Invalid password"}), 401

    if not operator.enabled:
        return jsonify({"error": "Account is disabled"}), 403

    access_token = create_access_token(identity=str(operator.operator_id))

    # Log the login
    audit = AuditLog(
        timestamp=datetime.now(timezone.utc),
        user_id=operator.operator_id,
        user_name=operator.name,
        action="USER_LOGIN",
        details=f"Logged in from {request.remote_addr}",
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"token": access_token, "user": operator.to_dict()}), 200


@auth_bp.route("/api/auth/me", methods=["GET"])
@jwt_required()
def get_current_user():
    user_id = int(get_jwt_identity())
    operator = Operator.query.get(user_id)
    if not operator:
        return jsonify({"error": "User not found"}), 404
    return jsonify(operator.to_dict()), 200


@auth_bp.route("/api/auth/logout", methods=["POST"])
@jwt_required()
def logout():
    user_id = int(get_jwt_identity())
    operator = Operator.query.get(user_id)
    if operator:
        audit = AuditLog(
            timestamp=datetime.now(timezone.utc),
            user_id=operator.operator_id,
            user_name=operator.name,
            action="USER_LOGOUT",
            details="Logged out",
        )
        db.session.add(audit)
        db.session.commit()
    return jsonify({"message": "Logged out"}), 200
