// Format metrics based on template type
export function formatMetrics(templateType, metrics) {
  const { metric_1, metric_2, metric_3, metric_4 } = metrics;

  switch (templateType) {
    case 'strength':
      // Weight × Reps × Sets
      return `${metric_1 || 0} lbs × ${metric_2 || 0} reps × ${metric_3 || 0} sets`;

    case 'cardio':
      // Distance in Duration
      return `${metric_1 || 0} miles in ${formatDuration(metric_2)}`;

    case 'cardio_machine':
      // Level X, Incline Y, Duration, Calories
      const parts = [];
      if (metric_1) parts.push(`Level ${metric_1}`);
      if (metric_2) parts.push(`Incline ${metric_2}`);
      if (metric_3) parts.push(formatDuration(metric_3));
      if (metric_4) parts.push(`${metric_4} cal`);
      return parts.join(', ');

    case 'timed':
      // Duration only
      return formatDuration(metric_1);

    case 'bodyweight':
      // Reps × Sets
      return `${metric_1 || 0} reps × ${metric_2 || 0} sets`;

    default:
      return 'Unknown template type';
  }
}

// Format duration in seconds to MM:SS
function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Format date to readable string
export function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00'); // Add time to avoid timezone issues
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// Format time from ISO timestamp
export function formatTime(isoTimestamp) {
  const date = new Date(isoTimestamp);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// Calculate metric value for trend tracking
export function calculateTrendMetric(templateType, metrics) {
  switch (templateType) {
    case 'strength':
      return (metrics.metric_1 || 0) * (metrics.metric_2 || 0) * (metrics.metric_3 || 0);
    case 'bodyweight':
      return (metrics.metric_1 || 0) * (metrics.metric_2 || 0);
    case 'cardio':
      return metrics.metric_1 || 0;
    case 'cardio_machine':
      return metrics.metric_4 || 0;
    case 'timed':
      return metrics.metric_1 || 0;
    default:
      return 0;
  }
}

// Get human-readable metric name for trend display
export function getTrendMetricName(templateType) {
  switch (templateType) {
    case 'strength':
      return 'total volume';
    case 'bodyweight':
      return 'total reps';
    case 'cardio':
      return 'distance';
    case 'cardio_machine':
      return 'calories burned';
    case 'timed':
      return 'duration';
    default:
      return 'metric';
  }
}

// Format trend metric value for display
export function formatTrendMetric(templateType, value) {
  if (!value) return 'N/A';

  switch (templateType) {
    case 'strength':
      return `${value.toLocaleString()} lbs total`;
    case 'bodyweight':
      return `${value} reps total`;
    case 'cardio':
      return `${value.toFixed(1)} miles`;
    case 'cardio_machine':
      return `${value} calories`;
    case 'timed':
      return formatDuration(value);
    default:
      return String(value);
  }
}
