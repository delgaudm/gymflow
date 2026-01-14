import { useNavigate } from 'react-router-dom';

function AdminHome() {
  const navigate = useNavigate();

  const buttonStyle = {
    width: '100%',
    padding: '1.5rem',
    fontSize: '1.1rem',
    marginBottom: '1rem'
  };

  return (
    <main className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={() => navigate('/')}
          className="secondary outline"
          aria-label="Back to home"
        >
          ← Home
        </button>
        <h2>Admin Panel</h2>
      </header>

      <div style={{ marginTop: '2rem' }}>
        <button
          style={buttonStyle}
          onClick={() => navigate('/admin/categories')}
        >
          Manage Categories
        </button>

        <button
          style={buttonStyle}
          onClick={() => navigate('/admin/exercises')}
        >
          Manage Exercises
        </button>

        <button
          style={buttonStyle}
          onClick={() => navigate('/admin/logs')}
        >
          View All Logs
        </button>
      </div>
    </main>
  );
}

export default AdminHome;
