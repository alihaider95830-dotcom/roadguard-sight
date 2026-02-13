from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class Operator(db.Model):
    __tablename__ = "operators"

    operator_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="Operator")
    enabled = db.Column(db.Boolean, default=True)
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "operatorId": self.operator_id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "enabled": self.enabled,
            "createdAt": self.created_at.isoformat() + "Z"
            if self.created_at
            else None,
        }


class Inspection(db.Model):
    __tablename__ = "inspections"

    inspection_id = db.Column(db.String(64), primary_key=True)
    timestamp = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    location = db.Column(db.String(200), nullable=False)
    camera_id = db.Column(db.String(20), nullable=False)
    license_plate = db.Column(db.String(20), nullable=True)
    status = db.Column(db.String(10), nullable=False)  # Safe / Unsafe
    defect_types = db.Column(db.Text, nullable=True)  # JSON-encoded list
    confidence = db.Column(db.Float, nullable=False, default=0.0)
    image_urls = db.Column(db.Text, nullable=True)  # JSON-encoded list
    processing_duration_ms = db.Column(db.Integer, nullable=True)

    alerts = db.relationship("Alert", backref="inspection", lazy=True)

    def to_dict(self):
        import json

        return {
            "inspectionId": self.inspection_id,
            "timestamp": self.timestamp.isoformat() + "Z"
            if self.timestamp
            else None,
            "location": self.location,
            "cameraId": self.camera_id,
            "licensePlate": self.license_plate,
            "status": self.status,
            "defectTypes": json.loads(self.defect_types)
            if self.defect_types
            else None,
            "confidence": self.confidence,
            "imageUrls": json.loads(self.image_urls) if self.image_urls else [],
            "processingDurationMs": self.processing_duration_ms,
        }


class Alert(db.Model):
    __tablename__ = "alerts"

    alert_id = db.Column(db.String(64), primary_key=True)
    inspection_id = db.Column(
        db.String(64), db.ForeignKey("inspections.inspection_id"), nullable=False
    )
    alert_date = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    status = db.Column(
        db.String(20), nullable=False, default="Pending"
    )  # Pending / Acknowledged / Resolved
    escalated = db.Column(db.Boolean, default=False)
    operator_id = db.Column(
        db.Integer, db.ForeignKey("operators.operator_id"), nullable=True
    )
    response_time_ms = db.Column(db.Integer, nullable=True)
    summary = db.Column(db.Text, nullable=False)
    location = db.Column(db.String(200), nullable=False)
    camera_id = db.Column(db.String(20), nullable=False)
    license_plate = db.Column(db.String(20), nullable=True)
    defect_types = db.Column(db.Text, nullable=True)  # JSON-encoded list
    confidence = db.Column(db.Float, nullable=False, default=0.0)
    image_urls = db.Column(db.Text, nullable=True)  # JSON-encoded list

    def to_dict(self):
        import json

        return {
            "alertId": self.alert_id,
            "inspectionId": self.inspection_id,
            "alertDate": self.alert_date.isoformat() + "Z"
            if self.alert_date
            else None,
            "status": self.status,
            "escalated": self.escalated,
            "operatorId": self.operator_id,
            "responseTimeMs": self.response_time_ms,
            "summary": self.summary,
            "location": self.location,
            "cameraId": self.camera_id,
            "licensePlate": self.license_plate,
            "defectTypes": json.loads(self.defect_types)
            if self.defect_types
            else [],
            "confidence": self.confidence,
            "imageUrls": json.loads(self.image_urls) if self.image_urls else [],
        }


class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    timestamp = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    user_id = db.Column(
        db.Integer, db.ForeignKey("operators.operator_id"), nullable=False
    )
    user_name = db.Column(db.String(100), nullable=False)
    action = db.Column(db.String(50), nullable=False)
    details = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            "id": str(self.id),
            "timestamp": self.timestamp.isoformat() + "Z"
            if self.timestamp
            else None,
            "userId": self.user_id,
            "userName": self.user_name,
            "action": self.action,
            "details": self.details,
        }
