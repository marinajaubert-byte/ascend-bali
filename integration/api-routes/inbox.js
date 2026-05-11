/**
 * API route: /api/inbox
 * Copy to: ~/golden-claw/mission-control/src/app/api/inbox/route.ts
 *
 * GET  /api/inbox              list messages (filter: status, type, limit)
 * POST /api/inbox              create message (from agents or system)
 * PUT  /api/inbox/:id          mark read / actioned
 * DELETE /api/inbox/:id        delete message
 */

import Database from 'better-sqlite3';
import path from 'path';

function getDb() {
  return new Database(path.join(process.cwd(), 'crm.db'));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const type   = searchParams.get('type');
  const limit  = parseInt(searchParams.get('limit')  || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  const db = getDb();
  try {
    const conditions = [];
    const params = [];
    if (status) { conditions.push('status = ?'); params.push(status); }
    if (type)   { conditions.push('type = ?');   params.push(type);   }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const messages = db.prepare(`
      SELECT * FROM mc_inbox ${where}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params);

    const total = db.prepare(`SELECT COUNT(*) as n FROM mc_inbox ${where}`).get(...params.slice(0, -2))?.n || 0;
    const unread = db.prepare("SELECT COUNT(*) as n FROM mc_inbox WHERE status = 'unread'").get()?.n || 0;

    return Response.json({ messages, total, unread, limit, offset });
  } finally {
    db.close();
  }
}

export async function POST(request) {
  const body = await request.json();
  const { from_agent = 'system', to_agent = 'me', type = 'report', task_id, subject, body: msgBody } = body;
  if (!subject?.trim()) return Response.json({ error: 'subject is required' }, { status: 400 });

  const db = getDb();
  try {
    const result = db.prepare(`
      INSERT INTO mc_inbox (from_agent, to_agent, type, task_id, subject, body, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'unread', ?)
    `).run(from_agent, to_agent, type, task_id || null, subject.trim(), msgBody || null, new Date().toISOString());

    const msg = db.prepare('SELECT * FROM mc_inbox WHERE id = ?').get(result.lastInsertRowid);
    return Response.json(msg, { status: 201 });
  } finally {
    db.close();
  }
}

export async function PUT(request, { params }) {
  const { id } = params;
  const body = await request.json();
  const db = getDb();
  try {
    const allowed = ['status', 'read_at'];
    const sets = [];
    const vals = [];
    for (const key of allowed) {
      if (key in body) { sets.push(`${key} = ?`); vals.push(body[key]); }
    }
    if (body.status === 'read' && !body.read_at) {
      sets.push('read_at = ?');
      vals.push(new Date().toISOString());
    }
    if (sets.length === 0) return Response.json({ error: 'No fields to update' }, { status: 400 });
    vals.push(id);
    db.prepare(`UPDATE mc_inbox SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
    const msg = db.prepare('SELECT * FROM mc_inbox WHERE id = ?').get(id);
    if (!msg) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(msg);
  } finally {
    db.close();
  }
}

export async function DELETE(request, { params }) {
  const db = getDb();
  try {
    db.prepare('DELETE FROM mc_inbox WHERE id = ?').run(params.id);
    return Response.json({ ok: true });
  } finally {
    db.close();
  }
}
