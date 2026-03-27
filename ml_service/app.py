from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
import json, base64, io
from PIL import Image
import cv2

app = Flask(__name__)
CORS(app)

# Load model + class names once on startup
model = tf.keras.models.load_model("auto_parts_model.keras")
with open("class_names.json") as f:
    class_indices = json.load(f)
class_names = {v: k for k, v in class_indices.items()}

# ── Thresholds (tune these after testing) ──────────────────
BLUR_THRESHOLD      = 80.0   # below this = blurry
ENTROPY_THRESHOLD   = 3.0    # above this = not a car part
CONFIDENCE_MINIMUM  = 0.45   # below this = not confident enough

# ── Helpers ────────────────────────────────────────────────

def check_blur(pil_image):
    """
    Laplacian variance — measures edge sharpness.
    Low value = blurry, high value = sharp.
    """
    gray = np.array(pil_image.convert("L"))          # grayscale
    lap  = cv2.Laplacian(gray, cv2.CV_64F).var()
    return lap

def check_entropy(predictions):
    """
    Shannon entropy of softmax output.
    High entropy = predictions spread across many classes = uncertain = not a part.
    Max possible entropy for 50 classes = log(50) ≈ 3.91
    """
    predictions = np.clip(predictions, 1e-9, 1.0)   # avoid log(0)
    entropy = -np.sum(predictions * np.log(predictions))
    return entropy

# ── Predict route ───────────────────────────────────────────
@app.route("/predict", methods=["POST"])
def predict():
    try:
        # Decode base64 image
        data      = request.json.get("image")
        img_bytes = base64.b64decode(data)
        pil_img   = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        # ── Step 1: Blur detection ──────────────────────────
        blur_score = check_blur(pil_img)
        print(f"Blur score: {blur_score:.1f}")

        if blur_score < BLUR_THRESHOLD:
            return jsonify({
                "success": False,
                "reason":  "blur",
                "blur_score": round(blur_score, 1),
                "message": "The image you uploaded is not clear. Please retake the photo and upload again."
            })

        # ── Step 2: Run model prediction ────────────────────
        img = pil_img.resize((224, 224))
        arr = np.array(img) / 255.0
        arr = np.expand_dims(arr, 0)

        predictions = model.predict(arr, verbose=0)[0]
        top_idx     = int(np.argmax(predictions))
        confidence  = float(predictions[top_idx])
        entropy     = check_entropy(predictions)

        print(f"Top class: {class_names[top_idx]}")
        print(f"Confidence: {confidence * 100:.1f}%")
        print(f"Entropy: {entropy:.3f}")

        # ── Step 3: Out-of-distribution check ───────────────
        # High entropy OR low confidence = not a car part
        if entropy > ENTROPY_THRESHOLD or confidence < CONFIDENCE_MINIMUM:
            return jsonify({
                "success":    False,
                "reason":     "unknown",
                "entropy":    round(entropy, 3),
                "confidence": round(confidence * 100, 1),
                "message":    "Undefined part"
            })

        # ── Step 4: Valid prediction ─────────────────────────
        part_name = class_names[top_idx].replace("_", " ").title()
        return jsonify({
            "success":    True,
            "part_name":  part_name,
            "confidence": round(confidence * 100, 1)
        })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({ "success": False, "reason": "error", "message": str(e) }), 500

if __name__ == "__main__":
    app.run(port=5001, debug=True)