-- Mission Control Schema Migration
-- Run once against your crm.db
-- sqlite3 ~/golden-claw/mission-control/crm.db < db-migration.sql

PRAGMA foreign_keys = ON;

-- Extend tasks (SQLite does not support IF NOT EXISTS for ALTER TABLE ADD COLUMN)
-- Run these one at a time if column already exists:
ALTER TABLE tasks ADD COLUMN quadrant TEXT DEFAULT NULL;
ALTER TABLE tasks ADD COLUMN goal_id INTEGER DEFAULT NULL;
ALTER TABLE tasks ADD COLUMN revenue_score INTEGER DEFAULT 3;
ALTER TABLE tasks ADD COLUMN cost_tokens INTEGER DEFAULT NULL;

-- Extend agents
ALTER TABLE agents ADD COLUMN instructions TEXT DEFAULT NULL;
ALTER TABLE agents ADD COLUMN capabilities TEXT DEFAULT NULL;
ALTER TABLE agents ADD COLUMN skill_ids TEXT DEFAULT NULL;

-- Goals
CREATE TABLE IF NOT EXISTS mc_goals (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  title          TEXT    NOT NULL,
  type           TEXT    NOT NULL DEFAULT 'outcome',   -- outcome|habit|project|metric
  timeframe      TEXT,
  parent_goal_id INTEGER REFERENCES mc_goals(id),
  project_id     INTEGER,
  status         TEXT    NOT NULL DEFAULT 'active',    -- active|completed|paused|cancelled
  notes          TEXT,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  deleted_at     TEXT    DEFAULT NULL
);

-- Goal milestones
CREATE TABLE IF NOT EXISTS mc_goal_milestones (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_id    INTEGER NOT NULL REFERENCES mc_goals(id) ON DELETE CASCADE,
  title      TEXT    NOT NULL,
  done       INTEGER NOT NULL DEFAULT 0,
  due_date   TEXT,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Brain dump
CREATE TABLE IF NOT EXISTS mc_brain_dump (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  content      TEXT    NOT NULL,
  captured_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  processed    INTEGER NOT NULL DEFAULT 0,
  converted_to TEXT    DEFAULT NULL,   -- 'task'|'goal'|'archived'
  tags         TEXT    DEFAULT NULL    -- JSON array string
);

-- Inbox (agent reports, questions, approvals)
CREATE TABLE IF NOT EXISTS mc_inbox (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  from_agent TEXT    NOT NULL DEFAULT 'system',
  to_agent   TEXT    NOT NULL DEFAULT 'me',
  type       TEXT    NOT NULL DEFAULT 'report',   -- report|question|approval
  task_id    INTEGER DEFAULT NULL,
  subject    TEXT    NOT NULL,
  body       TEXT,
  status     TEXT    NOT NULL DEFAULT 'unread',   -- unread|read|actioned
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  read_at    TEXT    DEFAULT NULL
);

-- Skills library
CREATE TABLE IF NOT EXISTS mc_skills_library (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL UNIQUE,
  description TEXT,
  content     TEXT,
  tags        TEXT    DEFAULT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_quadrant       ON tasks(quadrant);
CREATE INDEX IF NOT EXISTS idx_tasks_revenue_score  ON tasks(revenue_score DESC);
CREATE INDEX IF NOT EXISTS idx_mc_brain_dump_proc   ON mc_brain_dump(processed);
CREATE INDEX IF NOT EXISTS idx_mc_inbox_status      ON mc_inbox(status);
CREATE INDEX IF NOT EXISTS idx_mc_goals_status      ON mc_goals(status);
