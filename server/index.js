const express = require('express');
const cors = require('cors');
require('dotenv').config({ quiet: true });

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const reportRoutes = require('./routes/reportRoutes');
const db = require('./config/db');
const { ensureDatabaseSchema } = require('./config/schema');
const { startAllSchedulers } = require('./services/taskScheduler');

const app = express();
const PORT = process.env.PORT || 5000;

const parseOrigins = (value) => (
  value
    ? value.split(',').map((origin) => origin.trim()).filter(Boolean)
    : []
);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://taskmate-pro.web.app',
  ...parseOrigins(process.env.CLIENT_URL),
  ...parseOrigins(process.env.CORS_ORIGINS)
];

// Middleware
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`CORS blocked request from origin: ${origin}`);
    return callback(new Error(`CORS blocked request from origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));
// Respond to preflight requests for all routes
// Use '/*' for OPTIONS so path-to-regexp doesn't choke on a bare '*'
app.options('/*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/reports', reportRoutes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'TaskMate Pro API',
    health: '/api/health'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'TaskMate Pro API is running!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health/db', async (req, res) => {
  const health = await db.getDatabaseHealth();
  const status = health.success ? 200 : 503;

  res.status(status).json({
    success: health.success,
    message: health.success ? health.message : 'Database connection failed',
    code: health.success ? undefined : health.code,
    details: process.env.NODE_ENV === 'development' && !health.success ? health.message : undefined,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health/schema', async (req, res) => {
  const schema = await ensureDatabaseSchema();
  const status = schema.success ? 200 : 503;

  res.status(status).json({
    success: schema.success,
    message: schema.success ? schema.message : 'Database schema check failed',
    code: schema.success ? undefined : schema.code,
    details: process.env.NODE_ENV === 'development' && !schema.success ? schema.message : undefined,
    timestamp: new Date().toISOString()
  });
});

// 404 handler - catch all unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log('TaskMate Pro server running');
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  ensureDatabaseSchema().then((schema) => {
    if (!schema.success) {
      console.error('[ERROR] Database schema check failed:', schema.code, schema.message);
      return;
    }

    console.log('[OK] Database schema is ready.');
    startAllSchedulers();
  });
});

module.exports = app;
