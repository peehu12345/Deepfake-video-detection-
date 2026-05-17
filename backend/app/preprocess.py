# app/preprocess.py
from PIL import Image, ImageEnhance, ImageOps
import numpy as np
import io
import librosa
import cv2
import tempfile
import random
from tensorflow.keras.applications.inception_v3 import preprocess_input  # ✅ Add this

# ---------------- Image Preprocessing + Augmentation ---------------- #
def preprocess_image(image_bytes, target_size=(224, 224), augment=False):
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    if augment:
        if random.random() > 0.5:
            img = ImageOps.mirror(img)
        angle = random.uniform(-15, 15)
        img = img.rotate(angle)
        enhancer = ImageEnhance.Brightness(img)
        img = enhancer.enhance(random.uniform(0.8, 1.2))
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(random.uniform(0.8, 1.2))
    img = img.resize(target_size)
    img_array = np.array(img, dtype=np.float32)
    img_array = preprocess_input(img_array)  # ✅ correct normalization for Inception
    return np.expand_dims(img_array, axis=0)

# ---------------- Audio Preprocessing + Augmentation ---------------- #
def preprocess_audio(audio_bytes, sr=16000, augment=False):
    y, sr = librosa.load(io.BytesIO(audio_bytes), sr=sr)
    if augment:
        noise = np.random.normal(0, 0.005, y.shape)
        y = y + noise
        shift = int(random.uniform(-0.1, 0.1) * len(y))
        y = np.roll(y, shift)
        n_steps = random.uniform(-1, 1)
        y = librosa.effects.pitch_shift(y, sr, n_steps)

    # Generate mel-spectrogram instead of MFCC to match CNN input expectations
    n_mels = 128
    n_fft = 2048
    hop_length = 512  # Adjust to get approximately 128 time frames for typical audio length
    mel_spec = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=n_mels, n_fft=n_fft, hop_length=hop_length)

    # Convert to log scale (dB)
    mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)

    # Normalize to [0, 1]
    mel_spec_norm = (mel_spec_db - mel_spec_db.min()) / (mel_spec_db.max() - mel_spec_db.min() + 1e-8)

    # Ensure we have at least 128 time frames, pad if necessary
    target_time_frames = 128
    if mel_spec_norm.shape[1] < target_time_frames:
        pad_width = target_time_frames - mel_spec_norm.shape[1]
        mel_spec_norm = np.pad(mel_spec_norm, ((0, 0), (0, pad_width)), mode='constant')
    elif mel_spec_norm.shape[1] > target_time_frames:
        mel_spec_norm = mel_spec_norm[:, :target_time_frames]

    # Add channel dimension for CNN input (grayscale)
    mel_spec_norm = np.expand_dims(mel_spec_norm, axis=-1)

    # Add batch dimension
    return np.expand_dims(mel_spec_norm, axis=0)

# ---------------- Video Preprocessing + Augmentation ---------------- #
# def preprocess_video(video_bytes, frame_skip=10, target_size=(224,224), augment=False):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
        tmp.write(video_bytes)
        tmp_path = tmp.name

    cap = cv2.VideoCapture(tmp_path)
    frames = []
    count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if count % frame_skip == 0:
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            img = cv2.resize(frame, target_size)
            img = img / 255.0
            if augment:
                if random.random() > 0.5:
                    img = np.fliplr(img)
                factor = random.uniform(0.8, 1.2)
                img = np.clip(img * factor, 0, 1)
            frames.append(img)
        count += 1
    cap.release()
    return np.array(frames)


def preprocess_video(video_bytes, frame_skip=10, target_size=(224,224), augment=False):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
        tmp.write(video_bytes)
        tmp_path = tmp.name

    cap = cv2.VideoCapture(tmp_path)
    frames = []
    count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if count % frame_skip == 0:
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            img = cv2.resize(frame, target_size)
            img = img.astype(np.float32)
            if augment:
                if random.random() > 0.5:
                    img = np.fliplr(img)
                factor = random.uniform(0.8, 1.2)
                img = np.clip(img * factor, 0, 255)
            img = preprocess_input(img)  # ✅ correct for Inception
            frames.append(img)
        count += 1
    cap.release()
    return np.array(frames)