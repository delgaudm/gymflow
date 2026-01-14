import { useNavigate } from 'react-router-dom';

function CategoryCard({ id, name, color }) {
  const navigate = useNavigate();

  const style = {
    backgroundColor: color,
    color: '#FFFFFF',
    padding: '2rem',
    borderRadius: '0.5rem',
    textAlign: 'center',
    cursor: 'pointer',
    border: 'none',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    minHeight: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  return (
    <button
      style={style}
      onClick={() => navigate(`/category/${id}`)}
      aria-label={`View ${name} exercises`}
    >
      {name}
    </button>
  );
}

export default CategoryCard;
