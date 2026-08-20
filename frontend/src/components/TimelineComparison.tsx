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
  theme?: 'light' | 'dark';
}

export const TimelineComparison: React.FC<TimelineComparisonProps> = ({ alignmentData, theme = 'light' }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!alignmentData || !alignmentData.matches || alignmentData.matches.length === 0) return null;

  const isLight = theme === 'light';
  const { matches, unmatched_actual, unmatched_expected } = alignmentData;

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
  expectedNotesList.sort((a, b) => a.onset - b.onset);

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

  const maxTime = Math.max(lastExpectedSpaced, lastActualSpaced, 3.0) + 0.5;
  const timelineWidth = Math.ceil(maxTime * pixelsPerSecond);

  return (
    <div className={`w-full rounded-xl p-6 shadow-xl border transition-all ${
      isLight ? 'bg-[#ffffff] border-[#e2d5c3]' : 'bg-[#1c140e] border-[#3d2b1f]'
    }`}>
      <h2 className={`text-2xl font-bold mb-2 flex items-center ${
        isLight ? 'text-[#3b180d]' : 'text-[#fef3c7]'
      }`}>
        <span className="bg-amber-600 w-3 h-8 rounded-full mr-3"></span>
        Note Synchronization Timeline
      </h2>
      <p className={`text-sm mb-6 ${isLight ? 'text-[#785b48]' : 'text-[#d1c2b0]'}`}>
        Scroll horizontally to inspect played notes vs reference grid. Connectors indicate timing alignment.
      </p>

      {/* Horizontally Scrollable Container */}
      <div 
        ref={scrollContainerRef}
        className={`w-full overflow-x-auto rounded-xl border relative p-4 scrollbar-thin ${
          isLight
            ? 'bg-[#fcf8f2] border-[#e2d5c3] scrollbar-thumb-[#d6c4b0]'
            : 'bg-[#120d09]/90 border-[#3d2b1f] scrollbar-thumb-[#3d2b1f]'
        }`}
      >
        {/* Scroll arrows */}
        <button
          aria-label="Scroll left"
          className={`absolute bottom-2 left-2 z-30 p-1.5 rounded-full border transition cursor-pointer ${
            isLight
              ? 'bg-[#ffffff] text-[#3b180d] border-[#d6c4b0] hover:bg-[#f4ebe1]'
              : 'bg-[#281c13] text-[#fef3c7] border-[#3d2b1f] hover:bg-[#36261a]'
          }`}
          onClick={() => {
            scrollContainerRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
          }}
        >
          &#9664;
        </button>
        <button
          aria-label="Scroll right"
          className={`absolute bottom-2 right-2 z-30 p-1.5 rounded-full border transition cursor-pointer ${
            isLight
              ? 'bg-[#ffffff] text-[#3b180d] border-[#d6c4b0] hover:bg-[#f4ebe1]'
              : 'bg-[#281c13] text-[#fef3c7] border-[#3d2b1f] hover:bg-[#36261a]'
          }`}
          onClick={() => {
            scrollContainerRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
          }}
        >
          &#9654;
        </button>
        <div 
          className="relative h-44 select-none" 
          style={{ width: `${timelineWidth}px`, minWidth: '100%' }}
        >
          {/* Horizontal Track Lanes */}
          <div className={`absolute top-2 left-0 right-0 h-10 rounded-lg border ${
            isLight ? 'bg-[#f4ebe1] border-[#e2d5c3]' : 'bg-[#1c140e]/60 border-[#3d2b1f]/40'
          }`}></div>
          <div className={`absolute top-26 left-0 right-0 h-10 rounded-lg border ${
            isLight ? 'bg-[#f4ebe1] border-[#e2d5c3]' : 'bg-[#1c140e]/60 border-[#3d2b1f]/40'
          }`}></div>

          {/* SVG Connecting Lines Overlay */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
            {matches.map((m, idx) => {
              const xExpected = (spacedExpectedOnsets.get(`match-${idx}`) || 0) * pixelsPerSecond;
              const xActual = (spacedActualOnsets.get(`match-${idx}`) || 0) * pixelsPerSecond;
              
              let strokeColor = isLight ? '#059669' : '#10b981'; // green (on-time)
              if (m.status === 'early') strokeColor = isLight ? '#d97706' : '#fbbf24'; // acoustic gold
              if (m.status === 'late') strokeColor = isLight ? '#e11d48' : '#f43f5e'; // ruby red

              return (
                <line
                  key={`line-${idx}`}
                  x1={xExpected + pillWidth / 2}
                  y1={42}
                  x2={xActual + pillWidth / 2}
                  y2={104}
                  stroke={strokeColor}
                  strokeWidth={2}
                  strokeDasharray={m.status === 'on-time' ? undefined : '3 3'}
                  opacity={0.8}
                />
              );
            })}
          </svg>

          {/* TOP ROW: Expected Notes */}
          <div className="absolute top-2 left-0 right-0 h-10 flex items-center">
            <span className={`absolute -left-2 top-2.5 text-[9px] font-bold uppercase tracking-wider origin-left -rotate-90 select-none ${
              isLight ? 'text-[#785b48]' : 'text-[#a39280]'
            }`}>
              Expected
            </span>
            {matches.map((m, idx) => {
              const x = (spacedExpectedOnsets.get(`match-${idx}`) || 0) * pixelsPerSecond;
              return (
                <div
                  key={`exp-${idx}`}
                  className={`absolute h-10 rounded-lg border flex flex-col items-center justify-center shadow-md z-20 ${
                    isLight
                      ? 'bg-[#ffffff] border-[#d6c4b0] text-[#3b180d]'
                      : 'bg-[#281c13] border-[#3d2b1f] text-[#fef3c7]'
                  }`}
                  style={{ 
                    left: `${x}px`, 
                    width: `${pillWidth}px` 
                  }}
                  title={`Expected note: ${m.note_name} at ${m.expected_onset.toFixed(2)}s`}
                >
                  <span className="text-[10px] font-bold leading-tight">{m.note_name}</span>
                  <span className="text-[7px] font-normal leading-none mt-0.5 opacity-75">{m.expected_onset.toFixed(1)}s</span>
                </div>
              );
            })}
            {unmatched_expected.map((note, idx) => {
              const x = (spacedExpectedOnsets.get(`missed-${idx}`) || 0) * pixelsPerSecond;
              return (
                <div
                  key={`exp-miss-${idx}`}
                  className={`absolute h-10 rounded-lg border flex flex-col items-center justify-center shadow-md z-20 opacity-75 ${
                    isLight
                      ? 'bg-rose-100 border-rose-300 text-rose-800'
                      : 'bg-rose-950/40 border-rose-700/50 text-rose-300'
                  }`}
                  style={{ 
                    left: `${x}px`, 
                    width: `${pillWidth}px` 
                  }}
                  title={`Missed note: ${note.note_name || note.note_num} at ${note.onset.toFixed(2)}s`}
                >
                  <span className="text-[10px] font-bold leading-tight">{note.note_name || note.note_num}</span>
                  <span className="text-[7px] font-normal leading-none mt-0.5">missed</span>
                  <span className="absolute -top-1 -right-1 text-[7px] bg-rose-600 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
                    ✕
                  </span>
                </div>
              );
            })}
          </div>

          {/* BOTTOM ROW: Actual Played Notes */}
          <div className="absolute top-26 left-0 right-0 h-10 flex items-center">
            <span className={`absolute -left-2 top-2.5 text-[9px] font-bold uppercase tracking-wider origin-left -rotate-90 select-none ${
              isLight ? 'text-[#785b48]' : 'text-[#a39280]'
            }`}>
              Played
            </span>
            {matches.map((m, idx) => {
              const x = (spacedActualOnsets.get(`match-${idx}`) || 0) * pixelsPerSecond;
              let bgColor = isLight ? 'bg-emerald-100 border-emerald-400 text-emerald-900' : 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300';
              if (m.status === 'early') bgColor = isLight ? 'bg-amber-100 border-amber-400 text-amber-900' : 'bg-amber-500/20 border-amber-500/60 text-amber-300';
              if (m.status === 'late') bgColor = isLight ? 'bg-rose-100 border-rose-400 text-rose-900' : 'bg-rose-500/20 border-rose-500/60 text-rose-300';

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
            {unmatched_actual.map((note, idx) => {
              const x = (spacedActualOnsets.get(`extra-${idx}`) || 0) * pixelsPerSecond;
              return (
                <div
                  key={`act-extra-${idx}`}
                  className={`absolute h-10 rounded-lg border flex flex-col items-center justify-center shadow-md z-20 opacity-75 ${
                    isLight
                      ? 'bg-[#ffffff] border-[#d6c4b0] text-[#785b48]'
                      : 'bg-[#281c13] border-[#3d2b1f] text-[#d1c2b0]'
                  }`}
                  style={{ 
                    left: `${x}px`, 
                    width: `${pillWidth}px` 
                  }}
                  title={`Extra note: ${note.note_name || note.note_num} at ${note.onset.toFixed(2)}s`}
                >
                  <span className="text-[10px] font-bold leading-tight">{note.note_name || note.note_num}</span>
                  <span className="text-[7px] font-normal leading-none mt-0.5">extra</span>
                  <span className="absolute -top-1 -right-1 text-[7px] bg-amber-600 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center font-extrabold">
                    +
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className={`flex flex-wrap items-center gap-4 mt-5 text-xs justify-center ${
        isLight ? 'text-[#785b48]' : 'text-[#d1c2b0]'
      }`}>
        <div className="flex items-center space-x-1.5">
          <span className={`w-3 h-3 rounded border inline-block ${
            isLight ? 'bg-emerald-100 border-emerald-400' : 'bg-emerald-500/20 border-emerald-500/60'
          }`}></span>
          <span>On-Time Note (within ±60ms)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className={`w-3 h-3 rounded border inline-block ${
            isLight ? 'bg-amber-100 border-amber-400' : 'bg-amber-500/20 border-amber-500/60'
          }`}></span>
          <span>Rushing (Early)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className={`w-3 h-3 rounded border inline-block ${
            isLight ? 'bg-rose-100 border-rose-400' : 'bg-rose-500/20 border-rose-500/60'
          }`}></span>
          <span>Dragging (Late)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className={`w-3 h-3 rounded border inline-block text-center text-[8px] leading-3 font-bold ${
            isLight ? 'bg-[#ffffff] border-[#d6c4b0] text-[#785b48]' : 'bg-[#281c13] border-[#3d2b1f] text-[#d1c2b0]'
          }`}>
            +
          </span>
          <span>Extra Note Played</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className={`w-3 h-3 rounded border inline-block text-center text-[8px] leading-3 font-bold ${
            isLight ? 'bg-rose-100 border-rose-300 text-rose-700' : 'bg-rose-950/40 border-rose-600/50 text-rose-300'
          }`}>
            ✕
          </span>
          <span>Missed Note</span>
        </div>
      </div>
    </div>
  );
};
