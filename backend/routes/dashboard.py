from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from models import db, Inspection, Alert
from datetime import datetime, timezone
from sqlalchemy import func

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/api/dashboard/stats", methods=["GET"])
@jwt_required()
def get_dashboard_stats():
    today = datetime.now(timezone.utc).date()

    # Total inspections today
    total = Inspection.query.filter(
        func.date(Inspection.timestamp) == today
    ).count()

    safe_count = Inspection.query.filter(
        func.date(Inspection.timestamp) == today,
        Inspection.status == "Safe",
    ).count()

    unsafe_count = Inspection.query.filter(
        func.date(Inspection.timestamp) == today,
        Inspection.status == "Unsafe",
    ).count()

    # Average processing latency today
    avg_latency_result = (
        db.session.query(func.avg(Inspection.processing_duration_ms))
        .filter(func.date(Inspection.timestamp) == today)
        .scalar()
    )
    avg_latency = round(avg_latency_result) if avg_latency_result else 0

    # Pending alerts
    alerts_pending = Alert.query.filter_by(status="Pending").count()

    return jsonify(
        {
            "totalInspections": total,
            "safeCount": safe_count,
            "unsafeCount": unsafe_count,
            "avgProcessingLatency": avg_latency,
            "alertsPending": alerts_pending,
        }
    ), 200
