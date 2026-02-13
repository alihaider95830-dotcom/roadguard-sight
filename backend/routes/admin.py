from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Operator, AuditLog
from datetime import datetime, timezone

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/api/admin/operators", methods=["GET"])
@jwt_required()
def get_operators():
    operators = Operator.query.all()
    return jsonify([o.to_dict() for o in operators]), 200


@admin_bp.route(
    "/api/admin/operators/<int:operator_id>/toggle", methods=["PUT"]
)
@jwt_required()
def toggle_operator_status(operator_id):
    user_id = int(get_jwt_identity())

    operator = Operator.query.get(operator_id)
    if not operator:
        return jsonify({"error": "Operator not found"}), 404

    operator.enabled = not operator.enabled

    # Get the admin user for audit
    admin = Operator.query.get(user_id)
    action = "USER_ENABLED" if operator.enabled else "USER_DISABLED"
    audit = AuditLog(
        timestamp=datetime.now(timezone.utc),
        user_id=user_id,
        user_name=admin.name if admin else "Unknown",
        action=action,
        details=f"User {operator.email} {'enabled' if operator.enabled else 'disabled'}",
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify(operator.to_dict()), 200


@admin_bp.route("/api/admin/audit", methods=["GET"])
@jwt_required()
def get_audit_logs():
    logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(100).all()
    return jsonify([log.to_dict() for log in logs]), 200
