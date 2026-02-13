from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Inspection
from datetime import datetime, timedelta, timezone
from sqlalchemy import func
import json

reports_bp = Blueprint("reports", __name__)


@reports_bp.route("/api/reports/generate", methods=["POST"])
@jwt_required()
def generate_report():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    report_type = data.get("type", "trend")
    date_from = data.get("dateFrom")
    date_to = data.get("dateTo")

    if report_type == "trend":
        charts_data = _generate_trend_data(7)
    elif report_type == "defects":
        charts_data = _generate_defect_distribution()
    elif report_type == "locations":
        charts_data = _generate_location_stats()
    elif report_type == "daily":
        charts_data = _generate_trend_data(30)
    else:
        charts_data = _generate_trend_data(7)

    total = sum(d["value"] for d in charts_data)
    safe = sum(d.get("safe", 0) for d in charts_data)
    unsafe = sum(d.get("unsafe", 0) for d in charts_data)

    # Calculate average confidence from DB
    avg_confidence = db.session.query(func.avg(Inspection.confidence)).scalar()

    return jsonify(
        {
            "chartsData": charts_data,
            "summary": {
                "total": total,
                "safe": safe,
                "unsafe": unsafe,
                "avgConfidence": round(avg_confidence, 2)
                if avg_confidence
                else 0.89,
            },
        }
    ), 200


def _generate_trend_data(days):
    """Generate trend data from actual DB records."""
    data = []
    now = datetime.now(timezone.utc)

    for i in range(days - 1, -1, -1):
        day = (now - timedelta(days=i)).date()

        safe_count = Inspection.query.filter(
            func.date(Inspection.timestamp) == day,
            Inspection.status == "Safe",
        ).count()

        unsafe_count = Inspection.query.filter(
            func.date(Inspection.timestamp) == day,
            Inspection.status == "Unsafe",
        ).count()

        data.append(
            {
                "name": day.strftime("%a, %b %d"),
                "value": safe_count + unsafe_count,
                "safe": safe_count,
                "unsafe": unsafe_count,
            }
        )

    return data


def _generate_defect_distribution():
    """Get defect type distribution from DB."""
    defect_types = [
        "Tread Wear",
        "Sidewall Damage",
        "Puncture",
        "Bulge",
        "Cracking",
        "Under-inflation",
        "Over-inflation",
        "Uneven Wear",
    ]

    inspections = Inspection.query.filter(
        Inspection.defect_types.isnot(None)
    ).all()

    counts = {d: 0 for d in defect_types}
    for insp in inspections:
        if insp.defect_types:
            for defect in json.loads(insp.defect_types):
                if defect in counts:
                    counts[defect] += 1

    return [{"name": k, "value": v} for k, v in counts.items()]


def _generate_location_stats():
    """Get per-location statistics from DB."""
    results = (
        db.session.query(
            Inspection.location,
            func.count().label("total"),
            func.sum(db.case((Inspection.status == "Safe", 1), else_=0)).label(
                "safe"
            ),
            func.sum(
                db.case((Inspection.status == "Unsafe", 1), else_=0)
            ).label("unsafe"),
        )
        .group_by(Inspection.location)
        .all()
    )

    return [
        {
            "name": r.location.split(" - ")[0] if r.location else "Unknown",
            "value": r.total,
            "safe": r.safe,
            "unsafe": r.unsafe,
        }
        for r in results
    ]
