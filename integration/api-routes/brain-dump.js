/**
 * API route: /api/brain-dump
 * Copy to: ~/golden-claw/mission-control/src/app/api/brain-dump/route.ts
 *
 * GET  /api/brain-dump              list entries (filter: processed, limit, offset)
 * GET  /api/brain-dump/:id          single entry
 * POST /api/brain-dump              create entry
 * PUT  /api/brain-dump/:id          update (triage / mark processed)
 * DELETE /api/brain-dump/:id        hard delete
 */

import Database from 'better-sqlite3';
import path from 'path';

function getDb() {
  return new Database(path.join(process.cwd(), 'crm.db'));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id        = searchParams.get('id');
  const processed = searchParams.get('processed');
  const limit     = parseInt(searchParams.get('limit')  || '30');
  const offset    = parseInt(searchParams.get('offset') || '0');

  const db = getDb();
  try {
    if (id) {
      const entry = db.prepare('SELECT * FROM mc_brain_dump WHERE id = ?').get(id);
      if (!entry) return Response.json({ error: 'Not found' }, { status: 404 });
      return Response.json(entry);
    }

    const conditions = [];
    const params = [];
    if (processed !== null && processed !== undefined) {
      conditions.push('processed = ?');
      params.push(processed === 'true' || processed === '1' ? 1 : 0);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const entries = db.prepare(`
      SELECT * FROM mc_brain_dump ${where}
      ORDER BY captured_at DESC
      LIMIT ? OFFSET ?
    `).all(...params);

    const total = db.prepare(`SELECT COUNT(*) as n FROM mc_brain_dump ${where}`).get(...params.slice(0, -2))?.n || 0;
    return Response.json({ entries, total, limit, offset });
  } finally {
    db.close();
  }
}

export async function POST(request) {
  const body = await request.json();
  const { content, tags } = body;
  if (!content?.trim()) return Response.json({ error: 'content is required' }, { status: 400 });

  const db = getDb();
  try {
    const result = db.prepare(`
      INSERT INTO mc_brain_dump (content, captured_at, processed, tags)
      VALUES (?, ?, 0, ?)
    `).run(content.trim(), new Date().toISOString(), tags ? JSON.stringify(tags) : null);

    const entry = db.prepare('SELECT * FROM mc_brain_dump WHERE id = ?').get(result.lastInsertRowid);
    return Response.json(entry, { status: 201 });
  } finally {
    db.close();
  }
}

export async function PUT(request, { params }) {
  const { id } = params;
  const body = await request.json();
  const db = getDb();
  try {
    const allowed = ['processed', 'converted_to', 'tags', 'content'];
    const sets = [];
    const vals = [];
    for (const key of allowed) {
      if (key in body) { sets.push(`${key} = ?`); vals.push(body[key]); }
    }
    if (sets.length === 0) return Response.json({ error: 'No fields to update' }, { status: 400 });
    vals.push(id);
    db.prepare(`UPDATE mc_brain_dump SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
    const entry = db.prepare('SELECT * FROM mc_brain_dump WHERE id = ?').get(id);
    if (!entry) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(entry);
  } finally {
    db.close();
  }
}

export async function DELETE(request, { params }) {
  const { id } = params;
  const db = getDb();
  try {
    db.prepare('DELETE FROM mc_brain_dump WHERE id = ?').run(id);
    return Response.json({ ok: true });
  } finally {
    db.close();
  }
}
