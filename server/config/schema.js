const db = require('./db');

const tableStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS tasks (
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
  )`,
  `CREATE TABLE IF NOT EXISTS end_of_day_reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    reminder_date DATE NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, reminder_date)
  )`
];

const requiredTables = ['users', 'tasks', 'end_of_day_reminders'];

const ensureDatabaseSchema = async () => {
  try {
    for (const statement of tableStatements) {
      await db.query(statement);
    }

    const [tables] = await db.query(
      `SELECT TABLE_NAME
       FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME IN (?, ?, ?)`,
      requiredTables
    );

    const existingTables = tables.map((table) => table.TABLE_NAME);
    const missingTables = requiredTables.filter((table) => !existingTables.includes(table));

    if (missingTables.length > 0) {
      return {
        success: false,
        code: 'DB_SCHEMA_INCOMPLETE',
        message: `Missing table(s): ${missingTables.join(', ')}`
      };
    }

    return {
      success: true,
      message: 'Database schema is ready',
      tables: existingTables
    };
  } catch (error) {
    return {
      success: false,
      code: error.code || 'DB_SCHEMA_FAILED',
      message: error.message
    };
  }
};

module.exports = { ensureDatabaseSchema };
