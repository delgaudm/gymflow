import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAPI } from '../hooks/useAPI';
import { formatMetrics, formatDate, formatTime } from '../utils/formatMetrics';
import HamburgerMenu from '../components/HamburgerMenu';

function DailyWorkout() {
  const { date } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useAPI(`/api/progress/daily/${date}`);

  // Calculate previous and next dates
  const currentDate = new Date(date + 'T00:00:00');
  const prevDate = new Date(currentDate);
  prevDate.setDate(prevDate.getDate() - 1);
  const nextDate = new Date(currentDate);
  nextDate.setDate(nextDate.getDate() + 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prevDateStr = prevDate.toISOString().split('T')[0];
  const nextDateStr = nextDate.toISOString().split('T')[0];
  const isNextDateFuture = nextDate > today;

  const navStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
  };

  const navGroupStyle = {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  };

  const exerciseLogStyle = (color) => ({
    borderLeft: `4px solid ${color}`,
    padding: '1rem',
    marginBottom: '1rem',
    background: 'var(--pico-card-background-color)',
    borderRadius: '4px',
  });

  const exerciseNameStyle = {
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    fontSize: '1.1rem',
  };

  const exerciseNameLinkStyle = {
    ...exerciseNameStyle,
    textDecoration: 'none',
    color: 'var(--pico-color)',
    display: 'block',
    cursor: 'pointer',
  };

  const exerciseMetricsStyle = {
    color: 'var(--pico-muted-color)',
    fontSize: '0.9rem',
    marginBottom: '0.25rem',
  };

  const timestampStyle = {
    color: 'var(--pico-muted-color)',
    fontSize: '0.8rem',
  };

  return (
    <main className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Workout Report</h1>
        <HamburgerMenu />
      </header>

      <h2>{formatDate(date)}</h2>

      <nav style={navStyle}>
        <div style={navGroupStyle}>
          <Link to="/progress" role="button" className="secondary outline">
            ← Progress
          </Link>
          <Link to="/" role="button" className="secondary outline">
            Home
          </Link>
        </div>
        <div style={navGroupStyle}>
          <button
            onClick={() => navigate(`/progress/${prevDateStr}`)}
            className="secondary outline"
            aria-label="Previous day"
          >
            ←
          </button>
          <button
            onClick={() => navigate(`/progress/${nextDateStr}`)}
            className="secondary outline"
            disabled={isNextDateFuture}
            aria-label="Next day"
            style={isNextDateFuture ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            →
          </button>
        </div>
      </nav>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: '#EF4444' }}>Error: {error}</p>}

      {data && data.logs && data.logs.length === 0 && (
        <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--pico-muted-color)' }}>
          No workout logged on this day
        </p>
      )}

      {data && data.logs && data.logs.length > 0 && (
        <div>
          {data.logs.map((log) => (
            <div key={log.id} style={exerciseLogStyle(log.category_color)}>
              <Link
                to={`/progress/exercise/${log.exercise_id}`}
                style={exerciseNameLinkStyle}
                onMouseEnter={(e) => (e.target.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.target.style.textDecoration = 'none')}
              >
                {log.exercise_name}
              </Link>
              <div style={exerciseMetricsStyle}>
                {formatMetrics(log.template_type, {
                  metric_1: log.metric_1,
                  metric_2: log.metric_2,
                  metric_3: log.metric_3,
                  metric_4: log.metric_4,
                })}
              </div>
              <div style={timestampStyle}>{formatTime(log.created_at)}</div>
              {log.notes && (
                <div style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
                  Note: {log.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default DailyWorkout;
