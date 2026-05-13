import numpy as np
import librosa

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

def process_pitches(y, sr):
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
                
    return detected_data
