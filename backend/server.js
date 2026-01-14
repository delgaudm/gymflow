import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from './db.js';
import categoriesRouter from './routes/categories.js';
import exercisesRouter from './routes/exercises.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/categories', categoriesRouter);
app.use('/api/exercises', exercisesRouter);

// Serve static frontend (in production)
const publicPath = join(__dirname, 'public');
app.use(express.static(publicPath));

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(join(publicPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`GymFlow server running on http://localhost:${PORT}`);
});
