import React, { useRef } from 'react';

interface MatchData {
  actual_index: number;
  expected_index: number;
  note_num: number;
  note_name: string;
  actual_onset: number;
  expected_onset: number;
  expected_duration?: number;
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

interface TimelineComparisonProps {
  alignmentData: AlignmentAnalysis | null;
}

export const TimelineComparison: React.FC<TimelineComparisonProps> = ({ alignmentData }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!alignmentData || !alignmentData.matches || alignmentData.matches.length === 0) return null;

  const { matches, unmatched_actual, unmatched_expected } = alignmentData;

  // 1. Gather all Expected events (matched + missed)
  const expectedNotesList = [
    ...matches.map((m, idx) => ({
      id: `match-${idx}`,
      onset: m.expected_onset,
      note_name: m.note_name,
      type: 'match' as const,
      index: idx
    })),
    ...unmatched_expected.map((u, idx) => ({
      id: `missed-${idx}`,
      onset: u.onset,
      note_name: u.note_name || u.note_num.toString(),
      type: 'missed' as const,
      index: idx
    }))
  ];
  // Sort chronologically
  expectedNotesList.sort((a, b) => a.onset - b.onset);

  // 2. Space Expected events to avoid overlap
  // Note pill width is 36px. At 200px/sec scale, 36px is 0.18s.
  // Let's use 0.25 seconds of minSpacing to give a comfortable visual margin.
  const pixelsPerSecond = 200;
  const pillWidth = 36;
  const minSpacingSeconds = 0.25;
  
  const spacedExpectedOnsets = new Map<string, number>();
  let lastExpectedSpaced = -minSpacingSeconds;

  expectedNotesList.forEach((note) => {
    let spacedOnset = note.onset;
    if (spacedOnset < lastExpectedSpaced + minSpacingSeconds) {
      spacedOnset = lastExpectedSpaced + minSpacingSeconds;
    }
    spacedExpectedOnsets.set(note.id, spacedOnset);
    lastExpectedSpaced = spacedOnset;
  });

  // 3. Gather all Actual events (matched + extra)
  const actualNotesList = [
    ...matches.map((m, idx) => ({
      id: `match-${idx}`,
      onset: m.actual_onset,
      note_name: m.note_name,
      type: 'match' as const,
      index: idx
    })),
    ...unmatched_actual.map((u, idx) => ({
      id: `extra-${idx}`,
      onset: u.onset,
      note_name: u.note_name || u.note_num.toString(),
      type: 'extra' as const,
      index: idx
    }))
  ];
  actualNotesList.sort((a, b) => a.onset - b.onset);

  // 4. Space Actual events to avoid overlap
  const spacedActualOnsets = new Map<string, number>();
  let lastActualSpaced = -minSpacingSeconds;

  actualNotesList.forEach((note) => {
    let spacedOnset = note.onset;
    if (spacedOnset < lastActualSpaced + minSpacingSeconds) {
      spacedOnset = lastActualSpaced + minSpacingSeconds;
    }
    spacedActualOnsets.set(note.id, spacedOnset);
    lastActualSpaced = spacedOnset;
  });

  // Calculate width of timeline container based on maximum spaced position
  const maxTime = Math.max(lastExpectedSpaced, lastActualSpaced, 3.0) + 0.5;
  const timelineWidth = Math.ceil(maxTime * pixelsPerSecond);

  return (
    <div className="w-full bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
      <h2 className="text-2xl font-bold mb-2 text-slate-100 flex items-center">
        <span className="bg-indigo-500 w-3 h-8 rounded-full mr-3"></span>
        Note Alignment Timeline
      </h2>
      <p className="text-sm text-slate-400 mb-6">
        Scroll horizontally to inspect note synchronization. Note positions are spaced out sequentially to avoid overlapping.
      </p>

      {/* Horizontally Scrollable Container */}
      <div 
        ref={scrollContainerRef}
        className="w-full overflow-x-auto bg-slate-950/60 rounded-xl border border-slate-800 relative p-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
      >
        <div 
          className="relative h-44 select-none" 
          style={{ width: `${timelineWidth}px`, minWidth: '100%' }}
        >
          {/* Horizontal Track Lanes */}
          <div className="absolute top-2 left-0 right-0 h-10 bg-slate-900/40 rounded-lg border border-slate-800/30"></div>
          <div className="absolute top-26 left-0 right-0 h-10 bg-slate-900/40 rounded-lg border border-slate-800/30"></div>

          {/* SVG Connecting Lines Overlay */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
            {matches.map((m, idx) => {
              const xExpected = (spacedExpectedOnsets.get(`match-${idx}`) || 0) * pixelsPerSecond;
              const xActual = (spacedActualOnsets.get(`match-${idx}`) || 0) * pixelsPerSecond;
              
              // Colors based on status
              let strokeColor = '#10b981'; // green (on-time)
              if (m.status === 'early') strokeColor = '#f59e0b'; // orange
              if (m.status === 'late') strokeColor = '#ef4444'; // red

              return (
                <line
                  key={`line-${idx}`}
                  x1={xExpected + pillWidth / 2}
                  y1={42} // Bottom of expected notes row (top-2 + h-10 = 12px + 40px)
                  x2={xActual + pillWidth / 2}
                  y2={104} // Top of actual notes row (top-26 = 104px)
                  stroke={strokeColor}
                  strokeWidth={2}
                  strokeDasharray={m.status === 'on-time' ? undefined : '3 3'}
                  opacity={0.65}
                />
              );
            })}
          </svg>

          {/* TOP ROW: Expected Notes */}
          <div className="absolute top-2 left-0 right-0 h-10 flex items-center">
            <span className="absolute -left-2 top-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 origin-left -rotate-90 select-none">
              Expected
            </span>
            {/* Aligned Expected Notes */}
            {matches.map((m, idx) => {
              const x = (spacedExpectedOnsets.get(`match-${idx}`) || 0) * pixelsPerSecond;
              return (
                <div
                  key={`exp-${idx}`}
                  className="absolute h-10 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex flex-col items-center justify-center shadow-md z-20"
                  style={{ 
                    left: `${x}px`, 
                    width: `${pillWidth}px` 
                  }}
                  title={`Expected note: ${m.note_name} at ${m.expected_onset.toFixed(2)}s`}
                >
                  <span className="text-[10px] font-bold leading-tight">{m.note_name}</span>
                  <span className="text-[7px] text-slate-500 font-normal leading-none mt-0.5">{m.expected_onset.toFixed(1)}s</span>
                </div>
              );
            })}
            {/* Missed Expected Notes (Deletions) */}
            {unmatched_expected.map((note, idx) => {
              const x = (spacedExpectedOnsets.get(`missed-${idx}`) || 0) * pixelsPerSecond;
              return (
                <div
                  key={`exp-miss-${idx}`}
                  className="absolute h-10 rounded-lg bg-red-950/20 border border-red-500/30 text-red-400/80 flex flex-col items-center justify-center shadow-md z-20 opacity-60"
                  style={{ 
                    left: `${x}px`, 
                    width: `${pillWidth}px` 
                  }}
                  title={`Missed note: ${note.note_name || note.note_num} at ${note.onset.toFixed(2)}s`}
                >
                  <span className="text-[10px] font-bold leading-tight">{note.note_name || note.note_num}</span>
                  <span className="text-[7px] text-red-500/70 font-normal leading-none mt-0.5">missed</span>
                  <span className="absolute -top-1 -right-1 text-[7px] bg-red-600 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center border border-slate-900 font-bold">
                    ✕
                  </span>
                </div>
              );
            })}
          </div>

          {/* BOTTOM ROW: Actual Played Notes */}
          <div className="absolute top-26 left-0 right-0 h-10 flex items-center">
            <span className="absolute -left-2 top-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 origin-left -rotate-90 select-none">
              Played
            </span>
            {/* Aligned Played Notes */}
            {matches.map((m, idx) => {
              const x = (spacedActualOnsets.get(`match-${idx}`) || 0) * pixelsPerSecond;
              let bgColor = 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300';
              if (m.status === 'early') bgColor = 'bg-amber-500/20 border-amber-500/60 text-amber-300';
              if (m.status === 'late') bgColor = 'bg-rose-500/20 border-rose-500/60 text-rose-300';

              return (
                <div
                  key={`act-${idx}`}
                  className={`absolute h-10 rounded-lg border flex flex-col items-center justify-center shadow-md z-20 ${bgColor}`}
                  style={{ 
                    left: `${x}px`, 
                    width: `${pillWidth}px` 
                  }}
                  title={`Played note: ${m.note_name} at ${m.actual_onset.toFixed(2)}s (Error: ${m.timing_error_ms.toFixed(0)}ms)`}
                >
                  <span className="text-[10px] font-bold leading-tight">{m.note_name}</span>
                  <span className="text-[7px] font-normal leading-none mt-0.5">
                    {m.timing_error_ms > 0 ? '+' : ''}{Math.round(m.timing_error_ms)}m
                  </span>
                </div>
              );
            })}
            {/* Extra Notes Played (Insertions) */}
            {unmatched_actual.map((note, idx) => {
              const x = (spacedActualOnsets.get(`extra-${idx}`) || 0) * pixelsPerSecond;
              return (
                <div
                  key={`act-extra-${idx}`}
                  className="absolute h-10 rounded-lg bg-slate-800 border border-slate-600 text-slate-400 flex flex-col items-center justify-center shadow-md z-20 opacity-60"
                  style={{ 
                    left: `${x}px`, 
                    width: `${pillWidth}px` 
                  }}
                  title={`Extra note: ${note.note_name || note.note_num} at ${note.onset.toFixed(2)}s`}
                >
                  <span className="text-[10px] font-bold leading-tight">{note.note_name || note.note_num}</span>
                  <span className="text-[7px] text-slate-500 font-normal leading-none mt-0.5">extra</span>
                  <span className="absolute -top-1 -right-1 text-[7px] bg-slate-500 text-slate-900 rounded-full w-3.5 h-3.5 flex items-center justify-center border border-slate-900 font-extrabold">
                    +
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-5 text-xs text-slate-400 justify-center">
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/60 inline-block"></span>
          <span>On-Time Note (within ±60ms)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/60 inline-block"></span>
          <span>Rushing (Early)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded bg-rose-500/20 border border-rose-500/60 inline-block"></span>
          <span>Dragging (Late)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded bg-slate-800 border border-slate-600 inline-block text-center text-[8px] leading-3 text-slate-400 font-bold">
            +
          </span>
          <span>Extra Note Played</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded bg-red-950/20 border border-red-500/30 inline-block text-center text-[8px] leading-3 text-red-400 font-bold">
            ✕
          </span>
          <span>Missed Note</span>
        </div>
      </div>
    </div>
  );
};
