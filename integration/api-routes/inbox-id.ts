/**
 * Item route: PUT /api/inbox/[id]  DELETE /api/inbox/[id]
 * Copy to: src/app/api/inbox/[id]/route.ts
 */
import Database from 'better-sqlite3';
import path from 'path';

function getDb() {
  return new Database(path.join(process.cwd(), 'crm.db'));
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const db   = getDb();
  try {
    const sets: string[]  = [];
    const vals: unknown[] = [];
    if ('status' in body)  { sets.push('status = ?');  vals.push(body.status);  }
    if ('read_at' in body) { sets.push('read_at = ?'); vals.push(body.read_at); }
    if (body.status === 'read' && !body.read_at) {
      sets.push('read_at = ?'); vals.push(new Date().toISOString());
    }
    if (!sets.length) return Response.json({ error: 'No fields to update' }, { status: 400 });
    db.prepare(`UPDATE mc_inbox SET ${sets.join(', ')} WHERE id = ?`).run(...vals, params.id);
    const msg = db.prepare('SELECT * FROM mc_inbox WHERE id = ?').get(params.id);
    if (!msg) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(msg);
  } finally {
    db.close();
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  try {
    db.prepare('DELETE FROM mc_inbox WHERE id = ?').run(params.id);
    return Response.json({ ok: true });
  } finally {
    db.close();
  }
}
