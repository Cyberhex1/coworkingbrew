import React, { useState } from 'react';
import { TaskItem } from '../types';
import { soundEngine } from '../utils/audioSynth';
import { LayoutGrid, Plus, Check, Trash2, ArrowRight, ArrowLeft, Sparkles, Award, Pencil, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SprintBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  onAddTask: (title: string, category: 'work' | 'study' | 'creative' | 'chores', pomodoros: number) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

type SprintColumn = 'backlog' | 'in_progress' | 'review' | 'done';

interface SprintTicket {
  id: string;
  title: string;
  column: SprintColumn;
  points: number;
  tag: 'feature' | 'bug' | 'refactor' | 'doc';
  assignee: string;
}

const INITIAL_SPRINT_TICKETS: SprintTicket[] = [
  { id: 'sp-1', title: 'Implement Three.js Voxel Office Room', column: 'done', points: 5, tag: 'feature', assignee: 'Alex (You)' },
  { id: 'sp-2', title: 'High-Contrast 3D Nametag Sprites', column: 'done', points: 3, tag: 'feature', assignee: 'Alex (You)' },
  { id: 'sp-3', title: 'Refactor Office Studio Sun Lighting', column: 'done', points: 3, tag: 'refactor', assignee: 'Alex (You)' },
  { id: 'sp-4', title: 'Interactive Espresso Machine Station', column: 'in_progress', points: 5, tag: 'feature', assignee: 'Alex (You)' },
  { id: 'sp-5', title: 'Agile Kanban Sprint Board Integration', column: 'in_progress', points: 5, tag: 'feature', assignee: 'Sam' },
  { id: 'sp-6', title: 'Multiplayer Co-Working Chat Protocol', column: 'review', points: 8, tag: 'feature', assignee: 'Jordan' },
  { id: 'sp-7', title: 'Lofi Audio Synth Beat Synchronizer', column: 'backlog', points: 3, tag: 'feature', assignee: 'Maya' },
  { id: 'sp-8', title: 'Fix avatar chair sitting rotation bias', column: 'backlog', points: 2, tag: 'bug', assignee: 'Alex (You)' },
];

export const SprintBoardModal: React.FC<SprintBoardModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}) => {
  const [tickets, setTickets] = useState<SprintTicket[]>(() => {
    const saved = localStorage.getItem('ontogether_sprint_tickets');
    return saved ? JSON.parse(saved) : INITIAL_SPRINT_TICKETS;
  });

  const [newTitle, setNewTitle] = useState<string>('');
  const [newPoints, setNewPoints] = useState<number>(3);
  const [newTag, setNewTag] = useState<'feature' | 'bug' | 'refactor' | 'doc'>('feature');

  // Edit ticket state
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editPoints, setEditPoints] = useState<number>(3);
  const [editTag, setEditTag] = useState<'feature' | 'bug' | 'refactor' | 'doc'>('feature');

  if (!isOpen) return null;

  const saveTickets = (updated: SprintTicket[]) => {
    setTickets(updated);
    localStorage.setItem('ontogether_sprint_tickets', JSON.stringify(updated));
  };

  const handleStartEdit = (t: SprintTicket) => {
    setEditingTicketId(t.id);
    setEditTitle(t.title);
    setEditPoints(t.points);
    setEditTag(t.tag);
  };

  const handleSaveEdit = (ticketId: string) => {
    if (!editTitle.trim()) return;
    const updated = tickets.map((t) =>
      t.id === ticketId
        ? { ...t, title: editTitle.trim(), points: editPoints, tag: editTag }
        : t
    );
    saveTickets(updated);
    setEditingTicketId(null);
    soundEngine.playCoin();
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTicket: SprintTicket = {
      id: `sp-${Date.now()}`,
      title: newTitle.trim(),
      column: 'backlog',
      points: newPoints,
      tag: newTag,
      assignee: 'Alex (You)',
    };

    saveTickets([...tickets, newTicket]);
    setNewTitle('');
    soundEngine.playCoin();
    onAddTask(newTicket.title, 'work', Math.ceil(newPoints / 2));
  };

  const handleMoveColumn = (ticketId: string, direction: 'next' | 'prev') => {
    const colOrder: SprintColumn[] = ['backlog', 'in_progress', 'review', 'done'];
    const updated = tickets.map((t) => {
      if (t.id === ticketId) {
        const curIdx = colOrder.indexOf(t.column);
        let nextIdx = direction === 'next' ? curIdx + 1 : curIdx - 1;
        nextIdx = Math.max(0, Math.min(colOrder.length - 1, nextIdx));
        const newCol = colOrder[nextIdx];

        if (newCol === 'done' && t.column !== 'done') {
          soundEngine.playHighFive();
          confetti({ particleCount: 40, spread: 60 });
        } else {
          soundEngine.playChime('digital');
        }

        return { ...t, column: newCol };
      }
      return t;
    });

    saveTickets(updated);
  };

  const handleDeleteTicket = (ticketId: string) => {
    saveTickets(tickets.filter((t) => t.id !== ticketId));
    soundEngine.playChime('chime');
  };

  const totalStoryPoints = tickets.reduce((acc, t) => acc + t.points, 0);
  const completedStoryPoints = tickets
    .filter((t) => t.column === 'done')
    .reduce((acc, t) => acc + t.points, 0);

  const getTagBadge = (tag: SprintTicket['tag']) => {
    switch (tag) {
      case 'feature':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'bug':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'refactor':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'doc':
      default:
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }
  };

  const columns: { id: SprintColumn; title: string; emoji: string; headerColor: string }[] = [
    { id: 'backlog', title: 'Sprint Backlog', emoji: '📌', headerColor: 'text-purple-300' },
    { id: 'in_progress', title: 'In Progress', emoji: '⚡', headerColor: 'text-amber-300' },
    { id: 'review', title: 'Code Review', emoji: '🔍', headerColor: 'text-blue-300' },
    { id: 'done', title: 'Shipped / Done', emoji: '✅', headerColor: 'text-emerald-300' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl bg-[#141221] border-2 border-emerald-500/40 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950/80 via-[#17232e] to-[#141221] p-5 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600/30 border border-emerald-400/50 flex items-center justify-center text-2xl shadow-inner">
              📋
            </div>
            <div>
              <h2 className="font-cozy font-bold text-lg text-white flex items-center gap-2">
                <span>Agile Sprint Whiteboard</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Sprint Velocity {completedStoryPoints}/{totalStoryPoints} SP
                </span>
              </h2>
              <p className="text-xs text-emerald-200/80 font-cozy">
                Organize team sprint backlog, move task cards, and ship production goals!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 hover:text-white flex items-center justify-center font-bold text-sm transition-all"
          >
            ✕
          </button>
        </div>

        {/* Quick Add Sprint Ticket Bar */}
        <div className="bg-[#1a172c] border-b border-purple-800/40 p-4">
          <form onSubmit={handleCreateTicket} className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Create new sprint ticket / user story..."
              className="flex-1 min-w-[200px] bg-[#110e1e] border border-purple-600/40 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-purple-400/40 focus:outline-none focus:border-emerald-400 font-cozy"
            />
            <select
              value={newPoints}
              onChange={(e) => setNewPoints(parseInt(e.target.value, 10))}
              className="bg-[#110e1e] border border-purple-600/40 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono focus:outline-none"
            >
              <option value={1}>1 pt (Quick)</option>
              <option value={2}>2 pts (Minor)</option>
              <option value={3}>3 pts (Standard)</option>
              <option value={5}>5 pts (Major)</option>
              <option value={8}>8 pts (Epic)</option>
            </select>
            <select
              value={newTag}
              onChange={(e) => setNewTag(e.target.value as any)}
              className="bg-[#110e1e] border border-purple-600/40 rounded-xl px-3 py-2 text-xs text-purple-200 font-cozy focus:outline-none"
            >
              <option value="feature">✨ Feature</option>
              <option value="bug">🐛 Bugfix</option>
              <option value="refactor">⚡ Refactor</option>
              <option value="doc">📖 Docs</option>
            </select>
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-cozy font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
              <span>Add Ticket</span>
            </button>
          </form>
        </div>

        {/* 4-Column Agile Kanban Board */}
        <div className="p-4 sm:p-6 overflow-x-auto flex-1 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-w-[760px] h-full">
            {columns.map((col) => {
              const colTickets = tickets.filter((t) => t.column === col.id);
              const colPoints = colTickets.reduce((acc, t) => acc + t.points, 0);

              return (
                <div
                  key={col.id}
                  className="bg-[#171426]/90 border border-purple-800/40 rounded-2xl p-3.5 flex flex-col flex-1"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-purple-800/40">
                    <div className="flex items-center gap-1.5 font-cozy font-bold text-xs">
                      <span>{col.emoji}</span>
                      <span className={col.headerColor}>{col.title}</span>
                    </div>
                    <span className="text-[10px] bg-purple-900/60 text-purple-200 font-mono px-2 py-0.5 rounded-full border border-purple-700/40">
                      {colTickets.length} ({colPoints} SP)
                    </span>
                  </div>

                  {/* Ticket List */}
                  <div className="space-y-2.5 flex-1 overflow-y-auto custom-scrollbar pr-1">
                    {colTickets.length === 0 ? (
                      <div className="text-center py-6 text-xs text-purple-400/40 font-cozy border-2 border-dashed border-purple-900/40 rounded-xl">
                        No cards
                      </div>
                    ) : (
                      colTickets.map((ticket) => {
                        const isEditing = editingTicketId === ticket.id;

                        if (isEditing) {
                          return (
                            <div
                              key={ticket.id}
                              className="p-3 rounded-xl bg-[#2a2244] border border-purple-400 shadow-lg flex flex-col gap-2 animate-fadeIn"
                            >
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit(ticket.id);
                                  if (e.key === 'Escape') setEditingTicketId(null);
                                }}
                                autoFocus
                                className="w-full bg-purple-950/90 border border-purple-600 rounded-lg px-2 py-1 text-xs text-white focus:outline-hidden font-cozy"
                                placeholder="Edit ticket title..."
                              />
                              <div className="flex items-center justify-between text-xs gap-1.5">
                                <select
                                  value={editTag}
                                  onChange={(e) => setEditTag(e.target.value as any)}
                                  className="bg-purple-950/90 border border-purple-700/60 rounded px-1.5 py-0.5 text-[10px] text-purple-200"
                                >
                                  <option value="feature">Feature</option>
                                  <option value="bug">Bug</option>
                                  <option value="refactor">Refactor</option>
                                  <option value="doc">Doc</option>
                                </select>
                                <select
                                  value={editPoints}
                                  onChange={(e) => setEditPoints(Number(e.target.value))}
                                  className="bg-purple-950/90 border border-purple-700/60 rounded px-1.5 py-0.5 text-[10px] text-purple-200"
                                >
                                  <option value={1}>1 SP</option>
                                  <option value={2}>2 SP</option>
                                  <option value={3}>3 SP</option>
                                  <option value={5}>5 SP</option>
                                  <option value={8}>8 SP</option>
                                </select>
                                <div className="flex gap-1 ml-auto">
                                  <button
                                    onClick={() => setEditingTicketId(null)}
                                    className="p-1 rounded text-purple-400 hover:text-white"
                                    title="Cancel"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleSaveEdit(ticket.id)}
                                    className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 rounded text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                                    title="Save"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Save</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={ticket.id}
                            className="p-3 rounded-xl bg-[#201b33] border border-purple-700/40 hover:border-emerald-500/50 transition-all shadow-md flex flex-col justify-between gap-2 group"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1.5">
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded border uppercase font-mono ${getTagBadge(
                                    ticket.tag
                                  )}`}
                                >
                                  {ticket.tag}
                                </span>
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-500/30 font-mono">
                                  {ticket.points} SP
                                </span>
                              </div>
                              <h4 className="font-cozy font-bold text-xs text-white leading-snug">
                                {ticket.title}
                              </h4>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-purple-900/50 text-[10px]">
                              <span className="text-purple-300/80 font-mono">{ticket.assignee}</span>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleStartEdit(ticket)}
                                  title="Edit Whiteboard Ticket"
                                  className="p-1 rounded hover:bg-purple-800 text-purple-300 hover:text-white"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>

                                {col.id !== 'backlog' && (
                                  <button
                                    onClick={() => handleMoveColumn(ticket.id, 'prev')}
                                    title="Move Left"
                                    className="p-1 rounded hover:bg-purple-800 text-purple-300"
                                  >
                                    <ArrowLeft className="w-3 h-3" />
                                  </button>
                                )}

                                <button
                                  onClick={() => handleDeleteTicket(ticket.id)}
                                  title="Delete Ticket"
                                  className="p-1 rounded hover:bg-rose-900/60 text-purple-400 hover:text-rose-300"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>

                                {col.id !== 'done' && (
                                  <button
                                    onClick={() => handleMoveColumn(ticket.id, 'next')}
                                    title="Move Right"
                                    className="p-1 rounded hover:bg-purple-800 text-purple-300"
                                  >
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
