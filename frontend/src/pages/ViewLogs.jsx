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
      case 'cardio_machine':
        return `L${log.metric_1 || 0} I${log.metric_2 || 0} ${log.metric_3 || 0}min ${log.metric_4 || 0}cal`;
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
