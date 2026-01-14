import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_DIR = process.env.DB_PATH ? dirname(process.env.DB_PATH) : join(__dirname, '..', 'data');
const DB_FILE = process.env.DB_PATH || join(DB_DIR, 'gymflow.db');

// Ensure data directory exists
if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema if database is new
function initializeDatabase() {
  const tableExists = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='categories'"
  ).get();

  if (!tableExists) {
    console.log('Initializing database schema...');

    // Create tables
    db.exec(`
      CREATE TABLE categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        template_type TEXT NOT NULL CHECK(template_type IN ('strength', 'cardio', 'timed', 'bodyweight')),
        last_used_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      );

      CREATE TABLE logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exercise_id INTEGER NOT NULL,
        metric_1 REAL,
        metric_2 INTEGER,
        metric_3 INTEGER,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_exercises_category ON exercises(category_id);
      CREATE INDEX idx_exercises_last_used ON exercises(last_used_at DESC);
      CREATE INDEX idx_logs_exercise ON logs(exercise_id);
      CREATE INDEX idx_logs_created ON logs(created_at DESC);
    `);

    // Insert seed data
    db.exec(`
      INSERT INTO categories (name, color, sort_order) VALUES
        ('Upper Body', '#3B82F6', 1),
        ('Lower Body', '#10B981', 2),
        ('Cardio', '#F59E0B', 3),
        ('Core', '#EF4444', 4);

      INSERT INTO exercises (category_id, name, template_type) VALUES
        (1, 'Bench Press', 'strength'),
        (1, 'Pull-ups', 'bodyweight'),
        (2, 'Squats', 'strength'),
        (2, 'Deadlift', 'strength'),
        (3, 'Running', 'cardio'),
        (3, 'Cycling', 'cardio'),
        (4, 'Plank', 'timed'),
        (4, 'Crunches', 'bodyweight');
    `);

    console.log('Database initialized with seed data');
  }
}

initializeDatabase();

export default db;
