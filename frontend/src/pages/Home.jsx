import { useAPI } from '../hooks/useAPI';
import CategoryCard from '../components/CategoryCard';

function Home() {
  const { data: categories, loading, error } = useAPI('/api/categories');

  return (
    <main className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>GymFlow</h1>
        <a href="/admin" role="button" className="secondary outline">Admin</a>
      </header>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: '#EF4444' }}>Error: {error}</p>}

      {categories && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1rem',
          marginTop: '2rem'
        }}>
          {categories.map(cat => (
            <CategoryCard key={cat.id} {...cat} />
          ))}
        </div>
      )}
    </main>
  );
}

export default Home;
