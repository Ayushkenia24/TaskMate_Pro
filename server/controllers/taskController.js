const db = require('../config/db');

// Create new task
const createTask = async (req, res) => {
  try {
    const { task_name, description, task_date, task_time } = req.body;
    const userId = req.user.id;

    if (!task_name || !task_date || !task_time) {
      return res.status(400).json({
        success: false,
        message: 'Task name, date, and time are required!'
      });
    }

    const [result] = await db.query(
      'INSERT INTO tasks (user_id, task_name, description, task_date, task_time) VALUES (?, ?, ?, ?, ?)',
      [userId, task_name, description || '', task_date, task_time]
    );

    res.status(201).json({
      success: true,
      message: 'Task created successfully!',
      taskId: result.insertId
    });
  } catch (error) {
    console.error('Task creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating task'
    });
  }
};

// Get all tasks for a user
const getTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.query;

    let query = 'SELECT * FROM tasks WHERE user_id = ?';
    const params = [userId];

    if (date) {
      query += ' AND task_date = ?';
      params.push(date);
    }

    query += ' ORDER BY task_date DESC, task_time ASC';

    const [tasks] = await db.query(query, params);

    res.json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error('Tasks fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching tasks'
    });
  }
};

// Get tasks by date
const getTasksByDate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.params;

    const [tasks] = await db.query(
      'SELECT * FROM tasks WHERE user_id = ? AND task_date = ? ORDER BY task_time ASC',
      [userId, date]
    );

    res.json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error('Tasks by date fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching tasks'
    });
  }
};

// Update task
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { task_name, description, task_date, task_time, status } = req.body;

    const [tasks] = await db.query(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (tasks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or unauthorized'
      });
    }

    const updates = [];
    const params = [];

    if (task_name !== undefined) {
      updates.push('task_name = ?');
      params.push(task_name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (task_date !== undefined) {
      updates.push('task_date = ?');
      params.push(task_date);
    }
    if (task_time !== undefined) {
      updates.push('task_time = ?');
      params.push(task_time);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
      if (status === 'done') {
        updates.push('completed_at = NOW()');
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one task field is required for update'
      });
    }

    params.push(id, userId);

    await db.query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      params
    );

    res.json({
      success: true,
      message: 'Task updated successfully!'
    });
  } catch (error) {
    console.error('Task update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating task'
    });
  }
};

// Mark task as done
const markTaskDone = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [tasks] = await db.query(
      'SELECT alert_count FROM tasks WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (tasks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or unauthorized'
      });
    }

    const task = tasks[0];
    const newStatus = task.alert_count >= 3 ? 'late' : 'done';

    await db.query(
      'UPDATE tasks SET status = ?, completed_at = NOW() WHERE id = ? AND user_id = ?',
      [newStatus, id, userId]
    );

    const message = newStatus === 'late'
      ? 'Task completed but marked as late submission!'
      : 'Task marked as done on time!';

    res.json({
      success: true,
      message,
      isLate: newStatus === 'late'
    });
  } catch (error) {
    console.error('Mark task done error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error marking task done'
    });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [result] = await db.query(
      'DELETE FROM tasks WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or unauthorized'
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully!'
    });
  } catch (error) {
    console.error('Task deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting task'
    });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTasksByDate,
  updateTask,
  markTaskDone,
  deleteTask
};
