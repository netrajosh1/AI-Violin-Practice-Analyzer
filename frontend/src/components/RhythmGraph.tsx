import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ScatterChart,
  Scatter
} from 'recharts';

interface RhythmAnalysis {
  tempo: number;
  onsets: number[];
  durations: number[];
  rhythm_stability: number;
  average_duration: number;
  score: number;
}

interface RhythmGraphProps {
  data: RhythmAnalysis;
}

export const RhythmGraph: React.FC<RhythmGraphProps> = ({ data }) => {
  if (!data || !data.durations || data.durations.length === 0) return null;

  const chartData = data.durations.map((duration, i) => ({
    noteIndex: i + 1,
    time: data.onsets[i],
    duration: duration,
  }));

  // Average duration is our "expected" baseline for visual stability
  const avgDuration = data.average_duration;

  return (
    <div className="w-full bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
      <h2 className="text-2xl font-bold mb-6 text-slate-100 flex items-center">
        <span className="bg-purple-500 w-3 h-8 rounded-full mr-3"></span>
        Rhythm & Timing Analysis
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
          <p className="text-slate-400 text-sm font-medium mb-1">Estimated Tempo</p>
          <p className="text-3xl font-bold text-slate-100">
            {Math.round(data.tempo)} <span className="text-sm font-normal text-slate-400">BPM</span>
          </p>
          <p className="text-xs text-slate-500 mt-2">Overall speed of performance</p>
        </div>

        <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
          <p className="text-slate-400 text-sm font-medium mb-1">Rhythm Stability</p>
          <p className={`text-3xl font-bold ${data.rhythm_stability < 0.1 ? 'text-green-400' : data.rhythm_stability < 0.25 ? 'text-yellow-400' : 'text-red-400'}`}>
            {data.rhythm_stability.toFixed(3)} <span className="text-sm font-normal text-slate-400">sec dev</span>
          </p>
          <p className="text-xs text-slate-500 mt-2">Lower variance = steadier rhythm</p>
        </div>

        <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
          <p className="text-slate-400 text-sm font-medium mb-1">Rhythm Score</p>
          <p className={`text-3xl font-bold ${data.score >= 80 ? 'text-green-400' : data.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
            {data.score} <span className="text-sm font-normal text-slate-400">/ 100</span>
          </p>
          <p className="text-xs text-slate-500 mt-2">Consistency rating</p>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-slate-200 mt-8 mb-4">Note Durations Over Time</h3>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }} barSize={20} barCategoryGap="10%">
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis
              type="number"
              dataKey="noteIndex"
              name="Note"
              stroke="#94a3b8"
              tickFormatter={(val) => `#${val}`}
              domain={['auto', 'auto']}
            />
            <YAxis
              type="number"
              dataKey="duration"
              name="Duration"
              stroke="#94a3b8"
              tickFormatter={(val) => `${val.toFixed(2)}s`}
              domain={[0, 'auto']}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
              formatter={(value: any, name: any) => [
                `${Number(value).toFixed(3)}s`,
                name === 'duration' ? 'Note Duration' : name
              ]}
              labelFormatter={(val, items) => {
                const noteItem = items[0]?.payload;
                const timeLabel = noteItem ? ` (at ${noteItem.time.toFixed(2)}s)` : '';
                return `Note: #${val}${timeLabel}`;
              }}
            />
            
            <ReferenceLine y={avgDuration} stroke="#a855f7" strokeWidth={2} strokeDasharray="3 3" />
            
            <Bar dataKey="duration" fill="#a855f7" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-12 p-4 bg-purple-900/20 border border-purple-800 rounded-lg">
        <h4 className="text-purple-400 font-semibold mb-2">How to read this chart:</h4>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li>Each dot represents a note.</li>
          <li>The Y-axis shows how long the note was held (duration).</li>
          <li>The dashed purple line shows the average note duration.</li>
          <li>Dots scattered far from the average line indicate rushing or dragging.</li>
        </ul>
      </div>
    </div>
  );
};
