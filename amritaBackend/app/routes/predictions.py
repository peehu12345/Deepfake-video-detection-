from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from ..preprocess import preprocess_image, preprocess_audio, preprocess_video
from ..models import image_models, audio_models
from ..auth import verify_token
import cv2
import os
import uuid
from PIL import Image
import numpy as np
import io
import subprocess
import tempfile
import logging
from typing import List, Dict, Optional
import librosa 

router = APIRouter()
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Configurable thresholds
IMAGE_FAKE_THRESHOLD = float(os.getenv("IMAGE_FAKE_THRESHOLD", "0.7"))
VIDEO_FAKE_THRESHOLD = float(os.getenv("VIDEO_FAKE_THRESHOLD", "0.8"))
AUDIO_FAKE_THRESHOLD = float(os.getenv("AUDIO_FAKE_THRESHOLD", "0.25"))
COMBINED_FAKE_THRESHOLD = float(os.getenv("COMBINED_FAKE_THRESHOLD", "0.7"))

def _ensure_models_exist(models: Dict[str, object]) -> bool:
    return bool(models)

def _extract_fake_prob_from_model_output(pred):
    """
    Accept various model output shapes and return a single fake-probability in [0,1].
    Handles:
      - softmax 2-class: [p_real, p_fake] -> take index 1 (p_fake)
      - sigmoid single-output: [p_fake] or [[p_fake]]
      - multi-class: take second index as 'fake' by convention (class 1 = fake)
    """
    arr = np.array(pred)
    # If shape (n,2) or (2,) -> take index 1 (class 1 = fake)
    if arr.ndim == 1 and arr.size == 2:
        return float(arr[1])
    if arr.ndim == 2 and arr.shape[1] == 2:
        return float(arr[0, 1])
    # If single-value outputs (sigmoid)
    if arr.ndim == 1 and arr.size == 1:
        return float(arr[0])
    if arr.ndim == 2 and arr.shape[1] == 1:
        return float(arr[0, 0])
    # Fallback: take second index as fake
    try:
        if arr.ndim >= 1:
            if arr.ndim == 2:
                return float(arr[0, 1])
            return float(arr[1])
    except Exception:
        pass
    # If all else fails, return 0.0 (very safe fallback)
    return 0.0

def _prepare_audio_input_for_model(model, y, sr=16000, max_duration=None, model_name=None):
    """
    Create a model-specific input array from audio array y.
    """
    if max_duration is not None:
        y = y[:int(sr * max_duration)]

    logger.info(f"Preparing audio for {model_name}: y.shape = {y.shape if len(y) > 0 else 'empty'}")

    # Parse expected shape (exclude batch dim) using model.input_shape
    try:
        parsed_expected = model.input_shape[1:]
        logger.info(f"Model {model_name}: input_shape[1:] = {parsed_expected}")
    except Exception as e:
        logger.warning(f"Could not parse input_shape for {model_name}: {e}")
        parsed_expected = (128, 128, 1)  # Safe fallback

    def _normalize_spec(spec):
        spec = spec.astype(np.float32)
        spec -= spec.min()
        denom = (spec.max() + 1e-9)
        if denom != 0:
            spec /= denom
        return spec

    # CASE A: 1D vector expected (e.g., (40,))
    if len(parsed_expected) == 1 or (model_name and "mfcc" in model_name.lower()):
        n_mfcc = parsed_expected[0] if parsed_expected and parsed_expected[0] is not None and parsed_expected[0] > 0 else 40
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc)
        mfcc = np.mean(mfcc.T, axis=0).astype(np.float32)  # shape (n_mfcc,)
        model_input = np.expand_dims(mfcc, axis=0)  # (1, n_mfcc)
        logger.info(f"MFCC input shape for {model_name}: {model_input.shape}")
        return model_input

    # Default to 3D image-like input for audio models
    if len(parsed_expected) == 3:
        h, w, c = [int(dim) if dim is not None else 128 for dim in parsed_expected]
    elif len(parsed_expected) == 2:
        h, w = [int(dim) if dim is not None else 128 for dim in parsed_expected]
        c = 1
    else:
        h, w, c = 128, 128, 1

    logger.info(f"Final dimensions for {model_name}: h={h}, w={w}, c={c}")

    # Compute mel spectrogram with n_mels = h
    mel_spec = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=h)
    mel_db = librosa.power_to_db(mel_spec, ref=np.max)
    mel_norm = _normalize_spec(mel_db)  # shape (h, time_frames)

    logger.info(f"mel_norm.shape for {model_name} = {mel_norm.shape} (h={h}, time_frames={mel_norm.shape[1]})")

    if mel_norm.shape[1] == 0 or mel_norm.shape[1] < 1:
        # If no time frames, create dummy
        mel_norm = np.zeros((h, w))

    # Resize to output shape (h, w): dsize = (width=w, height=h)
    mel_resized = cv2.resize(mel_norm, (w, h), interpolation=cv2.INTER_AREA)
    logger.info(f"After resize dsize=({w}, {h}) for {model_name}, mel_resized.shape = {mel_resized.shape}")

    if c == 1:
        arr = mel_resized[..., np.newaxis]  # (h, w, 1)
    else:
        # Stack the same spectrogram c times for multi-channel (e.g., pseudo-RGB)
        arr = np.stack([mel_resized] * c, axis=-1)  # (h, w, c)
        logger.info(f"Stacked to {c} channels for {model_name}, arr.shape = {arr.shape}")

    arr = arr.astype(np.float32)
    model_input = np.expand_dims(arr, axis=0)  # (1, h, w, c)
    logger.info(f"Final model_input shape for {model_name}: {model_input.shape}")

    return model_input


@router.post("/api/audio-upload/", tags=["Predictions"])
async def predict_audio(file: UploadFile = File(...), user_id: str = Depends(verify_token)):
    contents = await file.read()
    
    if not _ensure_models_exist(audio_models):
        raise HTTPException(status_code=500, detail="No audio models loaded")
    
    logger.info(f"Available audio models: {list(audio_models.keys())}")  # Log model names

    # Load audio from bytes
    sr = 16000
    try:
        y, _ = librosa.load(io.BytesIO(contents), sr=sr, mono=True)
    except Exception as e:
        logger.warning("Direct load failed, trying temp: %s", e)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmpf:
            tmpf.write(contents)
            tmp_path = tmpf.name
        try:
            y, _ = librosa.load(tmp_path, sr=sr, mono=True)
        finally:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass

    logger.info(f"Loaded audio: len(y)={len(y)}, sr={sr}")

    if len(y) == 0:
        raise HTTPException(status_code=400, detail="Empty audio file")
    
    # Segment into 1-second chunks
    segment_length = sr
    min_segment_length = int(sr * 0.5)  # Skip segments shorter than 0.5s
    segment_fake_probs = []
    
    for start in range(0, len(y), segment_length):
        end = start + segment_length
        seg_y = y[start:end].copy()
        if len(seg_y) < min_segment_length:
            continue
        
        # Pad if shorter than full segment
        if len(seg_y) < segment_length:
            pad_len = segment_length - len(seg_y)
            seg_y = np.pad(seg_y, (0, pad_len), mode='constant')
        
        # Predict for this segment
        seg_probs = []
        for name, model in audio_models.items():
            try:
                model_input = _prepare_audio_input_for_model(model, seg_y, sr=sr, model_name=name)
                raw = model.predict(model_input, verbose=0)
                fake_p = _extract_fake_prob_from_model_output(raw)
                seg_probs.append(fake_p)
                logger.info(f"Model {name} on segment {len(segment_fake_probs)} predicted fake_prob: {fake_p}")
            except Exception as e:
                logger.exception("Segment model %s failed: %s", name, e)
        
        if seg_probs:
            seg_avg_fake_p = float(np.mean(seg_probs))
            segment_fake_probs.append(seg_avg_fake_p)
    
    # Ensemble: mean of all segment fake probabilities
    if not segment_fake_probs:
        logger.error("No valid audio segments processed")
        # Fallback dummy prediction
        pred_label = "real"
        confidence = 0.5
        results = [{"segment_index": 0, "prediction": pred_label, "confidence": confidence}]
        response = {
            "results": results,
            "average_confidence": confidence,
            "overall_prediction": pred_label
        }
        return response
    
    avg_fake_prob = float(np.mean(segment_fake_probs))
    
    # Threshold-based overall label
    fake_threshold = AUDIO_FAKE_THRESHOLD
    overall_pred_label = "fake" if avg_fake_prob > fake_threshold else "real"
    overall_confidence = avg_fake_prob if overall_pred_label == "fake" else 1.0 - avg_fake_prob
    
    # Per-segment results
    results = []
    for i, seg_fake_p in enumerate(segment_fake_probs):
        s_label = "fake" if seg_fake_p > fake_threshold else "real"
        s_conf = seg_fake_p if s_label == "fake" else 1.0 - seg_fake_p
        results.append({
            "segment_index": i,
            "prediction": s_label,
            "fake_prob": float(seg_fake_p),
            "confidence": float(s_conf)
        })
    
    avg_confidence = float(np.mean([r["confidence"] for r in results]))
    
    logger.info("Audio prediction: avg_fake_prob=%.4f, threshold=%.4f, overall_label=%s, avg_confidence=%.4f", 
                avg_fake_prob, fake_threshold, overall_pred_label, avg_confidence)
    
    response = {
        "results": results,
        "average_confidence": avg_confidence,
        "overall_prediction": overall_pred_label
    }
    
    return response


@router.post("/api/upload-image/", tags=["Predictions"])
async def upload_image(file: UploadFile = File(...), user_id: str = None):
    """
    Upload an image and run ensemble image model predictions.
    Returns per-image results and an overall combined decision.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await file.read()

    try:
        # Convert bytes → PIL image
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    # Preprocess image
    try:
        input_data = preprocess_image(contents, augment=False)  # (1,H,W,3)
    except Exception as e:
        logger.exception("Image preprocessing failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to preprocess image")

    # Ensure image models are loaded
    if not _ensure_models_exist(image_models):
        raise HTTPException(status_code=500, detail="No image models available")

    probs_list = []
    for name, model in image_models.items():
        try:
            raw = model.predict(input_data, verbose=0)
            fake_p = _extract_fake_prob_from_model_output(raw)
            probs_list.append(fake_p)
        except Exception as e:
            logger.exception("Model %s failed on image: %s", name, e)

    if not probs_list:
        raise HTTPException(status_code=500, detail="All image models failed to predict")

    # Ensemble (mean of fake probabilities)
    avg_fake_prob = float(np.mean(probs_list))

    # Threshold-based label
    fake_threshold = IMAGE_FAKE_THRESHOLD
    pred_label = "fake" if avg_fake_prob > fake_threshold else "real"
    confidence = avg_fake_prob if pred_label == "fake" else 1.0 - avg_fake_prob

    # Save image for record/debug
    os.makedirs("media/images", exist_ok=True)
    filename = f"{uuid.uuid4()}.jpg"
    save_path = os.path.join("media/images", filename)
    try:
        image.save(save_path)
    except Exception as e:
        logger.warning("Failed to save uploaded image: %s", e)

    # Unified response format (same as video endpoint)
    response = {
        "results": [
            {
                "filename": filename,
                "prediction": pred_label,
                "fake_prob": avg_fake_prob,
                "confidence": confidence
            }
        ],
        "video_fake_prob": None,            # None for image endpoint
        "audio_fake_prob": None,            # None for image endpoint
        "combined_fake_prob": avg_fake_prob,
        "average_confidence": confidence,
        "overall_prediction": pred_label
    }

    logger.info("Image prediction: fake_prob=%.4f, threshold=%.4f, label=%s", avg_fake_prob, fake_threshold, pred_label)

    return response


@router.post("/predict_video", tags=["Predictions"])
async def predict_video(file: UploadFile = File(...), user_id: str = Depends(verify_token)):
    contents = await file.read()
    frames = preprocess_video(contents, augment=False)  # returns array (N, H, W, C)
    if not _ensure_models_exist(image_models):
        raise HTTPException(status_code=500, detail="No image models loaded")
    # Some image models may expect single-frame batches; aggregate by mean across frames
    results = {}
    for name, model in image_models.items():
        try:
            # If no frames, error
            if frames.size == 0:
                results[name] = {"error": "No frames produced by preprocess_video"}
                continue
            preds = model.predict(frames, verbose=0)  # preds shape (num_frames, classes) or similar
            avg = np.mean(preds, axis=0)
            results[name] = avg.tolist()
        except Exception as e:
            logger.exception("Video model prediction failed for %s: %s", name, e)
            results[name] = {"error": str(e)}
    return {"video_predictions": results}


@router.post("/api/upload/", tags=["Predictions"])
async def upload_video(file: UploadFile = File(...), user_id: str = None):
    """
    Upload a video file and run frame-level image model predictions + audio model predictions.
    Returns per-frame results and an overall combined decision.
    """
    if not file.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail="File must be a video")

    contents = await file.read()

    # Keep tmp file until we finish audio extraction as well
    tmp_video = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
    try:
        tmp_video.write(contents)
        tmp_video.flush()
        tmp_path = tmp_video.name
    finally:
        tmp_video.close()

    cap = cv2.VideoCapture(tmp_path)
    if not cap.isOpened():
        os.unlink(tmp_path)
        raise HTTPException(status_code=400, detail="Invalid video file")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
    logger.info("Processing video with %d frames", total_frames)

    results = []
    fake_probs: List[float] = []
    frame_count = 0
    
    target_frames = 9
    sample_every_n = max(1, total_frames // target_frames) if total_frames > 0 else 5

    os.makedirs("media/frames", exist_ok=True)

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            if len(results) >= target_frames:
                break

            # Sample every n frames to reduce processing time
            if frame_count % sample_every_n == 0:
                # convert & prepare bytes for preprocess_image
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frame_pil = Image.fromarray(frame_rgb)
                img_byte_arr = io.BytesIO()
                frame_pil.save(img_byte_arr, format='JPEG')
                img_bytes = img_byte_arr.getvalue()

                # Preprocess and predict using each image model (ensemble)
                try:
                    input_data = preprocess_image(img_bytes, augment=False)  # shape (1,H,W,3)
                except Exception as e:
                    logger.exception("preprocess_image failed at frame %d: %s", frame_count, e)
                    frame_count += 1
                    continue

                if not _ensure_models_exist(image_models):
                    logger.warning("No image models loaded; skipping frame predictions")
                    break

                probs_list = []
                for name, model in image_models.items():
                    try:
                        raw = model.predict(input_data, verbose=0)
                        fake_p = _extract_fake_prob_from_model_output(raw)
                        probs_list.append(fake_p)
                    except Exception as e:
                        logger.exception("Model %s failed on frame %d: %s", name, frame_count, e)

                # If no model provided a prob, skip
                if not probs_list:
                    frame_count += 1
                    continue

                # Ensemble: use mean of fake probabilities (robust)
                avg_fake_p = float(np.mean(probs_list))
                fake_probs.append(avg_fake_p)

                # For frame-level predictions, use threshold for fake prediction
                frame_fake_threshold = 0.5  # Threshold for predicting fake
                pred_label = "fake" if avg_fake_p > frame_fake_threshold else "real"
                confidence = avg_fake_p if pred_label == "fake" else 1.0 - avg_fake_p

                # Debug logging
                logger.info("Frame %d: avg_fake_p=%.4f, threshold=%.4f, pred_label=%s, confidence=%.4f", frame_count, avg_fake_p, frame_fake_threshold, pred_label, confidence)

                filename = f"{uuid.uuid4()}.jpg"
                save_path = os.path.join("media/frames", filename)
                try:
                    frame_pil.save(save_path)
                except Exception as e:
                    logger.exception("Failed to save frame to %s: %s", save_path, e)

                results.append({
                    "frame_index": frame_count,
                    "filename": filename,
                    "prediction": pred_label,
                    "fake_prob": avg_fake_p,
                    "confidence": float(confidence)
                })

            frame_count += 1
    finally:
        cap.release()

    #Ensure we have at least one frame prediction
    if not results:
        #Clean up tmp file before raising
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        raise HTTPException(status_code=400, detail="No frames extracted/predicted from video")

    # Video-level average fake probability
    avg_fake_prob = float(np.mean(fake_probs)) if fake_probs else 0.0
    avg_confidence = float(np.mean([r["confidence"] for r in results])) if results else 0.0

    #----------------------------
    #Extract audio and predict with audio models (segment-wise)
    #----------------------------
    audio_fake_prob = None
    audio_results = None
    audio_temp_wav = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    audio_path = audio_temp_wav.name
    audio_temp_wav.close()

    try:
        # Use ffmpeg to extract audio; keep tmp_path until done
        ffmpeg_cmd = [
            "ffmpeg", "-y", "-i", tmp_path, "-vn",
            "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", audio_path
        ]
        subprocess.run(ffmpeg_cmd, check=True, capture_output=True)

        # Load audio from path
        sr = 16000
        y, _ = librosa.load(audio_path, sr=sr, mono=True)

        if _ensure_models_exist(audio_models) and len(y) > 0:
            # Segment into 1-second chunks
            segment_length = sr
            min_segment_length = int(sr * 0.5)
            segment_fake_probs = []
            
            for start in range(0, len(y), segment_length):
                end = start + segment_length
                seg_y = y[start:end].copy()
                if len(seg_y) < min_segment_length:
                    continue
                
                # Pad if shorter
                if len(seg_y) < segment_length:
                    pad_len = segment_length - len(seg_y)
                    seg_y = np.pad(seg_y, (0, pad_len), mode='constant')
                
                # Predict for this segment
                seg_probs = []
                for name, model in audio_models.items():
                    try:
                        model_input = _prepare_audio_input_for_model(model, seg_y, sr=sr, model_name=name)
                        raw = model.predict(model_input, verbose=0)
                        fake_p = _extract_fake_prob_from_model_output(raw)
                        seg_probs.append(fake_p)
                    except Exception as e:
                        logger.exception("Audio segment model %s failed: %s", name, e)
                
                if seg_probs:
                    seg_avg_fake_p = float(np.mean(seg_probs))
                    segment_fake_probs.append(seg_avg_fake_p)
            
            if segment_fake_probs:
                audio_fake_prob = float(np.mean(segment_fake_probs))
                fake_threshold = AUDIO_FAKE_THRESHOLD
                audio_results = []
                for i, seg_fake_p in enumerate(segment_fake_probs):
                    s_label = "fake" if seg_fake_p > fake_threshold else "real"
                    s_conf = seg_fake_p if s_label == "fake" else 1.0 - seg_fake_p
                    audio_results.append({
                        "segment_index": i,
                        "prediction": s_label,
                        "fake_prob": float(seg_fake_p),
                        "confidence": float(s_conf)
                    })

    except subprocess.CalledProcessError as e:
        logger.exception("ffmpeg audio extraction failed: %s. stdout: %s stderr: %s",
                         e, getattr(e, "stdout", None), getattr(e, "stderr", None))
    except Exception as e:
        logger.exception("Audio extraction or prediction failed: %s", e)
    finally:
        # remove audio temp file
        if os.path.exists(audio_path):
            try:
                os.unlink(audio_path)
            except Exception:
                pass
        # remove tmp video file now that we're done
        if os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception:
                pass

    # ----------------------------
    # Combine video + audio signals
    # ----------------------------
    if audio_fake_prob is None:
        # No audio available / failed -> decision relies on video only (use slightly more conservative threshold)
        overall_fake_prob = avg_fake_prob
    else:
        # Combine by simple average (you can instead weight this by modality reliability)
        overall_fake_prob = float((avg_fake_prob + audio_fake_prob) / 2.0)

    overall_prediction = "fake" if overall_fake_prob > COMBINED_FAKE_THRESHOLD else "real"

    # Debug logging for overall prediction
    logger.info("Overall: video_fake_prob=%.4f, audio_fake_prob=%.4f, combined_fake_prob=%.4f, threshold=%.4f, overall_prediction=%s", avg_fake_prob, audio_fake_prob, overall_fake_prob, COMBINED_FAKE_THRESHOLD, overall_prediction)

    # Do NOT override frame predictions - keep per-frame differences

    response = {
        "results": results,
        "audio_results": audio_results,
        "video_fake_prob": avg_fake_prob,
        "audio_fake_prob": audio_fake_prob,
        "combined_fake_prob": overall_fake_prob,
        "average_confidence": avg_confidence,
        "overall_prediction": overall_prediction
    }

    return response

@router.get("/api/results/", tags=["Predictions"])
async def get_results():
    # Placeholder for getting results, since no storage implemented
    return {
        "results": [],
        "average_confidence": 0.0,
        "overall_prediction": "No results available"
    }