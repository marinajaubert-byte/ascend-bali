/**
 * API route: /api/goals
 * Copy to: ~/golden-claw/mission-control/src/app/api/goals/route.ts
 * (Convert to TypeScript as needed — types shown in comments)
 *
 * GET  /api/goals              list goals (filter: status, type, limit, offset)
 * GET  /api/goals/:id          single goal
 * POST /api/goals              create goal
 * PUT  /api/goals/:id          update goal
 * DELETE /api/goals/:id        soft delete
 */

import Database from 'better-sqlite3';
import path from 'path';

function getDb() {
  const dbPath = path.join(process.cwd(), 'crm.db');
  return new Database(dbPath);
}

// ─── GET /api/goals ──────────────────────────────────────────────────────────
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status   = searchParams.get('status');
  const type     = searchParams.get('type');
  const limit    = parseInt(searchParams.get('limit')  || '50');
  const offset   = parseInt(searchParams.get('offset') || '0');
  const id       = searchParams.get('id');

  const db = getDb();
  try {
    if (id) {
      const goal = db.prepare(`
        SELECT g.*, json_group_array(json_object(
          'id', m.id, 'title', m.title, 'done', m.done, 'due_date', m.due_date
        )) as milestones
        FROM mc_goals g
        LEFT JOIN mc_goal_milestones m ON m.goal_id = g.id
        WHERE g.id = ? AND g.deleted_at IS NULL
        GROUP BY g.id
      `).get(id);
      if (!goal) return Response.json({ error: 'Not found' }, { status: 404 });
      goal.milestones = JSON.parse(goal.milestones || '[]').filter(m => m.id !== null);
      return Response.json(goal);
    }

    const conditions = ['g.deleted_at IS NULL'];
    const params = [];
    if (status) { conditions.push('g.status = ?'); params.push(status); }
    if (type)   { conditions.push('g.type = ?');   params.push(type);   }
    params.push(limit, offset);

    const goals = db.prepare(`
      SELECT g.*, (
        SELECT COUNT(*) FROM mc_goal_milestones m WHERE m.goal_id = g.id AND m.done = 1
      ) as milestones_done,
      (SELECT COUNT(*) FROM mc_goal_milestones m WHERE m.goal_id = g.id) as milestones_total
      FROM mc_goals g
      WHERE ${conditions.join(' AND ')}
      ORDER BY g.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params);

    const total = db.prepare(`SELECT COUNT(*) as n FROM mc_goals g WHERE ${conditions.slice(0,-0).join(' AND ')} AND g.deleted_at IS NULL`).get(...params.slice(0, -2))?.n || 0;

    return Response.json({ goals, total, limit, offset });
  } finally {
    db.close();
  }
}

// ─── POST /api/goals ─────────────────────────────────────────────────────────
export async function POST(request) {
  const body = await request.json();
  const { title, type = 'outcome', timeframe, parent_goal_id, project_id, status = 'active', notes } = body;

  if (!title?.trim()) {
    return Response.json({ error: 'title is required' }, { status: 400 });
  }

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

// ─── PUT /api/goals/:id ──────────────────────────────────────────────────────
export async function PUT(request, { params }) {
  const { id } = params;
  const body = await request.json();

  const db = getDb();
  try {
    const allowed = ['title', 'type', 'timeframe', 'status', 'notes', 'project_id'];
    const sets = [];
    const vals = [];
    for (const key of allowed) {
      if (key in body) { sets.push(`${key} = ?`); vals.push(body[key]); }
    }
    if (sets.length === 0) return Response.json({ error: 'No fields to update' }, { status: 400 });
    vals.push(new Date().toISOString(), id);

    db.prepare(`UPDATE mc_goals SET ${sets.join(', ')}, updated_at = ? WHERE id = ? AND deleted_at IS NULL`).run(...vals);
    const goal = db.prepare('SELECT * FROM mc_goals WHERE id = ?').get(id);
    if (!goal) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(goal);
  } finally {
    db.close();
  }
}

// ─── DELETE /api/goals/:id ───────────────────────────────────────────────────
export async function DELETE(request, { params }) {
  const { id } = params;
  const db = getDb();
  try {
    db.prepare("UPDATE mc_goals SET deleted_at = ? WHERE id = ?").run(new Date().toISOString(), id);
    return Response.json({ ok: true });
  } finally {
    db.close();
  }
}
