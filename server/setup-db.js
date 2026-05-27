const mysql = require('mysql2/promise');
require('dotenv').config({ quiet: true });

const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];

async function setupDatabase() {
  let connection;

  try {
    const missingEnv = requiredEnv.filter((key) => !process.env[key]);
    if (missingEnv.length > 0) {
      throw new Error(`Missing required environment variable(s): ${missingEnv.join(', ')}`);
    }

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 3306,
      ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false }
    });

    console.log('[OK] Connected to MySQL server.');

    const databaseName = mysql.escapeId(process.env.DB_NAME);
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${databaseName}`);
    console.log(`[OK] Database '${process.env.DB_NAME}' created/verified.`);

    await connection.query(`USE ${databaseName}`);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[OK] Users table created/verified.');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        task_name VARCHAR(200) NOT NULL,
        description TEXT,
        task_date DATE NOT NULL,
        task_time TIME NOT NULL,
        status ENUM('pending', 'done', 'late') DEFAULT 'pending',
        alert_count TINYINT DEFAULT 0,
        first_alert_sent_at TIMESTAMP NULL,
        second_alert_sent_at TIMESTAMP NULL,
        third_alert_sent_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_date (user_id, task_date),
        INDEX idx_status (status),
        INDEX idx_alert_count (alert_count, status),
        INDEX idx_task_time (task_date, task_time)
      )
    `);
    console.log('[OK] Tasks table created/verified.');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS end_of_day_reminders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        reminder_date DATE NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_date (user_id, reminder_date)
      )
    `);
    console.log('[OK] End-of-day reminders table created/verified.');

    const [tables] = await connection.query('SHOW TABLES');
    console.log('\nTables in database:');
    tables.forEach((table) => {
      console.log(`- ${Object.values(table)[0]}`);
    });

    console.log('\n[OK] Database setup completed successfully.');
    console.log('Start the server with: npm start\n');
  } catch (error) {
    console.error('[ERROR] Database setup failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();
