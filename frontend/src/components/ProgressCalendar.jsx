import { useNavigate } from 'react-router-dom';

function ProgressCalendar({ calendarData }) {
  const navigate = useNavigate();

  if (!calendarData || !calendarData.days) {
    return null;
  }

  // Create a map of dates to workout counts for quick lookup
  const workoutMap = {};
  calendarData.days.forEach((day) => {
    workoutMap[day.date] = day.workout_count;
  });

  // Generate array of the last 30 days
  const days = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const dayNum = date.getDate();
    const isToday = i === 0;
    const hasWorkout = workoutMap[dateStr] > 0;

    days.push({
      date: dateStr,
      dayNum,
      isToday,
      hasWorkout,
    });
  }

  // Pad the beginning to start on the correct day of week
  const firstDayOfWeek = new Date(days[0].date).getDay(); // 0 = Sunday
  const paddingDays = Array(firstDayOfWeek).fill(null);

  const allCells = [...paddingDays, ...days];

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '0.5rem',
    maxWidth: '500px',
    margin: '2rem auto',
  };

  const cellStyle = (cell) => {
    const baseStyle = {
      aspectRatio: '1',
      minHeight: '44px',
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.875rem',
      border: 'none',
      padding: 0,
    };

    if (!cell) {
      return { ...baseStyle, background: 'transparent' };
    }

    if (cell.hasWorkout) {
      return {
        ...baseStyle,
        background: 'var(--pico-primary-background)',
        cursor: 'pointer',
        transition: 'opacity 0.2s',
        border: cell.isToday ? '2px solid var(--pico-primary)' : 'none',
      };
    }

    return {
      ...baseStyle,
      background: 'var(--pico-muted-color)',
      opacity: 0.3,
      cursor: 'default',
      border: cell.isToday ? '2px solid var(--pico-primary)' : 'none',
    };
  };

  const handleCellClick = (cell) => {
    if (cell && cell.hasWorkout) {
      navigate(`/progress/${cell.date}`);
    }
  };

  const handleMouseEnter = (e, cell) => {
    if (cell && cell.hasWorkout) {
      e.target.style.opacity = '0.8';
    }
  };

  const handleMouseLeave = (e, cell) => {
    if (cell && cell.hasWorkout) {
      e.target.style.opacity = '1';
    }
  };

  return (
    <div>
      <div style={gridStyle}>
        {allCells.map((cell, index) => (
          <button
            key={index}
            style={cellStyle(cell)}
            onClick={() => handleCellClick(cell)}
            onMouseEnter={(e) => handleMouseEnter(e, cell)}
            onMouseLeave={(e) => handleMouseLeave(e, cell)}
            aria-label={
              cell
                ? `${cell.date}, ${
                    cell.hasWorkout
                      ? `${workoutMap[cell.date]} exercises logged`
                      : 'no workout'
                  }`
                : ''
            }
            disabled={!cell || !cell.hasWorkout}
          >
            {cell ? cell.dayNum : ''}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ProgressCalendar;
