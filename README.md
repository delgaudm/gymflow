# GymFlow v2

Minimalist, ultra-fast workout tracker with sub-5-second logging. Self-hosted PWA optimized for mobile, one-thumb navigation.

## Features

- **Three-tap logging**: Home → Category → Exercise → Log (< 5 seconds)
- **Smart pre-fill**: Form auto-fills from your last workout
- **Offline-first**: PWA with service worker caching
- **Zero friction**: No logins, no confirmations, no interruptions
- **Self-hosted**: Your data stays on your server
- **Mobile-optimized**: One-thumb navigation, large tap targets

## Tech Stack

- **Frontend**: React 18, Vite, Pico.css, React Router
- **Backend**: Node.js 20, Express, SQLite (better-sqlite3)
- **Deployment**: Docker, Docker Compose
- **PWA**: Service Worker, Web App Manifest

## Quick Start

### Prerequisites

- Docker and Docker Compose
- (Optional) Tailscale for secure remote access

### Installation

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd gymflow
   ```

2. **Build and run**
   ```bash
   docker-compose up -d
   ```

3. **Access app**
   - Local: http://localhost:8080
   - Tailscale: http://<tailscale-ip>:8080

4. **Install as PWA**
   - Desktop: Click install button in address bar
   - Mobile: Tap "Add to Home Screen" in browser menu

### Data Persistence

Database is stored in `./data/gymflow.db` (git-ignored). Backup this file to preserve your workout history.

## Development

### Backend Development

```bash
cd backend
npm install
npm run dev
```

Server runs on http://localhost:8080 with hot-reload.

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

Vite dev server runs on http://localhost:5173 with API proxy to backend.

### Building for Production

```bash
cd frontend
npm run build
```

Outputs to `backend/public/` for serving by Express.

## Architecture

### Database Schema

- **categories**: Workout categories (color-coded)
- **exercises**: Exercise definitions with template types
- **logs**: Workout entries with flexible metrics

### Template Types

- **strength**: Weight, Reps, Sets
- **cardio**: Distance, Duration
- **timed**: Duration only
- **bodyweight**: Reps, Sets

### API Endpoints

- `GET /api/categories` - List categories
- `GET /api/exercises?category_id=X` - List exercises
- `GET /api/logs?exercise_id=X` - Recent logs
- `POST /api/logs` - Create log (updates exercise.last_used_at)

See `docs/GymFlow_PRD.md` for complete API specification.

## Admin Features

Access admin panel at http://localhost:8080/admin

- **Manage Categories**: Add, edit, delete, reorder
- **Manage Exercises**: Add, edit, delete, filter by category
- **View All Logs**: Browse history, delete incorrect entries

## Performance

Target metrics (achieved):
- Page transitions: < 200ms
- API response: < 50ms
- Log workflow: < 5 seconds
- Initial load: < 1s

## Deployment Notes

### Environment Variables

- `PORT`: Server port (default: 8080)
- `DB_PATH`: SQLite database path (default: `/app/data/gymflow.db`)
- `NODE_ENV`: `production` for optimizations

### Tailscale Setup

1. Install Tailscale on host machine
2. Access GymFlow via Tailscale IP from any device on your network
3. No authentication needed (network-level security)

### Backup

```bash
# Backup database
docker-compose down
cp data/gymflow.db data/gymflow.backup.db

# Restore database
cp data/gymflow.backup.db data/gymflow.db
docker-compose up -d
```

## License

MIT

## Credits

Built with ❤️ for lifters who want to log sets, not navigate menus.
