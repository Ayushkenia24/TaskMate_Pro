const mysql = require('mysql2');
require('dotenv').config({ quiet: true });

console.log('--- DEBUGGING CONNECTION VARIABLES ---');
console.log('DB_HOST:', `"${process.env.DB_HOST}"`);
console.log('DB_PORT:', `"${process.env.DB_PORT || 3306}"`);
console.log('DB_USER:', `"${process.env.DB_USER}"`);
console.log('DB_NAME:', `"${process.env.DB_NAME}"`);
console.log('--------------------------------------');

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false }
});

console.log('Attempting to connect...');
connection.connect((err) => {
  if (err) {
    console.error('[ERROR] CONNECTION FAILED:', err.code);
    console.error('Error details:', err.message);
  } else {
    console.log('[OK] CONNECTED SUCCESSFULLY!');
    connection.end();
  }
});
