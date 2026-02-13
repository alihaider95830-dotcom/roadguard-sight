import os
import logging
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO

from config import Config
from models import db

# Initialize extensions
jwt = JWTManager()
socketio = SocketIO(cors_allowed_origins="*")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    CORS(app)
    socketio.init_app(app)

    # Register blueprints
    from routes.auth import auth_bp
    from routes.dashboard import dashboard_bp
    from routes.inspections import inspections_bp
    from routes.alerts import alerts_bp
    from routes.reports import reports_bp
    from routes.admin import admin_bp
    from routes.ml import ml_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(inspections_bp)
    app.register_blueprint(alerts_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(ml_bp)

    # Serve uploaded images
    @app.route("/api/uploads/<filename>")
    def uploaded_file(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    # Health check
    @app.route("/api/health")
    def health():
        return {"status": "ok", "service": "RoadGuard Sight API"}

    # Create database tables
    with app.app_context():
        db.create_all()

        # Load ML model on startup
        from services.ml_service import load_model

        model_path = app.config.get("ML_MODEL_PATH")
        load_model(model_path)

    # SocketIO event handlers
    @socketio.on("connect")
    def handle_connect():
        logger.info("Client connected to WebSocket")

    @socketio.on("disconnect")
    def handle_disconnect():
        logger.info("Client disconnected from WebSocket")

    return app


if __name__ == "__main__":
    app = create_app()
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
