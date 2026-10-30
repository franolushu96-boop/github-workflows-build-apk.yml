import React, { useState } from 'react';
import { NumberStat, KenoDraw } from '../types/keno';
import { Flame, Snowflake, Clock, Sparkles, Shuffle, Trash2, Eye, ShieldAlert } from 'lucide-react';

interface KenoBoardProps {
  numberStats: Record<number, NumberStat>;
  selectedSpots: number[];
  onToggleSpot: (num: number) => void;
  onClearSpots: () => void;
  onQuickPick: (count: number) => void;
  onPickHot: () => void;
  onPickCold: () => void;
  activeDrawToInspect?: KenoDraw | null;
  onSendToAIStudio?: (numbers: number[]) => void;
  entryMode?: boolean;
  entryNumbers?: number[];
  onToggleEntryNumber?: (num: number) => void;
}

export const KenoBoard: React.FC<KenoBoardProps> = ({
  numberStats,
  selectedSpots,
  onToggleSpot,
  onClearSpots,
  onQuickPick,
  onPickHot,
  onPickCold,
  activeDrawToInspect,
  onSendToAIStudio,
  entryMode = false,
  entryNumbers = [],
  onToggleEntryNumber,
}) => {
  const [boardView, setBoardView] = useState<'ticket' | 'heatmap' | 'due'>('ticket');
  const [hoveredNum, setHoveredNum] = useState<number | null>(null);

  // Helper for heatmap colors
  const getHeatmapColor = (stat?: NumberStat) => {
    if (!stat || stat.count === 0) return 'bg-slate-900 text-slate-400 border-slate-800';
    if (stat.isHot) return 'bg-rose-950/80 text-rose-300 border-rose-600/70 shadow-sm shadow-rose-900/30';
    if (stat.isCold) return 'bg-cyan-950/70 text-cyan-300 border-cyan-700/50';
    if (stat.count >= 8) return 'bg-amber-950/60 text-amber-300 border-amber-700/50';
    return 'bg-slate-800/80 text-slate-300 border-slate-700/60';
  };

  const getDueColor = (stat?: NumberStat) => {
    if (!stat) return 'bg-slate-900 text-slate-400 border-slate-800';
    if (stat.drawsSinceLastHit >= 8) return 'bg-purple-950/80 text-purple-300 border-purple-600/60';
    if (stat.drawsSinceLastHit <= 2) return 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50';
    return 'bg-slate-800/80 text-slate-300 border-slate-700/60';
  };

  const activeDrawnSet = activeDrawToInspect ? new Set(activeDrawToInspect.numbers) : null;
  const currentEntrySet = new Set(entryNumbers);
  const selectedSpotsSet = new Set(selectedSpots);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-md">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-wide">
              {entryMode ? 'Select 20 Numbers for Draw' : 'Interactive Keno 80-Grid'}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
              Standard 80 Ball
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {entryMode
              ? `Tap numbers to toggle (${entryNumbers.length}/20 selected)`
              : `Tap any number to select your ticket spots (${selectedSpots.length} selected, max 15)`}
          </p>
        </div>

        {/* View Switcher & Action buttons */}
        {!entryMode && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
              <button
                onClick={() => setBoardView('ticket')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  boardView === 'ticket'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Ticket View
              </button>
              <button
                onClick={() => setBoardView('heatmap')}
                className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
                  boardView === 'heatmap'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                Heatmap
              </button>
              <button
                onClick={() => setBoardView('due')}
                className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
                  boardView === 'due'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-purple-300" />
                Gap / Due
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onQuickPick(10)}
                title="Random 10 Spots Quick Pick"
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1 transition-colors"
              >
                <Shuffle className="w-3 h-3 text-cyan-400" />
                <span>QP 10</span>
              </button>
              <button
                onClick={onPickHot}
                title="Select 10 Hottest Numbers"
                className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-200 border border-rose-800/60 text-xs flex items-center gap-1 transition-colors"
              >
                <Flame className="w-3 h-3 text-rose-400" />
                <span>Top Hot</span>
              </button>
              <button
                onClick={onPickCold}
                title="Select 10 Coldest Numbers"
                className="px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-200 border border-cyan-800/60 text-xs flex items-center gap-1 transition-colors"
              >
                <Snowflake className="w-3 h-3 text-cyan-400" />
                <span>Top Cold</span>
              </button>
              {selectedSpots.length > 0 && (
                <button
                  onClick={onClearSpots}
                  title="Clear Selected Spots"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/50 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Inspecting Draw Banner if active */}
      {activeDrawToInspect && !entryMode && (
        <div className="my-3 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Inspecting <strong>Draw #{activeDrawToInspect.drawNumber}</strong>. Golden borders show drawn balls;
              green circles are your ticket matches!
            </span>
          </div>
          <span className="font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
            {selectedSpots.filter((s) => activeDrawnSet?.has(s)).length} / {selectedSpots.length} Hits
          </span>
        </div>
      )}

      {/* 80-Number Board Grid (8 rows of 10) */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 sm:gap-2 my-4 select-none">
        {Array.from({ length: 80 }, (_, i) => i + 1).map((num) => {
          const stat = numberStats[num];
          const isSelectedSpot = selectedSpotsSet.has(num);
          const isEntrySelected = currentEntrySet.has(num);
          const isDrawnInActive = activeDrawnSet?.has(num);
          const isHitInActive = isDrawnInActive && isSelectedSpot;

          let tileClass = 'bg-slate-800/70 border-slate-700/60 text-slate-200 hover:border-slate-500';

          if (entryMode) {
            if (isEntrySelected) {
              tileClass = 'bg-emerald-600 text-white font-bold border-emerald-400 shadow-md shadow-emerald-900/40 ring-2 ring-emerald-400/60 scale-[1.03]';
            } else {
              tileClass = 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-700/60';
            }
          } else {
            if (boardView === 'heatmap') {
              tileClass = getHeatmapColor(stat);
            } else if (boardView === 'due') {
              tileClass = getDueColor(stat);
            }

            if (isSelectedSpot) {
              tileClass = 'bg-indigo-600 text-white font-bold border-indigo-400 shadow-md shadow-indigo-900/50 ring-2 ring-indigo-400/80 scale-[1.02] z-10';
            }

            if (isHitInActive) {
              tileClass = 'bg-emerald-600 text-white font-bold border-emerald-300 ring-4 ring-emerald-400 shadow-lg shadow-emerald-900/60 scale-[1.05] z-20';
            } else if (isDrawnInActive) {
              tileClass += ' ring-2 ring-amber-400/90 border-amber-400 font-semibold';
            }
          }

          return (
            <button
              key={num}
              type="button"
              onClick={() => {
                if (entryMode && onToggleEntryNumber) {
                  onToggleEntryNumber(num);
                } else {
                  onToggleSpot(num);
                }
              }}
              onMouseEnter={() => setHoveredNum(num)}
              onMouseLeave={() => setHoveredNum(null)}
              className={`relative flex flex-col items-center justify-center h-12 sm:h-14 rounded-xl border transition-all cursor-pointer ${tileClass}`}
            >
              {/* Top row indicators */}
              <div className="absolute top-1 left-1.5 right-1.5 flex items-center justify-between pointer-events-none text-[9px] leading-none opacity-80">
                {stat?.isHot && <Flame className="w-2.5 h-2.5 text-rose-400" />}
                {stat?.isCold && <Snowflake className="w-2.5 h-2.5 text-cyan-400" />}
                {!stat?.isHot && !stat?.isCold && stat?.isDue && (
                  <Clock className="w-2.5 h-2.5 text-purple-400" />
                )}
                <span className="ml-auto text-[9px] text-slate-400 font-mono">
                  {boardView === 'due' ? `${stat?.drawsSinceLastHit ?? 0}g` : `${stat?.count ?? 0}x`}
                </span>
              </div>

              {/* Number */}
              <span className="text-base sm:text-lg font-bold tracking-tight mt-1">{num}</span>

              {/* Subtitle / Percentage */}
              <span className="text-[9px] font-mono opacity-70 leading-none">
                {stat?.percentage ?? 0}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Legend & Hover Details Bar */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-indigo-600 border border-indigo-400 inline-block"></span>
            <span>Selected Spot</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-950 border border-rose-600 inline-block"></span>
            <span className="flex items-center gap-0.5">
              <Flame className="w-3 h-3 text-rose-400" /> Hot
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-cyan-950 border border-cyan-700 inline-block"></span>
            <span className="flex items-center gap-0.5">
              <Snowflake className="w-3 h-3 text-cyan-400" /> Cold
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-purple-950 border border-purple-600 inline-block"></span>
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3 text-purple-400" /> Overdue Gap
            </span>
          </div>
        </div>

        {/* Action: Weave selected into AI Studio prompt */}
        {selectedSpots.length > 0 && onSendToAIStudio && !entryMode && (
          <button
            onClick={() => onSendToAIStudio(selectedSpots)}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-indigo-900/30 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Talisman with #{selectedSpots.slice(0, 4).join(', ')}...</span>
          </button>
        )}
      </div>
    </div>
  );
};
