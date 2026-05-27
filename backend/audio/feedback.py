import numpy as np

def generate_feedback(pitch_data, rhythm_data, alignment_data=None):
    """
    Generates structured, professional coaching feedback items based on the analysis.
    Returns a dict with:
      - overall_summary: str
      - intonation_points: list of str
      - rhythm_points: list of str
      - strengths: list of str
      - improvements: list of str
    """
    feedback = {
        "overall_summary": "",
        "intonation_points": [],
        "rhythm_points": [],
        "strengths": [],
        "improvements": []
    }
    
    # ------------------ PITCH & INTONATION ANALYSIS ------------------
    has_pitch = pitch_data and pitch_data.get("num_detected_pitches", 0) > 0
    if has_pitch:
        avg_dev = pitch_data.get("average_deviation_cents", 0.0)
        abs_dev = pitch_data.get("absolute_average_deviation_cents", 0.0)
        
        # Core Intonation Assessment
        if abs_dev < 10.0:
            feedback["intonation_points"].append(
                f"Excellent pitch accuracy! Your absolute deviation averages just {abs_dev} cents, demonstrating a highly trained ear and accurate finger placement."
            )
            feedback["strengths"].append("Highly accurate pitch centering (under 10 cents average deviation).")
        elif abs_dev < 20.0:
            feedback["intonation_points"].append(
                f"Good general intonation. Your absolute average deviation is {abs_dev} cents, which is well within acceptable performance standards."
            )
            feedback["strengths"].append("Stable relative tuning in general positions.")
        else:
            feedback["intonation_points"].append(
                f"Your absolute average deviation is {abs_dev} cents. This is high enough to sound noticeably out-of-tune. Try practicing slowly and listening to reference pitches."
            )
            feedback["improvements"].append("Center your pitches more accurately (reduce absolute cents deviation).")
            
        # Directional Tendency (Sharp vs Flat)
        if avg_dev > 7.0:
            feedback["intonation_points"].append(
                f"You have a tendency to play sharp overall (averaging +{avg_dev} cents). This is often caused by hand tension or lifting fingers too high."
            )
            feedback["improvements"].append("Correct a general tendency to play sharp.")
        elif avg_dev < -7.0:
            feedback["intonation_points"].append(
                f"You have a tendency to play flat overall (averaging {avg_dev} cents). Focus on keeping your hand frame compact and extending your fingers fully."
            )
            feedback["improvements"].append("Correct a general tendency to play flat.")
            
        # Specific Note Analysis
        note_deviations = {}
        for pt in pitch_data.get("graph_data", []):
            note = pt.get("note", "")
            if note:
                # Group by note name (strip octaves)
                note_base = "".join([c for c in note if not c.isdigit()])
                if note_base not in note_deviations:
                    note_deviations[note_base] = []
                note_deviations[note_base].append(pt.get("cents", 0.0))
                
        worst_note = None
        worst_note_avg = 0.0
        for note, cents_list in note_deviations.items():
            if len(cents_list) >= 4:  # Only look at notes played enough times
                avg_note_cents = np.mean(cents_list)
                if abs(avg_note_cents) > abs(worst_note_avg):
                    worst_note = note
                    worst_note_avg = avg_note_cents
                    
        if worst_note and abs(worst_note_avg) > 12.0:
            direction = "sharp" if worst_note_avg > 0 else "flat"
            feedback["intonation_points"].append(
                f"Your '{worst_note}' notes were consistently {direction} (averaging {worst_note_avg:+.1f} cents). Watch finger spacing for this specific pitch."
            )
            feedback["improvements"].append(f"Work on finger placement for '{worst_note}' notes.")

    # ------------------ RHYTHM & TEMPO ANALYSIS ------------------
    if rhythm_data:
        tempo = rhythm_data.get("tempo", 0.0)
        stability = rhythm_data.get("rhythm_stability", 0.0)
        
        feedback["rhythm_points"].append(f"Performance tempo estimated around {round(tempo)} BPM.")
        
        if not alignment_data:
            # Self-consistency based feedback
            if stability < 0.09:
                feedback["rhythm_points"].append(
                    "Superb internal rhythm consistency! The duration spacing between note onsets is extremely steady."
                )
                feedback["strengths"].append("Outstanding rhythmic consistency (very steady note spacing).")
            elif stability < 0.20:
                feedback["rhythm_points"].append(
                    "Solid basic timing. Note lengths are relatively steady, though there is room for minor polishing."
                )
                feedback["strengths"].append("Steady timing during standard note values.")
            else:
                feedback["rhythm_points"].append(
                    f"Rhythm stability has high variance ({stability:.2f}s deviation). If this is a piece with a steady beat, try practicing with a metronome."
                )
                feedback["improvements"].append("Improve rhythmic consistency (high variation in note durations).")

    # ------------------ ALIGNMENT & REFERENCE COMPARISON ------------------
    if alignment_data and alignment_data.get("matches"):
        matches = alignment_data["matches"]
        errors = [m["timing_error"] for m in matches]
        abs_errors_ms = [abs(m["timing_error_ms"]) for m in matches]
        
        avg_err_ms = np.mean([m["timing_error_ms"] for m in matches])
        abs_avg_err_ms = np.mean(abs_errors_ms)
        
        # Calculate On-Time percentage
        on_time_count = sum(1 for m in matches if m["status"] == "on-time")
        pct_on_time = (on_time_count / len(matches)) * 100
        
        # Alignment Rhythmic Feedback
        feedback["rhythm_points"].append(
            f"Timing Accuracy: {pct_on_time:.1f}% of notes were played on time (within ±60ms of reference beat)."
        )
        
        if pct_on_time >= 80.0:
            feedback["rhythm_points"].append(
                "Superb synchronization! You matched the expected note onset timings with high precision."
            )
            feedback["strengths"].append("Excellent note onset precision and synchronization.")
        elif pct_on_time >= 55.0:
            feedback["rhythm_points"].append(
                f"Decent beat alignment (average discrepancy of {abs_avg_err_ms:.1f}ms). A little extra focus will lock it in."
            )
            feedback["strengths"].append("Moderate synchronization with the backing rhythm.")
        else:
            feedback["rhythm_points"].append(
                f"Low timing precision (average error of {abs_avg_err_ms:.1f}ms). You are frequently out of sync with the reference beat."
            )
            feedback["improvements"].append("Practice matching note starts exactly to expected pulse beats.")
            
        # Rushing vs Dragging Check
        if avg_err_ms < -15.0:
            feedback["rhythm_points"].append(
                f"You have a tendency to rush (playing an average of {abs(avg_err_ms):.1f}ms early). Try to feel the backend of the beat."
            )
            feedback["improvements"].append("Correct a tendency to rush/play ahead of the beat.")
        elif avg_err_ms > 15.0:
            feedback["rhythm_points"].append(
                f"You have a tendency to drag (playing an average of {avg_err_ms:.1f}ms late). Anticipate string changes and shifts."
            )
            feedback["improvements"].append("Correct a tendency to drag/play behind the beat.")
            
        # Unmatched actuals (extra notes)
        unmatched_act = alignment_data.get("unmatched_actual", [])
        if len(unmatched_act) > len(matches) * 0.2:
            feedback["rhythm_points"].append(
                f"Detected {len(unmatched_act)} extra notes not present in the expected sequence. Check for clean string crossings to avoid ghost notes."
            )
            feedback["improvements"].append("Clean up accidental finger slips or string noise (extra note triggers).")
            
        # Unmatched expected (missed notes)
        unmatched_exp = alignment_data.get("unmatched_expected", [])
        if len(unmatched_exp) > 0:
            feedback["rhythm_points"].append(
                f"Missed {len(unmatched_exp)} expected notes from the reference. Focus on executing all note heads cleanly."
            )
            feedback["improvements"].append(f"Ensure all notes are articulated (missed {len(unmatched_exp)} notes).")

        # Rhythmic stability drift (fatigue check)
        n_matches = len(matches)
        if n_matches >= 8:
            first_half_err = np.mean(abs_errors_ms[:n_matches//2])
            second_half_err = np.mean(abs_errors_ms[n_matches//2:])
            if second_half_err - first_half_err > 25.0:
                feedback["rhythm_points"].append(
                    "Your timing errors increased significantly in the second half. Focus on maintaining mental stamina and a steady tempo."
                )
                feedback["improvements"].append("Maintain rhythmic precision in longer passages (prevent timing drift).")

    # ------------------ OVERALL COACH SUMMARY ------------------
    pitch_score = pitch_data.get("score", 0) if has_pitch else 0
    rhythm_score = (alignment_data.get("score", 0) if alignment_data else rhythm_data.get("score", 0)) if rhythm_data else 0
    
    # Calculate weighted overall score
    overall = (pitch_score + rhythm_score) / 2 if (has_pitch and rhythm_data) else (pitch_score or rhythm_score)
    
    if overall >= 85.0:
        feedback["overall_summary"] = (
            "Fantastic work! You demonstrated excellent control. Your pitches are well-centered, and your timing aligns closely with the reference beats. Continue to polish minor details to make it performance-ready!"
        )
    elif overall >= 70.0:
        feedback["overall_summary"] = (
            "Solid performance with a good foundation. You have solid pitch and rhythmic awareness. Focus on slow practice to smooth out minor tuning tendencies and maintain tempo consistency."
        )
    else:
        feedback["overall_summary"] = (
            "A good practice run, but there are areas that need attention. Focus on using a metronome to stabilize your tempo, and slow down your practice to verify finger placement for intonation."
        )
        
    # Ensure lists are not empty
    if not feedback["strengths"]:
        feedback["strengths"].append("Able to produce recognizable note boundaries.")
    if not feedback["improvements"]:
        feedback["improvements"].append("Practice with metronome support for general coordination.")
        
    return feedback
