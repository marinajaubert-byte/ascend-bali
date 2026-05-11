/**
 * Page: /app/s/brain-dump
 * File path in app: src/app/s/brain-dump/page.tsx
 */

'use client';

import { useEffect, useState } from 'react';

interface Entry {
  id: number;
  content: string;
  captured_at: string;
  processed: number;
  converted_to: string | null;
  tags: string | null;
}

export default function BrainDumpPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [total, setTotal]     = useState(0);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<'all' | 'unprocessed'>('unprocessed');

  function load() {
    const qs = filter === 'unprocessed' ? '?processed=false' : '';
    fetch(`/api/brain-dump${qs}&limit=50`)
      .then((r) => r.json())
      .then((d) => {
        setEntries(Array.isArray(d) ? d : (d?.entries || []));
        setTotal(d?.total ?? 0);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [filter]); // eslint-disable-line

  async function capture() {
    if (!input.trim()) return;
    await fetch('/api/brain-dump', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: input.trim() }),
    });
    setInput('');
    load();
  }

  async function markProcessed(id: number) {
    await fetch(`/api/brain-dump/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ processed: 1, converted_to: 'archived' }),
    });
    setEntries((es) => es.filter((e) => e.id !== id));
  }

  async function convertToTask(entry: Entry) {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: entry.content, status: 'pending', quadrant: 'schedule', notes: 'From brain dump' }),
    });
    await fetch(`/api/brain-dump/${entry.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ processed: 1, converted_to: 'task' }),
    });
    setEntries((es) => es.filter((e) => e.id !== entry.id));
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Brain Dump</h1>
        <p className="text-zinc-500 text-sm mt-1">Capture everything. Triage later.</p>
      </div>

      {/* Capture box */}
      <div className="mb-8">
        <div className="flex gap-2">
          <input
            autoFocus
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && capture()}
            placeholder="What's on your mind? Press Enter to capture."
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-600 transition-colors"
          />
          <button
            onClick={capture}
            className="px-5 py-3 bg-yellow-600 hover:bg-yellow-500 text-black text-sm font-semibold rounded-lg transition-colors"
          >
            + Capture
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(['unprocessed', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs rounded-full transition-colors ${filter === f ? 'bg-yellow-600 text-black font-medium' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
          >
            {f === 'unprocessed' ? 'To triage' : 'All entries'}
          </button>
        ))}
        <span className="ml-auto text-xs text-zinc-600 self-center">{total} entries</span>
      </div>

      {/* Entries */}
      {loading ? (
        <p className="text-zinc-500 text-sm">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-zinc-600 text-sm">
          {filter === 'unprocessed' ? 'All caught up! Nothing to triage.' : 'No entries yet.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => (
            <li key={e.id} className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex items-start gap-3 group">
              <div className="flex-1">
                <p className="text-sm text-white">{e.content}</p>
                <p className="text-xs text-zinc-600 mt-1">
                  {new Date(e.captured_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {e.converted_to && <span className="ml-2 text-green-600">→ {e.converted_to}</span>}
                </p>
              </div>
              {!e.processed && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={() => convertToTask(e)}
                    className="px-2 py-1 text-xs bg-blue-900 hover:bg-blue-800 text-blue-200 rounded transition-colors"
                    title="Convert to task"
                  >
                    → Task
                  </button>
                  <button
                    onClick={() => markProcessed(e.id)}
                    className="px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded transition-colors"
                    title="Archive"
                  >
                    Archive
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
