import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar
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
  theme?: 'light' | 'dark';
}

export const RhythmGraph: React.FC<RhythmGraphProps> = ({ data, theme = 'light' }) => {
  if (!data || !data.durations || data.durations.length === 0) return null;

  const isLight = theme === 'light';

  const chartData = data.durations.map((duration, i) => ({
    noteIndex: i + 1,
    time: data.onsets[i],
    duration: duration,
  }));

  const avgDuration = data.average_duration;

  return (
    <div className={`w-full rounded-xl p-6 shadow-xl border transition-all ${
      isLight ? 'bg-[#ffffff] border-[#e2d5c3]' : 'bg-[#1c140e] border-[#3d2b1f]'
    }`}>
      <h2 className={`text-2xl font-bold mb-6 flex items-center ${
        isLight ? 'text-[#3b180d]' : 'text-[#fef3c7]'
      }`}>
        <span className="bg-amber-600 w-3 h-8 rounded-full mr-3"></span>
        Rhythm & Tempo Stability
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className={`p-4 rounded-lg border ${
          isLight ? 'bg-[#fcf8f2] border-[#e2d5c3]' : 'bg-[#281c13] border-[#3d2b1f]'
        }`}>
          <p className={`text-sm font-medium mb-1 ${isLight ? 'text-[#785b48]' : 'text-[#d1c2b0]'}`}>
            Estimated Tempo
          </p>
          <p className={`text-3xl font-bold ${isLight ? 'text-[#3b180d]' : 'text-[#fef3c7]'}`}>
            {Math.round(data.tempo)} <span className="text-sm font-normal text-[#a39280]">BPM</span>
          </p>
          <p className={`text-xs mt-2 ${isLight ? 'text-[#8c705c]' : 'text-[#a39280]'}`}>
            Overall speed of performance
          </p>
        </div>

        <div className={`p-4 rounded-lg border ${
          isLight ? 'bg-[#fcf8f2] border-[#e2d5c3]' : 'bg-[#281c13] border-[#3d2b1f]'
        }`}>
          <p className={`text-sm font-medium mb-1 ${isLight ? 'text-[#785b48]' : 'text-[#d1c2b0]'}`}>
            Rhythm Stability
          </p>
          <p className={`text-3xl font-bold ${
            data.rhythm_stability < 0.1 
              ? (isLight ? 'text-emerald-700' : 'text-emerald-400')
              : data.rhythm_stability < 0.25 
              ? (isLight ? 'text-amber-700' : 'text-amber-400')
              : (isLight ? 'text-rose-700' : 'text-rose-400')
          }`}>
            {data.rhythm_stability.toFixed(3)} <span className="text-sm font-normal text-[#a39280]">sec dev</span>
          </p>
          <p className={`text-xs mt-2 ${isLight ? 'text-[#8c705c]' : 'text-[#a39280]'}`}>
            Lower variance = steadier rhythm
          </p>
        </div>

        <div className={`p-4 rounded-lg border ${
          isLight ? 'bg-[#fcf8f2] border-[#e2d5c3]' : 'bg-[#281c13] border-[#3d2b1f]'
        }`}>
          <p className={`text-sm font-medium mb-1 ${isLight ? 'text-[#785b48]' : 'text-[#d1c2b0]'}`}>
            Rhythm Score
          </p>
          <p className={`text-3xl font-bold ${
            data.score >= 80 
              ? (isLight ? 'text-emerald-700' : 'text-emerald-400')
              : data.score >= 60 
              ? (isLight ? 'text-amber-700' : 'text-amber-400')
              : (isLight ? 'text-rose-700' : 'text-rose-400')
          }`}>
            {data.score} <span className="text-sm font-normal text-[#a39280]">/ 100</span>
          </p>
          <p className={`text-xs mt-2 ${isLight ? 'text-[#8c705c]' : 'text-[#a39280]'}`}>
            Consistency rating
          </p>
        </div>
      </div>

      <h3 className={`text-lg font-semibold mt-8 mb-4 ${isLight ? 'text-[#3b180d]' : 'text-[#fef3c7]'}`}>
        Note Durations Over Time
      </h3>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }} barSize={20} barCategoryGap="10%">
            <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2d5c3' : '#3d2b1f'} vertical={false} />
            <XAxis
              type="number"
              dataKey="noteIndex"
              name="Note"
              stroke={isLight ? '#785b48' : '#a39280'}
              tickFormatter={(val) => `#${val}`}
              domain={['auto', 'auto']}
            />
            <YAxis
              type="number"
              dataKey="duration"
              name="Duration"
              stroke={isLight ? '#785b48' : '#a39280'}
              tickFormatter={(val) => `${val.toFixed(2)}s`}
              domain={[0, 'auto']}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{
                backgroundColor: isLight ? '#ffffff' : '#281c13',
                borderColor: isLight ? '#e2d5c3' : '#3d2b1f',
                borderRadius: '8px',
                color: isLight ? '#3b180d' : '#fef3c7'
              }}
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

            <ReferenceLine y={avgDuration} stroke={isLight ? '#b45309' : '#fbbf24'} strokeWidth={2} strokeDasharray="3 3" />

            <Bar dataKey="duration" fill={isLight ? '#d97706' : '#d97706'} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={`mt-12 p-4 rounded-lg border ${
        isLight ? 'bg-[#fcf8f2] border-[#e2d5c3]' : 'bg-amber-950/25 border-amber-800/40'
      }`}>
        <h4 className={`font-semibold mb-2 text-sm flex items-center space-x-1.5 ${
          isLight ? 'text-[#78350f]' : 'text-amber-400'
        }`}>
          <span>🎼 Reading Rhythm & Durations</span>
        </h4>
        <ul className={`text-xs space-y-1 list-disc pl-5 ${
          isLight ? 'text-[#6e503e]' : 'text-[#d1c2b0]'
        }`}>
          <li>Each bar represents a played note in sequence.</li>
          <li>The height shows how long the note was held in seconds.</li>
          <li>The <span className="text-amber-600 font-semibold">gold dashed line</span> marks average note duration.</li>
          <li>Inconsistent bar heights indicate unintentional rushing or dragging.</li>
        </ul>
      </div>
    </div>
  );
};
