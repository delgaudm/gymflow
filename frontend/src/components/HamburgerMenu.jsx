import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const buttonStyle = {
    position: 'relative',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    fontSize: '1.5rem',
    minWidth: '48px',
    minHeight: '48px',
  };

  const dropdownStyle = {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '0.5rem',
    background: 'var(--pico-card-background-color)',
    border: '1px solid var(--pico-card-border-color)',
    borderRadius: 'var(--pico-border-radius)',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
    minWidth: '150px',
    zIndex: 1000,
    overflow: 'hidden',
  };

  const linkStyle = {
    display: 'block',
    padding: '0.75rem 1rem',
    textDecoration: 'none',
    color: 'var(--pico-color)',
    transition: 'background 0.2s',
  };

  const linkHoverStyle = {
    background: 'var(--pico-primary-background)',
  };

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="secondary outline"
        style={buttonStyle}
        aria-label="Menu"
        aria-expanded={isOpen}
      >
        ☰
      </button>

      {isOpen && (
        <div style={dropdownStyle}>
          <Link
            to="/progress"
            style={linkStyle}
            onClick={() => setIsOpen(false)}
            onMouseEnter={(e) => Object.assign(e.target.style, linkHoverStyle)}
            onMouseLeave={(e) => (e.target.style.background = '')}
          >
            Progress
          </Link>
          <Link
            to="/admin"
            style={linkStyle}
            onClick={() => setIsOpen(false)}
            onMouseEnter={(e) => Object.assign(e.target.style, linkHoverStyle)}
            onMouseLeave={(e) => (e.target.style.background = '')}
          >
            Admin
          </Link>
        </div>
      )}
    </div>
  );
}

export default HamburgerMenu;
