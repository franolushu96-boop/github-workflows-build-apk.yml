import React, { useState } from 'react';
import { KenoDraw } from '../types/keno';
import { Plus, Download, Upload, Trash2, Search, Filter, Eye, RefreshCw, CheckCircle, FileText } from 'lucide-react';
import { generateRandomDrawNumbers } from '../utils/kenoMath';

interface DrawHistoryProps {
  draws: KenoDraw[];
  selectedSpots: number[];
  activeInspectDraw: KenoDraw | null;
  onInspectDraw: (draw: KenoDraw | null) => void;
  onAddDraw: (draw: Omit<KenoDraw, 'id'>) => void;
  onDeleteDraw: (id: string) => void;
  onResetSampleData: () => void;
  onOpenManualEntry: () => void;
}

export const DrawHistory: React.FC<DrawHistoryProps> = ({
  draws,
  selectedSpots,
  activeInspectDraw,
  onInspectDraw,
  onAddDraw,
  onDeleteDraw,
  onResetSampleData,
  onOpenManualEntry,
}) => {
  const [filterNumber, setFilterNumber] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);

  const selectedSpotsSet = new Set(selectedSpots);

  // Quick Random Draw generation
  const handleQuickAddRandomDraw = () => {
    const nums = generateRandomDrawNumbers();
    const nextDrawNum = draws.length > 0 ? Math.max(...draws.map((d) => d.drawNumber)) + 1 : 1001;
    onAddDraw({
      drawNumber: nextDrawNum,
      timestamp: new Date().toISOString(),
      numbers: nums,
      notes: 'Quick simulated draw',
    });
  };

  const filteredDraws = draws.filter((draw) => {
    if (filterNumber !== '' && !draw.numbers.includes(Number(filterNumber))) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDraw = draw.drawNumber.toString().includes(q);
      const matchNotes = draw.notes?.toLowerCase().includes(q);
      if (!matchDraw && !matchNotes) return false;
    }
    return true;
  });

  // Export to JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(draws, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `keno_draws_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export to CSV
  const handleExportCSV = () => {
    const header = 'DrawNumber,Timestamp,Numbers,Sum,OddCount,EvenCount,Notes\n';
    const rows = draws.map((d) => {
      const sum = d.numbers.reduce((a, b) => a + b, 0);
      const odds = d.numbers.filter((n) => n % 2 !== 0).length;
      return `${d.drawNumber},"${d.timestamp}","${d.numbers.join(' ')}",${sum},${odds},${20 - odds},"${d.notes || ''}"`;
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(header + rows.join('\n'));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvContent);
    downloadAnchor.setAttribute('download', `keno_draws_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-md space-y-4">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Historical Draw Archive</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {filteredDraws.length} of {draws.length} draws listed
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenManualEntry}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-900/40 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Draw</span>
          </button>
          <button
            onClick={handleQuickAddRandomDraw}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Simulate Draw</span>
          </button>
          <button
            onClick={() => setShowExportModal(!showExportModal)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export</span>
          </button>
          <button
            onClick={onResetSampleData}
            title="Reset to default 35 educational draws"
            className="px-2 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Export Bar Dropdown */}
      {showExportModal && (
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs">
          <span className="text-slate-300">Choose export format:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-700 hover:bg-emerald-900 transition-colors font-mono"
            >
              CSV Table (.csv)
            </button>
            <button
              onClick={handleExportJSON}
              className="px-3 py-1 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-700 hover:bg-indigo-900 transition-colors font-mono"
            >
              Raw Data (.json)
            </button>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search draw # or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={filterNumber}
            onChange={(e) => setFilterNumber(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">Filter by Ball (All 1-80)</option>
            {Array.from({ length: 80 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                Contains Ball #{n}
              </option>
            ))}
          </select>
          {filterNumber !== '' && (
            <button
              onClick={() => setFilterNumber('')}
              className="text-xs text-slate-400 hover:text-slate-200 px-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Draws List */}
      <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
        {filteredDraws.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No draws matching your filters. Try clearing the filter or adding a new draw.
          </div>
        ) : (
          filteredDraws.map((draw) => {
            const isInspecting = activeInspectDraw?.id === draw.id;
            const sum = draw.numbers.reduce((a, b) => a + b, 0);
            const odds = draw.numbers.filter((n) => n % 2 !== 0).length;
            const lows = draw.numbers.filter((n) => n <= 40).length;

            // Hits against active user ticket
            const hits = selectedSpots.length > 0 ? draw.numbers.filter((n) => selectedSpotsSet.has(n)) : [];

            return (
              <div
                key={draw.id}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                  isInspecting
                    ? 'bg-amber-950/20 border-amber-500/50 shadow-md shadow-amber-950/30 ring-1 ring-amber-500/30'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Draw header info */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-800/60 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white font-mono">Draw #{draw.drawNumber}</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(draw.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                      {new Date(draw.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                    {draw.notes && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {draw.notes}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* User Ticket Match Pill */}
                    {selectedSpots.length > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          hits.length > 0
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {hits.length}/{selectedSpots.length} Ticket Hits
                      </span>
                    )}

                    {/* Stats pills */}
                    <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded">
                      Sum: {sum}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded">
                      {odds}O / {20 - odds}E
                    </span>

                    {/* Inspect on Grid toggle */}
                    <button
                      onClick={() => onInspectDraw(isInspecting ? null : draw)}
                      className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                        isInspecting
                          ? 'bg-amber-500 text-black font-semibold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      <span>{isInspecting ? 'Active' : 'Inspect'}</span>
                    </button>

                    <button
                      onClick={() => onDeleteDraw(draw.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete draw"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 20 Winning Numbers */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {draw.numbers.map((num) => {
                    const isTicketHit = selectedSpotsSet.has(num);
                    return (
                      <span
                        key={num}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm font-mono transition-transform ${
                          isTicketHit
                            ? 'bg-emerald-600 text-white border border-emerald-400 shadow-sm ring-2 ring-emerald-400/50 scale-105'
                            : num <= 40
                            ? 'bg-slate-800 text-slate-200 border border-slate-700'
                            : 'bg-slate-800/90 text-indigo-200 border border-indigo-900/60'
                        }`}
                      >
                        {num}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
