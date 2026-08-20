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
  theme?: 'light' | 'dark';
}

export const PerformanceCoaching: React.FC<PerformanceCoachingProps> = ({ feedback, theme = 'light' }) => {
  if (!feedback) return null;

  const isLight = theme === 'light';

  return (
    <div className={`w-full rounded-xl p-6 shadow-xl border space-y-6 transition-all ${
      isLight ? 'bg-[#ffffff] border-[#e2d5c3]' : 'bg-[#1c140e] border-[#3d2b1f]'
    }`}>
      {/* Header */}
      <div className={`flex items-center space-x-3 border-b pb-4 ${
        isLight ? 'border-[#e2d5c3]' : 'border-[#3d2b1f]'
      }`}>
        <div className={`p-2.5 rounded-lg font-bold text-xl shadow-lg border ${
          isLight
            ? 'bg-amber-600 text-white border-amber-500/40'
            : 'bg-gradient-to-r from-amber-600 to-amber-700 text-amber-100 border-amber-500/30'
        }`}>
          🎻
        </div>
        <div>
          <h2 className={`text-2xl font-bold ${isLight ? 'text-[#3b180d]' : 'text-[#fef3c7]'}`}>
            AI Practice Coach
          </h2>
          <p className={`text-xs ${isLight ? 'text-[#785b48]' : 'text-[#d1c2b0]'}`}>
            Personalized feedback based on intonation and rhythm analysis
          </p>
        </div>
      </div>

      {/* Overall Coach Summary */}
      <div className={`relative overflow-hidden border rounded-xl p-5 shadow-sm ${
        isLight
          ? 'bg-[#fcf8f2] border-[#e2d5c3] text-[#3b180d]'
          : 'bg-amber-950/20 border-amber-500/30 text-[#fef3c7]'
      }`}>
        <div className={`absolute top-0 right-0 p-3 opacity-10 select-none font-serif text-8xl leading-none ${
          isLight ? 'text-amber-700' : 'text-amber-400'
        }`}>
          ”
        </div>
        <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${
          isLight ? 'text-[#78350f]' : 'text-amber-400'
        }`}>
          Coach's Summary
        </h3>
        <p className="text-sm leading-relaxed relative z-10 font-medium">
          {feedback.overall_summary}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Strengths & Improvements */}
        <div className="space-y-6">
          {/* Strengths Card */}
          <div className={`border rounded-xl p-5 space-y-3 ${
            isLight ? 'bg-[#fcf8f2] border-[#e2d5c3]' : 'bg-[#120d09]/60 border-[#3d2b1f]'
          }`}>
            <h4 className={`font-bold text-sm uppercase tracking-wide flex items-center ${
              isLight ? 'text-emerald-700' : 'text-emerald-400'
            }`}>
              <span className="mr-2">✨</span> Key Strengths
            </h4>
            <ul className="space-y-2.5">
              {feedback.strengths.map((str, idx) => (
                <li key={`str-${idx}`} className={`text-xs flex items-start ${
                  isLight ? 'text-[#3b180d]' : 'text-[#d1c2b0]'
                }`}>
                  <span className={`mr-2 flex-shrink-0 mt-0.5 font-bold ${
                    isLight ? 'text-emerald-700' : 'text-emerald-400'
                  }`}>✓</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Areas for Improvement Card */}
          <div className={`border rounded-xl p-5 space-y-3 ${
            isLight ? 'bg-[#fcf8f2] border-[#e2d5c3]' : 'bg-[#120d09]/60 border-[#3d2b1f]'
          }`}>
            <h4 className={`font-bold text-sm uppercase tracking-wide flex items-center ${
              isLight ? 'text-amber-700' : 'text-amber-400'
            }`}>
              <span className="mr-2">🎯</span> Focus Areas
            </h4>
            <ul className="space-y-2.5">
              {feedback.improvements.map((imp, idx) => (
                <li key={`imp-${idx}`} className={`text-xs flex items-start ${
                  isLight ? 'text-[#3b180d]' : 'text-[#d1c2b0]'
                }`}>
                  <span className={`mr-2 flex-shrink-0 mt-0.5 font-bold ${
                    isLight ? 'text-amber-700' : 'text-amber-400'
                  }`}>→</span>
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
              <h4 className={`font-bold text-sm uppercase tracking-wide flex items-center ${
                isLight ? 'text-amber-800' : 'text-amber-400'
              }`}>
                <span className="w-1.5 h-3 bg-amber-600 rounded-full mr-2"></span>
                Intonation Insights
              </h4>
              <ul className={`space-y-2.5 pl-3 border-l ${
                isLight ? 'border-[#e2d5c3] text-[#6e503e]' : 'border-[#3d2b1f] text-[#d1c2b0]'
              }`}>
                {feedback.intonation_points.map((pt, idx) => (
                  <li key={`int-pt-${idx}`} className="text-xs leading-relaxed">
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rhythm Details */}
          {feedback.rhythm_points.length > 0 && (
            <div className="space-y-3">
              <h4 className={`font-bold text-sm uppercase tracking-wide flex items-center ${
                isLight ? 'text-amber-700' : 'text-amber-300'
              }`}>
                <span className="w-1.5 h-3 bg-amber-700 rounded-full mr-2"></span>
                Rhythm & Timing Insights
              </h4>
              <ul className={`space-y-2.5 pl-3 border-l ${
                isLight ? 'border-[#e2d5c3] text-[#6e503e]' : 'border-[#3d2b1f] text-[#d1c2b0]'
              }`}>
                {feedback.rhythm_points.map((pt, idx) => (
                  <li key={`rhy-pt-${idx}`} className="text-xs leading-relaxed">
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
