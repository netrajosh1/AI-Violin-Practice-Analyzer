import mido
import numpy as np
from audio.pitch import NOTE_NAMES

def parse_midi(midi_path):
    """
    Parses a MIDI file and returns a list of notes with:
    - note_num: MIDI note number (0-127)
    - note_name: string name (e.g. C4)
    - onset: onset time in seconds from the start of the file
    - duration: duration of the note in seconds
    """
    try:
        mid = mido.MidiFile(midi_path)
    except Exception as e:
        print(f"Error reading MIDI file: {e}")
        return []
    
    notes = []
    active_notes = {}
    current_time = 0.0
    
    for msg in mid:
        current_time += msg.time
        if msg.type == 'note_on' and msg.velocity > 0:
            if msg.note not in active_notes:
                active_notes[msg.note] = []
            active_notes[msg.note].append(current_time)
        elif msg.type == 'note_off' or (msg.type == 'note_on' and msg.velocity == 0):
            if msg.note in active_notes and active_notes[msg.note]:
                onset = active_notes[msg.note].pop(0)
                duration = current_time - onset
                
                note_idx = msg.note % 12
                note_name = NOTE_NAMES[note_idx]
                octave = (msg.note // 12) - 1
                
                notes.append({
                    "note_num": int(msg.note),
                    "note_name": f"{note_name}{octave}",
                    "onset": float(onset),
                    "duration": float(duration)
                })
                
    # Sort notes by onset time
    notes.sort(key=lambda x: x["onset"])
    return notes

def make_monophonic(notes):
    """
    Filters overlapping notes, keeping the one with the higher note number.
    """
    if not notes:
        return []
    
    monophonic = []
    for note in notes:
        if not monophonic:
            monophonic.append(note)
        else:
            prev = monophonic[-1]
            # If notes overlap or start within 100ms of each other,
            # resolve to the higher pitch note to keep it monophonic.
            if note["onset"] - prev["onset"] < 0.10:
                if note["note_num"] > prev["note_num"]:
                    monophonic[-1] = note
            else:
                monophonic.append(note)
    return monophonic

def align_sequences(actual_notes, expected_notes):
    """
    Aligns actual_notes (list of dicts) with expected_notes (list of dicts)
    using Needleman-Wunsch sequence alignment.
    Returns list of matched pairs: (actual_index, expected_index)
    """
    n = len(actual_notes)
    m = len(expected_notes)
    
    if n == 0 or m == 0:
        return []
        
    dp = np.zeros((n + 1, m + 1))
    parent = {}
    
    # Gap penalty (for insertion/deletion)
    GAP_PENALTY = -1.5
    
    # Initialize boundaries
    for i in range(1, n + 1):
        dp[i][0] = i * GAP_PENALTY
        parent[(i, 0)] = (i - 1, 0)
    for j in range(1, m + 1):
        dp[0][j] = j * GAP_PENALTY
        parent[(0, j)] = (0, j - 1)
        
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            act_note = actual_notes[i-1]["note_num"]
            exp_note = expected_notes[j-1]["note_num"]
            
            # Match score: Reward matching notes, smaller penalty for octaves/semitones
            if act_note == exp_note:
                match_score = 3.0
            elif abs(act_note - exp_note) == 12:  # Octave error
                match_score = 1.0
            elif abs(act_note - exp_note) <= 2:   # Minor pitch deviation
                match_score = 0.5
            else:
                match_score = -2.0
                
            # Decisions
            score_match = dp[i-1][j-1] + match_score
            score_skip_act = dp[i-1][j] + GAP_PENALTY
            score_skip_exp = dp[i][j-1] + GAP_PENALTY
            
            best_score = max(score_match, score_skip_act, score_skip_exp)
            dp[i][j] = best_score
            
            if best_score == score_match:
                parent[(i, j)] = (i - 1, j - 1)
            elif best_score == score_skip_act:
                parent[(i, j)] = (i - 1, j)
            else:
                parent[(i, j)] = (i, j - 1)
                
    # Backtrack to find alignment
    align_pairs = []
    curr = (n, m)
    while curr != (0, 0):
        prev = parent.get(curr)
        if not prev:
            break
        if prev[0] == curr[0] - 1 and prev[1] == curr[1] - 1:
            align_pairs.append((curr[0] - 1, curr[1] - 1))
        curr = prev
        
    align_pairs.reverse()
    return align_pairs

def fit_tempo_and_offset(align_pairs, actual_notes, expected_notes):
    """
    Fits actual_onset = scale * expected_onset + offset.
    Returns:
      - scale: tempo ratio (actual tempo / expected tempo)
      - offset: start delay latency (in seconds)
    """
    if len(align_pairs) < 2:
        if len(align_pairs) == 1:
            a_idx, e_idx = align_pairs[0]
            return 1.0, float(actual_notes[a_idx]["onset"] - expected_notes[e_idx]["onset"])
        return 1.0, 0.0
        
    x = np.array([expected_notes[e_idx]["onset"] for _, e_idx in align_pairs])
    y = np.array([actual_notes[a_idx]["onset"] for a_idx, _ in align_pairs])
    
    if np.all(x == x[0]):
        return 1.0, float(np.mean(y - x))
        
    slope, intercept = np.polyfit(x, y, 1)
    
    # Constrain to realistic tempos (between 0.4x and 2.5x speed)
    if slope < 0.4 or slope > 2.5:
        return 1.0, float(np.mean(y - x))
        
    return float(slope), float(intercept)

def compare_audio_to_midi(actual_notes, expected_notes):
    """
    Compares the detected notes from audio against expected MIDI notes.
    """
    if not actual_notes:
        return {
            "matches": [],
            "unmatched_actual": [],
            "unmatched_expected": expected_notes,
            "tempo_scale": 1.0,
            "latency_offset": 0.0,
            "score": 0.0
        }
        
    if not expected_notes:
        return {
            "matches": [],
            "unmatched_actual": actual_notes,
            "unmatched_expected": [],
            "tempo_scale": 1.0,
            "latency_offset": 0.0,
            "score": 0.0
        }

    # Sequence Alignment
    align_pairs = align_sequences(actual_notes, expected_notes)
    
    # Fit tempo scale & delay offset
    scale, offset = fit_tempo_and_offset(align_pairs, actual_notes, expected_notes)
    
    # Calculate note comparisons
    matches = []
    matched_actual_indices = set()
    matched_expected_indices = set()
    
    for a_idx, e_idx in align_pairs:
        act_note = actual_notes[a_idx]
        exp_note = expected_notes[e_idx]
        
        # Apply tempo scaling and start delay offset to the expected timing
        corrected_onset = (exp_note["onset"] * scale) + offset
        
        timing_error = act_note["onset"] - corrected_onset
        
        matches.append({
            "actual_index": a_idx,
            "expected_index": e_idx,
            "note_num": act_note["note_num"],
            "note_name": act_note["note_name"],
            "actual_onset": float(act_note["onset"]),
            "expected_onset": float(corrected_onset),
            "expected_duration": float(exp_note["duration"] * scale),
            "timing_error": float(timing_error),
            "timing_error_ms": float(timing_error * 1000.0),
            # Tolerances: ±60ms is considered on-time for general performance
            "status": "on-time" if abs(timing_error) <= 0.06 else ("late" if timing_error > 0 else "early")
        })
        
        matched_actual_indices.add(a_idx)
        matched_expected_indices.add(e_idx)
        
    # Unmatched actuals (insertions - extra notes played)
    unmatched_actual = [
        note for i, note in enumerate(actual_notes) if i not in matched_actual_indices
    ]
    
    # Unmatched expected (deletions - missed notes)
    unmatched_expected = [
        note for i, note in enumerate(expected_notes) if i not in matched_expected_indices
    ]
    
    # Timing score calculation
    pct_on_time = (sum(1 for m in matches if m["status"] == "on-time") / len(matches) * 100) if matches else 0
    avg_abs_err_ms = np.mean([abs(m["timing_error_ms"]) for m in matches]) if matches else 0
    
    # Penalty for timing error (0 error = 0 penalty, 200ms error = 100 penalty)
    error_penalty = min(100.0, avg_abs_err_ms * 0.5)
    timing_score = (pct_on_time * 0.6) + ((100.0 - error_penalty) * 0.4)
    
    # Adjust score if there are many unmatched notes (missed or extra notes)
    total_expected = len(expected_notes)
    if total_expected > 0:
        completion_ratio = len(matches) / total_expected
        timing_score = timing_score * completion_ratio
        
    return {
        "matches": matches,
        "unmatched_actual": unmatched_actual,
        "unmatched_expected": unmatched_expected,
        "tempo_scale": float(scale),
        "latency_offset": float(offset),
        "score": round(float(timing_score), 1)
    }

def align_notes_to_bpm_grid(actual_notes, expected_bpm):
    """
    Aligns actual_notes to a metronome sixteenth-note grid at the expected BPM.
    """
    if not actual_notes or expected_bpm <= 0:
        return {
            "matches": [],
            "score": 0.0
        }
        
    beat_duration = 60.0 / expected_bpm
    grid_unit = beat_duration / 4.0  # Sixteenth note grid
    
    onsets = [n["onset"] for n in actual_notes]
    
    # Find the latency offset by finding the median phase of notes relative to the grid
    mod_values = [onset % grid_unit for onset in onsets]
    offset = float(np.median(mod_values))
    
    matches = []
    for i, note in enumerate(actual_notes):
        onset = note["onset"]
        
        # Round to the nearest grid step
        grid_idx = round((onset - offset) / grid_unit)
        expected_onset = offset + grid_idx * grid_unit
        
        timing_error = onset - expected_onset
        
        matches.append({
            "actual_index": i,
            "expected_index": i,
            "note_num": note["note_num"],
            "note_name": note["note_name"],
            "actual_onset": float(onset),
            "expected_onset": float(expected_onset),
            "expected_duration": float(grid_unit),
            "timing_error": float(timing_error),
            "timing_error_ms": float(timing_error * 1000.0),
            "status": "on-time" if abs(timing_error) <= 0.06 else ("late" if timing_error > 0 else "early")
        })
        
    # Calculate score
    pct_on_time = (sum(1 for m in matches if m["status"] == "on-time") / len(matches) * 100) if matches else 0
    avg_abs_err_ms = np.mean([abs(m["timing_error_ms"]) for m in matches]) if matches else 0
    
    error_penalty = min(100.0, avg_abs_err_ms * 0.5)
    timing_score = (pct_on_time * 0.6) + ((100.0 - error_penalty) * 0.4)
    
    return {
        "matches": matches,
        "unmatched_actual": [],
        "unmatched_expected": [],
        "tempo_scale": 1.0,
        "latency_offset": float(offset),
        "score": round(float(timing_score), 1)
    }

def extract_played_notes(onset_times, detected_pitches):
    """
    Given audio onset timestamps and a list of detected pitch points over time,
    extracts the notes played at each onset.
    """
    if not onset_times or not detected_pitches:
        return []
        
    played_notes = []
    pitches = sorted(detected_pitches, key=lambda x: x["time"])
    
    for idx, onset in enumerate(onset_times):
        next_onset = onset_times[idx+1] if idx < len(onset_times) - 1 else onset + 1.5
        end_time = min(next_onset, onset + 0.5)
        
        window_pitches = [p for p in pitches if onset <= p["time"] < end_time]
        
        if window_pitches:
            freqs = [p["pitch"] for p in window_pitches]
            median_freq = np.median(freqs)
            
            midi_exact = 69 + 12 * np.log2(median_freq / 440.0)
            note_num = int(round(midi_exact))
            
            note_idx = note_num % 12
            note_name = NOTE_NAMES[note_idx]
            octave = (note_num // 12) - 1
            
            played_notes.append({
                "note_num": note_num,
                "note_name": f"{note_name}{octave}",
                "onset": float(onset),
                "duration": float(next_onset - onset)
            })
        else:
            subsequent = [p for p in pitches if p["time"] >= onset]
            if subsequent and subsequent[0]["time"] - onset < 0.2:
                p = subsequent[0]
                midi_exact = 69 + 12 * np.log2(p["pitch"] / 440.0)
                note_num = int(round(midi_exact))
                note_idx = note_num % 12
                note_name = NOTE_NAMES[note_idx]
                octave = (note_num // 12) - 1
                
                played_notes.append({
                    "note_num": note_num,
                    "note_name": f"{note_name}{octave}",
                    "onset": float(onset),
                    "duration": float(next_onset - onset)
                })
    return played_notes

