# GymFlow v2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a minimalist, ultra-fast workout tracker with sub-5-second logging flow, deployed as self-hosted PWA.

**Architecture:** React frontend with Pico.css (semantic HTML), Express backend serving static build + REST API, SQLite database with better-sqlite3 for synchronous queries. Service worker for offline-first PWA capabilities.

**Tech Stack:** React 18, Vite, React Router, Pico.css, Node.js 20, Express, better-sqlite3, Docker

---

## Phase 1: Backend Foundation

### Task 1: Initialize Backend Project

**Files:**
- Create: `backend/package.json`
- Create: `backend/server.js`
- Create: `backend/db.js`

**Step 1: Create backend package.json**

```bash
cd /home/delgaudm/docker/gymflow/.worktrees/feature-v2-implementation
mkdir backend
cd backend
```

Create `backend/package.json`:

```json
{
  "name": "gymflow-backend",
  "version": "2.0.0",
  "type": "module",
  "description": "GymFlow v2 backend API server",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "better-sqlite3": "^9.2.2",
    "cors": "^2.8.5"
  }
}
```

**Step 2: Install dependencies**

Run: `npm install`
Expected: Dependencies installed successfully

**Step 3: Commit**

```bash
git add backend/package.json backend/package-lock.json
git commit -m "feat(backend): initialize backend with Express and SQLite dependencies

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 2: Database Schema and Initialization

**Files:**
- Create: `backend/db.js`

**Step 1: Create database module with schema**

Create `backend/db.js`:

```javascript
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
```

**Step 2: Test database initialization**

Run: `node -e "import('./db.js').then(() => console.log('DB initialized'))"`
Expected: "Initializing database schema..." and "Database initialized with seed data"

**Step 3: Verify database file created**

Run: `ls -lh ../data/gymflow.db`
Expected: Database file exists

**Step 4: Commit**

```bash
git add backend/db.js
git commit -m "feat(backend): add SQLite database with schema and seed data

- Categories, exercises, and logs tables
- Foreign key cascades and performance indexes
- Auto-initialization on first run

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 3: Express Server Setup

**Files:**
- Create: `backend/server.js`

**Step 1: Create Express server with static serving**

Create `backend/server.js`:

```javascript
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes will be added here

// Serve static frontend (in production)
const publicPath = join(__dirname, 'public');
app.use(express.static(publicPath));

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(join(publicPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`GymFlow server running on http://localhost:${PORT}`);
});
```

**Step 2: Test server startup**

Run: `cd backend && npm run dev`
Expected: "GymFlow server running on http://localhost:8080"

**Step 3: Test health endpoint**

Run (in new terminal): `curl http://localhost:8080/health`
Expected: `{"status":"ok","timestamp":"..."}`

**Step 4: Stop server and commit**

```bash
git add backend/server.js
git commit -m "feat(backend): add Express server with health check and static serving

- CORS enabled for development
- Static file serving for production frontend
- Fallback routing for React Router
- Error handling middleware

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 4: Categories API Endpoints

**Files:**
- Create: `backend/routes/categories.js`
- Modify: `backend/server.js`

**Step 1: Create categories route handler**

Create `backend/routes/categories.js`:

```javascript
import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET /api/categories - Get all categories sorted by sort_order
router.get('/', (req, res) => {
  try {
    const categories = db.prepare(
      'SELECT id, name, color, sort_order FROM categories ORDER BY sort_order ASC'
    ).all();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/categories - Create new category
router.post('/', (req, res) => {
  try {
    const { name, color, sort_order = 0 } = req.body;

    if (!name || !color) {
      return res.status(400).json({ error: 'Name and color are required' });
    }

    const result = db.prepare(
      'INSERT INTO categories (name, color, sort_order) VALUES (?, ?, ?)'
    ).run(name, color, sort_order);

    const category = db.prepare(
      'SELECT id, name, color, sort_order FROM categories WHERE id = ?'
    ).get(result.lastInsertRowid);

    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/categories/:id - Update category
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, sort_order } = req.body;

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (color !== undefined) {
      updates.push('color = ?');
      values.push(color);
    }
    if (sort_order !== undefined) {
      updates.push('sort_order = ?');
      values.push(sort_order);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    db.prepare(
      `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`
    ).run(...values);

    const category = db.prepare(
      'SELECT id, name, color, sort_order FROM categories WHERE id = ?'
    ).get(id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/categories/:id - Delete category (cascades to exercises and logs)
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
```

**Step 2: Register categories routes in server.js**

Modify `backend/server.js` - add after "// API routes will be added here":

```javascript
import categoriesRouter from './routes/categories.js';

// API routes
app.use('/api/categories', categoriesRouter);
```

**Step 3: Test categories API**

Run: `cd backend && npm run dev`

Test GET all:
```bash
curl http://localhost:8080/api/categories
```
Expected: JSON array with 4 seeded categories

Test POST:
```bash
curl -X POST http://localhost:8080/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Category","color":"#FF5733","sort_order":5}'
```
Expected: New category returned with id

Test PUT:
```bash
curl -X PUT http://localhost:8080/api/categories/5 \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Category"}'
```
Expected: Updated category returned

Test DELETE:
```bash
curl -X DELETE http://localhost:8080/api/categories/5
```
Expected: `{"success":true}`

**Step 4: Commit**

```bash
git add backend/routes/categories.js backend/server.js
git commit -m "feat(backend): add categories CRUD API endpoints

- GET /api/categories - list all sorted by sort_order
- POST /api/categories - create new category
- PUT /api/categories/:id - update category fields
- DELETE /api/categories/:id - delete with cascade

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 5: Exercises API Endpoints

**Files:**
- Create: `backend/routes/exercises.js`
- Modify: `backend/server.js`

**Step 1: Create exercises route handler**

Create `backend/routes/exercises.js`:

```javascript
import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET /api/exercises?category_id=X - Get exercises for category, sorted by last_used_at DESC NULLS LAST
router.get('/', (req, res) => {
  try {
    const { category_id } = req.query;

    if (!category_id) {
      return res.status(400).json({ error: 'category_id is required' });
    }

    const exercises = db.prepare(`
      SELECT id, name, template_type, category_id, last_used_at
      FROM exercises
      WHERE category_id = ?
      ORDER BY last_used_at DESC NULLS LAST, created_at DESC
    `).all(category_id);

    res.json(exercises);
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

// GET /api/exercises/:id - Get single exercise details
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const exercise = db.prepare(
      'SELECT id, name, template_type, category_id, last_used_at FROM exercises WHERE id = ?'
    ).get(id);

    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    res.json(exercise);
  } catch (error) {
    console.error('Error fetching exercise:', error);
    res.status(500).json({ error: 'Failed to fetch exercise' });
  }
});

// POST /api/exercises - Create new exercise
router.post('/', (req, res) => {
  try {
    const { category_id, name, template_type } = req.body;

    if (!category_id || !name || !template_type) {
      return res.status(400).json({
        error: 'category_id, name, and template_type are required'
      });
    }

    const validTypes = ['strength', 'cardio', 'timed', 'bodyweight'];
    if (!validTypes.includes(template_type)) {
      return res.status(400).json({
        error: `template_type must be one of: ${validTypes.join(', ')}`
      });
    }

    const result = db.prepare(
      'INSERT INTO exercises (category_id, name, template_type) VALUES (?, ?, ?)'
    ).run(category_id, name, template_type);

    const exercise = db.prepare(
      'SELECT id, name, template_type, category_id, last_used_at FROM exercises WHERE id = ?'
    ).get(result.lastInsertRowid);

    res.status(201).json(exercise);
  } catch (error) {
    console.error('Error creating exercise:', error);
    res.status(500).json({ error: 'Failed to create exercise' });
  }
});

// PUT /api/exercises/:id - Update exercise
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, template_type } = req.body;

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (template_type !== undefined) {
      const validTypes = ['strength', 'cardio', 'timed', 'bodyweight'];
      if (!validTypes.includes(template_type)) {
        return res.status(400).json({
          error: `template_type must be one of: ${validTypes.join(', ')}`
        });
      }
      updates.push('template_type = ?');
      values.push(template_type);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    db.prepare(
      `UPDATE exercises SET ${updates.join(', ')} WHERE id = ?`
    ).run(...values);

    const exercise = db.prepare(
      'SELECT id, name, template_type, category_id, last_used_at FROM exercises WHERE id = ?'
    ).get(id);

    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    res.json(exercise);
  } catch (error) {
    console.error('Error updating exercise:', error);
    res.status(500).json({ error: 'Failed to update exercise' });
  }
});

// DELETE /api/exercises/:id - Delete exercise (cascades to logs)
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const result = db.prepare('DELETE FROM exercises WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting exercise:', error);
    res.status(500).json({ error: 'Failed to delete exercise' });
  }
});

export default router;
```

**Step 2: Register exercises routes in server.js**

Modify `backend/server.js` - add after categories import:

```javascript
import exercisesRouter from './routes/exercises.js';

// Update API routes section:
app.use('/api/categories', categoriesRouter);
app.use('/api/exercises', exercisesRouter);
```

**Step 3: Test exercises API**

Run: `cd backend && npm run dev`

Test GET by category:
```bash
curl "http://localhost:8080/api/exercises?category_id=1"
```
Expected: Array of Upper Body exercises (Bench Press, Pull-ups)

Test GET single:
```bash
curl http://localhost:8080/api/exercises/1
```
Expected: Bench Press exercise details

Test POST:
```bash
curl -X POST http://localhost:8080/api/exercises \
  -H "Content-Type: application/json" \
  -d '{"category_id":1,"name":"Shoulder Press","template_type":"strength"}'
```
Expected: New exercise returned

Test PUT:
```bash
curl -X PUT http://localhost:8080/api/exercises/9 \
  -H "Content-Type: application/json" \
  -d '{"name":"Military Press"}'
```
Expected: Updated exercise

Test DELETE:
```bash
curl -X DELETE http://localhost:8080/api/exercises/9
```
Expected: `{"success":true}`

**Step 4: Commit**

```bash
git add backend/routes/exercises.js backend/server.js
git commit -m "feat(backend): add exercises CRUD API endpoints

- GET /api/exercises?category_id=X - list with last_used_at sorting
- GET /api/exercises/:id - single exercise details
- POST /api/exercises - create with validation
- PUT /api/exercises/:id - update name/template_type
- DELETE /api/exercises/:id - delete with cascade

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 6: Logs API Endpoints with last_used_at Update

**Files:**
- Create: `backend/routes/logs.js`
- Modify: `backend/server.js`

**Step 1: Create logs route handler**

Create `backend/routes/logs.js`:

```javascript
import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET /api/logs?exercise_id=X&limit=3 - Get recent logs for exercise
router.get('/', (req, res) => {
  try {
    const { exercise_id, limit = 3 } = req.query;

    if (!exercise_id) {
      return res.status(400).json({ error: 'exercise_id is required' });
    }

    const logs = db.prepare(`
      SELECT id, exercise_id, metric_1, metric_2, metric_3, notes, created_at
      FROM logs
      WHERE exercise_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(exercise_id, parseInt(limit));

    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// GET /api/logs/all?limit=100&offset=0 - Get all logs (for admin view)
router.get('/all', (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;

    const logs = db.prepare(`
      SELECT
        l.id,
        l.exercise_id,
        l.metric_1,
        l.metric_2,
        l.metric_3,
        l.notes,
        l.created_at,
        e.name as exercise_name,
        e.template_type
      FROM logs l
      JOIN exercises e ON l.exercise_id = e.id
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `).all(parseInt(limit), parseInt(offset));

    const totalCount = db.prepare('SELECT COUNT(*) as count FROM logs').get();

    res.json({
      logs,
      total: totalCount.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching all logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// POST /api/logs - Create new log and update exercise.last_used_at
router.post('/', (req, res) => {
  try {
    const { exercise_id, metric_1, metric_2, metric_3, notes } = req.body;

    if (!exercise_id) {
      return res.status(400).json({ error: 'exercise_id is required' });
    }

    // Coerce metric values (permissive validation)
    const m1 = metric_1 !== undefined && metric_1 !== '' ? parseFloat(metric_1) || null : null;
    const m2 = metric_2 !== undefined && metric_2 !== '' ? parseInt(metric_2) || null : null;
    const m3 = metric_3 !== undefined && metric_3 !== '' ? parseInt(metric_3) || null : null;

    // Insert log
    const result = db.prepare(
      'INSERT INTO logs (exercise_id, metric_1, metric_2, metric_3, notes) VALUES (?, ?, ?, ?, ?)'
    ).run(exercise_id, m1, m2, m3, notes || null);

    // Update exercise.last_used_at
    db.prepare(
      'UPDATE exercises SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(exercise_id);

    const log = db.prepare(`
      SELECT id, exercise_id, metric_1, metric_2, metric_3, notes, created_at
      FROM logs WHERE id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(log);
  } catch (error) {
    console.error('Error creating log:', error);
    res.status(500).json({ error: 'Failed to create log' });
  }
});

// DELETE /api/logs/:id - Delete log (for corrections)
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const result = db.prepare('DELETE FROM logs WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Log not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting log:', error);
    res.status(500).json({ error: 'Failed to delete log' });
  }
});

export default router;
```

**Step 2: Register logs routes in server.js**

Modify `backend/server.js` - add after exercises import:

```javascript
import logsRouter from './routes/logs.js';

// Update API routes section:
app.use('/api/categories', categoriesRouter);
app.use('/api/exercises', exercisesRouter);
app.use('/api/logs', logsRouter);
```

**Step 3: Test logs API**

Run: `cd backend && npm run dev`

Test POST (create log):
```bash
curl -X POST http://localhost:8080/api/logs \
  -H "Content-Type: application/json" \
  -d '{"exercise_id":1,"metric_1":185,"metric_2":8,"metric_3":3}'
```
Expected: New log returned

Test GET for exercise:
```bash
curl "http://localhost:8080/api/logs?exercise_id=1&limit=3"
```
Expected: Array with newly created log

Verify last_used_at was updated:
```bash
curl http://localhost:8080/api/exercises/1
```
Expected: last_used_at should be recent timestamp

Test GET all logs:
```bash
curl "http://localhost:8080/api/logs/all?limit=10"
```
Expected: Object with logs array, total count, limit, offset

Test DELETE:
```bash
curl -X DELETE http://localhost:8080/api/logs/1
```
Expected: `{"success":true}`

**Step 4: Commit**

```bash
git add backend/routes/logs.js backend/server.js
git commit -m "feat(backend): add logs API with automatic last_used_at update

- GET /api/logs?exercise_id=X - recent logs for exercise
- GET /api/logs/all - all logs with pagination for admin
- POST /api/logs - create log and update exercise timestamp
- DELETE /api/logs/:id - delete for corrections
- Permissive metric validation (coerce to null on invalid input)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 2: Frontend Core Flow

### Task 7: Initialize Frontend Project

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.js`
- Create: `frontend/index.html`

**Step 1: Create frontend package.json**

```bash
cd /home/delgaudm/docker/gymflow/.worktrees/feature-v2-implementation
mkdir frontend
cd frontend
```

Create `frontend/package.json`:

```json
{
  "name": "gymflow-frontend",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8"
  }
}
```

**Step 2: Create vite.config.js**

Create `frontend/vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: '../backend/public',
    emptyOutDir: true
  }
});
```

**Step 3: Create index.html**

Create `frontend/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="Minimalist workout tracker" />
  <meta name="theme-color" content="#3B82F6" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css" />
  <title>GymFlow</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

**Step 4: Install dependencies**

Run: `npm install`
Expected: Dependencies installed successfully

**Step 5: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vite.config.js frontend/index.html
git commit -m "feat(frontend): initialize React project with Vite and Pico.css

- Vite dev server with API proxy
- Build output to backend/public for deployment
- Pico.css via CDN for semantic styling

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 8: React App Setup with Router

**Files:**
- Create: `frontend/src/main.jsx`
- Create: `frontend/src/App.jsx`
- Create: `frontend/src/pages/Home.jsx`

**Step 1: Create main entry point**

Create `frontend/src/main.jsx`:

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Step 2: Create App with router**

Create `frontend/src/App.jsx`:

```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

**Step 3: Create placeholder Home page**

Create `frontend/src/pages/Home.jsx`:

```javascript
function Home() {
  return (
    <main className="container">
      <header>
        <h1>GymFlow</h1>
      </header>
      <p>Loading categories...</p>
    </main>
  );
}

export default Home;
```

**Step 4: Test development server**

Run: `cd frontend && npm run dev`
Expected: Vite dev server starts, opens http://localhost:5173

Verify: "GymFlow" heading displays with Pico.css styling

**Step 5: Commit**

```bash
git add frontend/src/
git commit -m "feat(frontend): add React Router and placeholder home page

- Main entry point with React 18 StrictMode
- BrowserRouter setup for client-side routing
- Placeholder home page with Pico.css container

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 9: API Hook and Category Display

**Files:**
- Create: `frontend/src/hooks/useAPI.js`
- Create: `frontend/src/components/CategoryCard.jsx`
- Modify: `frontend/src/pages/Home.jsx`

**Step 1: Create API hook**

Create `frontend/src/hooks/useAPI.js`:

```javascript
import { useState, useEffect } from 'react';

export function useAPI(url, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const json = await response.json();

        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, deps);

  return { data, loading, error };
}

export async function apiPost(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function apiPut(url, body) {
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function apiDelete(url) {
  const response = await fetch(url, {
    method: 'DELETE'
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}
```

**Step 2: Create CategoryCard component**

Create `frontend/src/components/CategoryCard.jsx`:

```javascript
import { useNavigate } from 'react-router-dom';

function CategoryCard({ id, name, color }) {
  const navigate = useNavigate();

  const style = {
    backgroundColor: color,
    color: '#FFFFFF',
    padding: '2rem',
    borderRadius: '0.5rem',
    textAlign: 'center',
    cursor: 'pointer',
    border: 'none',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    minHeight: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  return (
    <button
      style={style}
      onClick={() => navigate(`/category/${id}`)}
      aria-label={`View ${name} exercises`}
    >
      {name}
    </button>
  );
}

export default CategoryCard;
```

**Step 3: Update Home page to fetch and display categories**

Modify `frontend/src/pages/Home.jsx`:

```javascript
import { useAPI } from '../hooks/useAPI';
import CategoryCard from '../components/CategoryCard';

function Home() {
  const { data: categories, loading, error } = useAPI('/api/categories');

  return (
    <main className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>GymFlow</h1>
        <a href="/admin" role="button" className="secondary outline">Admin</a>
      </header>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: '#EF4444' }}>Error: {error}</p>}

      {categories && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1rem',
          marginTop: '2rem'
        }}>
          {categories.map(cat => (
            <CategoryCard key={cat.id} {...cat} />
          ))}
        </div>
      )}
    </main>
  );
}

export default Home;
```

**Step 4: Test category display**

Ensure backend is running: `cd backend && npm run dev`
Run frontend: `cd frontend && npm run dev`

Visit: http://localhost:5173

Expected:
- 2x2 grid of colored category buttons
- Upper Body (blue), Lower Body (green), Cardio (orange), Core (red)
- Clicking category navigates to /category/:id (404 for now)

**Step 5: Commit**

```bash
git add frontend/src/hooks/ frontend/src/components/ frontend/src/pages/Home.jsx
git commit -m "feat(frontend): add category grid display on home page

- useAPI hook for data fetching with loading/error states
- CategoryCard component with colored backgrounds
- 2-column grid layout for categories
- Navigation to category view on click

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 10: Category View with Exercise List

**Files:**
- Create: `frontend/src/pages/CategoryView.jsx`
- Create: `frontend/src/components/ExerciseButton.jsx`
- Modify: `frontend/src/App.jsx`

**Step 1: Create ExerciseButton component**

Create `frontend/src/components/ExerciseButton.jsx`:

```javascript
import { useNavigate } from 'react-router-dom';

function ExerciseButton({ id, name }) {
  const navigate = useNavigate();

  const style = {
    padding: '1.5rem 1rem',
    minHeight: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    fontSize: '1rem'
  };

  return (
    <button
      style={style}
      onClick={() => navigate(`/entry/${id}`)}
      aria-label={`Log ${name}`}
    >
      {name}
    </button>
  );
}

export default ExerciseButton;
```

**Step 2: Create CategoryView page**

Create `frontend/src/pages/CategoryView.jsx`:

```javascript
import { useParams, useNavigate } from 'react-router-dom';
import { useAPI } from '../hooks/useAPI';
import ExerciseButton from '../components/ExerciseButton';

function CategoryView() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { data: exercises, loading, error } = useAPI(`/api/exercises?category_id=${categoryId}`, [categoryId]);
  const { data: category } = useAPI(`/api/categories`);

  const currentCategory = category?.find(c => c.id === parseInt(categoryId));

  return (
    <main className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={() => navigate('/')}
          className="secondary outline"
          aria-label="Back to home"
        >
          ← Back
        </button>
        <h2>{currentCategory?.name || 'Exercises'}</h2>
      </header>

      {loading && <p>Loading exercises...</p>}
      {error && <p style={{ color: '#EF4444' }}>Error: {error}</p>}

      {exercises && exercises.length === 0 && (
        <p style={{ textAlign: 'center', marginTop: '2rem', color: '#6B7280' }}>
          No exercises yet
        </p>
      )}

      {exercises && exercises.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1rem',
          marginTop: '2rem'
        }}>
          {exercises.map(ex => (
            <ExerciseButton key={ex.id} {...ex} />
          ))}
        </div>
      )}
    </main>
  );
}

export default CategoryView;
```

**Step 3: Add route to App.jsx**

Modify `frontend/src/App.jsx`:

```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CategoryView from './pages/CategoryView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/category/:categoryId" element={<CategoryView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

**Step 4: Test category view**

Run: `cd frontend && npm run dev`

Visit: http://localhost:5173
Click: "Upper Body" category

Expected:
- Shows "← Back" button and "Upper Body" heading
- 2x2 grid with "Bench Press" and "Pull-ups"
- Exercises sorted with most recently used first
- Clicking exercise navigates to /entry/:id (404 for now)

Test back button: Returns to home page

**Step 5: Commit**

```bash
git add frontend/src/pages/CategoryView.jsx frontend/src/components/ExerciseButton.jsx frontend/src/App.jsx
git commit -m "feat(frontend): add category view with exercise grid

- CategoryView page displays exercises for selected category
- ExerciseButton component for exercise selection
- Exercises sorted by last_used_at DESC NULLS LAST
- Back button navigation to home
- Empty state for categories with no exercises

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 11: Entry Form with Dynamic Fields

**Files:**
- Create: `frontend/src/pages/EntryView.jsx`
- Create: `frontend/src/hooks/useFormState.js`
- Create: `frontend/src/components/Toast.jsx`
- Modify: `frontend/src/App.jsx`

**Step 1: Create form state persistence hook**

Create `frontend/src/hooks/useFormState.js`:

```javascript
import { useState, useEffect } from 'react';

export function useFormState(key, initialValue) {
  const [value, setValue] = useState(() => {
    const saved = sessionStorage.getItem(key);
    return saved ? JSON.parse(saved) : initialValue;
  });

  useEffect(() => {
    sessionStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  const clearState = () => {
    sessionStorage.removeItem(key);
    setValue(initialValue);
  };

  return [value, setValue, clearState];
}
```

**Step 2: Create Toast component**

Create `frontend/src/components/Toast.jsx`:

```javascript
import { useEffect } from 'react';

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 1000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const style = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: type === 'success' ? '#10B981' : '#EF4444',
    color: '#FFFFFF',
    padding: '1.5rem 3rem',
    borderRadius: '0.5rem',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    zIndex: 1000,
    boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
  };

  return <div style={style}>{message}</div>;
}

export default Toast;
```

**Step 3: Create EntryView page**

Create `frontend/src/pages/EntryView.jsx`:

```javascript
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAPI, apiPost } from '../hooks/useAPI';
import { useFormState } from '../hooks/useFormState';
import Toast from '../components/Toast';

function EntryView() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const { data: exercise } = useAPI(`/api/exercises/${exerciseId}`, [exerciseId]);
  const { data: logs } = useAPI(`/api/logs?exercise_id=${exerciseId}&limit=3`, [exerciseId]);

  const [formData, setFormData, clearFormData] = useFormState(`entry-${exerciseId}`, {
    metric_1: '',
    metric_2: '',
    metric_3: '',
    notes: ''
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);

  const firstInputRef = useRef(null);

  // Pre-fill from most recent log
  useEffect(() => {
    if (logs && logs.length > 0) {
      const lastLog = logs[0];
      setFormData(prev => ({
        metric_1: prev.metric_1 || lastLog.metric_1 || '',
        metric_2: prev.metric_2 || lastLog.metric_2 || '',
        metric_3: prev.metric_3 || lastLog.metric_3 || '',
        notes: prev.notes || ''
      }));
    }
  }, [logs]);

  // Auto-focus first input
  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [exercise]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await apiPost('/api/logs', {
        exercise_id: parseInt(exerciseId),
        metric_1: formData.metric_1,
        metric_2: formData.metric_2,
        metric_3: formData.metric_3,
        notes: formData.notes
      });

      clearFormData();
      setShowToast(true);

      // Navigate back after toast
      setTimeout(() => {
        navigate(`/category/${exercise.category_id}`);
      }, 1000);

    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const getFieldLabels = () => {
    if (!exercise) return {};

    switch (exercise.template_type) {
      case 'strength':
        return { m1: 'Weight (lbs)', m2: 'Reps', m3: 'Sets' };
      case 'cardio':
        return { m1: 'Distance (mi)', m2: 'Duration (min)', m3: null };
      case 'timed':
        return { m1: 'Duration (sec)', m2: null, m3: null };
      case 'bodyweight':
        return { m1: 'Reps', m2: 'Sets', m3: null };
      default:
        return {};
    }
  };

  const formatLog = (log) => {
    if (!exercise) return '';

    switch (exercise.template_type) {
      case 'strength':
        return `${log.metric_1} lbs × ${log.metric_2} reps × ${log.metric_3} sets`;
      case 'cardio':
        return `${log.metric_1} mi in ${log.metric_2} min`;
      case 'timed':
        return `${log.metric_1} seconds`;
      case 'bodyweight':
        return `${log.metric_1} reps × ${log.metric_2} sets`;
      default:
        return '';
    }
  };

  if (!exercise) return <main className="container"><p>Loading...</p></main>;

  const labels = getFieldLabels();

  return (
    <main className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
      {showToast && <Toast message="✓ Saved!" onClose={() => setShowToast(false)} />}

      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={() => navigate(`/category/${exercise.category_id}`)}
          className="secondary outline"
          aria-label="Back to category"
        >
          ← Back
        </button>
        <h2>{exercise.name}</h2>
      </header>

      {logs && logs.length > 0 && (
        <section>
          <h4>Recent History:</h4>
          <ul style={{ color: '#6B7280', fontSize: '0.9rem' }}>
            {logs.map(log => (
              <li key={log.id}>{formatLog(log)}</li>
            ))}
          </ul>
        </section>
      )}

      <form onSubmit={handleSubmit}>
        {labels.m1 && (
          <label>
            {labels.m1}
            <input
              ref={firstInputRef}
              type="text"
              inputMode={exercise.template_type === 'strength' || exercise.template_type === 'cardio' ? 'decimal' : 'numeric'}
              value={formData.metric_1}
              onChange={(e) => handleChange('metric_1', e.target.value)}
            />
          </label>
        )}

        {labels.m2 && (
          <label>
            {labels.m2}
            <input
              type="text"
              inputMode="numeric"
              value={formData.metric_2}
              onChange={(e) => handleChange('metric_2', e.target.value)}
            />
          </label>
        )}

        {labels.m3 && (
          <label>
            {labels.m3}
            <input
              type="text"
              inputMode="numeric"
              value={formData.metric_3}
              onChange={(e) => handleChange('metric_3', e.target.value)}
            />
          </label>
        )}

        <label>
          Notes (optional)
          <input
            type="text"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder=""
          />
        </label>

        {error && (
          <article style={{ backgroundColor: '#EF4444', color: '#FFF', padding: '1rem' }}>
            <p>Error: {error}</p>
            <button type="submit" disabled={saving}>Retry</button>
          </article>
        )}

        <button
          type="submit"
          disabled={saving}
          style={{
            width: '100%',
            padding: '1.5rem',
            fontSize: '1.25rem',
            marginTop: '1rem'
          }}
        >
          {saving ? 'SAVING...' : 'SAVE'}
        </button>
      </form>
    </main>
  );
}

export default EntryView;
```

**Step 4: Add route to App.jsx**

Modify `frontend/src/App.jsx`:

```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CategoryView from './pages/CategoryView';
import EntryView from './pages/EntryView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/category/:categoryId" element={<CategoryView />} />
        <Route path="/entry/:exerciseId" element={<EntryView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

**Step 5: Test complete three-tap flow**

Run: `cd frontend && npm run dev`

Test flow:
1. Home → Click "Upper Body"
2. Category → Click "Bench Press"
3. Entry form displays with:
   - Recent history (if logs exist)
   - Pre-filled fields from last log
   - Weight, Reps, Sets inputs
   - Notes field
   - Giant SAVE button
4. Modify weight to "190"
5. Click SAVE
6. Green "✓ Saved!" toast appears for 1 second
7. Auto-navigates back to Upper Body category

Verify:
- Form auto-focuses first input
- Numeric keyboard on mobile (test with browser DevTools mobile mode)
- Form state persists if navigating away and back

**Step 6: Commit**

```bash
git add frontend/src/pages/EntryView.jsx frontend/src/hooks/useFormState.js frontend/src/components/Toast.jsx frontend/src/App.jsx
git commit -m "feat(frontend): add entry form with dynamic fields and auto-save

- EntryView with template-specific field labels
- Form pre-fill from most recent log
- Auto-focus first input for speed
- Recent history display (metrics only)
- Toast notification with 1-second flash
- Form state persistence in sessionStorage
- Error handling with retry button

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 3: Admin Interface

### Task 12: Admin Home Page

**Files:**
- Create: `frontend/src/pages/AdminHome.jsx`
- Modify: `frontend/src/App.jsx`

**Step 1: Create AdminHome page**

Create `frontend/src/pages/AdminHome.jsx`:

```javascript
import { useNavigate } from 'react-router-dom';

function AdminHome() {
  const navigate = useNavigate();

  const buttonStyle = {
    width: '100%',
    padding: '1.5rem',
    fontSize: '1.1rem',
    marginBottom: '1rem'
  };

  return (
    <main className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={() => navigate('/')}
          className="secondary outline"
          aria-label="Back to home"
        >
          ← Home
        </button>
        <h2>Admin Panel</h2>
      </header>

      <div style={{ marginTop: '2rem' }}>
        <button
          style={buttonStyle}
          onClick={() => navigate('/admin/categories')}
        >
          Manage Categories
        </button>

        <button
          style={buttonStyle}
          onClick={() => navigate('/admin/exercises')}
        >
          Manage Exercises
        </button>

        <button
          style={buttonStyle}
          onClick={() => navigate('/admin/logs')}
        >
          View All Logs
        </button>
      </div>
    </main>
  );
}

export default AdminHome;
```

**Step 2: Add route to App.jsx**

Modify `frontend/src/App.jsx`:

```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CategoryView from './pages/CategoryView';
import EntryView from './pages/EntryView';
import AdminHome from './pages/AdminHome';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/category/:categoryId" element={<CategoryView />} />
        <Route path="/entry/:exerciseId" element={<EntryView />} />
        <Route path="/admin" element={<AdminHome />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

**Step 3: Test admin navigation**

Run: `cd frontend && npm run dev`

From home page, click "Admin" button

Expected:
- Admin Panel heading with back button
- Three large buttons: Manage Categories, Manage Exercises, View All Logs
- Clicking any button navigates (404 for now)

**Step 4: Commit**

```bash
git add frontend/src/pages/AdminHome.jsx frontend/src/App.jsx
git commit -m "feat(frontend): add admin home page with navigation

- Admin panel with three management sections
- Navigation to categories, exercises, and logs management
- Back button to return to home

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 13: Manage Categories Page

**Files:**
- Create: `frontend/src/pages/ManageCategories.jsx`
- Modify: `frontend/src/App.jsx`

**Step 1: Create ManageCategories page**

Create `frontend/src/pages/ManageCategories.jsx`:

```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAPI, apiPost, apiPut, apiDelete } from '../hooks/useAPI';

function ManageCategories() {
  const navigate = useNavigate();
  const { data: categories, loading, error } = useAPI('/api/categories');
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', color: '#3B82F6' });
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const maxSort = categories ? Math.max(...categories.map(c => c.sort_order), 0) : 0;
      await apiPost('/api/categories', { ...formData, sort_order: maxSort + 1 });
      setShowAddForm(false);
      setFormData({ name: '', color: '#3B82F6' });
      setRefreshKey(k => k + 1);
      window.location.reload(); // Simple refresh for now
    } catch (err) {
      alert('Error adding category: ' + err.message);
    }
  };

  const handleEdit = async (id, updates) => {
    try {
      await apiPut(`/api/categories/${id}`, updates);
      setEditingId(null);
      window.location.reload();
    } catch (err) {
      alert('Error updating category: ' + err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}" and all its exercises/logs?`)) return;

    try {
      await apiDelete(`/api/categories/${id}`);
      window.location.reload();
    } catch (err) {
      alert('Error deleting category: ' + err.message);
    }
  };

  const handleReorder = async (id, direction) => {
    const index = categories.findIndex(c => c.id === id);
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const current = categories[index];
    const target = categories[targetIndex];

    try {
      await apiPut(`/api/categories/${current.id}`, { sort_order: target.sort_order });
      await apiPut(`/api/categories/${target.id}`, { sort_order: current.sort_order });
      window.location.reload();
    } catch (err) {
      alert('Error reordering: ' + err.message);
    }
  };

  return (
    <main className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={() => navigate('/admin')}
          className="secondary outline"
        >
          ← Back
        </button>
        <h2>Manage Categories</h2>
      </header>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: '#EF4444' }}>Error: {error}</p>}

      <button
        onClick={() => setShowAddForm(!showAddForm)}
        style={{ width: '100%', marginBottom: '1rem' }}
      >
        {showAddForm ? 'Cancel' : '+ Add New Category'}
      </button>

      {showAddForm && (
        <form onSubmit={handleAdd} style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc' }}>
          <label>
            Name
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </label>
          <label>
            Color
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            />
          </label>
          <button type="submit">Save Category</button>
        </form>
      )}

      {categories && categories.map((cat, idx) => (
        <div
          key={cat.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem',
            padding: '1rem',
            border: '1px solid #ccc',
            borderRadius: '0.25rem'
          }}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              backgroundColor: cat.color,
              borderRadius: '0.25rem'
            }}
          />
          <span style={{ flex: 1 }}>{cat.name}</span>

          <button
            onClick={() => handleReorder(cat.id, 'up')}
            disabled={idx === 0}
            className="secondary outline"
            style={{ padding: '0.25rem 0.5rem' }}
          >
            ↑
          </button>
          <button
            onClick={() => handleReorder(cat.id, 'down')}
            disabled={idx === categories.length - 1}
            className="secondary outline"
            style={{ padding: '0.25rem 0.5rem' }}
          >
            ↓
          </button>

          <button
            onClick={() => setEditingId(editingId === cat.id ? null : cat.id)}
            className="secondary outline"
            style={{ padding: '0.25rem 0.5rem' }}
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(cat.id, cat.name)}
            className="secondary"
            style={{ padding: '0.25rem 0.5rem' }}
          >
            ×
          </button>
        </div>
      ))}
    </main>
  );
}

export default ManageCategories;
```

**Step 2: Add route to App.jsx**

Modify `frontend/src/App.jsx`:

```javascript
import ManageCategories from './pages/ManageCategories';

// Add to Routes:
<Route path="/admin/categories" element={<ManageCategories />} />
```

**Step 3: Test category management**

Run: `cd frontend && npm run dev`

Navigate: Admin → Manage Categories

Test:
- Click "+ Add New Category"
- Enter name "Test", pick color
- Click Save → Category appears in list
- Click Edit → (for now, button just toggles)
- Use ↑↓ arrows to reorder
- Click × to delete (with confirmation)

**Step 4: Commit**

```bash
git add frontend/src/pages/ManageCategories.jsx frontend/src/App.jsx
git commit -m "feat(frontend): add category management page

- CRUD interface for categories
- Add form with color picker
- Up/down arrows for reordering
- Delete with confirmation dialog
- Color preview in list

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 14: Manage Exercises Page

**Files:**
- Create: `frontend/src/pages/ManageExercises.jsx`
- Modify: `frontend/src/App.jsx`

**Step 1: Create ManageExercises page**

Create `frontend/src/pages/ManageExercises.jsx`:

```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAPI, apiPost, apiPut, apiDelete } from '../hooks/useAPI';

function ManageExercises() {
  const navigate = useNavigate();
  const { data: categories } = useAPI('/api/categories');
  const [filterCategoryId, setFilterCategoryId] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    template_type: 'strength'
  });

  const exerciseQuery = filterCategoryId === 'all'
    ? null
    : `/api/exercises?category_id=${filterCategoryId}`;

  const { data: exercises } = useAPI(exerciseQuery || '/api/categories', [filterCategoryId]);

  // Get all exercises across all categories for "all" filter
  const allExercises = filterCategoryId === 'all' && categories
    ? categories.flatMap(cat => {
        const { data } = useAPI(`/api/exercises?category_id=${cat.id}`, [cat.id]) || { data: [] };
        return (data || []).map(ex => ({ ...ex, category_name: cat.name }));
      })
    : exercises || [];

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await apiPost('/api/exercises', formData);
      setShowAddForm(false);
      setFormData({ name: '', category_id: '', template_type: 'strength' });
      window.location.reload();
    } catch (err) {
      alert('Error adding exercise: ' + err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}" and all its logs?`)) return;

    try {
      await apiDelete(`/api/exercises/${id}`);
      window.location.reload();
    } catch (err) {
      alert('Error deleting exercise: ' + err.message);
    }
  };

  return (
    <main className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={() => navigate('/admin')}
          className="secondary outline"
        >
          ← Back
        </button>
        <h2>Manage Exercises</h2>
      </header>

      {categories && (
        <label>
          Filter by Category
          <select
            value={filterCategoryId}
            onChange={(e) => setFilterCategoryId(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </label>
      )}

      <button
        onClick={() => setShowAddForm(!showAddForm)}
        style={{ width: '100%', marginBottom: '1rem' }}
      >
        {showAddForm ? 'Cancel' : '+ Add New Exercise'}
      </button>

      {showAddForm && (
        <form onSubmit={handleAdd} style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc' }}>
          <label>
            Name
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </label>
          <label>
            Category
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              required
            >
              <option value="">Select category</option>
              {categories?.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </label>
          <label>
            Template Type
            <select
              value={formData.template_type}
              onChange={(e) => setFormData({ ...formData, template_type: e.target.value })}
            >
              <option value="strength">Strength (Weight, Reps, Sets)</option>
              <option value="cardio">Cardio (Distance, Duration)</option>
              <option value="timed">Timed (Duration only)</option>
              <option value="bodyweight">Bodyweight (Reps, Sets)</option>
            </select>
          </label>
          <button type="submit">Save Exercise</button>
        </form>
      )}

      {allExercises.length === 0 && <p style={{ color: '#6B7280' }}>No exercises found</p>}

      {allExercises.map(ex => (
        <div
          key={ex.id}
          style={{
            marginBottom: '1rem',
            padding: '1rem',
            border: '1px solid #ccc',
            borderRadius: '0.25rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <strong>{ex.name}</strong>
              <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                {ex.template_type} • {ex.category_name || 'Unknown Category'}
              </div>
            </div>
            <button
              onClick={() => handleDelete(ex.id, ex.name)}
              className="secondary"
              style={{ padding: '0.25rem 0.5rem' }}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </main>
  );
}

export default ManageExercises;
```

**Step 2: Add route to App.jsx**

Modify `frontend/src/App.jsx`:

```javascript
import ManageExercises from './pages/ManageExercises';

// Add to Routes:
<Route path="/admin/exercises" element={<ManageExercises />} />
```

**Step 3: Test exercise management**

Run: `cd frontend && npm run dev`

Navigate: Admin → Manage Exercises

Test:
- Filter dropdown shows all categories
- Click "+ Add New Exercise"
- Fill form (name, category, template type)
- Save → Exercise appears in list
- Filter by category → Shows only that category's exercises
- Delete exercise with confirmation

**Step 4: Commit**

```bash
git add frontend/src/pages/ManageExercises.jsx frontend/src/App.jsx
git commit -m "feat(frontend): add exercise management page

- CRUD interface for exercises
- Category filter dropdown
- Add form with template type selection
- Display exercise with type and category
- Delete with confirmation

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 15: View All Logs Page

**Files:**
- Create: `frontend/src/pages/ViewLogs.jsx`
- Modify: `frontend/src/App.jsx`

**Step 1: Create ViewLogs page**

Create `frontend/src/pages/ViewLogs.jsx`:

```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAPI, apiDelete } from '../hooks/useAPI';

function ViewLogs() {
  const navigate = useNavigate();
  const [limit] = useState(100);
  const [offset, setOffset] = useState(0);

  const { data: response, loading, error } = useAPI(`/api/logs/all?limit=${limit}&offset=${offset}`, [offset]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this log entry?')) return;

    try {
      await apiDelete(`/api/logs/${id}`);
      window.location.reload();
    } catch (err) {
      alert('Error deleting log: ' + err.message);
    }
  };

  const formatLog = (log) => {
    switch (log.template_type) {
      case 'strength':
        return `${log.metric_1 || 0} lbs × ${log.metric_2 || 0} × ${log.metric_3 || 0}`;
      case 'cardio':
        return `${log.metric_1 || 0} mi in ${log.metric_2 || 0} min`;
      case 'timed':
        return `${log.metric_1 || 0} sec`;
      case 'bodyweight':
        return `${log.metric_1 || 0} × ${log.metric_2 || 0}`;
      default:
        return 'N/A';
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const logs = response?.logs || [];
  const total = response?.total || 0;
  const hasMore = offset + limit < total;

  return (
    <main className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={() => navigate('/admin')}
          className="secondary outline"
        >
          ← Back
        </button>
        <h2>All Logs</h2>
      </header>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: '#EF4444' }}>Error: {error}</p>}

      {logs.length === 0 && !loading && (
        <p style={{ color: '#6B7280', textAlign: 'center' }}>No logs yet</p>
      )}

      {logs.length > 0 && (
        <>
          <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1rem' }}>
            Showing {offset + 1}-{Math.min(offset + limit, total)} of {total} logs
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Exercise</th>
                  <th>Metrics</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.875rem' }}>{formatDate(log.created_at)}</td>
                    <td>{log.exercise_name}</td>
                    <td>{formatLog(log)}</td>
                    <td style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                      {log.notes || '-'}
                    </td>
                    <td>
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="secondary"
                        style={{ padding: '0.25rem 0.5rem' }}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <button
              onClick={() => setOffset(o => o + limit)}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              Load More ({total - offset - limit} remaining)
            </button>
          )}

          {offset > 0 && (
            <button
              onClick={() => setOffset(o => Math.max(0, o - limit))}
              className="secondary"
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              Previous Page
            </button>
          )}
        </>
      )}
    </main>
  );
}

export default ViewLogs;
```

**Step 2: Add route to App.jsx**

Modify `frontend/src/App.jsx`:

```javascript
import ViewLogs from './pages/ViewLogs';

// Add to Routes:
<Route path="/admin/logs" element={<ViewLogs />} />
```

**Step 3: Test logs view**

Run: `cd frontend && npm run dev`

Navigate: Admin → View All Logs

Expected:
- Table with columns: Date, Exercise, Metrics, Notes, Delete
- Formatted metrics based on template type
- Delete button (×) with confirmation
- "Load More" button if > 100 logs
- "Previous Page" button if offset > 0

Create some logs via the main flow to test display

**Step 4: Commit**

```bash
git add frontend/src/pages/ViewLogs.jsx frontend/src/App.jsx
git commit -m "feat(frontend): add view all logs page with pagination

- Table display of all workout logs
- Formatted metrics by template type
- Date formatting (MMM DD, HH:MM)
- Delete functionality with confirmation
- Pagination (100 logs per page, load more button)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 4: PWA Features

### Task 16: Service Worker Setup

**Files:**
- Create: `frontend/public/service-worker.js`
- Modify: `frontend/src/main.jsx`
- Modify: `frontend/vite.config.js`

**Step 1: Create service worker**

Create `frontend/public/service-worker.js`:

```javascript
const CACHE_NAME = 'gymflow-v2-cache';
const STATIC_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service worker: caching static assets');
      return cache.addAll(STATIC_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: cache-first for assets, network-first for API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Network-first for API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache successful API responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache when offline
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            // Return offline error response
            return new Response(
              JSON.stringify({ error: 'Network unavailable' }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        // Cache new assets
        if (response.ok && request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
  );
});
```

**Step 2: Register service worker in main.jsx**

Modify `frontend/src/main.jsx`:

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration.scope);
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}
```

**Step 3: Update vite.config.js to copy service worker**

Modify `frontend/vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-service-worker',
      writeBundle() {
        copyFileSync(
          'public/service-worker.js',
          '../backend/public/service-worker.js'
        );
      }
    }
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: '../backend/public',
    emptyOutDir: true
  }
});
```

**Step 4: Test service worker**

Run production build:
```bash
cd frontend
npm run build
```

Start backend server:
```bash
cd ../backend
npm start
```

Visit: http://localhost:8080

Open DevTools → Application → Service Workers
Expected: Service worker registered and active

Test offline:
- DevTools → Network → Set to "Offline"
- Reload page → Should load from cache
- Try to log workout → Shows error (network unavailable)

**Step 5: Commit**

```bash
git add frontend/public/service-worker.js frontend/src/main.jsx frontend/vite.config.js
git commit -m "feat(pwa): add service worker with offline support

- Cache-first strategy for static assets
- Network-first strategy for API calls
- Offline fallback with cached responses
- Service worker registration in main.jsx
- Auto-copy service worker to build output

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 17: PWA Manifest and Icons

**Files:**
- Create: `frontend/public/manifest.json`
- Create: `frontend/public/icons/icon.svg`
- Modify: `frontend/index.html`

**Step 1: Create PWA manifest**

Create `frontend/public/manifest.json`:

```json
{
  "name": "GymFlow",
  "short_name": "GymFlow",
  "description": "Minimalist workout tracker for ultra-fast logging",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#3B82F6",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

**Step 2: Create SVG icon**

Create `frontend/public/icons/icon.svg`:

```svg
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#3B82F6"/>
  <circle cx="160" cy="256" r="40" fill="white"/>
  <circle cx="352" cy="256" r="40" fill="white"/>
  <rect x="200" y="240" width="112" height="32" rx="8" fill="white"/>
  <rect x="140" y="220" width="232" height="72" rx="8" fill="none" stroke="white" stroke-width="12"/>
</svg>
```

**Step 3: Generate PNG icons from SVG**

For development, create placeholder PNGs:

```bash
mkdir -p frontend/public/icons
# Create simple colored squares as placeholders (will be replaced with proper icons in production)
# For now, copy the SVG as both sizes
cp frontend/public/icons/icon.svg frontend/public/icons/icon-192.png
cp frontend/public/icons/icon.svg frontend/public/icons/icon-512.png
```

Note: In production, use proper image conversion tool or online SVG-to-PNG converter.

**Step 4: Link manifest in index.html**

Modify `frontend/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="Minimalist workout tracker" />
  <meta name="theme-color" content="#3B82F6" />
  <link rel="manifest" href="/manifest.json" />
  <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/icons/icon-192.png" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css" />
  <title>GymFlow</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

**Step 5: Test PWA installation**

Build and run:
```bash
cd frontend && npm run build
cd ../backend && npm start
```

Visit http://localhost:8080 in Chrome/Edge

Expected:
- Install button in address bar (desktop)
- "Add to Home Screen" prompt (mobile)
- Theme color applied to browser chrome

Test installation:
- Install PWA
- Launch from home screen/app drawer
- Verify full-screen mode (no browser UI)

**Step 6: Commit**

```bash
git add frontend/public/manifest.json frontend/public/icons/ frontend/index.html
git commit -m "feat(pwa): add manifest and app icons

- PWA manifest with app metadata
- SVG icon with dumbbell design
- PNG icons for different sizes (192x192, 512x512)
- Linked manifest and icons in index.html
- Supports installation on home screen

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 5: Docker Deployment

### Task 18: Dockerfile

**Files:**
- Create: `Dockerfile`
- Create: `README.md`

**Step 1: Create Dockerfile**

Create `Dockerfile` in project root:

```dockerfile
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source and build
COPY frontend/ ./
RUN npm run build

# Stage 2: Production server
FROM node:20-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source
COPY backend/ ./

# Copy built frontend from stage 1
COPY --from=frontend-build /app/backend/public ./public

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R node:node /app/data

# Switch to non-root user
USER node

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "server.js"]
```

**Step 2: Create docker-compose.yml**

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  gymflow:
    build: .
    container_name: gymflow
    ports:
      - "8080:8080"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - DB_PATH=/app/data/gymflow.db
      - PORT=8080
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:8080/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]
      interval: 30s
      timeout: 3s
      retries: 3
```

**Step 3: Create .dockerignore**

Create `.dockerignore`:

```
node_modules
npm-debug.log
.git
.gitignore
*.md
.DS_Store
data
dist
.worktrees
.claude
```

**Step 4: Test Docker build**

Build image:
```bash
docker build -t gymflow:latest .
```

Expected: Multi-stage build completes successfully

Run container:
```bash
docker-compose up -d
```

Test:
```bash
curl http://localhost:8080/health
```
Expected: `{"status":"ok","timestamp":"..."}`

Visit: http://localhost:8080
Expected: Full GymFlow app loads, can log workouts

**Step 5: Test data persistence**

Create a workout log
Stop container: `docker-compose down`
Start container: `docker-compose up -d`
Verify log still exists

**Step 6: Commit**

```bash
git add Dockerfile docker-compose.yml .dockerignore
git commit -m "feat(docker): add multi-stage Dockerfile and compose config

- Multi-stage build (frontend → production server)
- Volume mount for persistent SQLite database
- Health check endpoint monitoring
- Non-root user for security
- Docker Compose for easy deployment

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 19: Documentation

**Files:**
- Create: `README.md`

**Step 1: Create README**

Create `README.md` in project root:

```markdown
# GymFlow v2

Minimalist, ultra-fast workout tracker with sub-5-second logging. Self-hosted PWA optimized for mobile, one-thumb navigation.

## Features

- **Three-tap logging**: Home → Category → Exercise → Log (< 5 seconds)
- **Smart pre-fill**: Form auto-fills from your last workout
- **Offline-first**: PWA with service worker caching
- **Zero friction**: No logins, no confirmations, no interruptions
- **Self-hosted**: Your data stays on your server
- **Mobile-optimized**: One-thumb navigation, large tap targets

## Tech Stack

- **Frontend**: React 18, Vite, Pico.css, React Router
- **Backend**: Node.js 20, Express, SQLite (better-sqlite3)
- **Deployment**: Docker, Docker Compose
- **PWA**: Service Worker, Web App Manifest

## Quick Start

### Prerequisites

- Docker and Docker Compose
- (Optional) Tailscale for secure remote access

### Installation

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd gymflow
   ```

2. **Build and run**
   ```bash
   docker-compose up -d
   ```

3. **Access app**
   - Local: http://localhost:8080
   - Tailscale: http://<tailscale-ip>:8080

4. **Install as PWA**
   - Desktop: Click install button in address bar
   - Mobile: Tap "Add to Home Screen" in browser menu

### Data Persistence

Database is stored in `./data/gymflow.db` (git-ignored). Backup this file to preserve your workout history.

## Development

### Backend Development

```bash
cd backend
npm install
npm run dev
```

Server runs on http://localhost:8080 with hot-reload.

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

Vite dev server runs on http://localhost:5173 with API proxy to backend.

### Building for Production

```bash
cd frontend
npm run build
```

Outputs to `backend/public/` for serving by Express.

## Architecture

### Database Schema

- **categories**: Workout categories (color-coded)
- **exercises**: Exercise definitions with template types
- **logs**: Workout entries with flexible metrics

### Template Types

- **strength**: Weight, Reps, Sets
- **cardio**: Distance, Duration
- **timed**: Duration only
- **bodyweight**: Reps, Sets

### API Endpoints

- `GET /api/categories` - List categories
- `GET /api/exercises?category_id=X` - List exercises
- `GET /api/logs?exercise_id=X` - Recent logs
- `POST /api/logs` - Create log (updates exercise.last_used_at)

See `docs/GymFlow_PRD.md` for complete API specification.

## Admin Features

Access admin panel at http://localhost:8080/admin

- **Manage Categories**: Add, edit, delete, reorder
- **Manage Exercises**: Add, edit, delete, filter by category
- **View All Logs**: Browse history, delete incorrect entries

## Performance

Target metrics (achieved):
- Page transitions: < 200ms
- API response: < 50ms
- Log workflow: < 5 seconds
- Initial load: < 1s

## Deployment Notes

### Environment Variables

- `PORT`: Server port (default: 8080)
- `DB_PATH`: SQLite database path (default: `/app/data/gymflow.db`)
- `NODE_ENV`: `production` for optimizations

### Tailscale Setup

1. Install Tailscale on host machine
2. Access GymFlow via Tailscale IP from any device on your network
3. No authentication needed (network-level security)

### Backup

```bash
# Backup database
docker-compose down
cp data/gymflow.db data/gymflow.backup.db

# Restore database
cp data/gymflow.backup.db data/gymflow.db
docker-compose up -d
```

## License

MIT

## Credits

Built with ❤️ for lifters who want to log sets, not navigate menus.
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add comprehensive README with setup and usage

- Quick start guide with Docker commands
- Development instructions for frontend and backend
- Architecture overview and API reference
- Admin features documentation
- Performance targets and deployment notes

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Final Tasks

### Task 20: Final Testing and Polish

**Testing Checklist:**

**Speed Test** (Record with timer):
1. Open app → Tap category → Tap exercise → Modify field → Tap SAVE
2. Target: < 5 seconds from open to saved

**Functional Test**:
- [ ] All template types work (strength, cardio, timed, bodyweight)
- [ ] Recent history displays correctly
- [ ] Form pre-fill from last log
- [ ] Success toast shows for 1 second
- [ ] Back navigation works at all levels
- [ ] Admin CRUD operations work
- [ ] Category reordering updates correctly
- [ ] Delete confirmations appear

**PWA Test**:
- [ ] Install prompt appears
- [ ] Installed app opens in standalone mode
- [ ] Offline mode shows cached UI
- [ ] Service worker caches static assets
- [ ] API calls fail gracefully when offline

**Mobile Test** (use DevTools mobile emulation):
- [ ] Numeric keyboards appear (inputmode="decimal" and "numeric")
- [ ] Large tap targets (44x44px minimum)
- [ ] One-thumb navigation possible
- [ ] No accidental taps (16px spacing)

**Edge Cases**:
- [ ] Empty category shows "No exercises yet"
- [ ] Empty form submission allowed (null metrics)
- [ ] Invalid input coerces to null
- [ ] Delete category cascades to exercises and logs
- [ ] Concurrent edits (last write wins)

**Step 1: Run full test suite manually**

Document any issues found in `docs/testing-notes.md`

**Step 2: Fix any critical issues**

(Address issues as separate commits)

**Step 3: Final commit**

```bash
git add .
git commit -m "chore: final testing and polish for v2.0 release

- Verified < 5 second logging flow
- Tested all template types and CRUD operations
- Confirmed PWA installation and offline support
- Validated mobile UX (touch targets, keyboards)
- Edge case handling verified

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Execution Complete

The implementation plan is now complete. All 20 tasks cover:

✅ **Phase 1**: Backend (SQLite, Express, REST API)
✅ **Phase 2**: Frontend (React, routing, three-tap flow)
✅ **Phase 3**: Admin (CRUD interfaces)
✅ **Phase 4**: PWA (service worker, manifest, icons)
✅ **Phase 5**: Docker (deployment, documentation)

**Estimated total time**: 8-12 hours for experienced developer following plan step-by-step.

**Next step**: Choose execution approach (subagent-driven or parallel session).
