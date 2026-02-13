"""
Machine Learning Service for Tire Inspection.

This module provides the integration point for your ML model.
Replace the placeholder logic with your actual model loading and inference code.

Supported approaches:
  1. Load a local model file (e.g., .h5, .pkl, .onnx, .pt)
  2. Call an external ML API / microservice
  3. Use TensorFlow / PyTorch / scikit-learn directly

To integrate your model:
  1. Place your model file in backend/ml_models/ (or configure ML_MODEL_PATH)
  2. Update `load_model()` to load your specific model
  3. Update `predict()` to run inference with your model
  4. Update `postprocess()` to map model output to the expected format
"""

import os
import time
import logging

logger = logging.getLogger(__name__)

# Global reference to loaded model
_model = None

# Defect types the system recognizes
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


def load_model(model_path=None):
    """
    Load your ML model into memory.

    Replace this with your actual model loading code.

    Examples:
        # TensorFlow / Keras
        import tensorflow as tf
        model = tf.keras.models.load_model(model_path)

        # PyTorch
        import torch
        model = torch.load(model_path)
        model.eval()

        # scikit-learn
        import joblib
        model = joblib.load(model_path)

        # ONNX Runtime
        import onnxruntime as ort
        model = ort.InferenceSession(model_path)
    """
    global _model

    if model_path and os.path.exists(model_path):
        logger.info(f"Loading ML model from: {model_path}")
        # -------------------------------------------------------
        # TODO: Replace with your actual model loading code
        # Example:
        #   import tensorflow as tf
        #   _model = tf.keras.models.load_model(model_path)
        # -------------------------------------------------------
        _model = {"loaded": True, "path": model_path}
        logger.info("ML model loaded successfully")
    else:
        logger.warning(
            "No ML model path configured or file not found. "
            "Using placeholder predictions. "
            "Set ML_MODEL_PATH environment variable to your model file."
        )
        _model = None


def preprocess_image(image_data):
    """
    Preprocess image data before feeding to the model.

    Replace this with your actual preprocessing pipeline.

    Args:
        image_data: Raw image bytes from the upload

    Returns:
        Preprocessed data ready for model inference

    Examples:
        # Using Pillow + numpy
        from PIL import Image
        import numpy as np
        import io

        img = Image.open(io.BytesIO(image_data))
        img = img.resize((224, 224))
        arr = np.array(img) / 255.0
        return np.expand_dims(arr, axis=0)
    """
    # -------------------------------------------------------
    # TODO: Replace with your actual preprocessing
    # -------------------------------------------------------
    return image_data


def predict(preprocessed_data):
    """
    Run inference with the loaded model.

    Replace this with your actual model prediction code.

    Args:
        preprocessed_data: Output from preprocess_image()

    Returns:
        Raw model output (predictions, logits, etc.)

    Examples:
        # TensorFlow
        predictions = _model.predict(preprocessed_data)
        return predictions

        # PyTorch
        import torch
        with torch.no_grad():
            output = _model(torch.tensor(preprocessed_data))
        return output.numpy()

        # scikit-learn
        return _model.predict_proba(preprocessed_data)
    """
    global _model

    if _model is None:
        # Placeholder: return dummy prediction when no model loaded
        logger.info("No model loaded — returning placeholder prediction")
        return None

    # -------------------------------------------------------
    # TODO: Replace with your actual inference code
    # Example:
    #   return _model.predict(preprocessed_data)
    # -------------------------------------------------------
    return None


def postprocess(raw_prediction):
    """
    Convert raw model output into the structured result format.

    Replace this with your actual postprocessing logic.

    Args:
        raw_prediction: Output from predict()

    Returns:
        dict with keys:
            - status: "Safe" or "Unsafe"
            - confidence: float 0.0 to 1.0
            - defect_types: list of detected defect strings (from DEFECT_TYPES)
    """
    if raw_prediction is None:
        # Placeholder: return a safe result when no model available
        return {
            "status": "Safe",
            "confidence": 0.95,
            "defect_types": [],
        }

    # -------------------------------------------------------
    # TODO: Replace with your actual postprocessing
    # Example for a classification model:
    #
    #   confidence = float(max(raw_prediction[0]))
    #   predicted_class = int(np.argmax(raw_prediction[0]))
    #
    #   if predicted_class == 0:
    #       return {"status": "Safe", "confidence": confidence, "defect_types": []}
    #   else:
    #       detected = [DEFECT_TYPES[i] for i, v in enumerate(raw_prediction[0][1:])
    #                   if v > 0.5]
    #       return {"status": "Unsafe", "confidence": confidence,
    #               "defect_types": detected or ["Unknown"]}
    # -------------------------------------------------------
    return {
        "status": "Safe",
        "confidence": 0.95,
        "defect_types": [],
    }


def run_inspection(image_data):
    """
    Full inspection pipeline: preprocess -> predict -> postprocess.

    This is the main entry point called by the API route.

    Args:
        image_data: Raw image bytes from the upload

    Returns:
        dict with keys:
            - status: "Safe" or "Unsafe"
            - confidence: float 0.0 to 1.0
            - defect_types: list of strings
            - processing_duration_ms: int (milliseconds)
    """
    start = time.time()

    preprocessed = preprocess_image(image_data)
    raw_prediction = predict(preprocessed)
    result = postprocess(raw_prediction)

    duration_ms = int((time.time() - start) * 1000)
    result["processing_duration_ms"] = duration_ms

    return result
