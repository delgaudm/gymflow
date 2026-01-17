import { useParams, useNavigate } from 'react-router-dom';
import { useAPI } from '../hooks/useAPI';
import { formatMetrics, formatTime } from '../utils/formatMetrics';
import TrendIndicator from '../components/TrendIndicator';
import HamburgerMenu from '../components/HamburgerMenu';

function ExerciseHistory() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useAPI(`/api/exercise/${exerciseId}/history`);

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  };

  const navStyle = {
    marginBottom: '2rem',
  };

  const exerciseLogStyle = (color) => ({
    borderLeft: `4px solid ${color}`,
    padding: '1rem',
    marginBottom: '1rem',
    background: 'var(--pico-card-background-color)',
    borderRadius: '4px',
  });

  const dateStyle = {
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    fontSize: '1rem',
  };

  const metricsStyle = {
    color: 'var(--pico-muted-color)',
    fontSize: '0.9rem',
    marginBottom: '0.25rem',
  };

  const timestampStyle = {
    color: 'var(--pico-muted-color)',
    fontSize: '0.8rem',
  };

  const notesStyle = {
    marginTop: '0.5rem',
    fontStyle: 'italic',
    fontSize: '0.9rem',
  };

  return (
    <main className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <header style={headerStyle}>
        <h1>Exercise History</h1>
        <HamburgerMenu />
      </header>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: '#EF4444' }}>Error: {error}</p>}

      {data && (
        <>
          <h2>{data.exercise.name}</h2>

          <nav style={navStyle}>
            <button onClick={() => navigate(-1)} className="secondary outline">
              ← Back
            </button>
          </nav>

          <TrendIndicator trend={data.trend} templateType={data.exercise.template_type} />

          {data.logs && data.logs.length === 0 && (
            <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--pico-muted-color)' }}>
              No workout history for this exercise yet
            </p>
          )}

          {data.logs && data.logs.length > 0 && (
            <div>
              <h3>Workout History</h3>
              {data.logs.map((log) => (
                <div key={log.id} style={exerciseLogStyle(data.exercise.category_color)}>
                  <div style={dateStyle}>
                    {new Date(log.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                  <div style={metricsStyle}>
                    {formatMetrics(data.exercise.template_type, {
                      metric_1: log.metric_1,
                      metric_2: log.metric_2,
                      metric_3: log.metric_3,
                      metric_4: log.metric_4,
                    })}
                  </div>
                  <div style={timestampStyle}>{formatTime(log.created_at)}</div>
                  {log.notes && (
                    <div style={notesStyle}>
                      Note: {log.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default ExerciseHistory;
