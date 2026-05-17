from fastapi import APIRouter
import os
import numpy as np
from PIL import Image
import io
import tempfile
import soundfile as sf
from ..preprocess import preprocess_image, preprocess_audio, preprocess_video
from ..models import image_models, audio_models

router = APIRouter()

# ---------------- Dummy Test Data ---------------- #
TEST_IMAGE_DIR = "test_images"
os.makedirs(TEST_IMAGE_DIR, exist_ok=True)

# ----- Image Ground Truth -----
image_ground_truth = {}
for i in range(1, 5):
    img_array = np.random.randint(0, 256, (224, 224, 3), dtype=np.uint8)
    img = Image.fromarray(img_array)
    fname = f"img{i}.jpg"
    img.save(os.path.join(TEST_IMAGE_DIR, fname))
    image_ground_truth[fname] = i % 2  # Example class labels 0 or 1

# ----- Audio Ground Truth -----
audio_ground_truth = {}
for i in range(1, 5):
    y = np.random.uniform(-1, 1, 16000).astype(np.float32)
    audio_bytes = io.BytesIO()
    sf.write(audio_bytes, y, samplerate=16000, format='WAV')
    audio_bytes.seek(0)
    audio_ground_truth[f"audio{i}.wav"] = (audio_bytes, i % 2)

# ----- Video Ground Truth -----
video_ground_truth = {}
for i in range(1, 3):
    video_array = np.random.randint(0, 256, (50, 224, 224, 3), dtype=np.uint8)
    video_bytes = video_array.tobytes()
    video_ground_truth[f"video{i}.mp4"] = (video_bytes, i % 2)

# ---------------- Accuracy Endpoint ---------------- #
@router.get("/check_accuracy", tags=["Evaluation"])
def check_accuracy():
    results = {}
    all_accuracies = []

    # ----- Image Models -----
    X_images, y_images = [], []
    for fname, label in image_ground_truth.items():
        fpath = os.path.join(TEST_IMAGE_DIR, fname)
        with open(fpath, "rb") as f:
            contents = f.read()
        img = preprocess_image(contents, augment=False)
        X_images.append(img)
        y_images.append(label)
    if X_images:
        X_images = np.vstack(X_images)
        y_images = np.array(y_images)
        for name, model in image_models.items():
            y_pred = model.predict(X_images)
            y_pred_labels = np.argmax(y_pred, axis=1)
            acc = float(np.mean(y_pred_labels == y_images))
            results[name] = acc
            all_accuracies.append(acc)

    # ----- Audio Models -----
    X_audio, y_audio = [], []
    for fname, (audio_bytes, label) in audio_ground_truth.items():
        audio_bytes.seek(0)
        arr = preprocess_audio(audio_bytes.read(), augment=False)
        X_audio.append(arr)
        y_audio.append(label)
    if X_audio:
        X_audio = np.vstack(X_audio)
        y_audio = np.array(y_audio)
        for name, model in audio_models.items():
            y_pred = model.predict(X_audio)
            y_pred_labels = np.argmax(y_pred, axis=1)
            acc = float(np.mean(y_pred_labels == y_audio))
            results[name] = acc
            all_accuracies.append(acc)

    # ----- Video Models -----
    X_video, y_video = [], []
    for fname, (video_bytes, label) in video_ground_truth.items():
        arr = preprocess_video(video_bytes, augment=False)
        X_video.append(arr)
        y_video.append(label)
    if X_video:
        X_video = np.vstack(X_video)
        y_video = np.array(y_video)
        for name, model in image_models.items():  # video uses image_models
            y_pred = model.predict(X_video)
            y_pred_labels = np.argmax(y_pred, axis=1)
            acc = float(np.mean(y_pred_labels == y_video))
            results[name] = acc
            all_accuracies.append(acc)

    mean_accuracy_percent = float(np.mean(all_accuracies)) * 100 if all_accuracies else 0.0
    return {"accuracy": results, "mean_accuracy_percent": mean_accuracy_percent}
