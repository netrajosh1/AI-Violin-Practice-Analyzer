# AI Violin Practice Analyzer 🎻

An AI-powered web application designed to help violinists evaluate both **intonation accuracy** and **rhythmic precision** through advanced audio signal processing, live microphone recording, MIDI alignment, and intelligent performance coaching.

The system analyzes live microphone recordings or uploaded audio files against a metronome grid or MIDI reference performance, then generates detailed visualizations and personalized coaching insights to help musicians practice more effectively.

---

# 🚀 Features

## 🎙️ In-Browser Live Microphone Recording
- Record violin practice directly inside the browser using your device's microphone
- Real-time recording timer counter (`RECORDING: 00:15`) with live pulsing indicators
- Built-in HTML5 Audio Player preview to listen back to your recording before analyzing
- Automatic client-side 16-bit PCM **WAV encoding** via Web Audio API for 100% precision during audio signal processing

## 📁 Audio Upload & Baseline Selection
- Support for uploading `.wav`, `.mp3`, `.m4a`, and `.webm` violin recordings
- Flexible baseline reference selection:
  - **No Reference**: Pure intonation and rhythm stability evaluation
  - **Metronome BPM Grid**: Align timing against expected beats per minute
  - **MIDI Reference File**: Full note-for-note sequence alignment against reference score

## ☀️ / 🌙 Light & Dark Theme Modes
- **Light Mode (Warm Cream & Deep Mahogany)**: Soft warm cream background (`#faf6ee`) paired with rich mahogany brown typography and acoustic gold buttons. Warm, traditional, and readable in bright rooms.
- **Dark Mode (Dark Stage Wood & Amber Glow)**: Deep charcoal wood atmosphere (`#140f0c`) with ambient amber glows (`#f59e0b`). Ideal for musicians practicing on stage or in dim practice rooms.
- One-click toggle switch in header.

## 🎯 Pitch & Intonation Analysis
- Fundamental frequency extraction using Librosa
- Converts detected frequencies into standard musical pitch notes
- Calculates exact tuning deviations in **cents**
- Identifies overall sharp (+) or flat (-) tendencies
- Computes absolute variance metrics to gauge pitch stability

## ⏱️ Rhythm + Timing Alignment
- MIDI parsing via `mido`
- **Needleman–Wunsch sequence alignment algorithm** to handle:
  - Insertions (extra notes played)
  - Deletions (missed notes)
  - Minor pitch mismatches
- Dynamic onset alignment between expected and played notes
- Tempo scaling and latency compensation using linear regression
- Millisecond-level timing drift analysis relative to $\pm 60\text{ms}$ human perception tolerance

## 📊 Interactive Visualizations
- **Pitch Accuracy Graphs**: Displays cents deviation over time with target intonation center lines and tolerance bands
- **Note Alignment Timeline View**: Dual-row interactive horizontal timeline comparing expected vs. actual played note onsets with status connectors (on-time, early/rushing, late/dragging)
- **Rhythm Drift Graph**: Bar chart showing note-by-note timing errors in milliseconds against a shaded $\pm 60\text{ms}$ tolerance band

## 🤖 AI Coaching Feedback Engine
Smart feedback system synthesizes performance data to generate:
- **Coach's Summary**: High-level evaluation of the practice session
- **Key Strengths**: Specific areas executed accurately (e.g., solid intonation centering, steady tempo)
- **Focus Areas**: Actionable recommendations for improvement (e.g., avoiding rushing eighth-note passages, shifts in higher positions)
- **Detailed Bullet Insights**: Targeted observations for both intonation and rhythm

---

# 🔌 API Endpoints

### Performance Analysis Endpoint
**`POST /analyze`**
Accepts performance audio and optional reference settings to produce full intonation, rhythm, alignment, and coaching payloads.
```bash
POST http://127.0.0.1:8000/analyze
FormData:
  file: <recorded_violin.wav>
  midi_file: <optional_reference.mid>
  expected_bpm: <optional_number>
```

### Rhythm Detection Endpoint
**`POST /rhythm`**
Accepts an audio file and returns rhythm analysis JSON (tempo, onsets, durations, stability metric).
```bash
POST http://127.0.0.1:8000/rhythm
FormData:
  file: <audio.wav>
```

---

# 🛠️ Architecture & Tech Stack

## Frontend
- **Framework:** React 19 + TypeScript (Vite)
- **Styling:** Tailwind CSS v4 (Custom Violin Theme tokens & Light/Dark Mode)
- **Audio Capture:** Web Audio API & MediaRecorder API (with client-side PCM WAV encoder)
- **Visualization:** Recharts
- **HTTP Client:** Axios

## Backend
- **Framework:** FastAPI (Python)
- **Audio Signal Processing:** Librosa, NumPy, SciPy, SoundFile
- **MIDI Processing:** Mido
- **Server:** Uvicorn

---

# 🏃‍♂️ Getting Started

### Prerequisites
- **Python 3.9+**
- **Node.js 18+**
- **npm**

---

### 1. Running the Backend

Navigate to the `backend` directory:
```bash
cd backend
```

Activate the project virtual environment (or create one):
```bash
source venv/bin/activate
```

Install backend dependencies (if needed):
```bash
pip install fastapi uvicorn librosa numpy scipy soundfile python-multipart mido
```

Start the FastAPI backend server:
```bash
venv/bin/uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
Backend API will run at: `http://127.0.0.1:8000`

---

### 2. Running the Frontend

Navigate to the `frontend` directory:
```bash
cd frontend
```

Install frontend dependencies:
```bash
npm install
```

Start the Vite development server:
```bash
npm run dev
```
Frontend Web App will run at: `http://localhost:5173`

---

# 📝 License

This project is open-source and available under the MIT License.
