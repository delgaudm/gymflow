import { getTrendMetricName, formatTrendMetric } from '../utils/formatMetrics';

function TrendIndicator({ trend, templateType }) {
  if (!trend) {
    return null;
  }

  // Not enough data state
  if (trend.direction === null || trend.session_count < 16) {
    const remaining = Math.max(0, 16 - trend.session_count);

    return (
      <div style={styles.card(null)}>
        <div style={styles.icon}>ℹ️</div>
        <div style={styles.content}>
          <div style={styles.status}>Not enough data</div>
          <div style={styles.context}>
            {remaining > 0
              ? `Log ${remaining} more workout${remaining > 1 ? 's' : ''} to see your trend`
              : 'Keep logging to see your trend'
            }
          </div>
        </div>
      </div>
    );
  }

  // Determine display based on trend direction
  const config = {
    improving: {
      icon: '↗️',
      status: 'Improving',
      color: 'var(--pico-primary-background)',
    },
    maintaining: {
      icon: '→',
      status: 'Maintaining',
      color: 'var(--pico-secondary-background)',
    },
    declining: {
      icon: '↘️',
      status: 'Declining',
      color: 'rgba(245, 158, 11, 0.2)', // Orange, not red - less judgmental
    },
  };

  const display = config[trend.direction] || config.maintaining;
  const metricName = getTrendMetricName(templateType);

  return (
    <div style={styles.card(display.color)}>
      <div style={styles.icon}>{display.icon}</div>
      <div style={styles.content}>
        <div style={styles.status}>{display.status}</div>
        <div style={styles.context}>
          Based on your last 8 vs previous 8 workouts
        </div>
        <div style={styles.metrics}>
          <div style={styles.metricRow}>
            <span style={styles.metricLabel}>Recent avg:</span>
            <span style={styles.metricValue}>
              {formatTrendMetric(templateType, trend.recent_avg)}
            </span>
          </div>
          <div style={styles.metricRow}>
            <span style={styles.metricLabel}>Previous avg:</span>
            <span style={styles.metricValue}>
              {formatTrendMetric(templateType, trend.previous_avg)}
            </span>
          </div>
          <div style={styles.metricRow}>
            <span style={styles.metricLabel}>Change:</span>
            <span style={styles.metricValue}>
              {trend.percent_change > 0 ? '+' : ''}
              {trend.percent_change.toFixed(1)}%
            </span>
          </div>
        </div>
        <div style={styles.tracking}>
          Tracking {metricName}
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: (bgColor) => ({
    background: bgColor || 'var(--pico-card-background-color)',
    border: '1px solid var(--pico-card-border-color)',
    borderRadius: 'var(--pico-border-radius)',
    padding: '1.5rem',
    marginBottom: '2rem',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    minHeight: '60px',
  }),
  icon: {
    fontSize: '2em',
    lineHeight: 1,
    flexShrink: 0,
  },
  content: {
    flex: 1,
  },
  status: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
  },
  context: {
    color: 'var(--pico-muted-color)',
    fontSize: '0.875rem',
    marginBottom: '1rem',
  },
  metrics: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  metricRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.9rem',
  },
  metricLabel: {
    color: 'var(--pico-muted-color)',
  },
  metricValue: {
    fontWeight: 'bold',
  },
  tracking: {
    fontSize: '0.875rem',
    color: 'var(--pico-muted-color)',
    fontStyle: 'italic',
  },
};

export default TrendIndicator;
