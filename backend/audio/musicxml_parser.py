import xml.etree.ElementTree as ET
import os
from typing import List, Dict

# Mapping of pitch step to semitone offset
STEP_TO_SEMITONE = {
    "C": 0,
    "D": 2,
    "E": 4,
    "F": 5,
    "G": 7,
    "A": 9,
    "B": 11,
}

NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def parse_musicxml(file_path: str) -> List[Dict]:
    """Parse a MusicXML file and return a list of notes.

    Each note dict contains:
        - note_num: MIDI note number (0-127)
        - note_name: e.g., "C4"
        - onset: onset time in seconds
        - duration: duration in seconds

    The parser assumes a constant tempo derived from the first <direction> element
    (or defaults to 120 BPM) and uses the <divisions> value for timing resolution.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"MusicXML file not found: {file_path}")

    tree = ET.parse(file_path)
    root = tree.getroot()

    # MusicXML namespace handling (optional)
    ns = {"m": root.tag.split('}')[0].strip('{')} if '}' in root.tag else {}
    def find(elem, path):
        return elem.find(path, ns) if ns else elem.find(path)
    def findall(elem, path):
        return elem.findall(path, ns) if ns else elem.findall(path)

    # Default values
    divisions = 1
    tempo = 120.0  # BPM

    # Locate the first part
    part = find(root, "m:part" if ns else "part")
    if part is None:
        raise ValueError("No <part> element found in MusicXML.")

    # Scan for global attributes
    for measure in findall(part, "m:measure" if ns else "measure"):
        # Divisions (ticks per quarter note)
        attributes = find(measure, "m:attributes" if ns else "attributes")
        if attributes is not None:
            div_elem = find(attributes, "m:divisions" if ns else "divisions")
            if div_elem is not None and div_elem.text and div_elem.text.isdigit():
                divisions = int(div_elem.text)
        # Tempo (metronome)
        direction = find(measure, "m:direction" if ns else "direction")
        if direction is not None:
            sound = find(direction, "m:sound" if ns else "sound")
            if sound is not None and "tempo" in sound.attrib:
                try:
                    tempo = float(sound.attrib["tempo"])
                except ValueError:
                    pass
        # Break after we have both values (most files define them early)
        if divisions != 1 and tempo != 120.0:
            break

    seconds_per_division = 60.0 / (tempo * divisions)

    notes: List[Dict] = []
    current_division = 0  # cumulative divisions for onset timing

    for measure in findall(part, "m:measure" if ns else "measure"):
        for note_elem in findall(measure, "m:note" if ns else "note"):
            # Skip rests
            if find(note_elem, "m:rest" if ns else "rest") is not None:
                # Even rests consume time
                dur_elem = find(note_elem, "m:duration" if ns else "duration")
                if dur_elem is not None and dur_elem.text and dur_elem.text.isdigit():
                    current_division += int(dur_elem.text)
                continue

            pitch_elem = find(note_elem, "m:pitch" if ns else "pitch")
            if pitch_elem is None:
                continue
            step = find(pitch_elem, "m:step" if ns else "step")
            octave = find(pitch_elem, "m:octave" if ns else "octave")
            alter_elem = find(pitch_elem, "m:alter" if ns else "alter")
            if step is None or octave is None or step.text is None or octave.text is None:
                continue
            step_val = step.text.strip()
            octave_val = int(octave.text.strip())
            alter = int(alter_elem.text.strip()) if alter_elem is not None and alter_elem.text else 0
            semitone = STEP_TO_SEMITONE.get(step_val, 0) + alter
            midi_num = (octave_val + 1) * 12 + semitone
            note_name = f"{NOTE_NAMES[semitone % 12]}{octave_val}"

            dur_elem = find(note_elem, "m:duration" if ns else "duration")
            dur_div = int(dur_elem.text.strip()) if dur_elem is not None and dur_elem.text and dur_elem.text.isdigit() else divisions

            onset_sec = current_division * seconds_per_division
            duration_sec = dur_div * seconds_per_division

            notes.append({
                "note_num": midi_num,
                "note_name": note_name,
                "onset": onset_sec,
                "duration": duration_sec,
            })

            # Advance time cursor
            current_division += dur_div

    # Sort notes just in case
    notes.sort(key=lambda n: n["onset"])
    return notes
