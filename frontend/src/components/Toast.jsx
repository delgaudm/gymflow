import { useEffect } from 'react';

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 1000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const style = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: type === 'success' ? '#10B981' : '#EF4444',
    color: '#FFFFFF',
    padding: '1.5rem 3rem',
    borderRadius: '0.5rem',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    zIndex: 1000,
    boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
  };

  return <div style={style}>{message}</div>;
}

export default Toast;
