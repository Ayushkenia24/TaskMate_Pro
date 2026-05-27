const express = require('express');
const cors = require('cors');
require('dotenv').config({ quiet: true });

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const reportRoutes = require('./routes/reportRoutes');
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
  ...parseOrigins(process.env.CLIENT_URL),
  ...parseOrigins(process.env.CORS_ORIGINS)
];

// Middleware
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked request from origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));
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

  startAllSchedulers();
});

module.exports = app;
