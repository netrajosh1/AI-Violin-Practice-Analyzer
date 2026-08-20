import { useState } from 'react';
import { AudioUploader } from './components/AudioUploader';
import { PitchGraph } from './components/PitchGraph';
import { RhythmGraph } from './components/RhythmGraph';
import { RhythmDriftGraph } from './components/RhythmDriftGraph';
import { TimelineComparison } from './components/TimelineComparison';
import { PerformanceCoaching } from './components/PerformanceCoaching';

function App() {
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const handleAnalysisComplete = (data: any) => {
    setAnalysisData(data);
  };

  const isLight = theme === 'light';

  return (
    <div className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
      isLight ? 'bg-[#faf6ee] text-[#2b1007]' : 'bg-[#140f0c] text-[#f3f4f6]'
    }`}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Control Bar with Theme Switcher */}
        <div className="flex justify-between items-center">
          <div className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase border ${
            isLight
              ? 'bg-[#f0e6d8] border-[#d6c4b0] text-[#78350f]'
              : 'bg-[#281c13] border-[#3d2b1f] text-amber-400'
          }`}>
            <span>🎻 Practice Room Companion</span>
          </div>

          <button
            onClick={() => setTheme(isLight ? 'dark' : 'light')}
            aria-label="Toggle Theme"
            title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            className={`p-2.5 rounded-xl border text-lg transition-all flex items-center justify-center cursor-pointer shadow-sm ${
              isLight
                ? 'bg-[#f4ebe1] text-[#3b180d] border-[#d6c4b0] hover:bg-[#eae0d2]'
                : 'bg-[#281c13] text-amber-300 border-[#3d2b1f] hover:bg-[#342418] shadow-[0_0_15px_rgba(245,158,11,0.2)]'
            }`}
          >
            <span>{isLight ? '☀️' : '🌙'}</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className={`text-4xl md:text-5xl font-extrabold tracking-tight ${
            isLight
              ? 'text-[#3b180d]'
              : 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500'
          }`}>
            AI Violin Practice Analyzer
          </h1>
          <p className={`text-base md:text-lg max-w-2xl mx-auto leading-relaxed ${
            isLight ? 'text-[#6e503e]' : 'text-[#d1c2b0]'
          }`}>
            Record or upload your violin performance for instant, AI-powered intonation, rhythm stability, and pitch alignment analysis.
          </p>
        </div>

        {/* Uploader Section */}
        <div className={`max-w-2xl mx-auto border p-6 rounded-2xl shadow-xl transition-all ${
          isLight
            ? 'bg-[#ffffff] border-[#e2d5c3] shadow-amber-900/5'
            : 'bg-[#1c140e]/90 border-[#3d2b1f] shadow-2xl backdrop-blur-sm'
        }`}>
          <AudioUploader onAnalysisComplete={handleAnalysisComplete} theme={theme} />
        </div>

        {/* Results Section */}
        {analysisData && !analysisData.error && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out space-y-8">
            
            {/* Overall Score Row */}
            <div className={`w-full rounded-xl p-6 shadow-xl border flex flex-col md:flex-row items-center justify-between gap-6 transition-all ${
              isLight
                ? 'bg-[#ffffff] border-[#e2d5c3]'
                : 'bg-[#1c140e] border-[#3d2b1f]'
            }`}>
              <div className="space-y-2 text-center md:text-left">
                <h2 className={`text-2xl font-bold ${isLight ? 'text-[#3b180d]' : 'text-[#fef3c7]'}`}>
                  Overall Performance Rating
                </h2>
                <p className={`text-sm max-w-md ${isLight ? 'text-[#785b48]' : 'text-[#d1c2b0]'}`}>
                  Calculated from pitch accuracy (cents deviation) and onset synchronization metrics.
                </p>
              </div>
              <div className={`relative w-28 h-28 flex items-center justify-center rounded-full border-4 ${
                isLight
                  ? 'bg-[#fcf8f2] border-amber-600 shadow-md'
                  : 'bg-[#281c13] border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.35)]'
              }`}>
                <span className={`text-4xl font-extrabold ${
                  analysisData.overall_score >= 80 
                    ? (isLight ? 'text-emerald-600' : 'text-emerald-400')
                    : analysisData.overall_score >= 60 
                    ? (isLight ? 'text-amber-600' : 'text-amber-400')
                    : (isLight ? 'text-rose-600' : 'text-rose-400')
                }`}>
                  {analysisData.overall_score}
                </span>
              </div>
            </div>

            {/* AI Coaching Panel */}
            {analysisData.coaching_feedback && (
              <PerformanceCoaching feedback={analysisData.coaching_feedback} theme={theme} />
            )}

            {/* Timeline Comparison */}
            {analysisData.alignment_analysis && (
              <TimelineComparison alignmentData={analysisData.alignment_analysis} theme={theme} />
            )}

            {/* Pitch & Basic Rhythm Core Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pitch Analysis */}
              {analysisData.pitch_analysis && (
                <PitchGraph 
                  data={analysisData.pitch_analysis.graph_data} 
                  averageDeviation={analysisData.pitch_analysis.average_deviation_cents}
                  absAverageDeviation={analysisData.pitch_analysis.absolute_average_deviation_cents}
                  theme={theme}
                />
              )}

              {/* Rhythm Analysis */}
              {analysisData.rhythm_analysis && (
                <RhythmGraph data={analysisData.rhythm_analysis} theme={theme} />
              )}
            </div>

            {/* Detailed Rhythm Drift Graph */}
            {analysisData.alignment_analysis && (
              <RhythmDriftGraph alignmentData={analysisData.alignment_analysis} theme={theme} />
            )}
            
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
