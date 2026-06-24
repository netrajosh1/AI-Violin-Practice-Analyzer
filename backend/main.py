import os
import librosa
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware

from audio.pitch import process_pitches
from audio.rhythm import analyze_rhythm
from audio.midi_compare import (
    compare_audio_to_midi,
    align_notes_to_bpm_grid,
    parse_midi,
    make_monophonic,
    extract_played_notes
)
from audio.feedback import generate_feedback

app = FastAPI()

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


@app.post("/rhythm")
async def analyze_rhythm_endpoint(file: UploadFile = File(...)):
    """Accept a WAV/MP3 audio file and return rhythm analysis JSON.
    This endpoint is useful for clients that need only rhythm metrics without pitch processing.
    """
    # Read uploaded file into temporary file
    contents = await file.read()
    temp_file = "temp_rhythm.wav"
    with open(temp_file, "wb") as f:
        f.write(contents)
    try:
        y, sr = librosa.load(temp_file)
        rhythm_data = analyze_rhythm(y, sr)
        return rhythm_data
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}
    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)

async def analyze_audio(
    file: UploadFile = File(...),
    midi_file: Optional[UploadFile] = File(None),
    expected_bpm: Optional[float] = Form(None)
):
    contents = await file.read()
    temp_file = "temp.wav"
    
    with open(temp_file, "wb") as f:
        f.write(contents)

    temp_midi = None
    if midi_file and midi_file.filename:
        midi_contents = await midi_file.read()
        if midi_contents:
            temp_midi = "temp.mid"
            with open(temp_midi, "wb") as f:
                f.write(midi_contents)

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
        
        # 3. Alignment Analysis (MIDI or Metronome BPM Grid)
        alignment_data = None
        
        # Convert detected audio onsets and pitches into a list of notes
        actual_notes = []
        if detected_data and rhythm_data.get("onsets"):
            actual_notes = extract_played_notes(rhythm_data["onsets"], detected_data)
            
        if temp_midi:
            expected_notes = parse_midi(temp_midi)
            expected_mono = make_monophonic(expected_notes)
            alignment_data = compare_audio_to_midi(actual_notes, expected_mono)
        elif expected_bpm and expected_bpm > 0:
            alignment_data = align_notes_to_bpm_grid(actual_notes, expected_bpm)
            
        # 4. Overall Performance Score Calculation
        # Pitch Score (0-100)
        pitch_score = max(0, 100 - (abs_avg_cents * 2)) if detected_data else 0
        
        # Rhythm Score (0-100)
        if alignment_data:
            rhythm_score = alignment_data["score"]
        else:
            rhythm_stability = rhythm_data["rhythm_stability"]
            rhythm_score = max(0, 100 - (rhythm_stability * 200)) if rhythm_stability > 0 else 0
            
        # Only compute overall score if we have enough data
        overall_score = (pitch_score + rhythm_score) / 2 if detected_data else 0
        
        # Create standard dictionary for pitch_analysis
        pitch_analysis_dict = {
            "num_detected_pitches": len(detected_data),
            "average_deviation_cents": round(float(avg_cents), 2),
            "absolute_average_deviation_cents": round(float(abs_avg_cents), 2),
            "graph_data": graph_data,
            "score": round(pitch_score, 1)
        }
        
        # Create standard dictionary for rhythm_analysis
        rhythm_analysis_dict = {
            **rhythm_data,
            "score": round(rhythm_score, 1)
        }
        
        # 5. Coaching Feedback Generation
        coaching_feedback = generate_feedback(pitch_analysis_dict, rhythm_analysis_dict, alignment_data)
        
        return {
            "pitch_analysis": pitch_analysis_dict,
            "rhythm_analysis": rhythm_analysis_dict,
            "alignment_analysis": alignment_data,
            "coaching_feedback": coaching_feedback,
            "overall_score": round(overall_score, 1)
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}
    finally:
        # Clean up temp files
        if os.path.exists(temp_file):
            os.remove(temp_file)
        if temp_midi and os.path.exists(temp_midi):
            os.remove(temp_midi)
