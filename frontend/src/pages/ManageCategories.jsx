import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAPI, apiPost, apiPut, apiDelete } from '../hooks/useAPI';

function ManageCategories() {
  const navigate = useNavigate();
  const { data: categories, loading, error } = useAPI('/api/categories');
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', color: '#3B82F6' });
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const maxSort = categories ? Math.max(...categories.map(c => c.sort_order), 0) : 0;
      await apiPost('/api/categories', { ...formData, sort_order: maxSort + 1 });
      setShowAddForm(false);
      setFormData({ name: '', color: '#3B82F6' });
      setRefreshKey(k => k + 1);
      window.location.reload(); // Simple refresh for now
    } catch (err) {
      alert('Error adding category: ' + err.message);
    }
  };

  const handleEdit = async (id, updates) => {
    try {
      await apiPut(`/api/categories/${id}`, updates);
      setEditingId(null);
      window.location.reload();
    } catch (err) {
      alert('Error updating category: ' + err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}" and all its exercises/logs?`)) return;

    try {
      await apiDelete(`/api/categories/${id}`);
      window.location.reload();
    } catch (err) {
      alert('Error deleting category: ' + err.message);
    }
  };

  const handleReorder = async (id, direction) => {
    const index = categories.findIndex(c => c.id === id);
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const current = categories[index];
    const target = categories[targetIndex];

    try {
      await apiPut(`/api/categories/${current.id}`, { sort_order: target.sort_order });
      await apiPut(`/api/categories/${target.id}`, { sort_order: current.sort_order });
      window.location.reload();
    } catch (err) {
      alert('Error reordering: ' + err.message);
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
        <h2>Manage Categories</h2>
      </header>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: '#EF4444' }}>Error: {error}</p>}

      <button
        onClick={() => setShowAddForm(!showAddForm)}
        style={{ width: '100%', marginBottom: '1rem' }}
      >
        {showAddForm ? 'Cancel' : '+ Add New Category'}
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
            Color
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            />
          </label>
          <button type="submit">Save Category</button>
        </form>
      )}

      {categories && categories.map((cat, idx) => (
        <div
          key={cat.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem',
            padding: '1rem',
            border: '1px solid #ccc',
            borderRadius: '0.25rem'
          }}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              backgroundColor: cat.color,
              borderRadius: '0.25rem'
            }}
          />
          <span style={{ flex: 1 }}>{cat.name}</span>

          <button
            onClick={() => handleReorder(cat.id, 'up')}
            disabled={idx === 0}
            className="secondary outline"
            style={{ padding: '0.25rem 0.5rem' }}
          >
            ↑
          </button>
          <button
            onClick={() => handleReorder(cat.id, 'down')}
            disabled={idx === categories.length - 1}
            className="secondary outline"
            style={{ padding: '0.25rem 0.5rem' }}
          >
            ↓
          </button>

          <button
            onClick={() => setEditingId(editingId === cat.id ? null : cat.id)}
            className="secondary outline"
            style={{ padding: '0.25rem 0.5rem' }}
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(cat.id, cat.name)}
            className="secondary"
            style={{ padding: '0.25rem 0.5rem' }}
          >
            ×
          </button>
        </div>
      ))}
    </main>
  );
}

export default ManageCategories;
