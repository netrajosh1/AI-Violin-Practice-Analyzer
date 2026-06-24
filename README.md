# AI Violin Practice Analyzer 🎻

An AI-powered web application designed to help violinists evaluate both **intonation accuracy** and **rhythmic precision** through advanced audio signal processing, MIDI alignment, and intelligent performance feedback.

The system analyzes uploaded violin recordings against either a metronome grid or a MIDI reference performance, then generates detailed visualizations and coaching insights to help musicians practice more effectively.

---

# 🚀 Features

## 🎵 Audio Upload & Performance Analysis
- Drag-and-drop interface for uploading `.wav` violin recordings
- Analyze performances against:
  - No reference (free intonation analysis)
  - Metronome BPM grid
  - MIDI reference file
- One-click **Analyze Performance** workflow

---

## 🎯 Pitch & Intonation Analysis
- Fundamental frequency extraction using Librosa
- Converts detected frequencies into musical note information
- Calculates tuning deviations in cents
- Identifies consistently sharp or flat tendencies
- Detects problematic pitch regions and unstable notes

---

## ⏱️ Rhythm + Timing Analysis (Phase 2)
- MIDI parsing using `mido`
- Needleman–Wunsch sequence alignment algorithm for:
  - Insertions
  - Missing notes
  - Minor pitch mismatches
- Dynamic onset alignment between expected and played notes
- Tempo scaling and latency correction using linear regression
- Metronome grid synchronization against expected BPM
- Millisecond-level timing drift analysis

---

## 📊 Interactive Visualizations

<<<<<<< HEAD
### Pitch Accuracy Graphs
- Displays tuning deviation over time
- Highlights sharp/flat regions dynamically
=======
### Rhythm Detection Endpoint
The new **`/rhythm`** endpoint accepts an audio file and returns rhythm analysis JSON (tempo, onsets, durations, stability, average duration). This is useful when only timing metrics are needed.

**Request**
```bash
POST http://127.0.0.1:8000/rhythm
FormData:
  file: <audio.wav>
```

**Response**
```json
{
  "tempo": 120.0,
  "onsets": [...],
  "durations": [...],
  "rhythm_stability": 0.045,
  "average_duration": 0.5
}
```

This replaces the original line at the end of the backend section.

### Running the Frontend
>>>>>>> 486e5f0 (rhythym endpoint)

### Timeline Comparison View
- Dual-row horizontal timeline comparing:
  - Expected note onsets
  - Actual played onsets
- Color-coded alignment connectors for:
  - Early notes
  - Late notes
  - Correctly aligned notes

### Rhythm Drift Graph
- Visualizes timing errors in milliseconds
- Helps identify rushing or dragging tendencies

---

## 🤖 AI Coaching Feedback System

Smart coaching engine generates personalized feedback including:
- Strengths detected in the performance
- Rhythm consistency observations
- Intonation trend analysis
- Specific problematic notes/passages
- Early/late onset tendencies
- Practice recommendations tailored to the performer

Example feedback:

> “Your intonation becomes consistently sharp during higher position shifts, and you tend to rush repeated eighth-note passages after tempo increases.”

---

# 🛠️ Architecture & Tech Stack

This project uses a decoupled frontend/backend architecture.

---

# Frontend

- **Framework:** React + TypeScript (Vite)
- **Styling:** Tailwind CSS v4
- **Visualization:** Recharts
- **HTTP Client:** Axios

### Core Frontend Components
- `AudioUploader.tsx`
- `PerformanceCoaching.tsx`
- `TimelineComparison.tsx`
- `RhythmDriftGraph.tsx`

---

# Backend

- **Framework:** FastAPI (Python)
- **Audio Processing:** Librosa, NumPy, SciPy
- **MIDI Processing:** mido
- **Machine Logic:** Custom alignment + regression systems
- **Server:** Uvicorn

### Core Backend Modules
- `midi_compare.py`
- `feedback.py`

---

# 🧠 Core Algorithms

## Sequence Alignment
Implements a custom Needleman–Wunsch alignment system to map:
- Expected note sequences
- Played violin note sequences

This enables robust handling of:
- Missed notes
- Extra notes
- Timing inconsistencies
- Minor pitch inaccuracies

---

## Tempo & Latency Compensation
Uses linear regression to:
- Estimate performance latency
- Detect tempo drift
- Dynamically scale expected timing grids

This prevents unfair penalties for:
- Slight delayed starts
- Natural tempo fluctuations

---

## Coaching Intelligence Layer
The feedback engine analyzes:
- Pitch deviation trends
- Timing consistency
- Repeated note errors
- Rhythm drift patterns

Then synthesizes these observations into human-readable coaching guidance.

---

# 🏃‍♂️ Getting Started

# Prerequisites

- Python 3.9+
- Node.js 18+
- npm

---

# Running the Backend

Navigate to the backend directory:

```bash
cd backend
```

Create and activate a virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

Install dependencies:

```bash
pip install fastapi uvicorn librosa numpy scipy matplotlib soundfile python-multipart mido
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

Backend runs at:

```text
http://127.0.0.1:8000
```

---

# Running the Frontend

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

---

# ✅ Verification

- Backend successfully loads and executes inside its virtual environment
- Frontend compiles successfully with:

```bash
npm run build
```

- Zero TypeScript/Vite compilation errors
- End-to-end upload → analysis → visualization pipeline verified

---

# 🔮 Roadmap / Future Features

## ✅ Phase 1 — Intonation Analysis
Completed:
- Pitch extraction
- Cents deviation analysis
- Pitch visualization

## ✅ Phase 2 — Rhythm + Timing Analysis
Completed:
- MIDI alignment
- Timing drift analysis
- Tempo scaling
- Coaching feedback
- Timeline visualizations

## 🔜 Phase 3 — Sheet Music Matching
- Parse MusicXML / sheet music directly
- Automatic expected-note generation
- Phrase segmentation analysis

## 🔜 Phase 4 — Real-Time Analysis
- Live microphone input
- Instant visual feedback
- Real-time tuning/rhythm alerts

## 🔜 Phase 5 — Advanced AI Practice Coach
- LLM-generated performance summaries
- Personalized exercise generation
- Long-term practice tracking
- Adaptive difficulty recommendations

---

# 📝 License

This project is open-source and available under the MIT License.
