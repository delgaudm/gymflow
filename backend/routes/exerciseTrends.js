import express from 'express';
import db from '../db.js';

const router = express.Router();

// Calculate metric value based on template type
function calculateMetric(templateType, log) {
  switch (templateType) {
    case 'strength':
      return (log.metric_1 || 0) * (log.metric_2 || 0) * (log.metric_3 || 0);
    case 'bodyweight':
      return (log.metric_1 || 0) * (log.metric_2 || 0);
    case 'cardio':
      return log.metric_1 || 0;
    case 'cardio_machine':
      return log.metric_4 || 0;
    case 'timed':
      return log.metric_1 || 0;
    default:
      return 0;
  }
}

// Determine trend direction based on percentage change
function determineTrend(recentAvg, previousAvg) {
  if (previousAvg === 0) return null;

  const percentChange = ((recentAvg - previousAvg) / previousAvg) * 100;

  if (percentChange > 10) return 'improving';
  if (percentChange < -10) return 'declining';
  return 'maintaining';
}

// Calculate trend from logs
function calculateTrend(logs, templateType) {
  // Filter out logs with invalid/missing metrics
  const validLogs = logs.filter(log => calculateMetric(templateType, log) > 0);

  if (validLogs.length < 16) {
    return {
      direction: null,
      recent_avg: null,
      previous_avg: null,
      percent_change: null,
      session_count: validLogs.length
    };
  }

  // Split into recent (0-7) and previous (8-15)
  const recentLogs = validLogs.slice(0, 8);
  const previousLogs = validLogs.slice(8, 16);

  // Calculate averages
  const recentMetrics = recentLogs.map(log => calculateMetric(templateType, log));
  const previousMetrics = previousLogs.map(log => calculateMetric(templateType, log));

  const recentAvg = recentMetrics.reduce((sum, val) => sum + val, 0) / recentMetrics.length;
  const previousAvg = previousMetrics.reduce((sum, val) => sum + val, 0) / previousMetrics.length;

  const percentChange = ((recentAvg - previousAvg) / previousAvg) * 100;
  const direction = determineTrend(recentAvg, previousAvg);

  return {
    direction,
    recent_avg: Math.round(recentAvg * 10) / 10, // Round to 1 decimal
    previous_avg: Math.round(previousAvg * 10) / 10,
    percent_change: Math.round(percentChange * 10) / 10,
    session_count: validLogs.length
  };
}

// GET /api/exercise/:exerciseId/history - Get exercise history with trend
router.get('/:exerciseId/history', (req, res) => {
  try {
    const { exerciseId } = req.params;

    // Get exercise details
    const exercise = db.prepare(`
      SELECT
        e.id,
        e.name,
        e.template_type,
        c.name as category_name,
        c.color as category_color
      FROM exercises e
      JOIN categories c ON e.category_id = c.id
      WHERE e.id = ?
    `).get(exerciseId);

    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    // Get last 30 logs for display
    const displayLogs = db.prepare(`
      SELECT
        id,
        exercise_id,
        metric_1,
        metric_2,
        metric_3,
        metric_4,
        notes,
        created_at
      FROM logs
      WHERE exercise_id = ?
      ORDER BY created_at DESC
      LIMIT 30
    `).all(exerciseId);

    // Get last 16+ logs for trend calculation
    const trendLogs = db.prepare(`
      SELECT
        metric_1,
        metric_2,
        metric_3,
        metric_4
      FROM logs
      WHERE exercise_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).all(exerciseId);

    // Calculate trend
    const trend = calculateTrend(trendLogs, exercise.template_type);

    res.json({
      exercise,
      trend,
      logs: displayLogs
    });
  } catch (error) {
    console.error('Error fetching exercise history:', error);
    res.status(500).json({ error: 'Failed to fetch exercise history' });
  }
});

export default router;
