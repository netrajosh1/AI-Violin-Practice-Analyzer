import librosa
import numpy as np

def analyze_rhythm(y, sr):
    """
    Analyzes the rhythm of the given audio signal.
    Returns estimated tempo, onset times, note durations, and rhythm stability.
    """
    # 1. Onset Detection
    onset_frames = librosa.onset.onset_detect(y=y, sr=sr)
    onset_times = librosa.frames_to_time(onset_frames, sr=sr)
    
    # 2. Duration Analysis
    durations = np.diff(onset_times)
    
    # 3. Tempo Estimation
    tempo_bpm, _ = librosa.beat.beat_track(y=y, sr=sr)
    # tempo_bpm could be an array of length 1, so ensure we return a float
    if isinstance(tempo_bpm, np.ndarray):
        tempo_bpm = tempo_bpm.item()
        
    # 4. Rhythm Stability Metric (Standard deviation of durations)
    # Lower is more stable.
    if len(durations) > 0:
        stability = np.std(durations)
        avg_duration = np.mean(durations)
    else:
        stability = 0.0
        avg_duration = 0.0
        
    return {
        "tempo": float(tempo_bpm),
        "onsets": onset_times.tolist(),
        "durations": durations.tolist(),
        "rhythm_stability": float(stability),
        "average_duration": float(avg_duration)
    }
