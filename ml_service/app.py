from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
import json
import base64
import io
from PIL import Image
import cv2

app = Flask(__name__)
CORS(app)

# Load model and class names
IMG_SIZE = (224, 224)

model = tf.keras.models.load_model("auto_parts_model.keras", compile=False)

with open("class_names.json", "r") as f:
    class_indices = json.load(f)

class_names = {v: k for k, v in class_indices.items()}

# Thresholds (tune after testing)
BLUR_THRESHOLD = 80.0
CONFIDENCE_MINIMUM = 0.55
MARGIN_MINIMUM = 0.15
ENTROPY_THRESHOLD = 2.40 

# Helpers
def check_blur(pil_image):
    gray = np.array(pil_image.convert("L"))
    return cv2.Laplacian(gray, cv2.CV_64F).var()

def check_entropy(predictions):
    predictions = np.clip(predictions, 1e-9, 1.0)
    return -np.sum(predictions * np.log(predictions))

def preprocess_image(pil_image):
    img = pil_image.resize(IMG_SIZE)
    arr = np.array(img).astype("float32")
    arr = np.expand_dims(arr, axis=0)
    return arr

def decode_base64_image(data):
    if not data:
        raise ValueError("No image data provided.")

    if "," in data:
        data = data.split(",", 1)[1]

    img_bytes = base64.b64decode(data)
    pil_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    return pil_img

# Routes
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json.get("image")
        pil_img = decode_base64_image(data)

        # Step 1: Blur detection
        blur_score = check_blur(pil_img)
        print(f"Blur score: {blur_score:.1f}")

        if blur_score < BLUR_THRESHOLD:
            return jsonify({
                "success": False,
                "reason": "blur",
                "blur_score": round(float(blur_score), 1),
                "message": "The image is too blurry. Please upload a clearer image."
            })

        # Step 2: Preprocess and predict
        arr = preprocess_image(pil_img)
        predictions = model.predict(arr, verbose=0)[0]

        top_idx = int(np.argmax(predictions))
        top1 = float(predictions[top_idx])
        top2 = float(np.partition(predictions, -2)[-2])
        margin = top1 - top2
        entropy = float(check_entropy(predictions))
        label_raw = class_names[top_idx]

        print(f"Top class: {label_raw}")
        print(f"Top1 confidence: {top1 * 100:.1f}%")
        print(f"Top2 confidence: {top2 * 100:.1f}%")
        print(f"Margin: {margin:.3f}")
        print(f"Entropy: {entropy:.3f}")

        # Step 3: Reject unknown or uncertain predictions
        if (
            label_raw.lower() == "unknown"
            or top1 < CONFIDENCE_MINIMUM
            or margin < MARGIN_MINIMUM
            or entropy > ENTROPY_THRESHOLD
        ):
            return jsonify({
                "success": False,
                "reason": "unknown",
                "predicted_class": label_raw,
                "confidence": round(top1 * 100, 1),
                "margin": round(margin, 3),
                "entropy": round(entropy, 3),
                "message": "Undefined part"
            })

        # Step 4: Valid prediction
        part_name = label_raw.replace("_", " ").title()

        return jsonify({
            "success": True,
            "part_name": part_name,
            "confidence": round(top1 * 100, 1),
            "margin": round(margin, 3),
            "entropy": round(entropy, 3)
        })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({
            "success": False,
            "reason": "error",
            "message": str(e)
        }), 500

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "success": True,
        "message": "ML service is running"
    })

if __name__ == "__main__":
    app.run(port=5001, debug=True)