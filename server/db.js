const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'study-room.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      avatar TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      text TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS custom_scenes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      emoji TEXT,
      description TEXT,
      image TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS custom_music (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      artist TEXT,
      category TEXT,
      url TEXT,
      cover_url TEXT,
      duration INTEGER,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      selected_scene TEXT DEFAULT 'cafe',
      selected_music TEXT DEFAULT 'rain',
      volume INTEGER DEFAULT 50,
      external_volume INTEGER DEFAULT 50,
      pomodoro_work INTEGER DEFAULT 25,
      pomodoro_break INTEGER DEFAULT 5,
      theme TEXT DEFAULT 'dark',
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS study_stats (
      user_id TEXT PRIMARY KEY,
      total_sessions INTEGER DEFAULT 0,
      total_minutes INTEGER DEFAULT 0,
      current_streak INTEGER DEFAULT 0,
      best_streak INTEGER DEFAULT 0,
      last_study_date TEXT,
      today_study_seconds INTEGER DEFAULT 0,
      today_pomodoro_count INTEGER DEFAULT 0,
      streak_days INTEGER DEFAULT 0,
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS favorite_scenes (
      user_id TEXT NOT NULL,
      scene_id TEXT NOT NULL,
      PRIMARY KEY (user_id, scene_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS favorite_music (
      user_id TEXT NOT NULL,
      music_id TEXT NOT NULL,
      PRIMARY KEY (user_id, music_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS study_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      duration INTEGER NOT NULL,
      type TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}

init();

const stmts = {
  getUser: db.prepare('SELECT * FROM users WHERE id = ?'),
  upsertUser: db.prepare(`INSERT INTO users (id, username, avatar, created_at) VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET username=excluded.username, avatar=excluded.avatar`),

  getTodos: db.prepare('SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC'),
  insertTodo: db.prepare('INSERT INTO todos (id, user_id, text, completed, created_at) VALUES (?, ?, ?, ?, ?)'),
  updateTodo: db.prepare('UPDATE todos SET text = ?, completed = ? WHERE id = ? AND user_id = ?'),
  deleteTodo: db.prepare('DELETE FROM todos WHERE id = ? AND user_id = ?'),
  clearTodos: db.prepare('DELETE FROM todos WHERE user_id = ?'),

  getCustomScenes: db.prepare('SELECT * FROM custom_scenes WHERE user_id = ? ORDER BY created_at DESC'),
  insertCustomScene: db.prepare('INSERT INTO custom_scenes (id, user_id, name, emoji, description, image, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'),
  deleteCustomScene: db.prepare('DELETE FROM custom_scenes WHERE id = ? AND user_id = ?'),

  getCustomMusic: db.prepare('SELECT * FROM custom_music WHERE user_id = ? ORDER BY created_at DESC'),
  insertCustomMusic: db.prepare('INSERT INTO custom_music (id, user_id, name, artist, category, url, cover_url, duration, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'),
  deleteCustomMusic: db.prepare('DELETE FROM custom_music WHERE id = ? AND user_id = ?'),

  getSettings: db.prepare('SELECT * FROM user_settings WHERE user_id = ?'),
  upsertSettings: db.prepare(`INSERT INTO user_settings (user_id, selected_scene, selected_music, volume, external_volume, pomodoro_work, pomodoro_break, theme, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET selected_scene=excluded.selected_scene, selected_music=excluded.selected_music,
    volume=excluded.volume, external_volume=excluded.external_volume, pomodoro_work=excluded.pomodoro_work,
    pomodoro_break=excluded.pomodoro_break, theme=excluded.theme, updated_at=excluded.updated_at`),

  getStats: db.prepare('SELECT * FROM study_stats WHERE user_id = ?'),
  upsertStats: db.prepare(`INSERT INTO study_stats (user_id, total_sessions, total_minutes, current_streak, best_streak, last_study_date, today_study_seconds, today_pomodoro_count, streak_days, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET total_sessions=excluded.total_sessions, total_minutes=excluded.total_minutes,
    current_streak=excluded.current_streak, best_streak=excluded.best_streak, last_study_date=excluded.last_study_date,
    today_study_seconds=excluded.today_study_seconds, today_pomodoro_count=excluded.today_pomodoro_count,
    streak_days=excluded.streak_days, updated_at=excluded.updated_at`),

  getFavoriteScenes: db.prepare('SELECT scene_id FROM favorite_scenes WHERE user_id = ?'),
  addFavoriteScene: db.prepare('INSERT OR IGNORE INTO favorite_scenes (user_id, scene_id) VALUES (?, ?)'),
  removeFavoriteScene: db.prepare('DELETE FROM favorite_scenes WHERE user_id = ? AND scene_id = ?'),

  getFavoriteMusic: db.prepare('SELECT music_id FROM favorite_music WHERE user_id = ?'),
  addFavoriteMusic: db.prepare('INSERT OR IGNORE INTO favorite_music (user_id, music_id) VALUES (?, ?)'),
  removeFavoriteMusic: db.prepare('DELETE FROM favorite_music WHERE user_id = ? AND music_id = ?'),

  getHistory: db.prepare('SELECT * FROM study_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'),
  insertHistory: db.prepare('INSERT INTO study_history (user_id, date, duration, type) VALUES (?, ?, ?, ?)'),
};

module.exports = { db, stmts };
