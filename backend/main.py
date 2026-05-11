import os
import librosa
import numpy as np
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F',
              'F#', 'G', 'G#', 'A', 'A#', 'B']

def analyze_pitch(freq):
    if freq <= 0:
        return None, None

    # Calculate MIDI note number
    midi_exact = 69 + 12 * np.log2(freq / 440.0)
    midi = round(midi_exact)

    note = NOTE_NAMES[midi % 12]
    octave = (midi // 12) - 1
    note_name = f"{note}{octave}"

    # Calculate target frequency for the note
    target_freq = 440.0 * (2.0 ** ((midi - 69) / 12.0))
    
    # Calculate cents deviation
    cents = 1200 * np.log2(freq / target_freq)
    
    return note_name, cents

@app.post("/analyze")
async def analyze_audio(file: UploadFile = File(...)):
    contents = await file.read()
    temp_file = "temp.wav"
    
    with open(temp_file, "wb") as f:
        f.write(contents)

    # Load audio
    y, sr = librosa.load(temp_file)
    
    # Extract pitch
    pitches, magnitudes = librosa.piptrack(y=y, sr=sr)

    # Process pitches over time
    detected_data = []
    
    for t in range(pitches.shape[1]):
        index = magnitudes[:, t].argmax()
        pitch = pitches[index, t]
        
        # Only consider pitch if magnitude is significant to avoid noise
        if pitch > 0 and magnitudes[index, t] > np.max(magnitudes[:, t]) * 0.1:
            note_name, cents = analyze_pitch(pitch)
            if note_name:
                detected_data.append({
                    "time": float(t * 512 / sr),  # hop_length is 512 by default
                    "pitch": float(pitch),
                    "note": note_name,
                    "cents": float(cents)
                })

    # Clean up temp file
    if os.path.exists(temp_file):
        os.remove(temp_file)

    # Calculate some summary stats
    if not detected_data:
        return {"error": "No pitch detected"}
        
    avg_cents = np.mean([d["cents"] for d in detected_data])
    abs_avg_cents = np.mean([abs(d["cents"]) for d in detected_data])
    
    # Filter to display points for the graph (downsample if too many)
    max_points = 200
    step = max(1, len(detected_data) // max_points)
    graph_data = detected_data[::step]

    return {
        "num_detected_pitches": len(detected_data),
        "average_deviation_cents": round(float(avg_cents), 2),
        "absolute_average_deviation_cents": round(float(abs_avg_cents), 2),
        "graph_data": graph_data
    }
