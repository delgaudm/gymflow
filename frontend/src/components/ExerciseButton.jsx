import { useNavigate } from 'react-router-dom';

function ExerciseButton({ id, name }) {
  const navigate = useNavigate();

  const style = {
    padding: '1.5rem 1rem',
    minHeight: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    fontSize: '1rem'
  };

  return (
    <button
      style={style}
      onClick={() => navigate(`/entry/${id}`)}
      aria-label={`Log ${name}`}
    >
      {name}
    </button>
  );
}

export default ExerciseButton;
