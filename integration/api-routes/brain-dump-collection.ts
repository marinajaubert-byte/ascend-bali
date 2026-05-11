/**
 * Collection route: GET /api/brain-dump  POST /api/brain-dump
 * Copy to: src/app/api/brain-dump/route.ts
 */
import Database from 'better-sqlite3';
import path from 'path';

function getDb() {
  return new Database(path.join(process.cwd(), 'crm.db'));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const processed = searchParams.get('processed');
  const limit     = parseInt(searchParams.get('limit')  || '30');
  const offset    = parseInt(searchParams.get('offset') || '0');

  const db = getDb();
  try {
    const conditions: string[] = [];
    const params: unknown[]    = [];
    if (processed !== null) {
      conditions.push('processed = ?');
      params.push(processed === 'true' || processed === '1' ? 1 : 0);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const entries = db.prepare(
      `SELECT * FROM mc_brain_dump ${where} ORDER BY captured_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);

    const { n: total } = (db.prepare(
      `SELECT COUNT(*) AS n FROM mc_brain_dump ${where}`
    ).get(...params) as { n: number });

    return Response.json({ entries, total, limit, offset });
  } finally {
    db.close();
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { content, tags } = body;
  if (!content?.trim()) return Response.json({ error: 'content is required' }, { status: 400 });

  const db = getDb();
  try {
    const result = db.prepare(
      `INSERT INTO mc_brain_dump (content, captured_at, processed, tags) VALUES (?, ?, 0, ?)`
    ).run(content.trim(), new Date().toISOString(), tags ? JSON.stringify(tags) : null);
    const entry = db.prepare('SELECT * FROM mc_brain_dump WHERE id = ?').get(result.lastInsertRowid);
    return Response.json(entry, { status: 201 });
  } finally {
    db.close();
  }
}
