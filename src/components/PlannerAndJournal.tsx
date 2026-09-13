import React, { useState } from 'react';
import { MoodType, JournalEntry, TimeBlock } from '../types';
import { BookOpen, Calendar, Sparkles, Smile, Coffee, Heart, Check, Plus, Trash2, Pencil, X } from 'lucide-react';
import { soundEngine } from '../utils/audioSynth';
import confetti from 'canvas-confetti';

interface PlannerAndJournalProps {
  timeBlocks: TimeBlock[];
  journalEntries: JournalEntry[];
  todayFocusMinutes: number;
  onAddTimeBlock: (block: Omit<TimeBlock, 'id'>) => void;
  onDeleteTimeBlock: (id: string) => void;
  onToggleTimeBlock: (id: string) => void;
  onUpdateTimeBlock?: (id: string, updates: Partial<TimeBlock>) => void;
  onSaveJournalEntry: (entry: Omit<JournalEntry, 'id' | 'date'>) => void;
  onUpdateJournalEntry?: (id: string, updates: Partial<JournalEntry>) => void;
}

export const PlannerAndJournal: React.FC<PlannerAndJournalProps> = ({
  timeBlocks,
  journalEntries,
  todayFocusMinutes,
  onAddTimeBlock,
  onDeleteTimeBlock,
  onToggleTimeBlock,
  onUpdateTimeBlock,
  onSaveJournalEntry,
  onUpdateJournalEntry,
}) => {
  const [activeTab, setActiveTab] = useState<'planner' | 'journal'>('planner');

  // Planner state
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [blockTitle, setBlockTitle] = useState('');
  const [blockCategory, setBlockCategory] = useState('Deep Work');

  // Time Block Edit State
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editBlockTitle, setEditBlockTitle] = useState('');
  const [editStartTime, setEditStartTime] = useState('10:00');
  const [editEndTime, setEditEndTime] = useState('11:00');
  const [editBlockCategory, setEditBlockCategory] = useState('Deep Work');

  // Journal state
  const [mood, setMood] = useState<MoodType>('focused');
  const [gratitude, setGratitude] = useState('');
  const [reflection, setReflection] = useState('');
  const [savedToday, setSavedToday] = useState(false);
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);

  const handleStartEditBlock = (block: TimeBlock) => {
    setEditingBlockId(block.id);
    setEditBlockTitle(block.title);
    setEditStartTime(block.startTime);
    setEditEndTime(block.endTime);
    setEditBlockCategory(block.category);
  };

  const handleSaveEditBlock = (id: string) => {
    if (!editBlockTitle.trim()) return;
    if (onUpdateTimeBlock) {
      onUpdateTimeBlock(id, {
        title: editBlockTitle.trim(),
        startTime: editStartTime,
        endTime: editEndTime,
        category: editBlockCategory,
      });
      soundEngine.playCoin();
    }
    setEditingBlockId(null);
  };

  const handleStartEditJournal = (entry: JournalEntry) => {
    setEditingJournalId(entry.id);
    setMood(entry.mood);
    setGratitude(entry.gratitude);
    setReflection(entry.reflection);
  };

  const handleCancelEditJournal = () => {
    setEditingJournalId(null);
    setGratitude('');
    setReflection('');
    setMood('focused');
  };

  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockTitle.trim()) return;
    onAddTimeBlock({
      startTime,
      endTime,
      title: blockTitle.trim(),
      category: blockCategory,
      completed: false,
    });
    setBlockTitle('');
    soundEngine.playCoin();
  };

  const handleSaveJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflection.trim() && !gratitude.trim()) return;

    if (editingJournalId && onUpdateJournalEntry) {
      onUpdateJournalEntry(editingJournalId, {
        mood,
        gratitude,
        reflection,
      });
      soundEngine.playCoin();
      setEditingJournalId(null);
      setGratitude('');
      setReflection('');
      return;
    }

    onSaveJournalEntry({
      mood,
      gratitude,
      reflection,
      focusMinutes: todayFocusMinutes,
      completedTasksCount: 3,
      tags: ['focus', 'journal'],
    });
    setSavedToday(true);
    soundEngine.playCoin();
    confetti({ particleCount: 40, spread: 70 });
  };

  const moodEmojis: Record<MoodType, { emoji: string; label: string }> = {
    focused: { emoji: '🎯', label: 'Focused' },
    calm: { emoji: '🧘', label: 'Calm' },
    energetic: { emoji: '⚡', label: 'Energetic' },
    tired: { emoji: '😴', label: 'Tired' },
    proud: { emoji: '🌟', label: 'Proud' },
  };

  return (
    <div className="bg-[#1e1a2f]/90 backdrop-blur-md border border-purple-500/20 rounded-2xl p-4 sm:p-5 shadow-xl text-purple-100 flex flex-col select-none overflow-hidden w-full">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between mb-4 border-b border-purple-800/40 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('planner')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-cozy text-xs font-semibold transition-all ${
              activeTab === 'planner'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-purple-300 hover:text-white bg-purple-950/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Time Blocks</span>
          </button>
          <button
            onClick={() => setActiveTab('journal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-cozy text-xs font-semibold transition-all ${
              activeTab === 'journal'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-purple-300 hover:text-white bg-purple-950/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Focus Journal</span>
          </button>
        </div>
        <span className="text-xs font-cozy text-amber-300 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Earn 🎟️ Rewards</span>
        </span>
      </div>

      {/* 1. Time Blocking Planner Tab */}
      {activeTab === 'planner' && (
        <div className="space-y-3">
          {/* Add Time Block Form */}
          <form onSubmit={handleAddBlock} className="bg-purple-950/60 p-3 rounded-xl border border-purple-800/40 text-xs space-y-2">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={blockTitle}
                onChange={(e) => setBlockTitle(e.target.value)}
                placeholder="Session Goal (e.g. Code feature, Read paper)"
                className="flex-1 min-w-0 bg-purple-900/40 border border-purple-700/50 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-purple-400/60 focus:outline-hidden font-cozy"
              />
              <button
                type="submit"
                className="shrink-0 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg font-cozy font-semibold text-white text-xs flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Block</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-purple-300">
              <div className="flex items-center gap-1.5 text-[11px]">
                <span>Time:</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-purple-900/40 border border-purple-700/50 rounded px-1.5 py-0.5 text-xs text-white"
                />
                <span>to</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-purple-900/40 border border-purple-700/50 rounded px-1.5 py-0.5 text-xs text-white"
                />
              </div>
              <select
                value={blockCategory}
                onChange={(e) => setBlockCategory(e.target.value)}
                className="bg-purple-900/40 border border-purple-700/50 rounded px-2 py-0.5 text-xs text-purple-200 max-w-[120px] sm:max-w-none"
              >
                <option value="Deep Work">Deep Work</option>
                <option value="Study">Study</option>
                <option value="Meeting">Meeting</option>
                <option value="Break & Rest">Break & Rest</option>
              </select>
            </div>
          </form>

          {/* Time Block Schedule List */}
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {timeBlocks.length === 0 ? (
              <div className="text-center py-6 text-xs text-purple-400/70 font-cozy">
                No time blocks scheduled for today. Plan your day with intention! 📅
              </div>
            ) : (
              timeBlocks.map((block) => {
                const isEditing = editingBlockId === block.id;

                if (isEditing) {
                  return (
                    <div
                      key={block.id}
                      className="p-3 rounded-xl border border-purple-400 bg-purple-900/60 shadow-lg space-y-2 animate-fadeIn"
                    >
                      <input
                        type="text"
                        value={editBlockTitle}
                        onChange={(e) => setEditBlockTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEditBlock(block.id);
                          if (e.key === 'Escape') setEditingBlockId(null);
                        }}
                        autoFocus
                        placeholder="Edit block title..."
                        className="w-full bg-purple-950/80 border border-purple-600 rounded-lg px-2.5 py-1 text-xs text-white placeholder-purple-400/60 focus:outline-hidden focus:border-purple-300 font-cozy"
                      />
                      <div className="flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-1 text-purple-300">
                          <input
                            type="time"
                            value={editStartTime}
                            onChange={(e) => setEditStartTime(e.target.value)}
                            className="bg-purple-950/80 border border-purple-700/60 rounded px-1.5 py-0.5 text-xs text-white"
                          />
                          <span className="text-[10px]">to</span>
                          <input
                            type="time"
                            value={editEndTime}
                            onChange={(e) => setEditEndTime(e.target.value)}
                            className="bg-purple-950/80 border border-purple-700/60 rounded px-1.5 py-0.5 text-xs text-white"
                          />
                        </div>

                        <select
                          value={editBlockCategory}
                          onChange={(e) => setEditBlockCategory(e.target.value)}
                          className="bg-purple-950/80 border border-purple-700/60 rounded px-1.5 py-0.5 text-xs text-purple-200"
                        >
                          <option value="Deep Work">Deep Work</option>
                          <option value="Study">Study</option>
                          <option value="Meeting">Meeting</option>
                          <option value="Break & Rest">Break & Rest</option>
                        </select>

                        <div className="flex gap-1.5 ml-auto">
                          <button
                            type="button"
                            onClick={() => setEditingBlockId(null)}
                            className="p-1 rounded text-purple-400 hover:text-white text-xs"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditBlock(block.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 rounded font-cozy font-semibold text-white text-xs flex items-center gap-1 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={block.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      block.completed
                        ? 'bg-purple-950/30 border-purple-800/30 opacity-70'
                        : 'bg-purple-950/60 border-purple-700/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        onClick={() => {
                          soundEngine.playCoin();
                          onToggleTimeBlock(block.id);
                        }}
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          block.completed
                            ? 'bg-emerald-500 border-emerald-400 text-white'
                            : 'border-purple-600 bg-purple-950/50'
                        }`}
                      >
                        {block.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                      <div>
                        <p className={`text-xs font-cozy font-medium ${block.completed ? 'line-through text-purple-400' : 'text-purple-100'}`}>
                          {block.title}
                        </p>
                        <span className="text-[10px] text-purple-300 font-mono-timer">
                          {block.startTime} – {block.endTime} • {block.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEditBlock(block)}
                        title="Edit time block"
                        className="p-1 text-purple-400 hover:text-white rounded transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTimeBlock(block.id)}
                        title="Delete time block"
                        className="p-1 text-purple-400 hover:text-rose-400 rounded transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 2. Personal Focus Journal Tab */}
      {activeTab === 'journal' && (
        <form onSubmit={handleSaveJournal} className="space-y-3">
          {editingJournalId && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-amber-950/50 border border-amber-500/40 text-xs text-amber-200">
              <span className="flex items-center gap-1.5 font-bold">
                <Pencil className="w-3.5 h-3.5 text-amber-400" />
                Editing Saved Journal Entry
              </span>
              <button
                type="button"
                onClick={handleCancelEditJournal}
                className="text-xs text-amber-400 hover:text-white underline"
              >
                Cancel Edit
              </button>
            </div>
          )}

          {/* Mood Tracker */}
          <div>
            <label className="block text-xs font-cozy font-medium text-purple-300 mb-1.5">
              How are you feeling today?
            </label>
            <div className="flex items-center gap-2">
              {(Object.keys(moodEmojis) as MoodType[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(m)}
                  className={`flex-1 flex flex-col items-center py-1.5 rounded-xl border transition-all ${
                    mood === m
                      ? 'bg-purple-600/80 border-purple-400 text-white shadow-md scale-105'
                      : 'bg-purple-950/60 border-purple-800/40 text-purple-300 hover:bg-purple-900/40'
                  }`}
                >
                  <span className="text-base">{moodEmojis[m].emoji}</span>
                  <span className="text-[10px] font-cozy mt-0.5">{moodEmojis[m].label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Gratitude Prompt */}
          <div>
            <label className="block text-xs font-cozy font-medium text-purple-300 mb-1">
              ✨ 1 thing I'm grateful for:
            </label>
            <input
              type="text"
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
              placeholder="e.g. Hot matcha latte, productive morning, friendly co-workers..."
              className="w-full bg-purple-950/60 border border-purple-800/50 rounded-xl px-3 py-1.5 text-xs text-white placeholder-purple-400/50 focus:outline-hidden font-cozy"
            />
          </div>

          {/* Daily Reflection */}
          <div>
            <label className="block text-xs font-cozy font-medium text-purple-300 mb-1">
              📖 Session Reflections & Notes:
            </label>
            <textarea
              rows={2}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What did you learn? What progress did you make?"
              className="w-full bg-purple-950/60 border border-purple-800/50 rounded-xl px-3 py-1.5 text-xs text-white placeholder-purple-400/50 focus:outline-hidden font-cozy resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-purple-300">
              Today's Focus: <strong className="text-amber-300">{todayFocusMinutes} mins</strong>
            </span>
            <button
              type="submit"
              className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl font-cozy font-bold text-white text-xs shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{editingJournalId ? 'Save Edits' : savedToday ? 'Update Entry (+10🎟️)' : 'Save Reflection (+10🎟️)'}</span>
            </button>
          </div>

          {/* Past Entries with Edit capability */}
          {journalEntries.length > 0 && (
            <div className="pt-3 border-t border-purple-800/40 space-y-2">
              <span className="text-[11px] font-bold text-purple-300 block">Past Focus Journal Entries</span>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {journalEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-2.5 rounded-xl bg-purple-950/50 border border-purple-800/40 flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-purple-300 mb-0.5">
                        <span>{moodEmojis[entry.mood]?.emoji || '🎯'}</span>
                        <span className="font-mono-timer">{entry.date}</span>
                        <span>• {entry.focusMinutes} mins focus</span>
                      </div>
                      {entry.gratitude && (
                        <p className="text-[11px] text-amber-200/90 italic truncate">✨ {entry.gratitude}</p>
                      )}
                      {entry.reflection && (
                        <p className="text-xs text-purple-200 mt-0.5 line-clamp-2">{entry.reflection}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleStartEditJournal(entry)}
                      className="p-1 rounded text-purple-400 hover:text-white hover:bg-purple-800/40 transition-all shrink-0"
                      title="Edit this journal entry"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
};
