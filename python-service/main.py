from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from textgrids import TextGrid

import librosa
import numpy as np
import parselmouth

import shutil
import subprocess
import uuid
import os

app = FastAPI()

# =========================
# CONFIG
# =========================

CONDA_EXE = r"C:\Users\DELL\miniconda3\Scripts\conda.exe"

FILLERS = [
    "um",
    "uh",
    "like",
    "you know",
    "actually",
    "basically"
]

# =========================
# HELPERS
# =========================

def parse_alignment(textgrid_path):

    tg = TextGrid(textgrid_path)

    word_tier = tg["words"]

    words = []

    for interval in word_tier:

        if interval.text.strip():

            words.append({
                "word": interval.text,
                "start": float(interval.xmin),
                "end": float(interval.xmax),
                "duration": float(interval.xmax - interval.xmin)
            })

    return words


def calculate_speech_rate(words, duration):

    if duration <= 0:
        return 0

    return len(words) / (duration / 60)


def calculate_articulation_rate(words):

    if not words:
        return 0

    speaking_time = sum(
        w["duration"] for w in words
    )

    if speaking_time <= 0:
        return 0

    return len(words) / (speaking_time / 60)


def analyze_pauses(words):

    pauses = []

    for i in range(len(words) - 1):

        gap = words[i + 1]["start"] - words[i]["end"]

        if gap > 0:
            pauses.append(gap)

    long_pauses = [p for p in pauses if p > 0.7]

    return {
        "avg_pause": float(np.mean(pauses)) if pauses else 0,
        "max_pause": float(np.max(pauses)) if pauses else 0,
        "pause_count": len(pauses),
        "long_pause_count": len(long_pauses)
    }


def detect_fillers(transcript):

    count = 0

    lower = transcript.lower()

    for filler in FILLERS:
        count += lower.count(filler)

    return count


def detect_repetition(words):

    repeated = 0

    for i in range(len(words) - 1):

        if words[i]["word"].lower() == words[i + 1]["word"].lower():
            repeated += 1

    return repeated


def analyze_pitch(audio_path):

    snd = parselmouth.Sound(audio_path)

    pitch = snd.to_pitch()

    values = pitch.selected_array['frequency']

    values = values[values > 0]

    if len(values) == 0:
        return {
            "mean_pitch": 0,
            "pitch_variance": 0
        }

    return {
        "mean_pitch": float(np.mean(values)),
        "pitch_variance": float(np.var(values))
    }


def lexical_features(transcript):

    words = [
        w.lower()
        for w in transcript.split()
        if w.strip()
    ]

    unique_words = set(words)

    word_count = len(words)

    type_token_ratio = (
        len(unique_words) / word_count
        if word_count > 0
        else 0
    )

    return {
        "word_count": word_count,
        "unique_word_count": len(unique_words),
        "type_token_ratio": round(type_token_ratio, 3)
    }


def find_textgrid(output_dir):

    for root, dirs, files in os.walk(output_dir):

        for file in files:

            if file.endswith(".TextGrid"):
                return os.path.join(root, file)

    return None


# =========================
# API
# =========================

@app.post("/analyze")
async def analyze_audio(
    file: UploadFile = File(...),
    transcript: str = Form("")
):

    uid = str(uuid.uuid4())

    corpus_dir = os.path.join("temp", uid)
    output_dir = os.path.join("output", uid)

    os.makedirs(corpus_dir, exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)

    audio_ext = os.path.splitext(file.filename)[1]

    if not audio_ext:
        audio_ext = ".wav"

    audio_path = os.path.join(
        corpus_dir,
        f"sample{audio_ext}"
    )

    txt_path = os.path.join(
        corpus_dir,
        "sample.txt"
    )

    # =========================
    # SAVE AUDIO
    # =========================

    with open(audio_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # =========================
    # SAVE TRANSCRIPT
    # =========================

    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(transcript)

    # =========================
    # MFA ALIGN
    # =========================

    command = [
        CONDA_EXE,
        "run",
        "-n",
        "mfa",
        "mfa",
        "align",
        corpus_dir,
        "english_us_arpa",
        "english_us_arpa",
        output_dir,
        "--single_speaker",
        "--clean"
    ]

    try:

        print("RUNNING MFA COMMAND:")
        print(command)

        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="ignore"
        )

        print("RETURN CODE:", result.returncode)
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)

        if result.returncode != 0:

            return JSONResponse(
                status_code=500,
                content={
                    "error": "MFA alignment failed",
                    "details": result.stderr
                }
            )

    except Exception as e:

        return JSONResponse(
            status_code=500,
            content={
                "error": "MFA process crashed",
                "details": str(e)
            }
        )

    # =========================
    # FIND TEXTGRID
    # =========================

    textgrid_path = find_textgrid(output_dir)

    if not textgrid_path:

        return JSONResponse(
            status_code=500,
            content={
                "error": "TextGrid not found"
            }
        )

    print("TEXTGRID:", textgrid_path)

    # =========================
    # PARSE ALIGNMENT
    # =========================

    words = parse_alignment(textgrid_path)

    # =========================
    # AUDIO ANALYSIS
    # =========================

    y, sr = librosa.load(audio_path)

    duration = librosa.get_duration(
        y=y,
        sr=sr
    )

    speech_rate = calculate_speech_rate(
        words,
        duration
    )

    articulation_rate = calculate_articulation_rate(
        words
    )

    pause_data = analyze_pauses(words)

    filler_count = detect_fillers(transcript)

    repetition_count = detect_repetition(words)

    pitch_data = analyze_pitch(audio_path)

    lexical_data = lexical_features(transcript)

    reliability = 1.0

    if duration < 20:
        reliability -= 0.3

    if lexical_data["word_count"] < 40:
        reliability -= 0.3

    reliability = max(
        0.2,
        round(reliability, 2)
    )

    metrics = {

        # AUDIO
        "duration": round(duration, 2),

        # FLUENCY
        "speech_rate": round(speech_rate, 2),
        "articulation_rate": round(articulation_rate, 2),

        # PAUSES
        "avg_pause": round(pause_data["avg_pause"], 3),
        "max_pause": round(pause_data["max_pause"], 3),
        "pause_count": pause_data["pause_count"],
        "long_pause_count": pause_data["long_pause_count"],

        # DISFLUENCY
        "filler_count": filler_count,
        "repetition_count": repetition_count,

        # PRONUNCIATION
        "mean_pitch": round(
            pitch_data["mean_pitch"],
            2
        ),

        "pitch_variance": round(
            pitch_data["pitch_variance"],
            2
        ),

        # LEXICAL
        "word_count": lexical_data["word_count"],
        "unique_word_count": lexical_data["unique_word_count"],
        "type_token_ratio": lexical_data["type_token_ratio"],

        # QUALITY
        "reliability": reliability
    }

    return metrics