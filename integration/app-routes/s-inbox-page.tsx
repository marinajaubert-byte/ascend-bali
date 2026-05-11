/**
 * Page: /app/s/inbox
 * File path in app: src/app/s/inbox/page.tsx
 */

'use client';

import { useEffect, useState } from 'react';

interface Message {
  id: number;
  from_agent: string;
  to_agent: string;
  type: string;
  task_id: number | null;
  subject: string;
  body: string | null;
  status: string;
  created_at: string;
  read_at: string | null;
}

const TYPE_STYLE: Record<string, string> = {
  report:   'bg-blue-900 text-blue-300',
  question: 'bg-yellow-900 text-yellow-300',
  approval: 'bg-red-900 text-red-300',
};

export default function InboxPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unread, setUnread]     = useState(0);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<'unread' | 'all'>('unread');
  const [expanded, setExpanded] = useState<number | null>(null);

  function load() {
    const qs = filter === 'unread' ? '?status=unread' : '';
    fetch(`/api/inbox${qs}&limit=30`)
      .then((r) => r.json())
      .then((d) => {
        setMessages(Array.isArray(d) ? d : (d?.messages || []));
        setUnread(d?.unread ?? 0);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [filter]); // eslint-disable-line

  async function markRead(id: number) {
    await fetch(`/api/inbox/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'read', read_at: new Date().toISOString() }),
    });
    setMessages((ms) => ms.filter((m) => m.id !== id));
    setUnread((n) => Math.max(0, n - 1));
  }

  async function markActioned(id: number) {
    await fetch(`/api/inbox/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'actioned' }),
    });
    setMessages((ms) => ms.filter((m) => m.id !== id));
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Inbox</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {unread > 0 ? <span className="text-red-400">{unread} unread</span> : 'All caught up'}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(['unread', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs rounded-full transition-colors ${filter === f ? 'bg-yellow-600 text-black font-medium' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
          >
            {f === 'unread' ? 'Unread' : 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm">Loading…</p>
      ) : messages.length === 0 ? (
        <p className="text-zinc-600 text-sm">
          {filter === 'unread' ? 'No unread messages.' : 'Inbox is empty.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`bg-zinc-900 border rounded-lg overflow-hidden transition-colors ${m.status === 'unread' ? 'border-zinc-700' : 'border-zinc-800'}`}
            >
              <div
                className="px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-zinc-800/50"
                onClick={() => setExpanded(expanded === m.id ? null : m.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${TYPE_STYLE[m.type] || 'bg-zinc-800 text-zinc-400'}`}>
                      {m.type}
                    </span>
                    <span className="text-xs text-zinc-600">{m.from_agent}</span>
                  </div>
                  <p className={`text-sm ${m.status === 'unread' ? 'text-white font-medium' : 'text-zinc-400'}`}>
                    {m.subject}
                  </p>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {m.status === 'unread' && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                )}
              </div>

              {expanded === m.id && (
                <div className="px-4 pb-3 border-t border-zinc-800">
                  {m.body && (
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap mt-3 mb-3">{m.body}</p>
                  )}
                  <div className="flex gap-2">
                    {m.status === 'unread' && (
                      <button
                        onClick={() => markRead(m.id)}
                        className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
                      >
                        Mark read
                      </button>
                    )}
                    {m.type === 'approval' && (
                      <button
                        onClick={() => markActioned(m.id)}
                        className="px-3 py-1.5 text-xs bg-green-900 hover:bg-green-800 text-green-200 rounded transition-colors"
                      >
                        ✓ Approve
                      </button>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
