import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface GraphData {
  time: number;
  pitch: number;
  note: string;
  cents: number;
}

interface PitchGraphProps {
  data: GraphData[];
  averageDeviation: number;
  absAverageDeviation: number;
  theme?: 'light' | 'dark';
}

export const PitchGraph: React.FC<PitchGraphProps> = ({ data, averageDeviation, absAverageDeviation, theme = 'light' }) => {
  if (!data || data.length === 0) return null;

  const isLight = theme === 'light';

  return (
    <div className={`w-full rounded-xl p-6 shadow-xl border transition-all ${
      isLight ? 'bg-[#ffffff] border-[#e2d5c3]' : 'bg-[#1c140e] border-[#3d2b1f]'
    }`}>
      <h2 className={`text-2xl font-bold mb-6 flex items-center ${
        isLight ? 'text-[#3b180d]' : 'text-[#fef3c7]'
      }`}>
        <span className="bg-amber-600 w-3 h-8 rounded-full mr-3"></span>
        Intonation & Pitch Centering Analysis
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className={`p-4 rounded-lg border ${
          isLight ? 'bg-[#fcf8f2] border-[#e2d5c3]' : 'bg-[#281c13] border-[#3d2b1f]'
        }`}>
          <p className={`text-sm font-medium mb-1 ${isLight ? 'text-[#785b48]' : 'text-[#d1c2b0]'}`}>
            Average Deviation
          </p>
          <p className={`text-3xl font-bold ${
            Math.abs(averageDeviation) < 10 
              ? (isLight ? 'text-emerald-700' : 'text-emerald-400')
              : Math.abs(averageDeviation) < 20 
              ? (isLight ? 'text-amber-700' : 'text-amber-400')
              : (isLight ? 'text-rose-700' : 'text-rose-400')
          }`}>
            {averageDeviation > 0 ? '+' : ''}{averageDeviation} <span className="text-sm font-normal text-[#a39280]">cents</span>
          </p>
          <p className={`text-xs mt-2 ${isLight ? 'text-[#8c705c]' : 'text-[#a39280]'}`}>
            Overall sharp (+) or flat (-) tendency
          </p>
        </div>

        <div className={`p-4 rounded-lg border ${
          isLight ? 'bg-[#fcf8f2] border-[#e2d5c3]' : 'bg-[#281c13] border-[#3d2b1f]'
        }`}>
          <p className={`text-sm font-medium mb-1 ${isLight ? 'text-[#785b48]' : 'text-[#d1c2b0]'}`}>
            Absolute Variance
          </p>
          <p className={`text-3xl font-bold ${
            absAverageDeviation < 15 
              ? (isLight ? 'text-emerald-700' : 'text-emerald-400')
              : absAverageDeviation < 25 
              ? (isLight ? 'text-amber-700' : 'text-amber-400')
              : (isLight ? 'text-rose-700' : 'text-rose-400')
          }`}>
            {absAverageDeviation} <span className="text-sm font-normal text-[#a39280]">cents</span>
          </p>
          <p className={`text-xs mt-2 ${isLight ? 'text-[#8c705c]' : 'text-[#a39280]'}`}>
            Average distance from target pitch
          </p>
        </div>
      </div>

      <div className="h-80 w-full mt-8">
        <h3 className={`text-lg font-semibold mb-4 ${isLight ? 'text-[#3b180d]' : 'text-[#fef3c7]'}`}>
          Pitch Accuracy Over Time
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2d5c3' : '#3d2b1f'} vertical={false} />
            <XAxis
              dataKey="time"
              stroke={isLight ? '#785b48' : '#a39280'}
              tickFormatter={(val) => `${val.toFixed(1)}s`}
              minTickGap={30}
            />
            <YAxis
              dataKey="cents"
              stroke={isLight ? '#785b48' : '#a39280'}
              domain={[-50, 50]}
              tickFormatter={(val) => `${val}¢`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isLight ? '#ffffff' : '#281c13',
                borderColor: isLight ? '#e2d5c3' : '#3d2b1f',
                borderRadius: '8px',
                color: isLight ? '#3b180d' : '#fef3c7'
              }}
              labelFormatter={(val) => `Time: ${Number(val).toFixed(2)}s`}
              formatter={(value: any, _name: any, props: any) => [
                `${Number(value).toFixed(1)} cents (Note: ${props.payload.note})`,
                'Pitch Deviation'
              ]}
            />
            {/* Perfect pitch line (Emerald Green) */}
            <ReferenceLine y={0} stroke={isLight ? '#059669' : '#10b981'} strokeWidth={2} strokeDasharray="3 3" />
            {/* Tolerances (Soft Ruby Red) */}
            <ReferenceLine y={20} stroke={isLight ? '#e11d48' : '#f43f5e'} strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />
            <ReferenceLine y={-20} stroke={isLight ? '#e11d48' : '#f43f5e'} strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />

            <Line
              type="monotone"
              dataKey="cents"
              stroke={isLight ? '#d97706' : '#f59e0b'}
              strokeWidth={3}
              dot={{ r: 2, fill: isLight ? '#d97706' : '#f59e0b', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#fbbf24', stroke: isLight ? '#3b180d' : '#fff' }}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className={`mt-12 p-4 rounded-lg border ${
        isLight ? 'bg-[#fcf8f2] border-[#e2d5c3]' : 'bg-amber-950/25 border-amber-800/40'
      }`}>
        <h4 className={`font-semibold mb-2 flex items-center space-x-1.5 text-sm ${
          isLight ? 'text-[#78350f]' : 'text-amber-400'
        }`}>
          <span>🎻 Understanding Intonation</span>
        </h4>
        <ul className={`text-xs space-y-1 list-disc pl-5 ${
          isLight ? 'text-[#6e503e]' : 'text-[#d1c2b0]'
        }`}>
          <li>The <span className="text-emerald-600 font-semibold">green dashed line</span> at 0 represents perfect pitch.</li>
          <li>Points above the line mean you are playing <span className="text-rose-600 font-semibold">sharp</span>.</li>
          <li>Points below the line mean you are playing <span className="text-rose-600 font-semibold">flat</span>.</li>
          <li>Deviations within ±15 cents are in-tune for classical violin performance.</li>
        </ul>
      </div>
    </div>
  );
};
