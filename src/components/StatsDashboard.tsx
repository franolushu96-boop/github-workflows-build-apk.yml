import React from 'react';
import { OverallStats, NumberStat } from '../types/keno';
import { Flame, Snowflake, Clock, Info, ShieldAlert, BarChart3, TrendingUp, Layers } from 'lucide-react';

interface StatsDashboardProps {
  stats: OverallStats;
  onSelectNumber: (num: number) => void;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ stats, onSelectNumber }) => {
  return (
    <div className="space-y-6">
      {/* Educational Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 text-xs text-slate-300 flex items-start gap-3.5 backdrop-blur-md">
        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0 border border-indigo-500/20">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="font-semibold text-slate-100 text-sm">Educational Probability & History Tracker</h4>
          <p className="leading-relaxed text-slate-400">
            This tool records historical draws and computes empirical frequency for educational analysis.
            Under standard random Keno draws, every ball has an exact <strong>25% (20 in 80)</strong> theoretical chance of appearing in each draw. Past frequencies do not mathematically dictate future independent trials (Gambler's Fallacy).
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 font-medium">Draws Tracked</span>
          <div className="text-2xl sm:text-3xl font-bold text-white mt-1">{stats.totalDraws}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {stats.totalDraws * 20} total ball outcomes
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 font-medium">Average Draw Sum</span>
          <div className="text-2xl sm:text-3xl font-bold text-indigo-400 mt-1">{stats.avgSum}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Theoretical center: 810 (20 × 40.5)
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 font-medium">Odd / Even Split</span>
          <div className="text-2xl sm:text-3xl font-bold text-amber-400 mt-1">
            {stats.avgOddCount} / {stats.avgEvenCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Theoretical expected: 10.0 / 10.0
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 font-medium">Low (1-40) / High (41-80)</span>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-1">
            {stats.avgLowCount} / {stats.avgHighCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Balanced split across quadrants
          </span>
        </div>
      </div>

      {/* Hot, Cold, and Due Lists */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Hot Numbers */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Flame className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-100 text-sm">Hottest Numbers</h3>
            </div>
            <span className="text-[11px] text-rose-400/90 font-mono">Most Drawn</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {stats.hotNumbers.map((item) => (
              <button
                key={item.number}
                onClick={() => onSelectNumber(item.number)}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 hover:bg-rose-950/40 border border-slate-700/60 hover:border-rose-500/50 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30 flex items-center justify-center font-bold text-sm">
                    {item.number}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-200">{item.count} hits</div>
                  <div className="text-[10px] text-slate-400 font-mono">{item.percentage}%</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cold Numbers */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Snowflake className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-100 text-sm">Coldest Numbers</h3>
            </div>
            <span className="text-[11px] text-cyan-400/90 font-mono">Least Drawn</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {stats.coldNumbers.map((item) => (
              <button
                key={item.number}
                onClick={() => onSelectNumber(item.number)}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 hover:bg-cyan-950/40 border border-slate-700/60 hover:border-cyan-500/50 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-bold text-sm">
                    {item.number}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-200">{item.count} hits</div>
                  <div className="text-[10px] text-slate-400 font-mono">{item.percentage}%</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Overdue / Longest Gap */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-100 text-sm">Overdue Gaps</h3>
            </div>
            <span className="text-[11px] text-purple-400/90 font-mono">Draws Since Hit</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {stats.dueNumbers.map((item) => (
              <button
                key={item.number}
                onClick={() => onSelectNumber(item.number)}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 hover:bg-purple-950/40 border border-slate-700/60 hover:border-purple-500/50 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-bold text-sm">
                    {item.number}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-purple-300">
                    {item.drawsSinceLastHit} {item.drawsSinceLastHit === 1 ? 'draw' : 'draws'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">{item.count} total</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Decade Distribution & Top Pairs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Decade Distribution */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-slate-100 text-sm">Decade / Tier Distribution</h3>
          </div>
          <div className="space-y-2.5 mt-3">
            {Object.entries(stats.decadeDistribution).map(([decade, count]) => {
              const totalOutcomes = Math.max(1, stats.totalDraws * 20);
              const pct = Number(((count / totalOutcomes) * 100).toFixed(1));
              return (
                <div key={decade} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-300">Balls {decade}</span>
                    <span className="font-mono text-slate-400">
                      {count} hits ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, pct * 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Pairs Co-Occurrence */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-sm">Most Frequent Pairs</h3>
          </div>
          <p className="text-xs text-slate-400 mt-2 mb-3">
            Numbers that were drawn together in the same 20-number outcome most often.
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {stats.topPairs.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/60"
              >
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-1 rounded bg-slate-700 text-white font-mono font-bold text-xs">
                    #{item.pair[0]}
                  </span>
                  <span className="text-slate-500 text-xs">&</span>
                  <span className="px-2 py-1 rounded bg-slate-700 text-white font-mono font-bold text-xs">
                    #{item.pair[1]}
                  </span>
                </div>
                <span className="text-xs font-semibold text-emerald-400 font-mono">
                  {item.count}x
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
