/**
 * Page: /app/s/dashboard
 * File path in app: src/app/s/dashboard/page.tsx
 *
 * Mission Control main dashboard — links to all /app/s sections
 */

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Stats {
  topTasks: { id: number; title: string; quadrant: string | null }[];
  brainDumpUnprocessed: number;
  inboxUnread: number;
  goalsActive: number;
}

const MODULES = [
  { href: '/app/s/today',       label: 'Today',       emoji: '⚡', desc: 'Daily focus & priorities'         },
  { href: '/app/s/tasks',       label: 'Tasks',        emoji: '📋', desc: 'Eisenhower matrix'                 },
  { href: '/app/s/goals',       label: 'Goals',        emoji: '🎯', desc: 'Long-term objectives'              },
  { href: '/app/s/brain-dump',  label: 'Brain Dump',   emoji: '💡', desc: 'Quick capture & triage'           },
  { href: '/app/s/inbox',       label: 'Inbox',        emoji: '📥', desc: 'Agent reports & approvals'        },
  { href: '/app/app/agents',    label: 'Agents',       emoji: '🤖', desc: 'Manage AI agents'                 },
  { href: '/app/app/crm',       label: 'CRM',          emoji: '🤝', desc: 'Contacts & opportunities'         },
  { href: '/app/app/projects',  label: 'Projects',     emoji: '📦', desc: 'Active projects'                  },
];

export default function DashboardPage() {
  const [stats, setStats]   = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/today')
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-white">Mission Control</h1>
        <p className="text-zinc-500 mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Status strip */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="text-2xl font-bold text-white">{stats.goalsActive}</div>
            <div className="text-xs text-zinc-500 mt-1">Active goals</div>
          </div>
          <div className={`bg-zinc-900 border rounded-xl p-4 ${stats.inboxUnread > 0 ? 'border-red-800' : 'border-zinc-800'}`}>
            <div className={`text-2xl font-bold ${stats.inboxUnread > 0 ? 'text-red-400' : 'text-white'}`}>
              {stats.inboxUnread}
            </div>
            <div className="text-xs text-zinc-500 mt-1">Inbox unread</div>
          </div>
          <div className={`bg-zinc-900 border rounded-xl p-4 ${stats.brainDumpUnprocessed > 0 ? 'border-yellow-800' : 'border-zinc-800'}`}>
            <div className={`text-2xl font-bold ${stats.brainDumpUnprocessed > 0 ? 'text-yellow-400' : 'text-white'}`}>
              {stats.brainDumpUnprocessed}
            </div>
            <div className="text-xs text-zinc-500 mt-1">Brain dump to triage</div>
          </div>
        </div>
      )}

      {/* Module grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {MODULES.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 transition-all hover:bg-zinc-800"
          >
            <div className="text-2xl mb-2">{m.emoji}</div>
            <div className="text-sm font-medium text-white group-hover:text-yellow-400 transition-colors">{m.label}</div>
            <div className="text-xs text-zinc-600 mt-0.5">{m.desc}</div>
          </Link>
        ))}
      </div>

      {/* Top tasks quick view */}
      {stats && stats.topTasks.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Top priorities</h2>
            <Link href="/app/s/tasks" className="text-xs text-yellow-600 hover:underline">View matrix →</Link>
          </div>
          <ul className="space-y-1.5">
            {stats.topTasks.slice(0, 3).map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-sm text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 flex-shrink-0" />
                {t.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
