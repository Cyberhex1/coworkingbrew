import React, { useState } from 'react';
import { TaskItem } from '../types';
import { Plus, Check, Trash2, Pin, Sparkles, Tag, CheckCircle2, Pencil, X } from 'lucide-react';
import { soundEngine } from '../utils/audioSynth';
import confetti from 'canvas-confetti';

interface TodoListProps {
  tasks: TaskItem[];
  activeTaskId: string | null;
  onAddTask: (title: string, category: TaskItem['category'], estPomodoros: number, priority: TaskItem['priority']) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onSetActiveTask: (taskId: string) => void;
  onUpdateTask?: (taskId: string, updates: Partial<TaskItem>) => void;
}

export const TodoList: React.FC<TodoListProps> = ({
  tasks,
  activeTaskId,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onSetActiveTask,
  onUpdateTask,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TaskItem['category']>('Work');
  const [newEst, setNewEst] = useState(2);
  const [newPriority, setNewPriority] = useState<TaskItem['priority']>('medium');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isAdding, setIsAdding] = useState(false);

  // Edit Task State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<TaskItem['category']>('Work');
  const [editEst, setEditEst] = useState(2);

  const handleStartEdit = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditCategory(task.category);
    setEditEst(task.estimatedPomodoros);
  };

  const handleSaveEdit = (taskId: string) => {
    if (!editTitle.trim()) return;
    if (onUpdateTask) {
      onUpdateTask(taskId, {
        title: editTitle.trim(),
        category: editCategory,
        estimatedPomodoros: editEst,
      });
      soundEngine.playCoin();
    }
    setEditingTaskId(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask(newTitle.trim(), newCategory, newEst, newPriority);
    setNewTitle('');
    setIsAdding(false);
    soundEngine.playCoin();
  };

  const handleCheck = (task: TaskItem) => {
    if (!task.completed) {
      soundEngine.playCoin();
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.8 },
      });
    }
    onToggleTask(task.id);
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const getCategoryColor = (cat: TaskItem['category']) => {
    switch (cat) {
      case 'Work':
        return 'bg-blue-900/60 text-blue-200 border-blue-700/50';
      case 'Study':
        return 'bg-emerald-900/60 text-emerald-200 border-emerald-700/50';
      case 'Creative':
        return 'bg-purple-900/60 text-purple-200 border-purple-700/50';
      case 'Coding':
        return 'bg-cyan-900/60 text-cyan-200 border-cyan-700/50';
      case 'Health':
        return 'bg-rose-900/60 text-rose-200 border-rose-700/50';
      case 'General':
      default:
        return 'bg-amber-900/60 text-amber-200 border-amber-700/50';
    }
  };

  return (
    <div className="bg-[#1e1a2f]/90 backdrop-blur-md border border-purple-500/20 rounded-2xl p-5 shadow-xl text-purple-100 flex flex-col h-full select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-purple-400" />
          <h3 className="font-cozy font-bold text-base text-white">Focus Tasks</h3>
          <span className="text-xs bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-800/40 text-purple-300">
            {tasks.filter((t) => t.completed).length}/{tasks.length}
          </span>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1 px-2.5 py-1 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs font-cozy font-semibold text-white transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Task Creation Form */}
      {isAdding && (
        <form onSubmit={handleCreate} className="bg-purple-950/70 p-3 rounded-xl border border-purple-700/40 mb-3 space-y-2 animate-fade-in">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="What will you focus on?"
            autoFocus
            className="w-full bg-purple-900/40 border border-purple-700/50 rounded-lg px-3 py-1.5 text-xs text-white placeholder-purple-400/60 focus:outline-hidden focus:border-purple-400 font-cozy"
          />
          <div className="flex items-center justify-between text-xs gap-2">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as TaskItem['category'])}
              className="bg-purple-900/40 border border-purple-700/50 rounded-lg px-2 py-1 text-xs text-purple-200 focus:outline-hidden"
            >
              <option value="Work">💼 Work</option>
              <option value="Study">📚 Study</option>
              <option value="Coding">💻 Coding</option>
              <option value="Creative">🎨 Creative</option>
              <option value="Health">🧘 Health</option>
              <option value="General">📝 General</option>
            </select>

            <div className="flex items-center gap-1">
              <span className="text-purple-300 text-[11px]">🍅:</span>
              <select
                value={newEst}
                onChange={(e) => setNewEst(Number(e.target.value))}
                className="bg-purple-900/40 border border-purple-700/50 rounded-lg px-1.5 py-1 text-xs text-purple-200 focus:outline-hidden"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={6}>6</option>
              </select>
            </div>

            <div className="flex gap-1.5 ml-auto">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-2 py-1 rounded text-purple-400 hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded font-cozy font-semibold text-white text-xs"
              >
                Add (+5🎟️)
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-2 text-xs font-cozy">
        <button
          onClick={() => setFilter('all')}
          className={`px-2 py-0.5 rounded-md ${filter === 'all' ? 'bg-purple-800 text-white font-semibold' : 'text-purple-400 hover:text-purple-200'}`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-2 py-0.5 rounded-md ${filter === 'active' ? 'bg-purple-800 text-white font-semibold' : 'text-purple-400 hover:text-purple-200'}`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-2 py-0.5 rounded-md ${filter === 'completed' ? 'bg-purple-800 text-white font-semibold' : 'text-purple-400 hover:text-purple-200'}`}
        >
          Done
        </button>
      </div>

      {/* Task List Items */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[220px]">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-6 text-xs text-purple-400/70 font-cozy">
            No tasks found. Add one to stay accountable! ☕
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isActive = activeTaskId === task.id;
            const isEditing = editingTaskId === task.id;

            if (isEditing) {
              return (
                <div
                  key={task.id}
                  className="p-3 rounded-xl border border-purple-400 bg-purple-900/60 shadow-lg space-y-2 animate-fadeIn"
                >
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(task.id);
                      if (e.key === 'Escape') setEditingTaskId(null);
                    }}
                    autoFocus
                    placeholder="Edit task title..."
                    className="w-full bg-purple-950/80 border border-purple-600 rounded-lg px-2.5 py-1 text-xs text-white placeholder-purple-400/60 focus:outline-hidden focus:border-purple-300 font-cozy"
                  />
                  <div className="flex items-center justify-between text-xs gap-2">
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as TaskItem['category'])}
                      className="bg-purple-950/80 border border-purple-700/60 rounded px-2 py-0.5 text-xs text-purple-200"
                    >
                      <option value="Work">💼 Work</option>
                      <option value="Study">📚 Study</option>
                      <option value="Coding">💻 Coding</option>
                      <option value="Creative">🎨 Creative</option>
                      <option value="Health">🧘 Health</option>
                      <option value="General">📝 General</option>
                    </select>

                    <div className="flex items-center gap-1">
                      <span className="text-purple-300 text-[11px]">🍅:</span>
                      <select
                        value={editEst}
                        onChange={(e) => setEditEst(Number(e.target.value))}
                        className="bg-purple-950/80 border border-purple-700/60 rounded px-1.5 py-0.5 text-xs text-purple-200"
                      >
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={4}>4</option>
                        <option value={6}>6</option>
                      </select>
                    </div>

                    <div className="flex gap-1.5 ml-auto">
                      <button
                        type="button"
                        onClick={() => setEditingTaskId(null)}
                        className="px-2 py-1 rounded text-purple-400 hover:text-white text-xs flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(task.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded font-cozy font-semibold text-white text-xs flex items-center gap-1 shadow-sm"
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
                key={task.id}
                className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-purple-900/40 border-purple-400/80 shadow-md ring-1 ring-purple-400/40'
                    : 'bg-purple-950/40 border-purple-800/30 hover:bg-purple-950/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleCheck(task)}
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                      task.completed
                        ? 'bg-emerald-500 border-emerald-400 text-white'
                        : 'border-purple-600/70 hover:border-purple-400 bg-purple-950/50'
                    }`}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  {/* Task details */}
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-cozy truncate ${
                        task.completed ? 'line-through text-purple-400/60' : 'text-purple-100 font-medium'
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[9px] px-1.5 py-0.2 rounded border font-medium ${getCategoryColor(task.category)}`}>
                        {task.category}
                      </span>
                      <span className="text-[10px] text-rose-400">
                        {'🍅'.repeat(task.estimatedPomodoros)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                  {!task.completed && (
                    <button
                      onClick={() => handleStartEdit(task)}
                      title="Edit task"
                      className="p-1 text-purple-400 hover:text-white hover:bg-purple-800/40 rounded-md transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {!task.completed && (
                    <button
                      onClick={() => onSetActiveTask(task.id)}
                      title={isActive ? 'Active Task on Avatar' : 'Set as Current Focus Goal'}
                      className={`p-1 rounded-md transition-all ${
                        isActive
                          ? 'text-amber-400 bg-amber-950/60 border border-amber-500/40'
                          : 'text-purple-400 hover:text-white hover:bg-purple-800/40'
                      }`}
                    >
                      <Pin className={`w-3.5 h-3.5 ${isActive ? 'fill-amber-400' : ''}`} />
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    title="Delete task"
                    className="p-1 text-purple-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-md transition-all"
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
  );
};
