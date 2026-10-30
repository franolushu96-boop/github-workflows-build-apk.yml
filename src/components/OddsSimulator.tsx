import React, { useState, useMemo } from 'react';
import { SimulationResult } from '../types/keno';
import { getHypergeometricProb, runMonteCarloSimulation } from '../utils/kenoMath';
import { Play, RotateCcw, Award, Percent, Activity, Sparkles, HelpCircle } from 'lucide-react';

interface OddsSimulatorProps {
  selectedSpots: number[];
  onQuickPickSpots: (count: number) => void;
}

export const OddsSimulator: React.FC<OddsSimulatorProps> = ({
  selectedSpots,
  onQuickPickSpots,
}) => {
  const [spotCountOverride, setSpotCountOverride] = useState<number>(
    selectedSpots.length > 0 ? Math.min(selectedSpots.length, 10) : 10
  );
  const [simulationCount, setSimulationCount] = useState<number>(1000);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Active spots to simulate
  const effectiveSpots = useMemo(() => {
    if (selectedSpots.length > 0) return selectedSpots;
    // Default spots if none selected
    return Array.from({ length: spotCountOverride }, (_, i) => i + 1);
  }, [selectedSpots, spotCountOverride]);

  const nSpots = effectiveSpots.length;

  // Compute theoretical table for nSpots
  const theoreticalTable = useMemo(() => {
    const rows = [];
    for (let k = 0; k <= nSpots; k++) {
      const prob = getHypergeometricProb(nSpots, k);
      const pct = (prob * 100).toFixed(4);
      const oneInOdds = prob > 0 ? Math.round(1 / prob).toLocaleString() : '∞';
      rows.push({
        hits: k,
        probability: prob,
        percentage: Number(pct),
        oneInOdds,
      });
    }
    return rows;
  }, [nSpots]);

  const handleRunSimulation = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runMonteCarloSimulation(effectiveSpots, simulationCount);
      setSimResult(res);
      setIsRunning(false);
    }, 150);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-md space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <span>Mathematical Odds & Monte Carlo Simulator</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
              Hypergeometric Model
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Analyzing {nSpots}-Spot Ticket: ({effectiveSpots.join(', ')})
          </p>
        </div>

        {/* Spot selection selector if user has none picked */}
        {selectedSpots.length === 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Spots to test:</span>
            <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
              {[3, 5, 7, 8, 10].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSpotCountOverride(s);
                    onQuickPickSpots(s);
                  }}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    spotCountOverride === s ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s} Spot
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Simulator Controls & Trigger */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-300">Simulate Draws:</span>
          <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs">
            {[500, 1000, 5000, 10000].map((count) => (
              <button
                key={count}
                onClick={() => setSimulationCount(count)}
                className={`px-3 py-1 rounded-md font-mono transition-colors ${
                  simulationCount === count
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {count.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunSimulation}
            disabled={isRunning}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Simulating...' : `Run ${simulationCount.toLocaleString()} Draws`}</span>
          </button>

          {simResult && (
            <button
              onClick={() => setSimResult(null)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              title="Reset simulation results"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Probability Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Hits (k)</th>
              <th className="py-2.5 px-3">Theoretical Exact %</th>
              <th className="py-2.5 px-3">Odds (1 in X)</th>
              {simResult && <th className="py-2.5 px-3">Simulated Hits</th>}
              {simResult && <th className="py-2.5 px-3">Simulated %</th>}
              <th className="py-2.5 px-3">Visual Distribution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {theoreticalTable.map((row) => {
              const simHits = simResult ? simResult.hitDistribution[row.hits] || 0 : null;
              const simPct = simResult ? simResult.empiricalProbabilities[row.hits] || 0 : null;

              return (
                <tr key={row.hits} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded bg-slate-800 text-indigo-300 flex items-center justify-center text-xs">
                      {row.hits}
                    </span>
                    <span>hits</span>
                  </td>
                  <td className="py-2.5 px-3 text-indigo-300 font-semibold">
                    {row.percentage > 0.001 ? `${row.percentage.toFixed(2)}%` : '< 0.001%'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">1 in {row.oneInOdds}</td>

                  {simResult && (
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">
                      {simHits?.toLocaleString()}
                    </td>
                  )}
                  {simResult && (
                    <td className="py-2.5 px-3 text-emerald-300">
                      {simPct?.toFixed(2)}%
                    </td>
                  )}

                  <td className="py-2.5 px-3 w-48 sm:w-64">
                    <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden flex relative">
                      {/* Theoretical bar */}
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, row.percentage * 3.5)}%` }}
                        title={`Theoretical: ${row.percentage}%`}
                      />
                      {/* Simulated overlay bar */}
                      {simResult && simPct !== null && (
                        <div
                          className="bg-emerald-400/80 h-full rounded-full absolute top-0 left-0 transition-all duration-300"
                          style={{ width: `${Math.min(100, simPct * 3.5)}%` }}
                          title={`Simulated: ${simPct}%`}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Simulator Notes */}
      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
        <p className="font-semibold text-slate-300">Law of Large Numbers in Keno:</p>
        <p>
          Notice how the empirical simulated bar (emerald) closely mirrors the theoretical hypergeometric curve (indigo). As the simulation count grows toward 10,000+, random trial variation decreases and aligns precisely with mathematical expectations.
        </p>
      </div>
    </div>
  );
};
