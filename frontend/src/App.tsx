import { useState } from 'react';
import { AudioUploader } from './components/AudioUploader';
import { PitchGraph } from './components/PitchGraph';
import { RhythmGraph } from './components/RhythmGraph';

function App() {
  const [analysisData, setAnalysisData] = useState<any>(null);

  const handleAnalysisComplete = (data: any) => {
    setAnalysisData(data);
  };

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 tracking-tight">
            AI Violin Practice Analyzer
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Upload your violin recording for instant, AI-powered intonation and rhythm analysis. Get real-time feedback on your performance.
          </p>
        </div>

        {/* Uploader Section */}
        <div className="max-w-2xl mx-auto">
          <AudioUploader onAnalysisComplete={handleAnalysisComplete} />
        </div>

        {/* Results Section */}
        {analysisData && !analysisData.error && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out space-y-8">
            
            {/* Overall Score */}
            <div className="w-full bg-slate-800 rounded-xl p-8 shadow-xl border border-slate-700 text-center flex flex-col justify-center items-center">
              <h2 className="text-2xl font-bold mb-4 text-slate-100">Overall Performance Score</h2>
              <div className="relative w-32 h-32 flex items-center justify-center rounded-full bg-slate-700 border-4 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                <span className={`text-4xl font-extrabold ${analysisData.overall_score >= 80 ? 'text-green-400' : analysisData.overall_score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {analysisData.overall_score}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pitch Analysis */}
              {analysisData.pitch_analysis && (
                <PitchGraph 
                  data={analysisData.pitch_analysis.graph_data} 
                  averageDeviation={analysisData.pitch_analysis.average_deviation_cents}
                  absAverageDeviation={analysisData.pitch_analysis.absolute_average_deviation_cents}
                />
              )}

              {/* Rhythm Analysis */}
              {analysisData.rhythm_analysis && (
                <RhythmGraph data={analysisData.rhythm_analysis} />
              )}
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

