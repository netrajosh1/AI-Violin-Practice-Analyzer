import React, { useState } from 'react';
import axios from 'axios';
import { RhythmGraph } from './RhythmGraph';

interface RhythmData {
  tempo: number;
  onsets: number[];
  durations: number[];
  rhythm_stability: number;
  average_duration: number;
  score: number;
}

export const RhythmUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [rhythmData, setRhythmData] = useState<RhythmData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    const form = new FormData();
    form.append('file', file);
    try {
      const resp = await axios.post('http://127.0.0.1:8000/rhythm', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (resp.data.error) {
        setError(resp.data.error);
      } else {
        setRhythmData(resp.data as RhythmData);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <h3 className="text-xl font-semibold text-slate-200">Rhythm‑Only Analysis</h3>
      <input type="file" accept="audio/*" onChange={handleFileChange} disabled={loading} />
      <button
        onClick={analyze}
        disabled={!file || loading}
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 transition"
      >
        {loading ? 'Analyzing…' : 'Analyze Rhythm'}
      </button>
      {error && <p className="text-red-400">{error}</p>}
      {rhythmData && (
        <div className="mt-4">
          <RhythmGraph data={rhythmData} />
        </div>
      )}
    </div>
  );
};
