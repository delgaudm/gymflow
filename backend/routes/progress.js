import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET /api/progress/calendar?days=30 - Get workout calendar data
router.get('/calendar', (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysInt = parseInt(days);

    // Get workout counts per day for the last N days
    const workoutDays = db.prepare(`
      SELECT
        DATE(created_at) as date,
        COUNT(DISTINCT exercise_id) as workout_count
      FROM logs
      WHERE created_at >= datetime('now', '-' || ? || ' days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all(daysInt);

    // Count total workout days (days with at least one exercise)
    const totalWorkoutDays = workoutDays.length;

    res.json({
      days: workoutDays,
      total_workout_days: totalWorkoutDays
    });
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    res.status(500).json({ error: 'Failed to fetch calendar data' });
  }
});

// GET /api/progress/daily/:date - Get all logs for a specific date
router.get('/daily/:date', (req, res) => {
  try {
    const { date } = req.params;

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Get all logs for the specified date with exercise and category details
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
        e.template_type,
        c.name as category_name,
        c.color as category_color
      FROM logs l
      JOIN exercises e ON l.exercise_id = e.id
      JOIN categories c ON e.category_id = c.id
      WHERE DATE(l.created_at) = ?
      ORDER BY l.created_at ASC
    `).all(date);

    res.json({
      date,
      logs
    });
  } catch (error) {
    console.error('Error fetching daily logs:', error);
    res.status(500).json({ error: 'Failed to fetch daily logs' });
  }
});

export default router;
