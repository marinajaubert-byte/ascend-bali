/**
 * Item route: GET /api/goals/[id]  PUT /api/goals/[id]  DELETE /api/goals/[id]
 * Copy to: src/app/api/goals/[id]/route.ts
 */
import Database from 'better-sqlite3';
import path from 'path';

function getDb() {
  return new Database(path.join(process.cwd(), 'crm.db'));
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  try {
    const goal = db.prepare('SELECT * FROM mc_goals WHERE id = ? AND deleted_at IS NULL').get(params.id);
    if (!goal) return Response.json({ error: 'Not found' }, { status: 404 });
    const milestones = db.prepare('SELECT * FROM mc_goal_milestones WHERE goal_id = ? ORDER BY id').all(params.id);
    return Response.json({ ...goal as object, milestones });
  } finally {
    db.close();
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const db   = getDb();
  try {
    const allowed = ['title', 'type', 'timeframe', 'status', 'notes', 'project_id'] as const;
    const sets: string[]    = [];
    const vals: unknown[]   = [];
    for (const key of allowed) {
      if (key in body) { sets.push(`${key} = ?`); vals.push(body[key]); }
    }
    if (!sets.length) return Response.json({ error: 'No fields to update' }, { status: 400 });
    db.prepare(`UPDATE mc_goals SET ${sets.join(', ')}, updated_at = ? WHERE id = ? AND deleted_at IS NULL`)
      .run(...vals, new Date().toISOString(), params.id);
    const goal = db.prepare('SELECT * FROM mc_goals WHERE id = ?').get(params.id);
    if (!goal) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(goal);
  } finally {
    db.close();
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  try {
    db.prepare("UPDATE mc_goals SET deleted_at = ? WHERE id = ?").run(new Date().toISOString(), params.id);
    return Response.json({ ok: true });
  } finally {
    db.close();
  }
}
