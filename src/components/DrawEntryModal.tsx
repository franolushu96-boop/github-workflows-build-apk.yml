import React, { useState } from 'react';
import { KenoDraw } from '../types/keno';
import { generateRandomDrawNumbers } from '../utils/kenoMath';
import { X, Check, Shuffle, AlertCircle } from 'lucide-react';

interface DrawEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDraw: (draw: Omit<KenoDraw, 'id'>) => void;
  suggestedDrawNumber: number;
}

export const DrawEntryModal: React.FC<DrawEntryModalProps> = ({
  isOpen,
  onClose,
  onSaveDraw,
  suggestedDrawNumber,
}) => {
  const [drawNumber, setDrawNumber] = useState<number>(suggestedDrawNumber);
  const [selectedNums, setSelectedNums] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleNumber = (num: number) => {
    setError(null);
    if (selectedNums.includes(num)) {
      setSelectedNums(selectedNums.filter((n) => n !== num));
    } else {
      if (selectedNums.length >= 20) {
        setError('Exactly 20 balls must be selected per Keno draw.');
        return;
      }
      setSelectedNums([...selectedNums, num].sort((a, b) => a - b));
    }
  };

  const handleQuickFillRemaining = () => {
    setError(null);
    const needed = 20 - selectedNums.length;
    if (needed <= 0) return;

    const available = Array.from({ length: 80 }, (_, i) => i + 1).filter(
      (n) => !selectedNums.includes(n)
    );

    // Shuffle and pick
    for (let i = available.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [available[i], available[j]] = [available[j], available[i]];
    }

    const picked = available.slice(0, needed);
    setSelectedNums([...selectedNums, ...picked].sort((a, b) => a - b));
  };

  const handleRandom20 = () => {
    setError(null);
    setSelectedNums(generateRandomDrawNumbers());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedNums.length !== 20) {
      setError(`A standard Keno draw requires exactly 20 numbers. Currently selected: ${selectedNums.length}.`);
      return;
    }

    onSaveDraw({
      drawNumber: Number(drawNumber),
      timestamp: new Date().toISOString(),
      numbers: [...selectedNums].sort((a, b) => a - b),
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Record New Keno Draw</h3>
            <p className="text-xs text-slate-400">
              Select 20 numbers from the 80-ball pool ({selectedNums.length}/20 selected)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Draw Number:</label>
              <input
                type="number"
                value={drawNumber}
                onChange={(e) => setDrawNumber(Number(e.target.value))}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Notes (Optional):</label>
              <input
                type="text"
                placeholder="e.g. Evening session, Table 4"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-semibold text-slate-300">
              Pick 20 Numbers: <span className="text-emerald-400 font-mono">({selectedNums.length}/20)</span>
            </span>
            <div className="flex items-center gap-2">
              {selectedNums.length > 0 && selectedNums.length < 20 && (
                <button
                  type="button"
                  onClick={handleQuickFillRemaining}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs flex items-center gap-1 transition-colors"
                >
                  <Shuffle className="w-3 h-3" />
                  <span>Fill Remaining ({20 - selectedNums.length})</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleRandom20}
                className="px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700 text-xs flex items-center gap-1 transition-colors"
              >
                <Shuffle className="w-3 h-3" />
                <span>Random 20</span>
              </button>
              {selectedNums.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedNums([])}
                  className="text-xs text-slate-400 hover:text-rose-400 px-2"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* 80 numbers mini-grid */}
          <div className="grid grid-cols-10 gap-1 p-2 bg-slate-950 rounded-xl border border-slate-800 select-none">
            {Array.from({ length: 80 }, (_, i) => i + 1).map((n) => {
              const isSelected = selectedNums.includes(n);
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => toggleNumber(n)}
                  className={`h-8 sm:h-9 rounded-lg text-xs font-mono font-bold transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white border border-emerald-400 scale-105 shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>

          {/* Selected Preview List */}
          {selectedNums.length > 0 && (
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
              <span className="text-slate-400 block mb-1">Selected numbers:</span>
              <div className="flex flex-wrap gap-1">
                {selectedNums.map((n) => (
                  <span
                    key={n}
                    className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-mono text-[11px]"
                  >
                    #{n}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedNums.length !== 20}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Draw #{drawNumber}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
