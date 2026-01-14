import { useParams, useNavigate } from 'react-router-dom';
import { useAPI } from '../hooks/useAPI';
import ExerciseButton from '../components/ExerciseButton';

function CategoryView() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { data: exercises, loading, error } = useAPI(`/api/exercises?category_id=${categoryId}`, [categoryId]);
  const { data: category } = useAPI(`/api/categories`);

  const currentCategory = category?.find(c => c.id === parseInt(categoryId));

  return (
    <main className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={() => navigate('/')}
          className="secondary outline"
          aria-label="Back to home"
        >
          ← Back
        </button>
        <h2>{currentCategory?.name || 'Exercises'}</h2>
      </header>

      {loading && <p>Loading exercises...</p>}
      {error && <p style={{ color: '#EF4444' }}>Error: {error}</p>}

      {exercises && exercises.length === 0 && (
        <p style={{ textAlign: 'center', marginTop: '2rem', color: '#6B7280' }}>
          No exercises yet
        </p>
      )}

      {exercises && exercises.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1rem',
          marginTop: '2rem'
        }}>
          {exercises.map(ex => (
            <ExerciseButton key={ex.id} {...ex} />
          ))}
        </div>
      )}
    </main>
  );
}

export default CategoryView;
