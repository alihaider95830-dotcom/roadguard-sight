"""
Seed the database with initial data for development / demonstration.

Usage:
    cd backend
    python seed_data.py
"""

import json
import random
import string
from datetime import datetime, timedelta, timezone

from app import create_app
from models import db, Operator, Inspection, Alert, AuditLog

DEFECT_TYPES = [
    "Tread Wear",
    "Sidewall Damage",
    "Puncture",
    "Bulge",
    "Cracking",
    "Under-inflation",
    "Over-inflation",
    "Uneven Wear",
]

LOCATIONS = [
    "Highway I-95 North - Mile 42",
    "Highway I-95 South - Mile 38",
    "Route 66 East - Checkpoint A",
    "Route 66 West - Checkpoint B",
    "Interstate 80 - Weigh Station",
    "Highway 101 - Toll Plaza",
]

CAMERA_IDS = ["CAM-001", "CAM-002", "CAM-003", "CAM-004", "CAM-005", "CAM-006"]


def generate_plate():
    letters = "ABCDEFGHJKLMNPRSTUVWXYZ"
    numbers = "0123456789"
    plate = "".join(random.choice(letters) for _ in range(3))
    plate += "-"
    plate += "".join(random.choice(numbers) for _ in range(4))
    return plate


def seed():
    app = create_app()
    with app.app_context():
        # Clear existing data
        db.drop_all()
        db.create_all()

        print("Seeding operators...")
        operators_data = [
            {
                "name": "Admin User",
                "email": "admin@atis.com",
                "password": "admin123",
                "role": "Admin",
                "enabled": True,
                "created_at": datetime(2024, 1, 1, tzinfo=timezone.utc),
            },
            {
                "name": "John Operator",
                "email": "operator@atis.com",
                "password": "operator123",
                "role": "Operator",
                "enabled": True,
                "created_at": datetime(2024, 1, 15, tzinfo=timezone.utc),
            },
            {
                "name": "Sarah Inspector",
                "email": "sarah@atis.com",
                "password": "sarah123",
                "role": "Operator",
                "enabled": True,
                "created_at": datetime(2024, 2, 1, tzinfo=timezone.utc),
            },
            {
                "name": "Mike Wilson",
                "email": "mike@atis.com",
                "password": "mike123",
                "role": "Operator",
                "enabled": False,
                "created_at": datetime(2024, 2, 10, tzinfo=timezone.utc),
            },
            {
                "name": "Emily Chen",
                "email": "emily@atis.com",
                "password": "emily123",
                "role": "Admin",
                "enabled": True,
                "created_at": datetime(2024, 3, 1, tzinfo=timezone.utc),
            },
        ]

        operators = []
        for op_data in operators_data:
            op = Operator(
                name=op_data["name"],
                email=op_data["email"],
                role=op_data["role"],
                enabled=op_data["enabled"],
                created_at=op_data["created_at"],
            )
            op.set_password(op_data["password"])
            db.session.add(op)
            operators.append(op)

        db.session.flush()

        print("Seeding inspections...")
        inspections = []
        now = datetime.now(timezone.utc)

        for i in range(150):
            is_unsafe = random.random() > 0.75
            timestamp = now - timedelta(seconds=random.random() * 86400)
            loc_idx = random.randint(0, len(LOCATIONS) - 1)

            defects = None
            if is_unsafe:
                selected = [d for d in DEFECT_TYPES if random.random() > 0.6]
                if not selected:
                    selected = [random.choice(DEFECT_TYPES)]
                defects = selected[:3]

            inspection = Inspection(
                inspection_id=f"INS-{int(now.timestamp())}-{uuid_short()}",
                timestamp=timestamp,
                location=LOCATIONS[loc_idx],
                camera_id=CAMERA_IDS[loc_idx],
                license_plate=generate_plate() if random.random() > 0.1 else None,
                status="Unsafe" if is_unsafe else "Safe",
                defect_types=json.dumps(defects) if defects else None,
                confidence=round(0.75 + random.random() * 0.24, 2),
                image_urls=json.dumps(
                    [
                        f"https://picsum.photos/seed/{random.randint(1, 10000)}/640/480",
                        f"https://picsum.photos/seed/{random.randint(1, 10000)}/640/480",
                    ]
                ),
                processing_duration_ms=150 + random.randint(0, 350),
            )
            db.session.add(inspection)
            inspections.append(inspection)

        db.session.flush()

        print("Seeding alerts...")
        statuses = ["Pending", "Acknowledged", "Resolved"]
        for insp in inspections:
            if insp.status == "Unsafe":
                status_idx = random.randint(0, 2)
                status = statuses[status_idx]

                alert = Alert(
                    alert_id=f"ALT-{int(now.timestamp())}-{uuid_short()}",
                    inspection_id=insp.inspection_id,
                    alert_date=insp.timestamp,
                    status=status,
                    escalated=status == "Pending" and random.random() > 0.7,
                    operator_id=random.randint(1, 5) if status != "Pending" else None,
                    response_time_ms=random.randint(5000, 50000)
                    if status != "Pending"
                    else None,
                    summary=f"Unsafe tire detected - {', '.join(json.loads(insp.defect_types)) if insp.defect_types else 'Unknown defect'}",
                    location=insp.location,
                    camera_id=insp.camera_id,
                    license_plate=insp.license_plate,
                    defect_types=insp.defect_types or "[]",
                    confidence=insp.confidence,
                    image_urls=insp.image_urls or "[]",
                )
                db.session.add(alert)

        print("Seeding audit logs...")
        audit_actions = [
            ("USER_LOGIN", "Logged in from 192.168.1.100"),
            ("ALERT_ACKNOWLEDGED", "Alert ALT-001 acknowledged"),
            ("SETTINGS_UPDATED", "Alert timeout changed to 90s"),
            ("ALERT_RESOLVED", "Alert ALT-002 resolved"),
            ("USER_DISABLED", "User mike@atis.com disabled"),
        ]

        for i, (action, details) in enumerate(audit_actions):
            op = operators[i % len(operators)]
            audit = AuditLog(
                timestamp=now - timedelta(hours=i + 1),
                user_id=op.operator_id,
                user_name=op.name,
                action=action,
                details=details,
            )
            db.session.add(audit)

        db.session.commit()
        print(
            f"Seed complete: {len(operators)} operators, "
            f"{len(inspections)} inspections, "
            f"{Alert.query.count()} alerts, "
            f"{AuditLog.query.count()} audit logs"
        )


def uuid_short():
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=6))


if __name__ == "__main__":
    seed()
