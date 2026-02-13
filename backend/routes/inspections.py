from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Inspection
from datetime import datetime

inspections_bp = Blueprint("inspections", __name__)


@inspections_bp.route("/api/inspections", methods=["GET"])
@jwt_required()
def get_inspections():
    # Query parameters
    date_from = request.args.get("from")
    date_to = request.args.get("to")
    plate = request.args.get("plate")
    status = request.args.get("status")
    page = request.args.get("page", 1, type=int)
    page_size = request.args.get("pageSize", 20, type=int)

    query = Inspection.query

    if date_from:
        try:
            from_dt = datetime.fromisoformat(date_from.replace("Z", "+00:00"))
            query = query.filter(Inspection.timestamp >= from_dt)
        except ValueError:
            pass

    if date_to:
        try:
            to_dt = datetime.fromisoformat(date_to.replace("Z", "+00:00"))
            query = query.filter(Inspection.timestamp <= to_dt)
        except ValueError:
            pass

    if plate:
        query = query.filter(
            Inspection.license_plate.ilike(f"%{plate}%")
        )

    if status and status in ("Safe", "Unsafe"):
        query = query.filter(Inspection.status == status)

    # Get total before pagination
    total = query.count()

    # Sort by timestamp descending and paginate
    inspections = (
        query.order_by(Inspection.timestamp.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return jsonify(
        {
            "data": [i.to_dict() for i in inspections],
            "total": total,
        }
    ), 200


@inspections_bp.route("/api/inspections/<inspection_id>", methods=["GET"])
@jwt_required()
def get_inspection(inspection_id):
    inspection = Inspection.query.get(inspection_id)
    if not inspection:
        return jsonify({"error": "Inspection not found"}), 404
    return jsonify(inspection.to_dict()), 200
