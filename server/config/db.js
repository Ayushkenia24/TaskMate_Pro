const mysql = require('mysql2');
require('dotenv').config({ quiet: true });

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

pool.getConnection((err, connection) => {
  if (err) {
    console.error('[ERROR] Database connection failed:', err.message);
    return;
  }

  console.log('[OK] MySQL database connected successfully.');
  connection.release();
});

module.exports = promisePool;
