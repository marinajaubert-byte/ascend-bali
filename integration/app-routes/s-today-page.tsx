/**
 * Page: /app/s/today
 * File path in app: src/app/s/today/page.tsx
 *
 * Today Command Center — daily focus view
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
}

interface InboxMessage {
  id: number;
  from_agent: string;
  type: string;
  subject: string;
  created_at: string;
}

interface TodayData {
  topTasks: Task[];
  brainDumpUnprocessed: number;
  inboxUnread: number;
  inboxLatest: InboxMessage[];
  goalsActive: number;
  agents: { id: number; name: string; status: string }[];
  generatedAt: string;
}

const QUADRANT_STYLE: Record<string, string> = {
  'do-now':    'text-red-400 bg-red-400/10',
  'schedule':  'text-blue-400 bg-blue-400/10',
  'delegate':  'text-cyan-400 bg-cyan-400/10',
  'eliminate': 'text-zinc-500 bg-zinc-500/10',
};
const QUADRANT_LABEL: Record<string, string> = {
  'do-now':    '🔥 Do Now',
  'schedule':  '📅 Schedule',
  'delegate':  '🤝 Delegate',
  'eliminate': '✗ Eliminate',
};

function RevenueStars({ score }: { score: number | null }) {
  if (!score) return null;
  return <span className="text-yellow-500 text-xs">{'★'.repeat(score)}</span>;
}

export default function TodayPage() {
  const [data, setData]       = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [brain, setBrain]     = useState('');
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    fetch('/api/today')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  async function markDone(id: number) {
    await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done', completed_at: new Date().toISOString() }),
    });
    setData((d) => d ? { ...d, topTasks: d.topTasks.filter((t) => t.id !== id) } : d);
  }

  async function saveBrain() {
    if (!brain.trim()) return;
    await fetch('/api/brain-dump', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: brain.trim() }),
    });
    setBrain('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Today</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{data?.topTasks.length ?? 0}</div>
          <div className="text-xs text-zinc-500 mt-1">Active tasks</div>
        </div>
        <div className={`bg-zinc-900 border rounded-lg p-4 text-center ${(data?.inboxUnread ?? 0) > 0 ? 'border-red-800' : 'border-zinc-800'}`}>
          <div className={`text-2xl font-bold ${(data?.inboxUnread ?? 0) > 0 ? 'text-red-400' : 'text-white'}`}>
            {data?.inboxUnread ?? 0}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Inbox unread</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
          <div className={`text-2xl font-bold ${(data?.brainDumpUnprocessed ?? 0) > 0 ? 'text-yellow-400' : 'text-white'}`}>
            {data?.brainDumpUnprocessed ?? 0}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Brain dump pending</div>
        </div>
      </div>

      {/* Top tasks */}
      <section>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Top Priorities</h2>
        {(data?.topTasks.length ?? 0) === 0 ? (
          <p className="text-zinc-600 text-sm">No pending tasks. Add one in Tasks.</p>
        ) : (
          <ul className="space-y-2">
            {data!.topTasks.map((t) => (
              <li key={t.id} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
                <button
                  onClick={() => markDone(t.id)}
                  className="w-5 h-5 rounded-full border border-zinc-600 hover:border-green-500 hover:bg-green-500/20 flex-shrink-0 transition-colors"
                  title="Mark done"
                />
                <span className="flex-1 text-sm text-white">{t.title}</span>
                <RevenueStars score={t.revenue_score} />
                {t.quadrant && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${QUADRANT_STYLE[t.quadrant] || 'text-zinc-500'}`}>
                    {QUADRANT_LABEL[t.quadrant] || t.quadrant}
                  </span>
                )}
                {t.due_date && (
                  <span className="text-xs text-zinc-600">{t.due_date}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Brain dump quick capture */}
      <section>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Quick Capture</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={brain}
            onChange={(e) => setBrain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveBrain()}
            placeholder="Dump a thought, idea, or task…"
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-600 transition-colors"
          />
          <button
            onClick={saveBrain}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-black text-sm font-medium rounded-lg transition-colors"
          >
            {saved ? '✓' : 'Capture'}
          </button>
        </div>
        {(data?.brainDumpUnprocessed ?? 0) > 0 && (
          <p className="text-xs text-zinc-600 mt-2">
            {data!.brainDumpUnprocessed} unprocessed — <a href="/app/s/brain-dump" className="text-yellow-600 hover:underline">triage now</a>
          </p>
        )}
      </section>

      {/* Inbox latest */}
      {(data?.inboxLatest.length ?? 0) > 0 && (
        <section>
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
            Inbox <span className="text-red-400 ml-1">{data!.inboxUnread} unread</span>
          </h2>
          <ul className="space-y-2">
            {data!.inboxLatest.map((m) => (
              <li key={m.id} className="flex items-start gap-3 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
                <span className="text-xs text-zinc-600 mt-0.5 uppercase">{m.type}</span>
                <div className="flex-1">
                  <p className="text-sm text-white">{m.subject}</p>
                  <p className="text-xs text-zinc-600">from {m.from_agent}</p>
                </div>
              </li>
            ))}
          </ul>
          <a href="/app/s/inbox" className="text-xs text-yellow-600 hover:underline mt-2 inline-block">
            View all inbox →
          </a>
        </section>
      )}
    </div>
  );
}
