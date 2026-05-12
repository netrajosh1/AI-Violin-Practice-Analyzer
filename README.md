# AI Violin Practice Analyzer 🎻

An AI-powered web application designed to help violinists evaluate their pitch accuracy and intonation in real-time. By leveraging digital signal processing and audio feature extraction, this tool provides instant, actionable feedback on musical performances.

![AI Violin Practice Analyzer](frontend/src/assets/hero.png) *(Note: Add a screenshot of the UI here)*

## 🚀 Features

* **Audio Upload:** Drag-and-drop interface for uploading `.wav` recordings of violin playing.
* **Pitch Detection Pipeline:** Uses Librosa to accurately extract fundamental frequencies over time.
* **Intonation Analysis:** Calculates deviations in cents by comparing detected pitches against exact mathematical target frequencies for musical notes.
* **Note Visualization:** Visualizes pitch accuracy and tuning deviations dynamically through interactive graphs.
* **Performance Stats:** Provides an overall "Average Deviation" and "Absolute Variance" to summarize the sharpness/flatness of the performance.

## 🛠️ Architecture & Tech Stack

This project is separated into a decoupled frontend and backend.

### Frontend
* **Framework:** React + TypeScript (via Vite)
* **Styling:** Tailwind CSS v4
* **Visualization:** Recharts for dynamic, interactive graphing
* **HTTP Client:** Axios

### Backend
* **Framework:** FastAPI (Python)
* **Audio Processing:** Librosa, NumPy
* **Server:** Uvicorn

## 🏃‍♂️ Getting Started

### Prerequisites
* Python 3.9+
* Node.js 18+
* npm

### Running the Backend

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
   ```
3. Install dependencies:
   ```bash
   pip install fastapi uvicorn librosa numpy scipy matplotlib soundfile python-multipart
   ```
4. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```
   *The backend will run at `http://127.0.0.1:8000`*

### Running the Frontend

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will run at `http://localhost:5173`*

## 🔮 Roadmap / Future Features
- **Phase 2: Rhythm Detection** - Using onset detection to analyze timing and rhythm.
- **Phase 3: Sheet Music Matching** - Compare the played sequence of notes against an expected melody.
- **Phase 4: Real-Time Analysis** - Live microphone input and instant feedback loop.
- **Phase 5: AI Coach** - LLM-powered summary of the performance (e.g., "Your intonation drifts sharp during high shifts.").

## 📝 License

This project is open-source and available under the MIT License.