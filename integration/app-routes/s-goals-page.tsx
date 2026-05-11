/**
 * Page: /app/s/goals
 * File path in app: src/app/s/goals/page.tsx
 */

'use client';

import { useEffect, useState } from 'react';

interface Goal {
  id: number;
  title: string;
  type: string;
  timeframe: string | null;
  status: string;
  milestones_done: number;
  milestones_total: number;
  notes: string | null;
}

const STATUS_STYLE: Record<string, string> = {
  active:    'bg-green-900 text-green-300',
  completed: 'bg-zinc-700 text-zinc-300',
  paused:    'bg-yellow-900 text-yellow-300',
  cancelled: 'bg-red-900 text-red-300',
};
const TYPE_ICON: Record<string, string> = {
  outcome: '🎯',
  habit:   '🔄',
  project: '📦',
  metric:  '📊',
};

export default function GoalsPage() {
  const [goals, setGoals]       = useState<Goal[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [form, setForm]         = useState({ title: '', type: 'outcome', timeframe: '', notes: '' });

  function load() {
    fetch('/api/goals?limit=50')
      .then((r) => r.json())
      .then((d) => setGoals(Array.isArray(d) ? d : (d?.goals || [])))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function addGoal() {
    if (!form.title.trim()) return;
    await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, title: form.title.trim(), status: 'active' }),
    });
    setForm({ title: '', type: 'outcome', timeframe: '', notes: '' });
    setShowAdd(false);
    load();
  }

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setGoals((gs) => gs.map((g) => g.id === id ? { ...g, status } : g));
  }

  const active    = goals.filter((g) => g.status === 'active');
  const completed = goals.filter((g) => g.status === 'completed');

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Goals</h1>
          <p className="text-zinc-500 text-sm mt-1">{active.length} active · {completed.length} completed</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-black text-sm font-medium rounded-lg transition-colors"
        >
          + Add Goal
        </button>
      </div>

      {showAdd && (
        <div className="mb-6 p-4 bg-zinc-900 border border-zinc-700 rounded-lg space-y-3">
          <input
            autoFocus
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && addGoal()}
            placeholder="Goal title"
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-600"
          />
          <div className="flex gap-3 flex-wrap">
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white"
            >
              <option value="outcome">🎯 Outcome</option>
              <option value="habit">🔄 Habit</option>
              <option value="project">📦 Project</option>
              <option value="metric">📊 Metric</option>
            </select>
            <input
              type="text"
              value={form.timeframe}
              onChange={(e) => setForm((f) => ({ ...f, timeframe: e.target.value }))}
              placeholder="Timeframe (e.g. Q3-2026)"
              className="bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none"
            />
          </div>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Notes (optional)"
            rows={2}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none resize-none"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white">Cancel</button>
            <button onClick={addGoal} className="px-4 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-black text-sm rounded">Add Goal</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-zinc-500 text-sm">Loading…</p>
      ) : (
        <div className="space-y-6">
          {/* Active */}
          {active.length > 0 && (
            <section>
              <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Active</h2>
              <ul className="space-y-2">
                {active.map((g) => (
                  <li key={g.id} className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 group">
                    <div className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0">{TYPE_ICON[g.type] || '🎯'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{g.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {g.timeframe && <span className="text-xs text-zinc-600">{g.timeframe}</span>}
                          {g.milestones_total > 0 && (
                            <span className="text-xs text-zinc-500">
                              {g.milestones_done}/{g.milestones_total} milestones
                            </span>
                          )}
                        </div>
                        {g.notes && <p className="text-xs text-zinc-600 mt-1">{g.notes}</p>}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={() => updateStatus(g.id, 'completed')}
                          className="px-2 py-1 text-xs bg-green-900 hover:bg-green-800 text-green-200 rounded"
                        >✓ Done</button>
                        <button
                          onClick={() => updateStatus(g.id, 'paused')}
                          className="px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded"
                        >⏸</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <section>
              <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Completed</h2>
              <ul className="space-y-1.5">
                {completed.map((g) => (
                  <li key={g.id} className="flex items-center gap-2 px-3 py-2 text-zinc-600">
                    <span>✓</span>
                    <span className="text-sm line-through">{g.title}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {active.length === 0 && completed.length === 0 && (
            <p className="text-zinc-600 text-sm">No goals yet. Add your first goal.</p>
          )}
        </div>
      )}
    </div>
  );
}
