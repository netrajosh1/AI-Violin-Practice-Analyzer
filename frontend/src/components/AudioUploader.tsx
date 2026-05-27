import React, { useState, useRef } from 'react';
import axios from 'axios';

interface AudioUploaderProps {
  onAnalysisComplete: (data: any) => void;
}

type ReferenceMode = 'none' | 'bpm' | 'midi';

export const AudioUploader: React.FC<AudioUploaderProps> = ({ onAnalysisComplete }) => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Reference Settings States
  const [refMode, setRefMode] = useState<ReferenceMode>('none');
  const [expectedBpm, setExpectedBpm] = useState<number>(120);
  const [midiFile, setMidiFile] = useState<File | null>(null);
  
  const audioInputRef = useRef<HTMLInputElement>(null);
  const midiInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetAudio(file);
    }
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSetAudio(file);
    }
  };

  const validateAndSetAudio = (file: File) => {
    if (!file.type.startsWith('audio/') && !file.name.endsWith('.wav') && !file.name.endsWith('.mp3')) {
      setError('Please upload a valid audio file (WAV or MP3).');
      return;
    }
    setAudioFile(file);
  };

  const handleMidiSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.mid') && !file.name.endsWith('.midi')) {
        setError('Please select a valid MIDI file (.mid or .midi).');
        return;
      }
      setMidiFile(file);
    }
  };

  const clearAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAudioFile(null);
  };

  const clearMidi = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMidiFile(null);
  };

  const triggerAnalyze = async () => {
    if (!audioFile) return;
    
    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', audioFile);

      if (refMode === 'midi' && midiFile) {
        formData.append('midi_file', midiFile);
      } else if (refMode === 'bpm' && expectedBpm > 0) {
        formData.append('expected_bpm', expectedBpm.toString());
      }

      // Make request to FastAPI backend
      const response = await axios.post('http://127.0.0.1:8000/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.error) {
        setError(response.data.error);
      } else {
        onAnalysisComplete(response.data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to analyze performance. Ensure backend is running.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Audio File Selection Zone */}
      <div
        className={`relative w-full h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
          isDragging
            ? 'border-blue-400 bg-blue-500/10 scale-[1.01]'
            : audioFile
            ? 'border-emerald-500/60 bg-emerald-500/5'
            : 'border-slate-600 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isAnalyzing && audioInputRef.current?.click()}
      >
        <input
          type="file"
          ref={audioInputRef}
          onChange={handleAudioSelect}
          accept="audio/*"
          className="hidden"
          disabled={isAnalyzing}
        />

        {audioFile ? (
          <div className="flex flex-col items-center text-center p-6">
            <div className="bg-emerald-500/20 p-3 rounded-full mb-3 text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-1">Audio Loaded</h3>
            <p className="text-emerald-400 text-sm font-medium mb-3">{audioFile.name}</p>
            {!isAnalyzing && (
              <button
                onClick={clearAudio}
                className="text-xs text-slate-400 hover:text-red-400 transition-colors underline bg-transparent border-none cursor-pointer"
              >
                Change file
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center p-6">
            <div className="bg-slate-700 p-3 rounded-full mb-3 text-blue-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-200 mb-1">Violin Performance Audio</h3>
            <p className="text-slate-400 text-sm max-w-sm mb-3">
              Drag & drop audio here or click to browse (WAV / MP3).
            </p>
          </div>
        )}
      </div>

      {/* Comparison Reference Settings Panel */}
      {audioFile && (
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 space-y-4">
          <label className="block text-slate-300 font-semibold text-sm">
            Comparison Baseline (Optional)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['none', 'bpm', 'midi'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => !isAnalyzing && setRefMode(mode)}
                disabled={isAnalyzing}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  refMode === mode
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {mode === 'none' && 'No Reference'}
                {mode === 'bpm' && 'Metronome (BPM)'}
                {mode === 'midi' && 'MIDI File'}
              </button>
            ))}
          </div>

          {/* Conditional inputs */}
          {refMode === 'bpm' && (
            <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-slate-400 text-xs font-medium mb-2">
                Expected Tempo (BPM)
              </label>
              <div className="flex items-center space-x-3 max-w-[200px]">
                <button
                  type="button"
                  onClick={() => setExpectedBpm((prev) => Math.max(40, prev - 5))}
                  disabled={isAnalyzing}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-200 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg"
                >
                  -
                </button>
                <input
                  type="number"
                  value={expectedBpm}
                  onChange={(e) => setExpectedBpm(Math.max(1, parseInt(e.target.value) || 120))}
                  disabled={isAnalyzing}
                  className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg py-1 px-2 text-center font-bold text-sm w-16 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setExpectedBpm((prev) => Math.min(280, prev + 5))}
                  disabled={isAnalyzing}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-200 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {refMode === 'midi' && (
            <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-slate-400 text-xs font-medium mb-2">
                Reference MIDI File
              </label>
              <input
                type="file"
                ref={midiInputRef}
                onChange={handleMidiSelect}
                accept=".mid,.midi"
                className="hidden"
                disabled={isAnalyzing}
              />
              {midiFile ? (
                <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-lg border border-slate-700">
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <span className="text-blue-400 flex-shrink-0 text-sm">🎵</span>
                    <span className="text-slate-200 text-xs font-medium truncate">{midiFile.name}</span>
                  </div>
                  {!isAnalyzing && (
                    <button
                      type="button"
                      onClick={clearMidi}
                      className="text-red-400 hover:text-red-300 font-bold text-sm bg-transparent border-none cursor-pointer px-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => midiInputRef.current?.click()}
                  className="w-full py-3 bg-slate-900 border border-dashed border-slate-600 hover:border-slate-500 text-slate-400 text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Click to select Reference .mid file
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Button & Loader */}
      {audioFile && (
        <div className="flex flex-col items-center">
          {isAnalyzing ? (
            <div className="flex flex-col items-center py-4">
              <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-semibold text-slate-300">Processing Performance Analysis...</p>
              <p className="text-xs text-slate-500 mt-1">Extracting pitch, onsets, and synchronizing timelines.</p>
            </div>
          ) : (
            <button
              onClick={triggerAnalyze}
              className="w-full py-3 px-6 text-white font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all text-center cursor-pointer"
            >
              Analyze Performance
            </button>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg flex items-start text-red-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};
