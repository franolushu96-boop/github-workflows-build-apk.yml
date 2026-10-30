import React, { useState, useMemo, useEffect } from 'react';
import { KenoDraw, GeneratedImageItem } from './types/keno';
import { INITIAL_KENO_DRAWS, computeOverallStats, generateQuickPickTicket } from './utils/kenoMath';
import { KenoBoard } from './components/KenoBoard';
import { StatsDashboard } from './components/StatsDashboard';
import { DrawHistory } from './components/DrawHistory';
import { OddsSimulator } from './components/OddsSimulator';
import { ImageStudio } from './components/ImageStudio';
import { DrawEntryModal } from './components/DrawEntryModal';
import { AndroidBuildModal } from './components/AndroidBuildModal';
import {
  Grid,
  BarChart2,
  History,
  Calculator,
  Sparkles,
  ShieldCheck,
  Plus,
  Shuffle,
  Info,
  Smartphone,
} from 'lucide-react';

export default function App() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'board' | 'stats' | 'history' | 'simulator' | 'aistudio'>('board');

  // Draws state persisted in localStorage
  const [draws, setDraws] = useState<KenoDraw[]>(() => {
    try {
      const saved = localStorage.getItem('kenostats_draws');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load saved draws', e);
    }
    return INITIAL_KENO_DRAWS;
  });

  // Selected ticket spots (e.g. 10 spots for tracking)
  const [selectedSpots, setSelectedSpots] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('kenostats_selected_spots');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [7, 14, 21, 28, 35, 42, 49, 56, 63, 77];
  });

  // Active draw being inspected on the board
  const [activeInspectDraw, setActiveInspectDraw] = useState<KenoDraw | null>(null);

  // Manual draw entry modal state
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);

  // AI prompt transferred from board or ticket
  const [transferredAIPrompt, setTransferredAIPrompt] = useState<string>('');

  // Persist draws
  useEffect(() => {
    try {
      localStorage.setItem('kenostats_draws', JSON.stringify(draws));
    } catch (e) {
      console.warn('Storage quota issue', e);
    }
  }, [draws]);

  // Persist spots
  useEffect(() => {
    try {
      localStorage.setItem('kenostats_selected_spots', JSON.stringify(selectedSpots));
    } catch {}
  }, [selectedSpots]);

  // Compute stats across all draws
  const stats = useMemo(() => computeOverallStats(draws), [draws]);

  // Handlers for ticket spots
  const handleToggleSpot = (num: number) => {
    if (selectedSpots.includes(num)) {
      setSelectedSpots(selectedSpots.filter((s) => s !== num));
    } else {
      if (selectedSpots.length >= 15) return; // standard max 15 spots
      setSelectedSpots([...selectedSpots, num].sort((a, b) => a - b));
    }
  };

  const handleClearSpots = () => {
    setSelectedSpots([]);
  };

  const handleQuickPick = (count: number) => {
    setSelectedSpots(generateQuickPickTicket(count));
  };

  const handlePickHot = () => {
    const hotNums = stats.hotNumbers.slice(0, 10).map((n) => n.number);
    setSelectedSpots(hotNums.sort((a, b) => a - b));
  };

  const handlePickCold = () => {
    const coldNums = stats.coldNumbers.slice(0, 10).map((n) => n.number);
    setSelectedSpots(coldNums.sort((a, b) => a - b));
  };

  const handleSelectFromStats = (num: number) => {
    handleToggleSpot(num);
    setActiveTab('board');
  };

  // Handlers for draws
  const handleAddDraw = (newDrawData: Omit<KenoDraw, 'id'>) => {
    const newDraw: KenoDraw = {
      ...newDrawData,
      id: `draw-${Date.now()}`,
    };
    setDraws([newDraw, ...draws]);
  };

  const handleDeleteDraw = (id: string) => {
    setDraws(draws.filter((d) => d.id !== id));
    if (activeInspectDraw?.id === id) {
      setActiveInspectDraw(null);
    }
  };

  const handleResetSampleData = () => {
    if (confirm('Reset to initial 35 educational draws?')) {
      setDraws(INITIAL_KENO_DRAWS);
      setActiveInspectDraw(null);
    }
  };

  // Send selected numbers to AI Image Studio
  const handleSendToAIStudio = (numbers: number[]) => {
    const numStr = numbers.join(', ');
    setTransferredAIPrompt(
      `A magnificent casino lucky talisman medallion made of polished gold and emerald jade, engraved with Keno numbers ${numStr}, resting on green velvet with magical golden particles, cinematic 4k`
    );
    setActiveTab('aistudio');
  };

  const nextSuggestedDrawNumber = draws.length > 0 ? Math.max(...draws.map((d) => d.drawNumber)) + 1 : 1001;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-950/50">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-amber-400 text-lg tracking-tighter">
                80
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                  Keno<span className="text-amber-400">Stats</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  v2.1 AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Educational Frequency Tracker & Gemini Image Studio
              </p>
            </div>
          </div>

          {/* Quick Active Ticket Spot Counter in Header */}
          <div className="hidden md:flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-slate-400">Active Ticket:</span>
            <span className="font-bold text-indigo-400 font-mono">
              {selectedSpots.length} {selectedSpots.length === 1 ? 'Spot' : 'Spots'}
            </span>
            {selectedSpots.length > 0 && (
              <span className="text-slate-500 font-mono text-[11px] max-w-[140px] truncate">
                ({selectedSpots.join(', ')})
              </span>
            )}
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAndroidModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-700/80 font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Android Native APK Build & Instructions"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Android APK</span>
            </button>

            <button
              onClick={() => setIsEntryModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-indigo-950/50 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Record Draw</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60 overflow-x-auto scrollbar-none">
          <nav className="flex space-x-1 sm:space-x-2 py-2">
            <button
              onClick={() => setActiveTab('board')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'board'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Interactive 80-Grid</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Analytics & Hot/Cold</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Draw Archive ({draws.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'simulator'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Monte Carlo & Odds</span>
            </button>

            <button
              onClick={() => setActiveTab('aistudio')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'aistudio'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-950/40'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-slate-900/80 border border-amber-500/20'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Create & Edit Images (AI)</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {/* Tab 1: Interactive Board */}
        {activeTab === 'board' && (
          <KenoBoard
            numberStats={stats.numberStats}
            selectedSpots={selectedSpots}
            onToggleSpot={handleToggleSpot}
            onClearSpots={handleClearSpots}
            onQuickPick={handleQuickPick}
            onPickHot={handlePickHot}
            onPickCold={handlePickCold}
            activeDrawToInspect={activeInspectDraw}
            onSendToAIStudio={handleSendToAIStudio}
          />
        )}

        {/* Tab 2: Analytics & Stats */}
        {activeTab === 'stats' && (
          <StatsDashboard stats={stats} onSelectNumber={handleSelectFromStats} />
        )}

        {/* Tab 3: Historical Archive */}
        {activeTab === 'history' && (
          <DrawHistory
            draws={draws}
            selectedSpots={selectedSpots}
            activeInspectDraw={activeInspectDraw}
            onInspectDraw={(d) => {
              setActiveInspectDraw(d);
              if (d) setActiveTab('board');
            }}
            onAddDraw={handleAddDraw}
            onDeleteDraw={handleDeleteDraw}
            onResetSampleData={handleResetSampleData}
            onOpenManualEntry={() => setIsEntryModalOpen(true)}
          />
        )}

        {/* Tab 4: Odds & Monte Carlo Simulator */}
        {activeTab === 'simulator' && (
          <OddsSimulator
            selectedSpots={selectedSpots}
            onQuickPickSpots={(count) => setSelectedSpots(generateQuickPickTicket(count))}
          />
        )}

        {/* Tab 5: AI Image Studio (Powered by gemini-nano-banana-2.1) */}
        {activeTab === 'aistudio' && (
          <ImageStudio
            selectedSpots={selectedSpots}
            initialPrompt={transferredAIPrompt}
            onClearInitialPrompt={() => setTransferredAIPrompt('')}
          />
        )}
      </main>

      {/* Manual Draw Entry Modal */}
      <DrawEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        onSaveDraw={handleAddDraw}
        suggestedDrawNumber={nextSuggestedDrawNumber}
      />

      {/* Android Native Build & Download Modal */}
      <AndroidBuildModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
      />

      {/* Educational Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/60 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>KenoStats • Educational Offline Number & Frequency Tracker</span>
          </div>
          <p className="max-w-md text-[11px] text-slate-500">
            Does not connect to wagering services or predict future results. Built for statistical analysis, hypergeometric probability education, and AI generative image styling with Gemini.
          </p>
        </div>
      </footer>
    </div>
  );
}
