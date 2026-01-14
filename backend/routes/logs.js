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
      SELECT id, exercise_id, metric_1, metric_2, metric_3, metric_4, notes, created_at
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
        l.metric_4,
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
    const { exercise_id, metric_1, metric_2, metric_3, metric_4, notes } = req.body;

    if (!exercise_id) {
      return res.status(400).json({ error: 'exercise_id is required' });
    }

    // Coerce metric values (permissive validation)
    const m1 = metric_1 !== undefined && metric_1 !== '' ? parseFloat(metric_1) || null : null;
    const m2 = metric_2 !== undefined && metric_2 !== '' ? parseInt(metric_2) || null : null;
    const m3 = metric_3 !== undefined && metric_3 !== '' ? parseInt(metric_3) || null : null;
    const m4 = metric_4 !== undefined && metric_4 !== '' ? parseInt(metric_4) || null : null;

    // Insert log
    const result = db.prepare(
      'INSERT INTO logs (exercise_id, metric_1, metric_2, metric_3, metric_4, notes) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(exercise_id, m1, m2, m3, m4, notes || null);

    // Update exercise.last_used_at
    db.prepare(
      'UPDATE exercises SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(exercise_id);

    const log = db.prepare(`
      SELECT id, exercise_id, metric_1, metric_2, metric_3, metric_4, notes, created_at
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
