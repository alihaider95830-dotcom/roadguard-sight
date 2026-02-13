import json
import uuid
from datetime import datetime, timezone

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

from models import db, Inspection, Alert
from services.ml_service import run_inspection

ml_bp = Blueprint("ml", __name__)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "bmp", "tiff"}

LOCATIONS = [
    "Highway I-95 North - Mile 42",
    "Highway I-95 South - Mile 38",
    "Route 66 East - Checkpoint A",
    "Route 66 West - Checkpoint B",
    "Interstate 80 - Weigh Station",
    "Highway 101 - Toll Plaza",
]

CAMERA_IDS = ["CAM-001", "CAM-002", "CAM-003", "CAM-004", "CAM-005", "CAM-006"]


def _allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


@ml_bp.route("/api/ml/inspect", methods=["POST"])
@jwt_required()
def inspect_tire():
    """
    Upload a tire image for ML inspection.

    Accepts multipart form data with:
      - image: The tire image file (required)
      - location: Inspection location string (optional)
      - cameraId: Camera identifier (optional)
      - licensePlate: Vehicle license plate (optional)

    Returns the full inspection result with ML predictions.
    """
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if not _allowed_file(file.filename):
        return jsonify(
            {"error": f"File type not allowed. Use: {', '.join(ALLOWED_EXTENSIONS)}"}
        ), 400

    # Read image data
    image_data = file.read()

    # Run ML inspection
    result = run_inspection(image_data)

    # Save the uploaded image
    filename = secure_filename(file.filename)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    saved_name = f"{timestamp}_{filename}"

    import os

    upload_dir = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, saved_name)
    with open(file_path, "wb") as f:
        f.write(image_data)

    image_url = f"/api/uploads/{saved_name}"

    # Get form data
    location = request.form.get("location", LOCATIONS[0])
    camera_id = request.form.get("cameraId", CAMERA_IDS[0])
    license_plate = request.form.get("licensePlate")

    # Create inspection record
    inspection_id = f"INS-{int(datetime.now(timezone.utc).timestamp())}-{uuid.uuid4().hex[:6]}"
    inspection = Inspection(
        inspection_id=inspection_id,
        timestamp=datetime.now(timezone.utc),
        location=location,
        camera_id=camera_id,
        license_plate=license_plate,
        status=result["status"],
        defect_types=json.dumps(result["defect_types"])
        if result["defect_types"]
        else None,
        confidence=result["confidence"],
        image_urls=json.dumps([image_url]),
        processing_duration_ms=result["processing_duration_ms"],
    )
    db.session.add(inspection)

    # If unsafe, create alert
    alert_data = None
    if result["status"] == "Unsafe":
        alert_id = f"ALT-{int(datetime.now(timezone.utc).timestamp())}-{uuid.uuid4().hex[:6]}"
        alert = Alert(
            alert_id=alert_id,
            inspection_id=inspection_id,
            alert_date=datetime.now(timezone.utc),
            status="Pending",
            escalated=False,
            summary=f"Unsafe tire detected - {', '.join(result['defect_types']) or 'Unknown defect'}",
            location=location,
            camera_id=camera_id,
            license_plate=license_plate,
            defect_types=json.dumps(result["defect_types"])
            if result["defect_types"]
            else "[]",
            confidence=result["confidence"],
            image_urls=json.dumps([image_url]),
        )
        db.session.add(alert)
        alert_data = alert.to_dict()

    db.session.commit()

    # Emit real-time events via SocketIO
    try:
        from app import socketio

        socketio.emit("inspection.created", inspection.to_dict())
        if alert_data:
            socketio.emit("alert.created", alert_data)
    except Exception:
        pass  # SocketIO not available

    response = {
        "inspection": inspection.to_dict(),
        "mlResult": {
            "status": result["status"],
            "confidence": result["confidence"],
            "defectTypes": result["defect_types"],
            "processingDurationMs": result["processing_duration_ms"],
        },
    }

    if alert_data:
        response["alert"] = alert_data

    return jsonify(response), 201


@ml_bp.route("/api/ml/batch-inspect", methods=["POST"])
@jwt_required()
def batch_inspect():
    """
    Upload multiple tire images for batch ML inspection.

    Accepts multipart form data with:
      - images: Multiple tire image files (required)
      - location: Inspection location string (optional)
      - cameraId: Camera identifier (optional)
      - licensePlate: Vehicle license plate (optional)

    Returns a list of inspection results.
    """
    files = request.files.getlist("images")
    if not files:
        return jsonify({"error": "No image files provided"}), 400

    location = request.form.get("location", LOCATIONS[0])
    camera_id = request.form.get("cameraId", CAMERA_IDS[0])
    license_plate = request.form.get("licensePlate")

    results = []

    for file in files:
        if file.filename == "" or not _allowed_file(file.filename):
            continue

        image_data = file.read()
        result = run_inspection(image_data)

        # Save uploaded image
        filename = secure_filename(file.filename)
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        saved_name = f"{timestamp}_{filename}"

        import os

        upload_dir = current_app.config["UPLOAD_FOLDER"]
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, saved_name)
        with open(file_path, "wb") as f:
            f.write(image_data)

        image_url = f"/api/uploads/{saved_name}"

        inspection_id = f"INS-{int(datetime.now(timezone.utc).timestamp())}-{uuid.uuid4().hex[:6]}"
        inspection = Inspection(
            inspection_id=inspection_id,
            timestamp=datetime.now(timezone.utc),
            location=location,
            camera_id=camera_id,
            license_plate=license_plate,
            status=result["status"],
            defect_types=json.dumps(result["defect_types"])
            if result["defect_types"]
            else None,
            confidence=result["confidence"],
            image_urls=json.dumps([image_url]),
            processing_duration_ms=result["processing_duration_ms"],
        )
        db.session.add(inspection)

        if result["status"] == "Unsafe":
            alert_id = f"ALT-{int(datetime.now(timezone.utc).timestamp())}-{uuid.uuid4().hex[:6]}"
            alert = Alert(
                alert_id=alert_id,
                inspection_id=inspection_id,
                alert_date=datetime.now(timezone.utc),
                status="Pending",
                escalated=False,
                summary=f"Unsafe tire detected - {', '.join(result['defect_types']) or 'Unknown defect'}",
                location=location,
                camera_id=camera_id,
                license_plate=license_plate,
                defect_types=json.dumps(result["defect_types"])
                if result["defect_types"]
                else "[]",
                confidence=result["confidence"],
                image_urls=json.dumps([image_url]),
            )
            db.session.add(alert)

        results.append(
            {
                "inspection": inspection.to_dict(),
                "mlResult": {
                    "status": result["status"],
                    "confidence": result["confidence"],
                    "defectTypes": result["defect_types"],
                    "processingDurationMs": result["processing_duration_ms"],
                },
            }
        )

    db.session.commit()

    return jsonify({"results": results, "totalProcessed": len(results)}), 201


@ml_bp.route("/api/ml/status", methods=["GET"])
@jwt_required()
def ml_status():
    """Check the status of the ML model."""
    from services.ml_service import _model

    return jsonify(
        {
            "modelLoaded": _model is not None,
            "modelPath": current_app.config.get("ML_MODEL_PATH", ""),
            "supportedDefects": [
                "Tread Wear",
                "Sidewall Damage",
                "Puncture",
                "Bulge",
                "Cracking",
                "Under-inflation",
                "Over-inflation",
                "Uneven Wear",
            ],
            "supportedFormats": list(ALLOWED_EXTENSIONS),
        }
    ), 200
