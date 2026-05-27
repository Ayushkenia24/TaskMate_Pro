const mysql = require('mysql2');
require('dotenv').config({ quiet: true });

const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];

const getMissingEnv = () => requiredEnv.filter((key) => !process.env[key]);

const sslConfig = process.env.DB_SSL === 'false'
  ? undefined
  : { rejectUnauthorized: false };

// Create a MySQL connection pool for better performance.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: sslConfig
});

const promisePool = pool.promise();

const logDatabaseConfig = () => {
  const missing = getMissingEnv();
  const status = requiredEnv
    .map((key) => `${key}=${process.env[key] ? 'set' : 'missing'}`)
    .join(', ');

  console.log(`[DB] Config check: ${status}, DB_PORT=${process.env.DB_PORT || 3306}, DB_SSL=${process.env.DB_SSL || 'true'}`);

  if (missing.length > 0) {
    console.error(`[ERROR] Missing database environment variable(s): ${missing.join(', ')}`);
  }
};

const getDatabaseHealth = async () => {
  const missing = getMissingEnv();
  if (missing.length > 0) {
    return {
      success: false,
      code: 'DB_CONFIG_MISSING',
      message: `Missing database environment variable(s): ${missing.join(', ')}`
    };
  }

  let connection;
  try {
    connection = await promisePool.getConnection();
    await connection.ping();

    return {
      success: true,
      message: 'Database connection is healthy'
    };
  } catch (error) {
    return {
      success: false,
      code: error.code || 'DB_CONNECTION_FAILED',
      message: error.message
    };
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

logDatabaseConfig();

const missingEnv = getMissingEnv();
if (missingEnv.length === 0) {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('[ERROR] Database connection failed:', err.code || 'UNKNOWN', err.message);
      return;
    }

    console.log('[OK] MySQL database connected successfully.');
    connection.release();
  });
} else {
  console.error('[ERROR] Database startup check skipped because configuration is incomplete.');
}

promisePool.getDatabaseHealth = getDatabaseHealth;

module.exports = promisePool;
