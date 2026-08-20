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
  theme?: 'light' | 'dark';
}

export const RhythmDriftGraph: React.FC<RhythmDriftGraphProps> = ({ alignmentData, theme = 'light' }) => {
  if (!alignmentData || !alignmentData.matches || alignmentData.matches.length === 0) return null;

  const isLight = theme === 'light';
  const { matches, score } = alignmentData;

  const chartData = matches.map((match, index) => ({
    noteIndex: index + 1,
    noteName: match.note_name,
    deviation: Math.round(match.timing_error_ms),
    status: match.status,
  }));

  const totalNotes = matches.length;
  const onTimeNotes = matches.filter((m) => m.status === 'on-time').length;
  const pctOnTime = ((onTimeNotes / totalNotes) * 100).toFixed(1);
  const avgAbsDev = Math.round(
    matches.reduce((sum, m) => sum + Math.abs(m.timing_error_ms), 0) / totalNotes
  );

  return (
    <div className={`w-full rounded-xl p-6 shadow-xl border transition-all ${
      isLight ? 'bg-[#ffffff] border-[#e2d5c3]' : 'bg-[#1c140e] border-[#3d2b1f]'
    }`}>
      <h2 className={`text-2xl font-bold mb-6 flex items-center ${
        isLight ? 'text-[#3b180d]' : 'text-[#fef3c7]'
      }`}>
        <span className="bg-rose-600 w-3 h-8 rounded-full mr-3"></span>
        Timing Accuracy & Rhythm Drift
      </h2>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className={`p-4 rounded-lg border ${
          isLight ? 'bg-[#fcf8f2] border-[#e2d5c3]' : 'bg-[#281c13] border-[#3d2b1f]'
        }`}>
          <p className={`text-sm font-medium mb-1 ${isLight ? 'text-[#785b48]' : 'text-[#d1c2b0]'}`}>
            On-Time Accuracy
          </p>
          <p className={`text-3xl font-bold ${
            Number(pctOnTime) >= 80 
              ? (isLight ? 'text-emerald-700' : 'text-emerald-400')
              : Number(pctOnTime) >= 60 
              ? (isLight ? 'text-amber-700' : 'text-amber-400')
              : (isLight ? 'text-rose-700' : 'text-rose-400')
          }`}>
            {pctOnTime}%
          </p>
          <p className={`text-xs mt-2 ${isLight ? 'text-[#8c705c]' : 'text-[#a39280]'}`}>
            Notes within ±60ms tolerance
          </p>
        </div>

        <div className={`p-4 rounded-lg border ${
          isLight ? 'bg-[#fcf8f2] border-[#e2d5c3]' : 'bg-[#281c13] border-[#3d2b1f]'
        }`}>
          <p className={`text-sm font-medium mb-1 ${isLight ? 'text-[#785b48]' : 'text-[#d1c2b0]'}`}>
            Avg Note Discrepancy
          </p>
          <p className={`text-3xl font-bold ${
            avgAbsDev < 40 
              ? (isLight ? 'text-emerald-700' : 'text-emerald-400')
              : avgAbsDev < 80 
              ? (isLight ? 'text-amber-700' : 'text-amber-400')
              : (isLight ? 'text-rose-700' : 'text-rose-400')
          }`}>
            {avgAbsDev} <span className="text-sm font-normal text-[#a39280]">ms</span>
          </p>
          <p className={`text-xs mt-2 ${isLight ? 'text-[#8c705c]' : 'text-[#a39280]'}`}>
            Average absolute timing offset
          </p>
        </div>

        <div className={`p-4 rounded-lg border ${
          isLight ? 'bg-[#fcf8f2] border-[#e2d5c3]' : 'bg-[#281c13] border-[#3d2b1f]'
        }`}>
          <p className={`text-sm font-medium mb-1 ${isLight ? 'text-[#785b48]' : 'text-[#d1c2b0]'}`}>
            Timing Score
          </p>
          <p className={`text-3xl font-bold ${
            score >= 80 
              ? (isLight ? 'text-emerald-700' : 'text-emerald-400')
              : score >= 60 
              ? (isLight ? 'text-amber-700' : 'text-amber-400')
              : (isLight ? 'text-rose-700' : 'text-rose-400')
          }`}>
            {score} <span className="text-sm font-normal text-[#a39280]">/ 100</span>
          </p>
          <p className={`text-xs mt-2 ${isLight ? 'text-[#8c705c]' : 'text-[#a39280]'}`}>
            Overall synchronization rating
          </p>
        </div>
      </div>

      <h3 className={`text-lg font-semibold mt-8 mb-4 ${isLight ? 'text-[#3b180d]' : 'text-[#fef3c7]'}`}>
        Note-by-Note Timing Deviations
      </h3>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2d5c3' : '#3d2b1f'} vertical={false} />
            <XAxis
              dataKey="noteIndex"
              stroke={isLight ? '#785b48' : '#a39280'}
              tickFormatter={(val) => `#${val}`}
            />
            <YAxis
              stroke={isLight ? '#785b48' : '#a39280'}
              domain={['auto', 'auto']}
              tickFormatter={(val) => `${val}ms`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isLight ? '#ffffff' : '#281c13',
                borderColor: isLight ? '#e2d5c3' : '#3d2b1f',
                borderRadius: '8px',
                color: isLight ? '#3b180d' : '#fef3c7'
              }}
              cursor={{ fill: isLight ? '#f4ebe1' : '#3d2b1f', opacity: 0.4 }}
              formatter={(value: any, _name: any, props: any) => {
                const label = value >= 0 ? `${value}ms Late (Dragging)` : `${Math.abs(value)}ms Early (Rushing)`;
                return [label, `Note ${props.payload.noteName}`];
              }}
              labelFormatter={(label) => `Note Sequence Index: #${label}`}
            />
            
            {/* Shaded On-Time Tolerance Band: ±60ms (Emerald Green) */}
            <ReferenceArea y1={-60} y2={60} fill="#10b981" fillOpacity={isLight ? 0.12 : 0.08} />
            <ReferenceLine y={0} stroke={isLight ? '#d6c4b0' : '#3d2b1f'} strokeWidth={1} />
            <ReferenceLine y={60} stroke={isLight ? '#059669' : '#10b981'} strokeDasharray="3 3" opacity={0.5} />
            <ReferenceLine y={-60} stroke={isLight ? '#059669' : '#10b981'} strokeDasharray="3 3" opacity={0.5} />

            <Bar dataKey="deviation">
              {chartData.map((entry, index) => {
                const isEarly = entry.deviation < 0;
                const isOffLimit = Math.abs(entry.deviation) > 60;
                
                let barColor = isLight ? '#059669' : '#10b981'; // Emerald Green
                if (isOffLimit) {
                  barColor = isEarly
                    ? (isLight ? '#d97706' : '#f59e0b')  // Acoustic Gold (rushing)
                    : (isLight ? '#e11d48' : '#f43f5e'); // Soft Ruby Red (dragging)
                }
                
                return <Cell key={`cell-${index}`} fill={barColor} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={`mt-12 p-4 rounded-lg border ${
        isLight ? 'bg-[#fcf8f2] border-[#e2d5c3]' : 'bg-rose-950/20 border-rose-800/40'
      }`}>
        <h4 className={`font-semibold mb-2 text-sm flex items-center ${
          isLight ? 'text-rose-800' : 'text-rose-400'
        }`}>
          💡 Reading Rhythmic Deviations
        </h4>
        <ul className={`text-xs space-y-1 list-disc pl-5 ${
          isLight ? 'text-[#6e503e]' : 'text-[#d1c2b0]'
        }`}>
          <li>Bars pointing <strong>upwards</strong> show notes played <span className="text-rose-600 font-semibold">late (dragging)</span>.</li>
          <li>Bars pointing <strong>downwards</strong> show notes played <span className="text-amber-600 font-semibold">early (rushing)</span>.</li>
          <li>The shaded green band represents the <strong>±60ms tolerance window</strong> where timing is perceived as perfectly in-sync.</li>
        </ul>
      </div>
    </div>
  );
};
