import React, { useState, useRef } from 'react';
import axios from 'axios';

interface AudioUploaderProps {
  onAnalysisComplete: (data: any) => void;
  theme?: 'light' | 'dark';
}

type ReferenceMode = 'none' | 'bpm' | 'midi';
type InputMethod = 'file' | 'record';

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  let channels: Float32Array[] = [];
  let sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function writeString(str: string) {
    for (let i = 0; i < str.length; i++) {
      out.setUint8(pos++, str.charCodeAt(i));
    }
  }

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  writeString('RIFF');
  setUint32(length - 8);
  writeString('WAVE');

  writeString('fmt ');
  setUint32(16);
  setUint16(1);
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);

  writeString('data');
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out], { type: 'audio/wav' });
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({ onAnalysisComplete, theme = 'light' }) => {
  const isLight = theme === 'light';

  const [inputMethod, setInputMethod] = useState<InputMethod>('file');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Reference Settings States
  const [refMode, setRefMode] = useState<ReferenceMode>('none');
  const [expectedBpm, setExpectedBpm] = useState<number>(120);
  const [midiFile, setMidiFile] = useState<File | null>(null);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const midiInputRef = useRef<HTMLInputElement>(null);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainderSecs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      let mimeType = '';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        const rawBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        });

        let finalFile: File;
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const arrayBuffer = await rawBlob.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          const wavBlob = audioBufferToWav(audioBuffer);
          finalFile = new File([wavBlob], `violin_recording_${Date.now()}.wav`, { type: 'audio/wav' });
        } catch (e) {
          console.warn('WAV conversion fallback to webm:', e);
          const ext = mediaRecorder.mimeType.includes('mp4') ? '.m4a' : '.webm';
          finalFile = new File([rawBlob], `violin_recording_${Date.now()}${ext}`, {
            type: rawBlob.type || 'audio/webm',
          });
        }

        setAudioFile(finalFile);
        setRecordedAudioUrl(URL.createObjectURL(finalFile));
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone permission error:', err);
      setError('Microphone access denied or not available. Please check browser microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const resetRecording = () => {
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
    setRecordedAudioUrl(null);
    setAudioFile(null);
  };

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
    if (!file.type.startsWith('audio/') && !file.name.endsWith('.wav') && !file.name.endsWith('.mp3') && !file.name.endsWith('.webm') && !file.name.endsWith('.m4a')) {
      setError('Please upload a valid audio file (WAV, MP3, WEBM, or M4A).');
      return;
    }
    setAudioFile(file);
    setRecordedAudioUrl(null);
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
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl(null);
    }
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
      {/* Segmented Tab Switcher */}
      <div className={`flex p-1.5 rounded-xl border shadow-inner transition-colors ${
        isLight ? 'bg-[#f4ebe1] border-[#d6c4b0]' : 'bg-[#120d09]/90 border-[#3d2b1f]'
      }`}>
        <button
          type="button"
          onClick={() => {
            if (!isRecording && !isAnalyzing) setInputMethod('file');
          }}
          disabled={isRecording || isAnalyzing}
          className={`flex-1 py-2.5 px-4 text-xs md:text-sm font-semibold rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            inputMethod === 'file'
              ? isLight
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 text-amber-100 shadow-md border border-amber-500/40'
              : isLight
                ? 'text-[#785b48] hover:text-[#3b180d]'
                : 'text-[#d1c2b0] hover:text-amber-200'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span>Upload Audio File</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (!isRecording && !isAnalyzing) setInputMethod('record');
          }}
          disabled={isRecording || isAnalyzing}
          className={`flex-1 py-2.5 px-4 text-xs md:text-sm font-semibold rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            inputMethod === 'record'
              ? isLight
                ? 'bg-rose-700 text-white shadow-md'
                : 'bg-gradient-to-r from-rose-800 via-rose-700 to-amber-800 text-amber-100 shadow-md border border-rose-500/40'
              : isLight
                ? 'text-[#785b48] hover:text-[#3b180d]'
                : 'text-[#d1c2b0] hover:text-amber-200'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <span>Record Live Audio</span>
        </button>
      </div>

      {/* Tab 1: File Upload Mode */}
      {inputMethod === 'file' && (
        <div
          className={`relative w-full h-52 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
            isDragging
              ? isLight ? 'border-amber-600 bg-amber-50/60' : 'border-amber-400 bg-amber-500/10'
              : audioFile
              ? isLight ? 'border-emerald-600 bg-emerald-50/60' : 'border-emerald-500/70 bg-emerald-950/20'
              : isLight ? 'border-[#d6c4b0] bg-[#fcf8f2] hover:border-amber-600 hover:bg-[#f6eee2]' : 'border-[#3d2b1f] bg-[#1c140e]/60 hover:border-amber-600/60 hover:bg-[#241a12]'
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
            accept="audio/*,.wav,.mp3,.webm,.m4a"
            className="hidden"
            disabled={isAnalyzing}
          />

          {audioFile ? (
            <div className="flex flex-col items-center text-center p-6">
              <div className={`p-3 rounded-full mb-3 border ${
                isLight ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className={`text-lg font-semibold mb-1 ${isLight ? 'text-[#3b180d]' : 'text-[#fef3c7]'}`}>
                Audio File Loaded
              </h3>
              <p className={`text-sm font-medium mb-3 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                {audioFile.name}
              </p>
              {!isAnalyzing && (
                <button
                  onClick={clearAudio}
                  className={`text-xs underline bg-transparent border-none cursor-pointer ${
                    isLight ? 'text-[#785b48] hover:text-rose-700' : 'text-[#d1c2b0] hover:text-rose-400'
                  }`}
                >
                  Change file
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center text-center p-6">
              <div className={`p-3 rounded-full mb-3 border ${
                isLight ? 'bg-[#f4ebe1] text-amber-700 border-[#d6c4b0]' : 'bg-[#281c13] text-amber-400 border-[#3d2b1f]'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                </svg>
              </div>
              <h3 className={`text-lg font-semibold mb-1 ${isLight ? 'text-[#3b180d]' : 'text-[#fef3c7]'}`}>
                Violin Performance Audio
              </h3>
              <p className={`text-sm max-w-sm mb-3 ${isLight ? 'text-[#785b48]' : 'text-[#d1c2b0]'}`}>
                Drag & drop audio here or click to browse (WAV / MP3 / M4A).
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Live Microphone Recording Mode */}
      {inputMethod === 'record' && (
        <div className={`w-full rounded-2xl border p-6 flex flex-col items-center justify-center min-h-[208px] ${
          isLight ? 'border-[#d6c4b0] bg-[#fcf8f2]' : 'border-[#3d2b1f] bg-[#1c140e]/80'
        }`}>
          {isRecording ? (
            /* Active Recording View */
            <div className="flex flex-col items-center space-y-4 w-full">
              <div className="relative flex items-center justify-center my-2">
                <div className="w-20 h-20 rounded-full bg-rose-600/30 animate-ping absolute"></div>
                <div className="w-16 h-16 rounded-full bg-rose-700 text-white flex items-center justify-center shadow-lg z-10 border border-rose-400/40">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
              </div>

              <div className="text-center">
                <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full font-mono text-sm font-bold border animate-pulse ${
                  isLight ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-950/60 text-rose-300 border-rose-700/50'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                  <span>RECORDING: {formatTime(recordingTime)}</span>
                </span>
                <p className={`text-xs mt-2 ${isLight ? 'text-[#785b48]' : 'text-[#d1c2b0]'}`}>
                  Play your violin clearly into your microphone.
                </p>
              </div>

              <button
                type="button"
                onClick={stopRecording}
                className="py-3 px-8 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded-xl shadow-lg transition-all flex items-center space-x-2 cursor-pointer hover:scale-105"
              >
                <div className="w-4 h-4 bg-white rounded-sm"></div>
                <span>Stop Recording</span>
              </button>
            </div>
          ) : recordedAudioUrl && audioFile ? (
            /* Recorded Preview View */
            <div className="flex flex-col items-center space-y-4 w-full">
              <div className={`p-3 rounded-full border ${
                isLight ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}>
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className={`text-base font-semibold ${isLight ? 'text-[#3b180d]' : 'text-[#fef3c7]'}`}>
                  Live Recording Saved
                </h3>
                <p className={`text-xs font-mono mt-0.5 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                  {audioFile.name}
                </p>
              </div>

              {/* HTML5 Audio Player Preview */}
              <div className={`w-full max-w-md p-2.5 rounded-xl border ${
                isLight ? 'bg-[#f4ebe1] border-[#d6c4b0]' : 'bg-[#120d09]/90 border-[#3d2b1f]'
              }`}>
                <audio controls src={recordedAudioUrl} className="w-full h-10 accent-amber-600" />
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={isAnalyzing}
                  className={`py-1.5 px-4 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    isLight ? 'bg-[#f4ebe1] text-[#3b180d] border-[#d6c4b0] hover:bg-[#eae0d2]' : 'bg-[#281c13] text-[#fef3c7] border-[#3d2b1f] hover:bg-[#36261a]'
                  }`}
                >
                  🔄 Record Again
                </button>
                <button
                  type="button"
                  onClick={resetRecording}
                  disabled={isAnalyzing}
                  className={`py-1.5 px-4 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    isLight ? 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200' : 'bg-rose-950/30 text-rose-400 border-rose-800/40 hover:bg-rose-900/40'
                  }`}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            /* Idle Ready to Record View */
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`p-4 rounded-full border ${
                isLight ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-rose-950/30 text-rose-400 border-rose-800/40'
              }`}>
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div>
                <h3 className={`text-lg font-semibold mb-1 ${isLight ? 'text-[#3b180d]' : 'text-[#fef3c7]'}`}>
                  Microphone Recording
                </h3>
                <p className={`text-sm max-w-sm ${isLight ? 'text-[#785b48]' : 'text-[#d1c2b0]'}`}>
                  Click below to record your violin performance live from your browser.
                </p>
              </div>
              <button
                type="button"
                onClick={startRecording}
                disabled={isAnalyzing}
                className={`py-3 px-8 text-white font-bold rounded-xl shadow-lg transition-all flex items-center space-x-2.5 cursor-pointer hover:scale-105 ${
                  isLight
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-900/20'
                    : 'bg-gradient-to-r from-amber-600 via-rose-700 to-amber-700 hover:from-amber-500 hover:to-rose-600 shadow-rose-950/50 border border-amber-500/30'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-white animate-pulse"></span>
                <span>Start Recording</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Comparison Reference Settings Panel */}
      {audioFile && (
        <div className={`rounded-xl p-5 border space-y-4 ${
          isLight ? 'bg-[#fcf8f2] border-[#e2d5c3]' : 'bg-[#1c140e] border-[#3d2b1f]'
        }`}>
          <label className={`block font-semibold text-sm ${isLight ? 'text-[#3b180d]' : 'text-[#fef3c7]'}`}>
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
                    ? 'bg-amber-600 border-amber-500 text-white shadow-md'
                    : isLight
                      ? 'bg-[#ffffff] border-[#d6c4b0] text-[#785b48] hover:bg-[#f4ebe1]'
                      : 'bg-[#281c13] border-[#3d2b1f] text-[#d1c2b0] hover:bg-[#342418]'
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
              <label className={`block text-xs font-medium mb-2 ${isLight ? 'text-[#785b48]' : 'text-[#d1c2b0]'}`}>
                Expected Tempo (BPM)
              </label>
              <div className="flex items-center space-x-3 max-w-[200px]">
                <button
                  type="button"
                  onClick={() => setExpectedBpm((prev) => Math.max(40, prev - 5))}
                  disabled={isAnalyzing}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg cursor-pointer border ${
                    isLight
                      ? 'bg-[#ffffff] text-[#3b180d] border-[#d6c4b0] hover:bg-[#f4ebe1]'
                      : 'bg-[#281c13] text-[#fef3c7] border-[#3d2b1f] hover:bg-[#36261a]'
                  }`}
                >
                  -
                </button>
                <input
                  type="number"
                  value={expectedBpm}
                  onChange={(e) => setExpectedBpm(Math.max(1, parseInt(e.target.value) || 120))}
                  disabled={isAnalyzing}
                  className={`rounded-lg py-1 px-2 text-center font-bold text-sm w-16 focus:outline-none focus:border-amber-600 border ${
                    isLight
                      ? 'bg-[#ffffff] border-[#d6c4b0] text-[#3b180d]'
                      : 'bg-[#120d09] border-[#3d2b1f] text-[#fef3c7]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setExpectedBpm((prev) => Math.min(280, prev + 5))}
                  disabled={isAnalyzing}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg cursor-pointer border ${
                    isLight
                      ? 'bg-[#ffffff] text-[#3b180d] border-[#d6c4b0] hover:bg-[#f4ebe1]'
                      : 'bg-[#281c13] text-[#fef3c7] border-[#3d2b1f] hover:bg-[#36261a]'
                  }`}
                >
                  +
                </button>
              </div>
            </div>
          )}

          {refMode === 'midi' && (
            <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <label className={`block text-xs font-medium mb-2 ${isLight ? 'text-[#785b48]' : 'text-[#d1c2b0]'}`}>
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
                <div className={`flex items-center justify-between p-3 rounded-lg border ${
                  isLight ? 'bg-[#ffffff] border-[#d6c4b0]' : 'bg-[#120d09]/90 border-[#3d2b1f]'
                }`}>
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <span className="text-amber-600 flex-shrink-0 text-sm">🎵</span>
                    <span className={`text-xs font-medium truncate ${isLight ? 'text-[#3b180d]' : 'text-[#fef3c7]'}`}>
                      {midiFile.name}
                    </span>
                  </div>
                  {!isAnalyzing && (
                    <button
                      type="button"
                      onClick={clearMidi}
                      className="text-rose-600 hover:text-rose-800 font-bold text-sm bg-transparent border-none cursor-pointer px-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => midiInputRef.current?.click()}
                  className={`w-full py-3 border border-dashed text-xs rounded-lg transition-colors cursor-pointer ${
                    isLight
                      ? 'bg-[#ffffff] border-[#d6c4b0] hover:border-amber-600 text-[#785b48]'
                      : 'bg-[#120d09] border-[#3d2b1f] hover:border-amber-500/50 text-[#d1c2b0]'
                  }`}
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
              <div className="w-10 h-10 border-4 border-amber-600/30 border-t-amber-600 rounded-full animate-spin mb-3"></div>
              <p className={`text-sm font-semibold ${isLight ? 'text-[#3b180d]' : 'text-[#fef3c7]'}`}>
                Processing Performance Analysis...
              </p>
              <p className={`text-xs mt-1 ${isLight ? 'text-[#785b48]' : 'text-[#d1c2b0]'}`}>
                Extracting pitch, onsets, and synchronizing timelines.
              </p>
            </div>
          ) : (
            <button
              onClick={triggerAnalyze}
              className={`w-full py-3.5 px-6 text-white font-bold rounded-xl shadow-lg transition-all text-center cursor-pointer text-base ${
                isLight
                  ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-700 hover:to-amber-900 shadow-amber-900/20'
                  : 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-900/40 border border-amber-400/30'
              }`}
            >
              Analyze Performance
            </button>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className={`mt-4 p-4 rounded-lg flex items-start border ${
          isLight ? 'bg-rose-100 border-rose-200 text-rose-800' : 'bg-rose-950/40 border-rose-700/50 text-rose-200'
        }`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-rose-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};
