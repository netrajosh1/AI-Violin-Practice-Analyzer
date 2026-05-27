import { useState } from 'react';
import { AudioUploader } from './components/AudioUploader';
import { PitchGraph } from './components/PitchGraph';
import { RhythmGraph } from './components/RhythmGraph';
import { RhythmDriftGraph } from './components/RhythmDriftGraph';
import { TimelineComparison } from './components/TimelineComparison';
import { PerformanceCoaching } from './components/PerformanceCoaching';

function App() {
  const [analysisData, setAnalysisData] = useState<any>(null);

  const handleAnalysisComplete = (data: any) => {
    setAnalysisData(data);
  };

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 text-slate-100">
      <div className="max-w-6xl mx-auto space-y-8">
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
        <div className="max-w-2xl mx-auto bg-slate-800/40 border border-slate-700/80 p-6 rounded-2xl shadow-xl">
          <AudioUploader onAnalysisComplete={handleAnalysisComplete} />
        </div>

        {/* Results Section */}
        {analysisData && !analysisData.error && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out space-y-8">
            
            {/* Overall Score Row */}
            <div className="w-full bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <h2 className="text-2xl font-bold text-slate-100">Overall Performance Rating</h2>
                <p className="text-sm text-slate-400 max-w-md">
                  Calculated from pitch centering accuracy and onset synchronization metrics.
                </p>
              </div>
              <div className="relative w-28 h-28 flex items-center justify-center rounded-full bg-slate-700 border-4 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                <span className={`text-4xl font-extrabold ${
                  analysisData.overall_score >= 80 
                    ? 'text-emerald-400' 
                    : analysisData.overall_score >= 60 
                    ? 'text-amber-400' 
                    : 'text-rose-400'
                }`}>
                  {analysisData.overall_score}
                </span>
              </div>
            </div>

            {/* AI Coaching Panel */}
            {analysisData.coaching_feedback && (
              <PerformanceCoaching feedback={analysisData.coaching_feedback} />
            )}

            {/* Timeline Comparison */}
            {analysisData.alignment_analysis && (
              <TimelineComparison alignmentData={analysisData.alignment_analysis} />
            )}

            {/* Pitch & Basic Rhythm Core Graphs */}
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

            {/* Detailed Rhythm Drift Graph */}
            {analysisData.alignment_analysis && (
              <RhythmDriftGraph alignmentData={analysisData.alignment_analysis} />
            )}
            
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
