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
