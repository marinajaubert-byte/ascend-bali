/**
 * Item route: GET /api/brain-dump/[id]  PUT /api/brain-dump/[id]  DELETE /api/brain-dump/[id]
 * Copy to: src/app/api/brain-dump/[id]/route.ts
 */
import Database from 'better-sqlite3';
import path from 'path';

function getDb() {
  return new Database(path.join(process.cwd(), 'crm.db'));
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  try {
    const entry = db.prepare('SELECT * FROM mc_brain_dump WHERE id = ?').get(params.id);
    if (!entry) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(entry);
  } finally {
    db.close();
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const db   = getDb();
  try {
    const allowed = ['processed', 'converted_to', 'tags', 'content'] as const;
    const sets: string[]  = [];
    const vals: unknown[] = [];
    for (const key of allowed) {
      if (key in body) { sets.push(`${key} = ?`); vals.push(body[key]); }
    }
    if (!sets.length) return Response.json({ error: 'No fields to update' }, { status: 400 });
    db.prepare(`UPDATE mc_brain_dump SET ${sets.join(', ')} WHERE id = ?`).run(...vals, params.id);
    const entry = db.prepare('SELECT * FROM mc_brain_dump WHERE id = ?').get(params.id);
    if (!entry) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(entry);
  } finally {
    db.close();
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  try {
    db.prepare('DELETE FROM mc_brain_dump WHERE id = ?').run(params.id);
    return Response.json({ ok: true });
  } finally {
    db.close();
  }
}
