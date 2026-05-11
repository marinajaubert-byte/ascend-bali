#!/usr/bin/env node
/**
 * mc — Mission Control terminal remote control
 * Connects to the Mission Control API (default: http://localhost:3002)
 *
 * Usage:
 *   node mc.js <command> [subcommand] [options]
 *   MC_HOST=http://192.168.0.108:3002 node mc.js today
 *
 * Commands:
 *   today                   Daily focus: top tasks, brain dump, inbox summary
 *   tasks [list]            List tasks (Eisenhower matrix view)
 *   tasks add               Add a new task
 *   tasks done <id>         Mark task complete
 *   tasks matrix            Show tasks grouped by quadrant
 *   brain [list]            List brain dump entries
 *   brain add "<text>"      Capture a quick brain dump entry
 *   brain triage <id>       Convert entry to task or goal
 *   goals [list]            List goals
 *   goals add               Add a new goal
 *   inbox [list]            List inbox messages
 *   inbox read <id>         Mark message as read
 *   agents [list]           List agents and their status
 *   db migrate              Run database migration (add mc_* tables + columns)
 */

import { createInterface } from 'readline';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

const HOST = process.env.MC_HOST || 'http://localhost:3002';
const API = `${HOST}/api`;

// ─── Colour helpers ──────────────────────────────────────────────────────────

const c = {
  reset: '\x1b[0m',
  bold:  '\x1b[1m',
  dim:   '\x1b[2m',
  gold:  '\x1b[33m',
  green: '\x1b[32m',
  red:   '\x1b[31m',
  blue:  '\x1b[34m',
  cyan:  '\x1b[36m',
  gray:  '\x1b[90m',
  white: '\x1b[97m',
};

const b  = (s) => `${c.bold}${s}${c.reset}`;
const gold  = (s) => `${c.gold}${s}${c.reset}`;
const green = (s) => `${c.green}${s}${c.reset}`;
const red   = (s) => `${c.red}${s}${c.reset}`;
const dim   = (s) => `${c.dim}${s}${c.reset}`;
const cyan  = (s) => `${c.cyan}${s}${c.reset}`;

// ─── HTTP helpers ────────────────────────────────────────────────────────────

async function api(path, options = {}) {
  const { default: fetch } = await import('node-fetch');
  const url = `${API}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json().catch(() => null);
}

const GET  = (path) => api(path);
const POST = (path, body) => api(path, { method: 'POST', body: JSON.stringify(body) });
const PUT  = (path, body) => api(path, { method: 'PUT',  body: JSON.stringify(body) });

// ─── Input helper ────────────────────────────────────────────────────────────

function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => { rl.close(); resolve(answer.trim()); });
  });
}

// ─── Display helpers ─────────────────────────────────────────────────────────

function header(title) {
  const line = '─'.repeat(52);
  console.log(`\n${gold(line)}`);
  console.log(`  ${b(gold('✦ ' + title))}`);
  console.log(`${gold(line)}\n`);
}

function taskRow(t, idx) {
  const num    = dim(`${String(idx + 1).padStart(2)}.`);
  const id     = dim(`[${t.id}]`);
  const status = t.status === 'done' ? green('✓') : t.status === 'in_progress' ? cyan('●') : dim('○');
  const rev    = t.revenue_score ? gold('★'.repeat(t.revenue_score)) : '';
  const due    = t.due_date ? dim(` due ${t.due_date}`) : '';
  console.log(`  ${num} ${status} ${t.title}${rev ? '  ' + rev : ''}${due}  ${id}`);
}

function separator() {
  console.log(dim('  ' + '·'.repeat(50)));
}

// ─── QUADRANT display ────────────────────────────────────────────────────────

const QUADRANT_LABELS = {
  'do-now':    { label: 'DO NOW',    emoji: '🔥', color: c.red   },
  'schedule':  { label: 'SCHEDULE',  emoji: '📅', color: c.blue  },
  'delegate':  { label: 'DELEGATE',  emoji: '🤝', color: c.cyan  },
  'eliminate': { label: 'ELIMINATE', emoji: '✗',  color: c.gray  },
  'none':      { label: 'UNASSIGNED',emoji: '?',  color: c.gray  },
};

function quadrantHeader(q) {
  const info = QUADRANT_LABELS[q] || QUADRANT_LABELS.none;
  console.log(`\n  ${info.color}${c.bold}${info.emoji}  ${info.label}${c.reset}`);
  console.log(dim('  ' + '─'.repeat(40)));
}

// ─── COMMANDS ────────────────────────────────────────────────────────────────

// today -----------------------------------------------------------------------

async function cmdToday() {
  header('TODAY — Mission Control');

  // Tasks: top priorities
  let tasks = [];
  try {
    const data = await GET('/tasks?status=pending,in_progress&limit=20');
    tasks = Array.isArray(data) ? data : (data?.tasks || data?.data || []);
  } catch (e) {
    console.log(red('  tasks API unavailable: ') + dim(e.message));
  }

  // Sort by revenue_score desc, then do-now quadrant first
  const quadrantOrder = { 'do-now': 0, 'schedule': 1, 'delegate': 2, 'eliminate': 3 };
  const top = [...tasks]
    .sort((a, b) => {
      const qa = quadrantOrder[a.quadrant] ?? 4;
      const qb = quadrantOrder[b.quadrant] ?? 4;
      if (qa !== qb) return qa - qb;
      return (b.revenue_score || 0) - (a.revenue_score || 0);
    })
    .slice(0, 5);

  console.log(b('  Top priorities'));
  if (top.length === 0) {
    console.log(dim('  No pending tasks.'));
  } else {
    top.forEach((t, i) => taskRow(t, i));
  }

  // Brain dump count
  let brainCount = 0;
  try {
    const bd = await GET('/brain-dump?processed=false&limit=1');
    brainCount = bd?.total ?? (Array.isArray(bd) ? bd.length : 0);
  } catch {}

  // Inbox count
  let inboxCount = 0;
  try {
    const ib = await GET('/inbox?status=unread&limit=1');
    inboxCount = ib?.total ?? (Array.isArray(ib) ? ib.length : 0);
  } catch {}

  console.log('');
  separator();
  console.log(`\n  ${gold('⚡')} ${b('Quick stats')}`);
  console.log(`     Brain dump (unprocessed): ${brainCount > 0 ? red(brainCount) : dim('0')}`);
  console.log(`     Inbox (unread):            ${inboxCount > 0 ? red(inboxCount) : dim('0')}`);

  // Quick capture
  console.log('');
  separator();
  const capture = await prompt(`\n  ${gold('+')} Quick brain dump (Enter to skip): `);
  if (capture) {
    await cmdBrainAdd(capture);
  }

  console.log('');
}

// tasks -----------------------------------------------------------------------

async function cmdTasksList(filter = {}) {
  header('Tasks');
  let tasks = [];
  try {
    const qs = new URLSearchParams({ limit: '50', ...filter }).toString();
    const data = await GET(`/tasks?${qs}`);
    tasks = Array.isArray(data) ? data : (data?.tasks || data?.data || []);
  } catch (e) {
    console.log(red('  Error: ') + e.message);
    console.log(dim('  Make sure Mission Control is running: npm start (in ~/golden-claw/mission-control)'));
    return;
  }

  if (tasks.length === 0) {
    console.log(dim('  No tasks found.'));
    return;
  }

  tasks.forEach((t, i) => taskRow(t, i));
  console.log('');
  console.log(dim(`  ${tasks.length} task(s) shown`));
  console.log('');
}

async function cmdTasksMatrix() {
  header('Eisenhower Matrix');
  let tasks = [];
  try {
    const data = await GET('/tasks?status=pending,in_progress&limit=100');
    tasks = Array.isArray(data) ? data : (data?.tasks || data?.data || []);
  } catch (e) {
    console.log(red('  Error: ') + e.message);
    return;
  }

  const quadrants = ['do-now', 'schedule', 'delegate', 'eliminate', 'none'];
  const grouped = {};
  quadrants.forEach((q) => { grouped[q] = []; });
  tasks.forEach((t) => {
    const q = t.quadrant || 'none';
    (grouped[q] || (grouped['none'] = grouped['none'] || [])).push(t);
    if (!grouped[q]) grouped['none'].push(t);
  });

  quadrants.forEach((q) => {
    if (grouped[q] && grouped[q].length > 0) {
      quadrantHeader(q);
      grouped[q].forEach((t, i) => taskRow(t, i));
    }
  });
  console.log('');
}

async function cmdTasksAdd() {
  header('Add Task');
  const title     = await prompt('  Title: ');
  if (!title) { console.log(red('  Cancelled.')); return; }

  console.log('\n  Quadrant:');
  console.log('    1. 🔥 Do Now    (important + urgent)');
  console.log('    2. 📅 Schedule  (important, not urgent)');
  console.log('    3. 🤝 Delegate  (urgent, not important)');
  console.log('    4. ✗  Eliminate (neither)');
  const qChoice   = await prompt('  Choice [1-4]: ');
  const quadrantMap = { '1': 'do-now', '2': 'schedule', '3': 'delegate', '4': 'eliminate' };
  const quadrant  = quadrantMap[qChoice] || 'schedule';

  const revStr    = await prompt('  Revenue score [1-5, Enter=3]: ');
  const revenue_score = parseInt(revStr) || 3;

  const due_date  = await prompt('  Due date [YYYY-MM-DD, Enter=none]: ');
  const notes     = await prompt('  Notes (optional): ');

  const body = {
    title,
    quadrant,
    revenue_score,
    status: 'pending',
    ...(due_date  ? { due_date  } : {}),
    ...(notes     ? { notes     } : {}),
  };

  try {
    const result = await POST('/tasks', body);
    const id = result?.id || result?.task?.id || '?';
    console.log(green(`\n  ✓ Task created [${id}]: ${title}`));
  } catch (e) {
    console.log(red('\n  Error: ') + e.message);
  }
  console.log('');
}

async function cmdTasksDone(id) {
  if (!id) { console.log(red('Usage: mc tasks done <id>')); return; }
  try {
    await PUT(`/tasks/${id}`, { status: 'done', completed_at: new Date().toISOString() });
    console.log(green(`✓ Task ${id} marked done.`));
  } catch (e) {
    console.log(red('Error: ') + e.message);
  }
}

// brain dump ------------------------------------------------------------------

async function cmdBrainList() {
  header('Brain Dump');
  let entries = [];
  try {
    const data = await GET('/brain-dump?limit=30');
    entries = Array.isArray(data) ? data : (data?.entries || data?.data || []);
  } catch (e) {
    console.log(red('  Error: ') + e.message);
    return;
  }

  if (entries.length === 0) {
    console.log(dim('  Empty. Add ideas with: mc brain add "your idea"'));
    return;
  }

  entries.forEach((e, i) => {
    const num   = dim(`${String(i + 1).padStart(2)}.`);
    const proc  = e.processed ? green('✓') : dim('○');
    const when  = e.captured_at || e.capturedAt || '';
    const date  = when ? dim(` ${when.slice(0, 10)}`) : '';
    console.log(`  ${num} ${proc} ${e.content}${date}  ${dim('[' + e.id + ']')}`);
  });
  console.log('');
}

async function cmdBrainAdd(content) {
  const text = content || await prompt('  Idea: ');
  if (!text) { console.log(red('  Cancelled.')); return; }
  try {
    const result = await POST('/brain-dump', {
      content: text,
      captured_at: new Date().toISOString(),
      processed: false,
    });
    const id = result?.id || '?';
    console.log(green(`  ✓ Captured [${id}]`));
  } catch (e) {
    console.log(red('  Error: ') + e.message);
  }
}

async function cmdBrainTriage(id) {
  if (!id) { console.log(red('Usage: mc brain triage <id>')); return; }
  header('Triage Entry');
  let entry;
  try {
    entry = await GET(`/brain-dump/${id}`);
  } catch (e) {
    console.log(red('  Entry not found: ') + e.message); return;
  }

  console.log(`  Content: ${b(entry.content)}\n`);
  console.log('  Convert to:');
  console.log('    1. Task');
  console.log('    2. Goal');
  console.log('    3. Archive (mark processed)');
  const choice = await prompt('  Choice [1-3]: ');

  if (choice === '1') {
    const title = await prompt(`  Task title [${entry.content}]: `) || entry.content;
    await POST('/tasks', { title, status: 'pending', notes: `From brain dump: ${entry.content}` });
    await PUT(`/brain-dump/${id}`, { processed: true, converted_to: 'task' });
    console.log(green('  ✓ Converted to task.'));
  } else if (choice === '2') {
    const title = await prompt(`  Goal title [${entry.content}]: `) || entry.content;
    await POST('/goals', { title, status: 'active', type: 'outcome', timeframe: '12-months' });
    await PUT(`/brain-dump/${id}`, { processed: true, converted_to: 'goal' });
    console.log(green('  ✓ Converted to goal.'));
  } else {
    await PUT(`/brain-dump/${id}`, { processed: true });
    console.log(green('  ✓ Archived.'));
  }
}

// goals -----------------------------------------------------------------------

async function cmdGoalsList() {
  header('Goals');
  let goals = [];
  try {
    const data = await GET('/goals?limit=50');
    goals = Array.isArray(data) ? data : (data?.goals || data?.data || []);
  } catch (e) {
    console.log(red('  Error: ') + e.message);
    return;
  }

  if (goals.length === 0) {
    console.log(dim('  No goals yet. Add one with: mc goals add'));
    return;
  }

  const statusIcon = { active: cyan('●'), completed: green('✓'), paused: dim('⏸'), cancelled: red('✗') };
  goals.forEach((g, i) => {
    const icon = statusIcon[g.status] || dim('○');
    const tf   = g.timeframe ? dim(` [${g.timeframe}]`) : '';
    console.log(`  ${dim(String(i+1).padStart(2)+'.')} ${icon} ${g.title}${tf}  ${dim('['+g.id+']')}`);
  });
  console.log('');
}

async function cmdGoalsAdd() {
  header('Add Goal');
  const title     = await prompt('  Goal: ');
  if (!title) { console.log(red('  Cancelled.')); return; }

  console.log('\n  Type:');
  console.log('    1. outcome  2. habit  3. project  4. metric');
  const tMap = { '1': 'outcome', '2': 'habit', '3': 'project', '4': 'metric' };
  const type = tMap[await prompt('  Type [1-4]: ')] || 'outcome';

  const timeframe = await prompt('  Timeframe [e.g. Q3-2026, 12-months]: ') || '12-months';

  try {
    const result = await POST('/goals', { title, type, timeframe, status: 'active' });
    console.log(green(`\n  ✓ Goal created [${result?.id || '?'}]: ${title}`));
  } catch (e) {
    console.log(red('\n  Error: ') + e.message);
  }
  console.log('');
}

// inbox -----------------------------------------------------------------------

async function cmdInboxList() {
  header('Inbox');
  let messages = [];
  try {
    const data = await GET('/inbox?limit=20');
    messages = Array.isArray(data) ? data : (data?.messages || data?.data || []);
  } catch (e) {
    console.log(red('  Error: ') + e.message);
    return;
  }

  if (messages.length === 0) {
    console.log(dim('  Inbox is empty.'));
    return;
  }

  const typeColor = { report: c.blue, question: c.gold, approval: c.red };
  messages.forEach((m, i) => {
    const num   = dim(`${String(i+1).padStart(2)}.`);
    const read  = m.status === 'unread' ? b(m.subject) : dim(m.subject);
    const type  = `${typeColor[m.type] || ''}[${m.type || '?'}]${c.reset}`;
    const from  = dim(`from ${m.from || '?'}`);
    console.log(`  ${num} ${type} ${read}  ${from}  ${dim('['+m.id+']')}`);
    if (m.body) console.log(dim(`       ${m.body.slice(0, 80)}${m.body.length > 80 ? '…' : ''}`));
  });
  console.log('');
}

async function cmdInboxRead(id) {
  if (!id) { console.log(red('Usage: mc inbox read <id>')); return; }
  try {
    await PUT(`/inbox/${id}`, { status: 'read', read_at: new Date().toISOString() });
    console.log(green(`✓ Message ${id} marked as read.`));
  } catch (e) {
    console.log(red('Error: ') + e.message);
  }
}

// agents ----------------------------------------------------------------------

async function cmdAgentsList() {
  header('Agents');
  let agents = [];
  try {
    const data = await GET('/agents?limit=20');
    agents = Array.isArray(data) ? data : (data?.agents || data?.data || []);
  } catch (e) {
    console.log(red('  Error: ') + e.message);
    return;
  }

  if (agents.length === 0) {
    console.log(dim('  No agents configured.'));
    return;
  }

  const statusIcon = { active: green('●'), idle: dim('○'), error: red('✗'), running: cyan('▶') };
  agents.forEach((a, i) => {
    const icon   = statusIcon[a.status] || dim('○');
    const task   = a.current_task ? dim(` — ${a.current_task}`) : '';
    console.log(`  ${dim(String(i+1).padStart(2)+'.')} ${icon} ${b(a.name || a.id)}${task}  ${dim('['+a.id+']')}`);
    if (a.description) console.log(dim(`       ${a.description}`));
  });
  console.log('');
}

// db migrate ------------------------------------------------------------------

const MIGRATION_SQL = `
-- Mission Control schema additions
-- Run this once inside Mission Control's SQLite database

-- 1. Extend tasks table (safe to run multiple times via IF NOT EXISTS pattern)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS quadrant TEXT DEFAULT NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS goal_id INTEGER DEFAULT NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS revenue_score INTEGER DEFAULT 3;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS cost_tokens INTEGER DEFAULT NULL;

-- 2. Extend agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS instructions TEXT DEFAULT NULL;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS capabilities TEXT DEFAULT NULL;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS skill_ids TEXT DEFAULT NULL;

-- 3. Goals table
CREATE TABLE IF NOT EXISTS mc_goals (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'outcome',
  timeframe   TEXT,
  parent_goal_id INTEGER REFERENCES mc_goals(id),
  project_id  INTEGER,
  status      TEXT NOT NULL DEFAULT 'active',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at  TEXT DEFAULT NULL
);

-- 4. Goal milestones
CREATE TABLE IF NOT EXISTS mc_goal_milestones (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_id   INTEGER NOT NULL REFERENCES mc_goals(id) ON DELETE CASCADE,
  title     TEXT NOT NULL,
  done      INTEGER NOT NULL DEFAULT 0,
  due_date  TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5. Brain dump
CREATE TABLE IF NOT EXISTS mc_brain_dump (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  content      TEXT NOT NULL,
  captured_at  TEXT NOT NULL DEFAULT (datetime('now')),
  processed    INTEGER NOT NULL DEFAULT 0,
  converted_to TEXT DEFAULT NULL,
  tags         TEXT DEFAULT NULL
);

-- 6. Inbox
CREATE TABLE IF NOT EXISTS mc_inbox (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  from_agent TEXT NOT NULL DEFAULT 'system',
  to_agent   TEXT NOT NULL DEFAULT 'me',
  type       TEXT NOT NULL DEFAULT 'report',
  task_id    INTEGER DEFAULT NULL,
  subject    TEXT NOT NULL,
  body       TEXT,
  status     TEXT NOT NULL DEFAULT 'unread',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  read_at    TEXT DEFAULT NULL
);

-- 7. Skills library
CREATE TABLE IF NOT EXISTS mc_skills_library (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  content     TEXT,
  tags        TEXT DEFAULT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

async function cmdDbMigrate() {
  header('Database Migration');
  console.log('  This migration adds Mission Control tables to crm.db.\n');
  console.log('  Tables/columns to be added:');
  console.log('    + tasks.quadrant, tasks.goal_id, tasks.revenue_score, tasks.cost_tokens');
  console.log('    + agents.instructions, agents.capabilities, agents.skill_ids');
  console.log('    + mc_goals, mc_goal_milestones, mc_brain_dump, mc_inbox, mc_skills_library\n');

  const confirm = await prompt('  Proceed? (y/N): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log(dim('  Cancelled.'));
    return;
  }

  // Try to find the database
  const dbCandidates = [
    `${process.env.HOME}/golden-claw/mission-control/crm.db`,
    `${process.env.HOME}/golden-claw/mission-control/data/crm.db`,
    './crm.db',
  ];
  const customDb = await prompt('  Path to crm.db (Enter=auto-detect): ');
  const dbPath   = customDb || null;

  if (dbPath || true) {
    const path = dbPath || dbCandidates[0];
    console.log(`\n  Using: ${path}`);

    // Write migration file for user to run manually (sqlite3 CLI)
    const migFile = './mc-migration.sql';
    const { writeFileSync } = await import('fs');
    writeFileSync(migFile, MIGRATION_SQL.trim());
    console.log(green(`\n  ✓ Migration SQL written to: ${migFile}`));
    console.log('\n  Run it with:');
    console.log(cyan(`    sqlite3 "${path}" < ${migFile}`));
    console.log('\n  Or if sqlite3 is on PATH, run now:');
    const runNow = await prompt('  Run migration now? (y/N): ');
    if (runNow.toLowerCase() === 'y') {
      try {
        const { stdout, stderr } = await execAsync(`sqlite3 "${path}" < ${migFile}`);
        if (stderr) console.log(red('  stderr: ') + stderr);
        console.log(green('  ✓ Migration applied.'));
        if (stdout) console.log(stdout);
      } catch (e) {
        console.log(red('  Error: ') + e.message);
        console.log(dim(`  Run manually: sqlite3 "${path}" < ${migFile}`));
      }
    }
  }
  console.log('');
}

// ─── HELP ────────────────────────────────────────────────────────────────────

function showHelp() {
  console.log(`
${gold('✦ mc — Mission Control Terminal')}
${dim('  Connected to: ' + HOST)}

${b('USAGE')}
  mc <command> [subcommand] [args]

${b('COMMANDS')}
  ${gold('today')}                  Daily focus: priorities, inbox, quick capture
  ${gold('tasks')}                  List tasks
  ${gold('tasks matrix')}           Eisenhower matrix view
  ${gold('tasks add')}              Add a new task interactively
  ${gold('tasks done')} <id>        Mark task complete

  ${gold('brain')}                  List brain dump entries
  ${gold('brain add')} "<text>"     Quick capture idea
  ${gold('brain triage')} <id>      Convert entry to task or goal

  ${gold('goals')}                  List goals
  ${gold('goals add')}              Add a new goal

  ${gold('inbox')}                  List inbox messages
  ${gold('inbox read')} <id>        Mark message as read

  ${gold('agents')}                 List agents and their status

  ${gold('db migrate')}             Add Mission Control tables to crm.db

${b('ENVIRONMENT')}
  MC_HOST    API base URL  (default: http://localhost:3002)
             Example: MC_HOST=http://192.168.0.108:3002 mc today

${b('EXAMPLES')}
  mc today
  mc tasks matrix
  mc brain add "idea for content series"
  mc tasks add
  mc goals add
  mc db migrate
`);
}

// ─── ROUTER ──────────────────────────────────────────────────────────────────

async function main() {
  const [,, cmd, sub, ...rest] = process.argv;

  try {
    switch (cmd) {
      case 'today':
        await cmdToday(); break;

      case 'tasks':
      case 'task':
        if (!sub || sub === 'list') await cmdTasksList();
        else if (sub === 'matrix')  await cmdTasksMatrix();
        else if (sub === 'add')     await cmdTasksAdd();
        else if (sub === 'done')    await cmdTasksDone(rest[0]);
        else { console.log(red('Unknown tasks subcommand: ') + sub); showHelp(); }
        break;

      case 'brain':
      case 'dump':
        if (!sub || sub === 'list') await cmdBrainList();
        else if (sub === 'add')     await cmdBrainAdd(rest.join(' '));
        else if (sub === 'triage')  await cmdBrainTriage(rest[0]);
        else { console.log(red('Unknown brain subcommand: ') + sub); showHelp(); }
        break;

      case 'goals':
      case 'goal':
        if (!sub || sub === 'list') await cmdGoalsList();
        else if (sub === 'add')     await cmdGoalsAdd();
        else { console.log(red('Unknown goals subcommand: ') + sub); showHelp(); }
        break;

      case 'inbox':
        if (!sub || sub === 'list') await cmdInboxList();
        else if (sub === 'read')    await cmdInboxRead(rest[0]);
        else { console.log(red('Unknown inbox subcommand: ') + sub); showHelp(); }
        break;

      case 'agents':
      case 'agent':
        if (!sub || sub === 'list') await cmdAgentsList();
        else { console.log(red('Unknown agents subcommand: ') + sub); showHelp(); }
        break;

      case 'db':
        if (sub === 'migrate') await cmdDbMigrate();
        else { console.log(red('Unknown db subcommand: ') + sub); showHelp(); }
        break;

      case 'help':
      case '--help':
      case '-h':
      case undefined:
        showHelp(); break;

      default:
        console.log(red('Unknown command: ') + cmd);
        showHelp();
    }
  } catch (err) {
    console.error(red('\n  Unexpected error: ') + err.message);
    if (process.env.DEBUG) console.error(err.stack);
    process.exit(1);
  }
}

main();
