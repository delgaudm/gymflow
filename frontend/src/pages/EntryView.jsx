import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAPI, apiPost } from '../hooks/useAPI';
import { useFormState } from '../hooks/useFormState';
import Toast from '../components/Toast';

function EntryView() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const { data: exercise } = useAPI(`/api/exercises/${exerciseId}`, [exerciseId]);
  const { data: logs } = useAPI(`/api/logs?exercise_id=${exerciseId}&limit=3`, [exerciseId]);

  const [formData, setFormData, clearFormData] = useFormState(`entry-${exerciseId}`, {
    metric_1: '',
    metric_2: '',
    metric_3: '',
    metric_4: '',
    notes: ''
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);

  const firstInputRef = useRef(null);

  // Pre-fill from most recent log
  useEffect(() => {
    if (logs && logs.length > 0) {
      const lastLog = logs[0];
      setFormData(prev => ({
        metric_1: prev.metric_1 || lastLog.metric_1 || '',
        metric_2: prev.metric_2 || lastLog.metric_2 || '',
        metric_3: prev.metric_3 || lastLog.metric_3 || '',
        metric_4: prev.metric_4 || lastLog.metric_4 || '',
        notes: prev.notes || ''
      }));
    }
  }, [logs]);

  // Auto-focus first input
  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [exercise]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await apiPost('/api/logs', {
        exercise_id: parseInt(exerciseId),
        metric_1: formData.metric_1,
        metric_2: formData.metric_2,
        metric_3: formData.metric_3,
        metric_4: formData.metric_4,
        notes: formData.notes
      });

      clearFormData();
      setShowToast(true);

      // Navigate back after toast
      setTimeout(() => {
        navigate(`/category/${exercise.category_id}`);
      }, 1000);

    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const getFieldLabels = () => {
    if (!exercise) return {};

    switch (exercise.template_type) {
      case 'strength':
        return { m1: 'Weight (lbs)', m2: 'Reps', m3: 'Sets', m4: null };
      case 'cardio':
        return { m1: 'Distance (mi)', m2: 'Duration (min)', m3: null, m4: null };
      case 'cardio_machine':
        return { m1: 'Level', m2: 'Incline', m3: 'Duration (min)', m4: 'Calories' };
      case 'timed':
        return { m1: 'Duration (sec)', m2: null, m3: null, m4: null };
      case 'bodyweight':
        return { m1: 'Reps', m2: 'Sets', m3: null, m4: null };
      default:
        return {};
    }
  };

  const formatLog = (log) => {
    if (!exercise) return '';

    switch (exercise.template_type) {
      case 'strength':
        return `${log.metric_1} lbs × ${log.metric_2} reps × ${log.metric_3} sets`;
      case 'cardio':
        return `${log.metric_1} mi in ${log.metric_2} min`;
      case 'cardio_machine':
        return `Level ${log.metric_1}, Incline ${log.metric_2}, ${log.metric_3} min, ${log.metric_4} cal`;
      case 'timed':
        return `${log.metric_1} seconds`;
      case 'bodyweight':
        return `${log.metric_1} reps × ${log.metric_2} sets`;
      default:
        return '';
    }
  };

  if (!exercise) return <main className="container"><p>Loading...</p></main>;

  const labels = getFieldLabels();

  return (
    <main className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
      {showToast && <Toast message="✓ Saved!" onClose={() => setShowToast(false)} />}

      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={() => navigate(`/category/${exercise.category_id}`)}
          className="secondary outline"
          aria-label="Back to category"
        >
          ← Back
        </button>
        <h2>{exercise.name}</h2>
      </header>

      {logs && logs.length > 0 && (
        <section>
          <h4>Recent History:</h4>
          <ul style={{ color: '#6B7280', fontSize: '0.9rem' }}>
            {logs.map(log => (
              <li key={log.id}>{formatLog(log)}</li>
            ))}
          </ul>
        </section>
      )}

      <form onSubmit={handleSubmit}>
        {labels.m1 && (
          <label>
            {labels.m1}
            <input
              ref={firstInputRef}
              type="text"
              inputMode={exercise.template_type === 'strength' || exercise.template_type === 'cardio' ? 'decimal' : 'numeric'}
              value={formData.metric_1}
              onChange={(e) => handleChange('metric_1', e.target.value)}
            />
          </label>
        )}

        {labels.m2 && (
          <label>
            {labels.m2}
            <input
              type="text"
              inputMode="numeric"
              value={formData.metric_2}
              onChange={(e) => handleChange('metric_2', e.target.value)}
            />
          </label>
        )}

        {labels.m3 && (
          <label>
            {labels.m3}
            <input
              type="text"
              inputMode="numeric"
              value={formData.metric_3}
              onChange={(e) => handleChange('metric_3', e.target.value)}
            />
          </label>
        )}

        {labels.m4 && (
          <label>
            {labels.m4}
            <input
              type="text"
              inputMode="numeric"
              value={formData.metric_4}
              onChange={(e) => handleChange('metric_4', e.target.value)}
            />
          </label>
        )}

        <label>
          Notes (optional)
          <input
            type="text"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder=""
          />
        </label>

        {error && (
          <article style={{ backgroundColor: '#EF4444', color: '#FFF', padding: '1rem' }}>
            <p>Error: {error}</p>
            <button type="submit" disabled={saving}>Retry</button>
          </article>
        )}

        <button
          type="submit"
          disabled={saving}
          style={{
            width: '100%',
            padding: '1.5rem',
            fontSize: '1.25rem',
            marginTop: '1rem'
          }}
        >
          {saving ? 'SAVING...' : 'SAVE'}
        </button>
      </form>
    </main>
  );
}

export default EntryView;
