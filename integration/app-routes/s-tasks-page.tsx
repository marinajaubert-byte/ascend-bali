/**
 * Page: /app/s/tasks
 * File path in app: src/app/s/tasks/page.tsx
 *
 * Eisenhower Matrix task view with quadrant grouping
 */

'use client';

import { useEffect, useState } from 'react';

interface Task {
  id: number;
  title: string;
  status: string;
  quadrant: string | null;
  revenue_score: number | null;
  due_date: string | null;
  notes: string | null;
}

const QUADRANTS = [
  { key: 'do-now',    label: 'Do Now',    sub: 'Important + Urgent',    color: 'border-red-800    bg-red-950/30',   badge: 'bg-red-900 text-red-300'   },
  { key: 'schedule',  label: 'Schedule',  sub: 'Important, Not Urgent', color: 'border-blue-800   bg-blue-950/30',  badge: 'bg-blue-900 text-blue-300'  },
  { key: 'delegate',  label: 'Delegate',  sub: 'Urgent, Not Important', color: 'border-cyan-800   bg-cyan-950/30',  badge: 'bg-cyan-900 text-cyan-300'  },
  { key: 'eliminate', label: 'Eliminate', sub: 'Not Important or Urgent',color: 'border-zinc-700   bg-zinc-900/50',  badge: 'bg-zinc-800 text-zinc-400'  },
];

export default function TasksPage() {
  const [tasks, setTasks]           = useState<Task[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showAdd, setShowAdd]       = useState(false);
  const [newTitle, setNewTitle]     = useState('');
  const [newQuadrant, setNewQuadrant] = useState('do-now');
  const [newRevenue, setNewRevenue] = useState(3);

  function load() {
    fetch('/api/tasks?status=pending,in_progress&limit=100')
      .then((r) => r.json())
      .then((d) => setTasks(Array.isArray(d) ? d : (d?.tasks || d?.data || [])))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function addTask() {
    if (!newTitle.trim()) return;
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), quadrant: newQuadrant, revenue_score: newRevenue, status: 'pending' }),
    });
    setNewTitle('');
    setShowAdd(false);
    load();
  }

  async function markDone(id: number) {
    await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done', completed_at: new Date().toISOString() }),
    });
    setTasks((ts) => ts.filter((t) => t.id !== id));
  }

  async function moveQuadrant(id: number, quadrant: string) {
    await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quadrant }),
    });
    setTasks((ts) => ts.map((t) => t.id === id ? { ...t, quadrant } : t));
  }

  const byQuadrant = (q: string) => tasks.filter((t) => t.quadrant === q || (!t.quadrant && q === 'schedule'));

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Tasks</h1>
          <p className="text-zinc-500 text-sm mt-1">Eisenhower Matrix — {tasks.length} active</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-black text-sm font-medium rounded-lg transition-colors"
        >
          + Add Task
        </button>
      </div>

      {/* Add task panel */}
      {showAdd && (
        <div className="mb-6 p-4 bg-zinc-900 border border-zinc-700 rounded-lg space-y-3">
          <input
            autoFocus
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="Task title…"
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-600"
          />
          <div className="flex gap-3 items-center flex-wrap">
            <select
              value={newQuadrant}
              onChange={(e) => setNewQuadrant(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white"
            >
              {QUADRANTS.map((q) => <option key={q.key} value={q.key}>{q.label}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Revenue:</span>
              {[1,2,3,4,5].map((n) => (
                <button
                  key={n}
                  onClick={() => setNewRevenue(n)}
                  className={`text-sm ${n <= newRevenue ? 'text-yellow-500' : 'text-zinc-700'}`}
                >★</button>
              ))}
            </div>
            <div className="flex gap-2 ml-auto">
              <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white">Cancel</button>
              <button onClick={addTask} className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-black text-sm rounded">Add</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-zinc-500 text-sm">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {QUADRANTS.map((q) => {
            const qtasks = byQuadrant(q.key);
            return (
              <div key={q.key} className={`border rounded-xl p-4 ${q.color}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-semibold text-white text-sm">{q.label}</h2>
                    <p className="text-xs text-zinc-500">{q.sub}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${q.badge}`}>{qtasks.length}</span>
                </div>

                <ul className="space-y-1.5 min-h-[60px]">
                  {qtasks.length === 0 && (
                    <li className="text-xs text-zinc-700 py-2">No tasks here</li>
                  )}
                  {qtasks.map((t) => (
                    <li key={t.id} className="flex items-start gap-2 group">
                      <button
                        onClick={() => markDone(t.id)}
                        className="mt-0.5 w-4 h-4 rounded-full border border-zinc-600 group-hover:border-green-500 flex-shrink-0 transition-colors"
                        title="Mark done"
                      />
                      <span className="flex-1 text-sm text-zinc-200 leading-snug">{t.title}</span>
                      {t.revenue_score && t.revenue_score >= 4 && (
                        <span className="text-yellow-500 text-xs flex-shrink-0">{'★'.repeat(t.revenue_score)}</span>
                      )}
                      {/* Move menu */}
                      <select
                        className="opacity-0 group-hover:opacity-100 text-xs bg-transparent border-0 text-zinc-500 cursor-pointer transition-opacity"
                        value={t.quadrant || ''}
                        onChange={(e) => moveQuadrant(t.id, e.target.value)}
                        title="Move to quadrant"
                      >
                        {QUADRANTS.map((qq) => <option key={qq.key} value={qq.key}>{qq.label}</option>)}
                      </select>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
