import React, { useState } from 'react';
import { TaskItem, TimeBlock } from '../types';
import { soundEngine } from '../utils/audioSynth';
import { Printer, Copy, Check, Sparkles, FileText, Download, Sticker } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CopierHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  timeBlocks: TimeBlock[];
  onPrintDeskPoster: (posterName: string) => void;
}

const MOTIVATIONAL_POSTERS = [
  {
    id: 'poster-1',
    title: 'Keep Calm and Ship Code',
    subtitle: 'Production ready since 9:00 AM',
    emoji: '🚢',
    bg: 'from-blue-600 to-indigo-800',
  },
  {
    id: 'poster-2',
    title: 'Rubber Duck Debugging Society',
    subtitle: 'Explain the bug out loud first',
    emoji: '🦆',
    bg: 'from-amber-500 to-orange-700',
  },
  {
    id: 'poster-3',
    title: 'There is No Place Like 127.0.0.1',
    subtitle: 'Localhost is my sanctuary',
    emoji: '🏠',
    bg: 'from-emerald-600 to-teal-800',
  },
  {
    id: 'poster-4',
    title: 'Eat • Sleep • Refactor • Repeat',
    subtitle: 'Clean code is a form of art',
    emoji: '⚡',
    bg: 'from-purple-600 to-pink-800',
  },
];

export const CopierHubModal: React.FC<CopierHubModalProps> = ({
  isOpen,
  onClose,
  tasks,
  timeBlocks,
  onPrintDeskPoster,
}) => {
  const [activeTab, setActiveTab] = useState<'sprint_sheet' | 'posters' | 'memo_scan'>('sprint_sheet');
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [memoText, setMemoText] = useState<string>('');
  const [memoSaved, setMemoSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.filter((t) => !t.completed).length;

  const generateMarkdownSummary = () => {
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let doc = `# 🏢 ONTOGETHER CO-WORKING SPRINT SHEET\n`;
    doc += `**Date:** ${today}\n`;
    doc += `**Status:** ${completedCount} Completed / ${tasks.length} Total Goals\n\n`;
    doc += `## 📋 TODAY'S SPRINT TASKS:\n`;
    tasks.forEach((t) => {
      doc += `- [${t.completed ? 'x' : ' '}] ${t.title} (${t.estimatedPomodoros} Pomodoros)\n`;
    });
    if (timeBlocks.length > 0) {
      doc += `\n## ⏱️ SCHEDULED TIME BLOCKS:\n`;
      timeBlocks.forEach((b) => {
        doc += `- ${b.startTime} - ${b.endTime}: ${b.title} [${b.completed ? 'DONE' : 'PENDING'}]\n`;
      });
    }
    return doc;
  };

  const handleCopySummary = () => {
    const text = generateMarkdownSummary();
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    soundEngine.playCoin();
    setTimeout(() => setCopiedSummary(false), 2400);
  };

  const handlePrintDocument = () => {
    if (isPrinting) return;
    setIsPrinting(true);
    soundEngine.playChime('digital');

    setTimeout(() => {
      setIsPrinting(false);
      soundEngine.playCoin();
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
    }, 1200);
  };

  const handlePrintPoster = (posterTitle: string) => {
    soundEngine.playCoin();
    confetti({ particleCount: 40, spread: 70 });
    onPrintDeskPoster(posterTitle);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#141829] border-2 border-blue-500/40 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950/80 via-[#172138] to-[#141829] p-5 border-b border-blue-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600/30 border border-blue-400/50 flex items-center justify-center text-2xl shadow-inner">
              🖨️
            </div>
            <div>
              <h2 className="font-cozy font-bold text-lg text-white flex items-center gap-2">
                <span>Multi-Function Copier & Print Hub</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                  Xerox TechVoxel 8000
                </span>
              </h2>
              <p className="text-xs text-blue-200/80 font-cozy">
                Generate sprint summary sheets, print desk stickers, and scan whiteboard notes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-blue-950/80 border border-blue-700/50 text-blue-300 hover:text-white flex items-center justify-center font-bold text-sm transition-all"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-blue-900/50 bg-[#101422]/70 px-4">
          <button
            onClick={() => setActiveTab('sprint_sheet')}
            className={`py-3 px-4 text-xs font-cozy font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'sprint_sheet'
                ? 'border-blue-400 text-white'
                : 'border-transparent text-blue-300/70 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Sprint Task Sheet</span>
          </button>

          <button
            onClick={() => setActiveTab('posters')}
            className={`py-3 px-4 text-xs font-cozy font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'posters'
                ? 'border-blue-400 text-white'
                : 'border-transparent text-blue-300/70 hover:text-white'
            }`}
          >
            <Sticker className="w-3.5 h-3.5" />
            <span>Office Posters</span>
          </button>

          <button
            onClick={() => setActiveTab('memo_scan')}
            className={`py-3 px-4 text-xs font-cozy font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'memo_scan'
                ? 'border-blue-400 text-white'
                : 'border-transparent text-blue-300/70 hover:text-white'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Document Scanner</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* TAB 1: SPRINT TASK SHEET */}
          {activeTab === 'sprint_sheet' && (
            <div className="space-y-4">
              <div className="bg-[#192033] border border-blue-500/30 p-4 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📄</span>
                    <div>
                      <h4 className="font-cozy font-bold text-sm text-white">Daily Focus Sprint Summary</h4>
                      <p className="text-[11px] text-blue-300/80 font-cozy">
                        {completedCount} tasks completed, {pendingCount} in queue
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopySummary}
                      className="px-3 py-1.5 bg-blue-900/60 hover:bg-blue-800 border border-blue-600/40 text-blue-200 rounded-xl text-xs font-cozy flex items-center gap-1.5 transition-all"
                    >
                      {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSummary ? 'Copied Markdown!' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={handlePrintDocument}
                      disabled={isPrinting}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-cozy font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>{isPrinting ? 'Printing Feed...' : 'Print Sheet'}</span>
                    </button>
                  </div>
                </div>

                {/* Printable Preview Sheet */}
                <div className="bg-[#0f1422] p-4 rounded-xl border border-blue-950 font-mono text-xs text-blue-100 space-y-2 select-text">
                  <div className="text-blue-400 font-bold border-b border-blue-900/60 pb-1">
                    ================= SPRINT SUMMARY =================
                  </div>
                  {tasks.length === 0 ? (
                    <div className="text-blue-400/60 py-2">No active tasks in queue.</div>
                  ) : (
                    tasks.map((t) => (
                      <div key={t.id} className="flex items-center gap-2">
                        <span className={t.completed ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                          [{t.completed ? '✓' : ' '}]
                        </span>
                        <span className={t.completed ? 'line-through opacity-60' : 'text-white'}>
                          {t.title}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OFFICE POSTERS */}
          {activeTab === 'posters' && (
            <div>
              <p className="text-xs text-blue-200/80 font-cozy mb-3">
                Print glossy vinyl motivational posters for your workstation!
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MOTIVATIONAL_POSTERS.map((poster) => (
                  <div
                    key={poster.id}
                    className={`p-4 rounded-2xl bg-gradient-to-br ${poster.bg} border border-white/20 shadow-lg flex flex-col justify-between`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-3xl">{poster.emoji}</span>
                      <span className="text-[10px] bg-black/40 text-white px-2 py-0.5 rounded-full font-mono">
                        Office Poster
                      </span>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-cozy font-bold text-sm text-white">{poster.title}</h4>
                      <p className="text-[11px] text-white/80 font-cozy">{poster.subtitle}</p>
                    </div>

                    <button
                      onClick={() => handlePrintPoster(poster.title)}
                      className="w-full py-2 bg-black/40 hover:bg-black/60 text-white rounded-xl text-xs font-cozy font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-300" />
                      <span>Print Desk Sticker</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENT SCANNER */}
          {activeTab === 'memo_scan' && (
            <div className="space-y-4">
              <div className="bg-[#192033] border border-blue-500/30 p-4 rounded-2xl">
                <h4 className="font-cozy font-bold text-sm text-white mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Flatbed Scanner Scratchpad</span>
                </h4>
                <p className="text-xs text-blue-200/80 font-cozy mb-3">
                  Write quick brainstorming ideas or whiteboard notes to scan and save to your session logs.
                </p>

                <textarea
                  value={memoText}
                  onChange={(e) => setMemoText(e.target.value)}
                  placeholder="Type sprint meeting notes, ideas, or reminders to scan..."
                  rows={4}
                  className="w-full bg-[#0f1422] border border-blue-900/60 rounded-xl p-3 text-xs text-white placeholder:text-blue-400/40 focus:outline-none focus:border-blue-400 font-cozy mb-3"
                />

                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-blue-400/80 font-mono">Optical Resolution: 1200 DPI</span>
                  <button
                    onClick={() => {
                      if (!memoText.trim()) return;
                      soundEngine.playChime('chime');
                      setMemoSaved(true);
                      setTimeout(() => setMemoSaved(false), 2000);
                    }}
                    disabled={!memoText.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-cozy text-xs font-bold transition-all active:scale-95 disabled:opacity-40"
                  >
                    {memoSaved ? '✓ Scanned & Logged!' : 'Scan & Archive'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
