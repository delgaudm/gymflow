import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAPI, apiPost, apiDelete } from '../hooks/useAPI';

function ManageExercises() {
  const navigate = useNavigate();
  const { data: categories } = useAPI('/api/categories');
  const [filterCategoryId, setFilterCategoryId] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    template_type: 'strength'
  });

  const exerciseQuery = filterCategoryId === 'all'
    ? '/api/exercises'
    : `/api/exercises?category_id=${filterCategoryId}`;

  const { data: exercises } = useAPI(exerciseQuery, [filterCategoryId]);

  // Add category names to exercises
  const allExercises = (exercises || []).map(ex => {
    const category = categories?.find(cat => cat.id === ex.category_id);
    return { ...ex, category_name: category?.name || 'Unknown Category' };
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await apiPost('/api/exercises', formData);
      setShowAddForm(false);
      setFormData({ name: '', category_id: '', template_type: 'strength' });
      window.location.reload();
    } catch (err) {
      alert('Error adding exercise: ' + err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}" and all its logs?`)) return;

    try {
      await apiDelete(`/api/exercises/${id}`);
      window.location.reload();
    } catch (err) {
      alert('Error deleting exercise: ' + err.message);
    }
  };

  return (
    <main className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={() => navigate('/admin')}
          className="secondary outline"
        >
          ← Back
        </button>
        <h2>Manage Exercises</h2>
      </header>

      {categories && (
        <label>
          Filter by Category
          <select
            value={filterCategoryId}
            onChange={(e) => setFilterCategoryId(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </label>
      )}

      <button
        onClick={() => setShowAddForm(!showAddForm)}
        style={{ width: '100%', marginBottom: '1rem' }}
      >
        {showAddForm ? 'Cancel' : '+ Add New Exercise'}
      </button>

      {showAddForm && (
        <form onSubmit={handleAdd} style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc' }}>
          <label>
            Name
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </label>
          <label>
            Category
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              required
            >
              <option value="">Select category</option>
              {categories?.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </label>
          <label>
            Template Type
            <select
              value={formData.template_type}
              onChange={(e) => setFormData({ ...formData, template_type: e.target.value })}
            >
              <option value="strength">Strength (Weight, Reps, Sets)</option>
              <option value="cardio">Cardio (Distance, Duration)</option>
              <option value="cardio_machine">Cardio Machine (Level, Incline, Duration, Calories)</option>
              <option value="timed">Timed (Duration only)</option>
              <option value="bodyweight">Bodyweight (Reps, Sets)</option>
            </select>
          </label>
          <button type="submit">Save Exercise</button>
        </form>
      )}

      {allExercises.length === 0 && <p style={{ color: '#6B7280' }}>No exercises found</p>}

      {allExercises.map(ex => (
        <div
          key={ex.id}
          style={{
            marginBottom: '1rem',
            padding: '1rem',
            border: '1px solid #ccc',
            borderRadius: '0.25rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <strong>{ex.name}</strong>
              <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                {ex.template_type} • {ex.category_name || 'Unknown Category'}
              </div>
            </div>
            <button
              onClick={() => handleDelete(ex.id, ex.name)}
              className="secondary"
              style={{ padding: '0.25rem 0.5rem' }}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </main>
  );
}

export default ManageExercises;
