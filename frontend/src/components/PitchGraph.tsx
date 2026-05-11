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
}

export const PitchGraph: React.FC<PitchGraphProps> = ({ data, averageDeviation, absAverageDeviation }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
      <h2 className="text-2xl font-bold mb-6 text-slate-100 flex items-center">
        <span className="bg-blue-500 w-3 h-8 rounded-full mr-3"></span>
        Intonation Analysis
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
          <p className="text-slate-400 text-sm font-medium mb-1">Average Deviation</p>
          <p className={`text-3xl font-bold ${Math.abs(averageDeviation) < 10 ? 'text-green-400' : Math.abs(averageDeviation) < 20 ? 'text-yellow-400' : 'text-red-400'}`}>
            {averageDeviation > 0 ? '+' : ''}{averageDeviation} <span className="text-sm font-normal text-slate-400">cents</span>
          </p>
          <p className="text-xs text-slate-500 mt-2">Overall sharp/flat tendency</p>
        </div>
        
        <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
          <p className="text-slate-400 text-sm font-medium mb-1">Absolute Variance</p>
          <p className={`text-3xl font-bold ${absAverageDeviation < 15 ? 'text-green-400' : absAverageDeviation < 25 ? 'text-yellow-400' : 'text-red-400'}`}>
            {absAverageDeviation} <span className="text-sm font-normal text-slate-400">cents</span>
          </p>
          <p className="text-xs text-slate-500 mt-2">Average distance from perfect pitch</p>
        </div>
      </div>

      <div className="h-80 w-full mt-8">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Pitch Accuracy Over Time</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="#94a3b8" 
              tickFormatter={(val) => `${val.toFixed(1)}s`}
              minTickGap={30}
            />
            <YAxis 
              dataKey="cents" 
              stroke="#94a3b8"
              domain={[-50, 50]}
              tickFormatter={(val) => `${val}¢`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
              labelFormatter={(val) => `Time: ${Number(val).toFixed(2)}s`}
              formatter={(value: number, name: string, props: any) => [
                `${value.toFixed(1)} cents (Note: ${props.payload.note})`,
                'Deviation'
              ]}
            />
            <ReferenceLine y={0} stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" />
            <ReferenceLine y={20} stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
            <ReferenceLine y={-20} stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
            
            <Line 
              type="monotone" 
              dataKey="cents" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ r: 2, fill: '#3b82f6', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#60a5fa', stroke: '#fff' }}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
        <h4 className="text-blue-400 font-semibold mb-2">How to read this chart:</h4>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li>The green dashed line at 0 represents perfect intonation.</li>
          <li>Points above the line mean you are playing <span className="text-red-400">sharp</span>.</li>
          <li>Points below the line mean you are playing <span className="text-red-400">flat</span>.</li>
          <li>Deviations within ±15 cents are generally acceptable.</li>
        </ul>
      </div>
    </div>
  );
};
