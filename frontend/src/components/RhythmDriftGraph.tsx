import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Cell
} from 'recharts';

interface MatchData {
  actual_index: number;
  expected_index: number;
  note_num: number;
  note_name: string;
  actual_onset: number;
  expected_onset: number;
  timing_error: number;
  timing_error_ms: number;
  status: 'on-time' | 'early' | 'late';
}

interface AlignmentAnalysis {
  matches: MatchData[];
  unmatched_actual: any[];
  unmatched_expected: any[];
  tempo_scale: number;
  latency_offset: number;
  score: number;
}

interface RhythmDriftGraphProps {
  alignmentData: AlignmentAnalysis | null;
}

export const RhythmDriftGraph: React.FC<RhythmDriftGraphProps> = ({ alignmentData }) => {
  if (!alignmentData || !alignmentData.matches || alignmentData.matches.length === 0) return null;

  const { matches, score } = alignmentData;

  // Prepare chart data
  const chartData = matches.map((match, index) => ({
    noteIndex: index + 1,
    noteName: match.note_name,
    deviation: Math.round(match.timing_error_ms),
    status: match.status,
  }));

  // Calculations for summary boxes
  const totalNotes = matches.length;
  const onTimeNotes = matches.filter((m) => m.status === 'on-time').length;
  const pctOnTime = ((onTimeNotes / totalNotes) * 100).toFixed(1);
  const avgAbsDev = Math.round(
    matches.reduce((sum, m) => sum + Math.abs(m.timing_error_ms), 0) / totalNotes
  );

  return (
    <div className="w-full bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
      <h2 className="text-2xl font-bold mb-6 text-slate-100 flex items-center">
        <span className="bg-rose-500 w-3 h-8 rounded-full mr-3"></span>
        Timing Accuracy & Rhythm Drift
      </h2>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
          <p className="text-slate-400 text-sm font-medium mb-1">On-Time Accuracy</p>
          <p className={`text-3xl font-bold ${Number(pctOnTime) >= 80 ? 'text-green-400' : Number(pctOnTime) >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
            {pctOnTime}%
          </p>
          <p className="text-xs text-slate-500 mt-2">Notes within ±60ms tolerance</p>
        </div>

        <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
          <p className="text-slate-400 text-sm font-medium mb-1">Avg Note Discrepancy</p>
          <p className={`text-3xl font-bold ${avgAbsDev < 40 ? 'text-green-400' : avgAbsDev < 80 ? 'text-yellow-400' : 'text-red-400'}`}>
            {avgAbsDev} <span className="text-sm font-normal text-slate-400">ms</span>
          </p>
          <p className="text-xs text-slate-500 mt-2">Average absolute timing offset</p>
        </div>

        <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
          <p className="text-slate-400 text-sm font-medium mb-1">Timing Score</p>
          <p className={`text-3xl font-bold ${score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
            {score} <span className="text-sm font-normal text-slate-400">/ 100</span>
          </p>
          <p className="text-xs text-slate-500 mt-2">Overall synchronization rating</p>
        </div>
      </div>

      {/* Recharts BarChart */}
      <h3 className="text-lg font-semibold text-slate-200 mt-8 mb-4">Note-by-Note Timing Deviations</h3>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis
              dataKey="noteIndex"
              stroke="#94a3b8"
              tickFormatter={(val) => `#${val}`}
            />
            <YAxis
              stroke="#94a3b8"
              domain={['auto', 'auto']}
              tickFormatter={(val) => `${val}ms`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
              cursor={{ fill: '#334155', opacity: 0.15 }}
              formatter={(value: any, _name: any, props: any) => {
                const label = value >= 0 ? `${value}ms Late (Dragging)` : `${Math.abs(value)}ms Early (Rushing)`;
                return [label, `Note ${props.payload.noteName}`];
              }}
              labelFormatter={(label) => `Note Sequence Index: #${label}`}
            />
            
            {/* Shaded On-Time Tolerance Band: ±60ms */}
            <ReferenceArea y1={-60} y2={60} fill="#10b981" fillOpacity={0.06} />
            <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />
            <ReferenceLine y={60} stroke="#10b981" strokeDasharray="3 3" opacity={0.3} />
            <ReferenceLine y={-60} stroke="#10b981" strokeDasharray="3 3" opacity={0.3} />

            <Bar dataKey="deviation">
              {chartData.map((entry, index) => {
                // Color code individual bars
                const isEarly = entry.deviation < 0;
                const isOffLimit = Math.abs(entry.deviation) > 60;
                
                let barColor = '#10b981'; // Green for on-time
                if (isOffLimit) {
                  barColor = isEarly ? '#f59e0b' : '#ef4444'; // Orange for rushing, Red for dragging
                }
                
                return <Cell key={`cell-${index}`} fill={barColor} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Guide Card */}
      <div className="mt-12 p-4 bg-rose-900/10 border border-rose-800/40 rounded-lg">
        <h4 className="text-rose-400 font-semibold mb-2 text-sm flex items-center">
          💡 Reading Rhythmic Deviations
        </h4>
        <ul className="text-xs text-slate-300 space-y-1 list-disc pl-5">
          <li>Bars pointing <strong>upwards</strong> show notes played <span className="text-red-400 font-semibold">late (dragging)</span>.</li>
          <li>Bars pointing <strong>downwards</strong> show notes played <span className="text-yellow-400 font-semibold">early (rushing)</span>.</li>
          <li>The shaded green band represents the <strong>±60ms tolerance window</strong> where timing is perceived as perfectly in-sync.</li>
        </ul>
      </div>
    </div>
  );
};
