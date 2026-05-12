import React, { useState, useRef } from 'react';
import axios from 'axios';

interface AudioUploaderProps {
  onAnalysisComplete: (data: any) => void;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({ onAnalysisComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processFile(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('audio/') && !file.name.endsWith('.wav')) {
      setError('Please upload an audio file (WAV or MP3).');
      return;
    }

    setFileName(file.name);
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

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
      setError(err.response?.data?.detail || 'Failed to analyze audio. Ensure the backend is running.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`relative w-full h-64 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300 ${isDragging
          ? 'border-blue-400 bg-blue-500/10 scale-[1.02]'
          : 'border-slate-600 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'
          }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="audio/*"
          className="hidden"
        />

        {isAnalyzing ? (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <p className="text-xl font-medium text-slate-200">Analyzing Pitch...</p>
            <p className="text-sm text-slate-400 mt-2">This might take a few seconds.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center p-6 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="bg-slate-700 p-4 rounded-full mb-4 group-hover:bg-blue-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-200 mb-2">Upload Violin Recording</h3>
            <p className="text-slate-400 max-w-sm mb-4">
              Drag and drop an audio file here, or click to browse. WAV format is recommended.
            </p>
            <button className="px-8 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20">
              Audio File
            </button>
            {fileName && <p className="mt-2 text-sm text-green-400 font-medium">Last uploaded: {fileName}</p>}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg flex items-start text-red-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};
