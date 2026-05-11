/**
 * Collection route: GET /api/goals  POST /api/goals
 * Copy to: src/app/api/goals/route.ts
 */
import Database from 'better-sqlite3';
import path from 'path';

function getDb() {
  return new Database(path.join(process.cwd(), 'crm.db'));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status   = searchParams.get('status');
  const type     = searchParams.get('type');
  const limit    = parseInt(searchParams.get('limit')  || '50');
  const offset   = parseInt(searchParams.get('offset') || '0');

  const db = getDb();
  try {
    const conditions: string[] = ['g.deleted_at IS NULL'];
    const params: unknown[]    = [];
    if (status) { conditions.push('g.status = ?'); params.push(status); }
    if (type)   { conditions.push('g.type = ?');   params.push(type);   }

    const goals = db.prepare(`
      SELECT g.*,
        (SELECT COUNT(*) FROM mc_goal_milestones m WHERE m.goal_id = g.id AND m.done = 1) AS milestones_done,
        (SELECT COUNT(*) FROM mc_goal_milestones m WHERE m.goal_id = g.id)                AS milestones_total
      FROM mc_goals g
      WHERE ${conditions.join(' AND ')}
      ORDER BY g.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const { n: total } = (db.prepare(
      `SELECT COUNT(*) AS n FROM mc_goals g WHERE ${conditions.join(' AND ')}`
    ).get(...params) as { n: number });

    return Response.json({ goals, total, limit, offset });
  } finally {
    db.close();
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { title, type = 'outcome', timeframe, parent_goal_id, project_id, status = 'active', notes } = body;
  if (!title?.trim()) return Response.json({ error: 'title is required' }, { status: 400 });

  const db = getDb();
  try {
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO mc_goals (title, type, timeframe, parent_goal_id, project_id, status, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title.trim(), type, timeframe || null, parent_goal_id || null, project_id || null, status, notes || null, now, now);
    const goal = db.prepare('SELECT * FROM mc_goals WHERE id = ?').get(result.lastInsertRowid);
    return Response.json(goal, { status: 201 });
  } finally {
    db.close();
  }
}
