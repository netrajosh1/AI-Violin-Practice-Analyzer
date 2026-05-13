import os
import librosa
import numpy as np
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from audio.pitch import process_pitches
from audio.rhythm import analyze_rhythm

app = FastAPI()

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.post("/analyze")
async def analyze_audio(file: UploadFile = File(...)):
    contents = await file.read()
    temp_file = "temp.wav"
    
    with open(temp_file, "wb") as f:
        f.write(contents)

    try:
        # Load audio
        y, sr = librosa.load(temp_file)
        
        # 1. Pitch Analysis
        detected_data = process_pitches(y, sr)
        
        # Calculate pitch summary stats
        avg_cents = 0.0
        abs_avg_cents = 0.0
        graph_data = []
        if detected_data:
            avg_cents = np.mean([d["cents"] for d in detected_data])
            abs_avg_cents = np.mean([abs(d["cents"]) for d in detected_data])
            
            # Filter to display points for the graph (downsample if too many)
            max_points = 200
            step = max(1, len(detected_data) // max_points)
            graph_data = detected_data[::step]
            
        # 2. Rhythm Analysis
        rhythm_data = analyze_rhythm(y, sr)
        
        # 3. Overall Performance Score Calculation
        # Pitch Score (0-100): Lower average deviation is better.
        # Assuming 50 cents off is terrible (score 0), 0 cents is perfect (score 100).
        pitch_score = max(0, 100 - (abs_avg_cents * 2)) if detected_data else 0
        
        # Rhythm Score (0-100): Lower stability standard deviation is better.
        # This is a bit arbitrary without a reference, but we can assign a score.
        # Stability of 0 is perfect (100). Stability of 0.5 seconds is bad (0).
        rhythm_stability = rhythm_data["rhythm_stability"]
        rhythm_score = max(0, 100 - (rhythm_stability * 200)) if rhythm_stability > 0 else 0
        
        # Only compute overall score if we have enough data
        overall_score = (pitch_score + rhythm_score) / 2 if detected_data else 0
        
        return {
            "pitch_analysis": {
                "num_detected_pitches": len(detected_data),
                "average_deviation_cents": round(float(avg_cents), 2),
                "absolute_average_deviation_cents": round(float(abs_avg_cents), 2),
                "graph_data": graph_data,
                "score": round(pitch_score, 1)
            },
            "rhythm_analysis": {
                **rhythm_data,
                "score": round(rhythm_score, 1)
            },
            "overall_score": round(overall_score, 1)
        }
    except Exception as e:
        return {"error": str(e)}
    finally:
        # Clean up temp file
        if os.path.exists(temp_file):
            os.remove(temp_file)
