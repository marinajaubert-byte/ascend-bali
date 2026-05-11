/**
 * Collection route: GET /api/inbox  POST /api/inbox
 * Copy to: src/app/api/inbox/route.ts
 */
import Database from 'better-sqlite3';
import path from 'path';

function getDb() {
  return new Database(path.join(process.cwd(), 'crm.db'));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const type   = searchParams.get('type');
  const limit  = parseInt(searchParams.get('limit')  || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  const db = getDb();
  try {
    const conditions: string[] = [];
    const params: unknown[]    = [];
    if (status) { conditions.push('status = ?'); params.push(status); }
    if (type)   { conditions.push('type = ?');   params.push(type);   }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const messages = db.prepare(
      `SELECT * FROM mc_inbox ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);

    const { n: total }  = (db.prepare(`SELECT COUNT(*) AS n FROM mc_inbox ${where}`).get(...params) as { n: number });
    const { n: unread } = (db.prepare("SELECT COUNT(*) AS n FROM mc_inbox WHERE status = 'unread'").get() as { n: number });

    return Response.json({ messages, total, unread, limit, offset });
  } finally {
    db.close();
  }
}

export async function POST(request: Request) {
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
