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
