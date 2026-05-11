/**
 * Route: GET /api/today
 * Copy to: src/app/api/today/route.ts
 */
import Database from 'better-sqlite3';
import path from 'path';

function getDb() {
  return new Database(path.join(process.cwd(), 'crm.db'));
}

export async function GET() {
  const db = getDb();
  try {
    const topTasks = db.prepare(`
      SELECT id, title, status, quadrant, revenue_score, due_date
      FROM tasks
      WHERE status IN ('pending', 'in_progress')
        AND (deleted_at IS NULL OR deleted_at = '')
      ORDER BY
        CASE quadrant
          WHEN 'do-now'    THEN 1
          WHEN 'schedule'  THEN 2
          WHEN 'delegate'  THEN 3
          WHEN 'eliminate' THEN 4
          ELSE 5
        END,
        COALESCE(revenue_score, 3) DESC
      LIMIT 5
    `).all();

    const { n: brainDumpUnprocessed } = db.prepare(
      "SELECT COUNT(*) AS n FROM mc_brain_dump WHERE processed = 0"
    ).get() as { n: number };

    const { n: inboxUnread } = db.prepare(
      "SELECT COUNT(*) AS n FROM mc_inbox WHERE status = 'unread'"
    ).get() as { n: number };

    const inboxLatest = db.prepare(`
      SELECT id, from_agent, type, subject, created_at
      FROM mc_inbox WHERE status = 'unread'
      ORDER BY created_at DESC LIMIT 3
    `).all();

    const { n: goalsActive } = db.prepare(
      "SELECT COUNT(*) AS n FROM mc_goals WHERE status = 'active' AND deleted_at IS NULL"
    ).get() as { n: number };

    let agents: unknown[] = [];
    try {
      agents = db.prepare("SELECT id, name, status FROM agents WHERE status != 'archived' LIMIT 10").all();
    } catch { /* agents table may not have status column */ }

    return Response.json({
      topTasks,
      brainDumpUnprocessed,
      inboxUnread,
      inboxLatest,
      goalsActive,
      agents,
      generatedAt: new Date().toISOString(),
    });
  } finally {
    db.close();
  }
}
