from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Alert, AuditLog, Operator
from datetime import datetime, timezone

alerts_bp = Blueprint("alerts", __name__)


@alerts_bp.route("/api/alerts", methods=["GET"])
@jwt_required()
def get_alerts():
    status = request.args.get("status")

    query = Alert.query

    if status and status in ("Pending", "Acknowledged", "Resolved"):
        query = query.filter(Alert.status == status)

    alerts = query.order_by(Alert.alert_date.desc()).all()

    return jsonify([a.to_dict() for a in alerts]), 200


@alerts_bp.route("/api/alerts/<alert_id>/acknowledge", methods=["PUT"])
@jwt_required()
def acknowledge_alert(alert_id):
    user_id = int(get_jwt_identity())

    alert = Alert.query.get(alert_id)
    if not alert:
        return jsonify({"error": "Alert not found"}), 404

    if alert.status != "Pending":
        return jsonify({"error": "Alert is not in Pending status"}), 400

    response_time_ms = int(
        (datetime.now(timezone.utc) - alert.alert_date).total_seconds() * 1000
    )

    alert.status = "Acknowledged"
    alert.operator_id = user_id
    alert.response_time_ms = response_time_ms
    alert.escalated = False

    operator = Operator.query.get(user_id)
    audit = AuditLog(
        timestamp=datetime.now(timezone.utc),
        user_id=user_id,
        user_name=operator.name if operator else "Unknown",
        action="ALERT_ACKNOWLEDGED",
        details=f"Alert {alert_id} acknowledged",
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify(
        {"operatorId": user_id, "responseTimeMs": response_time_ms}
    ), 200


@alerts_bp.route("/api/alerts/<alert_id>/resolve", methods=["PUT"])
@jwt_required()
def resolve_alert(alert_id):
    user_id = int(get_jwt_identity())

    alert = Alert.query.get(alert_id)
    if not alert:
        return jsonify({"error": "Alert not found"}), 404

    alert.status = "Resolved"

    operator = Operator.query.get(user_id)
    audit = AuditLog(
        timestamp=datetime.now(timezone.utc),
        user_id=user_id,
        user_name=operator.name if operator else "Unknown",
        action="ALERT_RESOLVED",
        details=f"Alert {alert_id} resolved",
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({"message": "Alert resolved"}), 200
