import React from 'react';

interface CoachingFeedback {
  overall_summary: string;
  intonation_points: string[];
  rhythm_points: string[];
  strengths: string[];
  improvements: string[];
}

interface PerformanceCoachingProps {
  feedback: CoachingFeedback | null;
}

export const PerformanceCoaching: React.FC<PerformanceCoachingProps> = ({ feedback }) => {
  if (!feedback) return null;

  return (
    <div className="w-full bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-slate-700 pb-4">
        <div className="bg-indigo-600 p-2.5 rounded-lg text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
          🎻
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-100">AI Practice Coach</h2>
          <p className="text-xs text-slate-400">Personalized feedback based on intonation and rhythm analysis</p>
        </div>
      </div>

      {/* Overall Coach Summary */}
      <div className="relative overflow-hidden bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-5 shadow-[inset_0_1px_3px_rgba(99,102,241,0.05)]">
        <div className="absolute top-0 right-0 p-3 opacity-15 select-none font-serif text-8xl leading-none text-indigo-400">
          ”
        </div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">Coach's Summary</h3>
        <p className="text-slate-200 text-sm leading-relaxed relative z-10 font-medium">
          {feedback.overall_summary}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Strengths & Improvements */}
        <div className="space-y-6">
          {/* Strengths Card */}
          <div className="bg-slate-900/40 border border-slate-700/60 rounded-xl p-5 space-y-3">
            <h4 className="text-emerald-400 font-bold text-sm uppercase tracking-wide flex items-center">
              <span className="mr-2">✨</span> Key Strengths
            </h4>
            <ul className="space-y-2.5">
              {feedback.strengths.map((str, idx) => (
                <li key={`str-${idx}`} className="text-slate-300 text-xs flex items-start">
                  <span className="text-emerald-400 mr-2 flex-shrink-0 mt-0.5 font-bold">✓</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Areas for Improvement Card */}
          <div className="bg-slate-900/40 border border-slate-700/60 rounded-xl p-5 space-y-3">
            <h4 className="text-amber-500 font-bold text-sm uppercase tracking-wide flex items-center">
              <span className="mr-2">🎯</span> Focus Areas
            </h4>
            <ul className="space-y-2.5">
              {feedback.improvements.map((imp, idx) => (
                <li key={`imp-${idx}`} className="text-slate-300 text-xs flex items-start">
                  <span className="text-amber-500 mr-2 flex-shrink-0 mt-0.5 font-bold">→</span>
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Detailed Analysis Bullet Points */}
        <div className="space-y-6">
          {/* Intonation Details */}
          {feedback.intonation_points.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-blue-400 font-bold text-sm uppercase tracking-wide flex items-center">
                <span className="w-1.5 h-3 bg-blue-500 rounded-full mr-2"></span>
                Intonation Insights
              </h4>
              <ul className="space-y-2.5 pl-3 border-l border-slate-700">
                {feedback.intonation_points.map((pt, idx) => (
                  <li key={`int-pt-${idx}`} className="text-slate-300 text-xs leading-relaxed">
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rhythm Details */}
          {feedback.rhythm_points.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-purple-400 font-bold text-sm uppercase tracking-wide flex items-center">
                <span className="w-1.5 h-3 bg-purple-500 rounded-full mr-2"></span>
                Rhythm & Timing Insights
              </h4>
              <ul className="space-y-2.5 pl-3 border-l border-slate-700">
                {feedback.rhythm_points.map((pt, idx) => (
                  <li key={`rhy-pt-${idx}`} className="text-slate-300 text-xs leading-relaxed">
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
