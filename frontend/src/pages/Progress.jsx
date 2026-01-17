import { useAPI } from '../hooks/useAPI';
import ProgressCalendar from '../components/ProgressCalendar';
import HamburgerMenu from '../components/HamburgerMenu';

function Progress() {
  const { data: calendarData, loading, error } = useAPI('/api/progress/calendar?days=30');

  const summaryStyle = {
    textAlign: 'center',
    fontSize: '1.25rem',
    marginTop: '2rem',
    color: 'var(--pico-color)',
  };

  return (
    <main className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Progress</h1>
        <HamburgerMenu />
      </header>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: '#EF4444' }}>Error: {error}</p>}

      {calendarData && (
        <>
          <div style={summaryStyle}>
            <strong>{calendarData.total_workout_days}</strong> workouts in last 30 days
          </div>
          <ProgressCalendar calendarData={calendarData} />
        </>
      )}
    </main>
  );
}

export default Progress;
