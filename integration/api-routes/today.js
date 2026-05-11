/**
 * API route: /api/today
 * Copy to: ~/golden-claw/mission-control/src/app/api/today/route.ts
 *
 * GET /api/today  — aggregated daily command center data
 * Returns: top tasks, inbox summary, brain dump count, agents status
 */

import Database from 'better-sqlite3';
import path from 'path';

function getDb() {
  return new Database(path.join(process.cwd(), 'crm.db'));
}

export async function GET() {
  const db = getDb();
  try {
    // Top 5 tasks by quadrant order + revenue score
    const topTasks = db.prepare(`
      SELECT id, title, status, quadrant, revenue_score, due_date
      FROM tasks
      WHERE status IN ('pending', 'in_progress') AND (deleted_at IS NULL OR deleted_at = '')
      ORDER BY
        CASE quadrant
          WHEN 'do-now'    THEN 1
          WHEN 'schedule'  THEN 2
          WHEN 'delegate'  THEN 3
          WHEN 'eliminate' THEN 4
          ELSE 5
        END ASC,
        COALESCE(revenue_score, 3) DESC
      LIMIT 5
    `).all();

    // Brain dump: unprocessed count
    const brainDumpCount = db.prepare(
      "SELECT COUNT(*) as n FROM mc_brain_dump WHERE processed = 0"
    ).get()?.n || 0;

    // Inbox: unread count + latest messages
    const inboxUnread = db.prepare(
      "SELECT COUNT(*) as n FROM mc_inbox WHERE status = 'unread'"
    ).get()?.n || 0;

    const inboxLatest = db.prepare(`
      SELECT id, from_agent, type, subject, created_at
      FROM mc_inbox WHERE status = 'unread'
      ORDER BY created_at DESC LIMIT 3
    `).all();

    // Active goals count
    const goalsActive = db.prepare(
      "SELECT COUNT(*) as n FROM mc_goals WHERE status = 'active' AND deleted_at IS NULL"
    ).get()?.n || 0;

    // Agents (if table exists)
    let agents = [];
    try {
      agents = db.prepare(`
        SELECT id, name, status FROM agents WHERE status != 'archived' LIMIT 10
      `).all();
    } catch {}

    return Response.json({
      topTasks,
      brainDumpUnprocessed: brainDumpCount,
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
