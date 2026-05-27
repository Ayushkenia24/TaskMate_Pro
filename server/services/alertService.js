const { sendSMS } = require('../config/twilio');
const db = require('../config/db');

// Send first alert when the task time arrives.
const sendFirstAlert = async (taskId, userPhone, userName, taskName, taskTime) => {
  try {
    const formattedTime = new Date(`2000-01-01 ${taskTime}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const message = `TaskMate Pro - Alert 1/3\n\nHi ${userName}!\n\nIt's time for: "${taskName}"\nScheduled at: ${formattedTime}\n\nComplete it now to stay on track.\n\n- TaskMate Pro`;

    const result = await sendSMS(userPhone, message);

    if (result.success) {
      await db.query(
        'UPDATE tasks SET alert_count = 1, first_alert_sent_at = NOW() WHERE id = ?',
        [taskId]
      );

      console.log(`[OK] First alert sent for task ${taskId}: "${taskName}"`);
      return { success: true };
    }

    console.error(`[ERROR] Failed to send first alert for task ${taskId}`);
    return { success: false, error: result.error };
  } catch (error) {
    console.error('[ERROR] First alert error:', error.message);
    return { success: false, error: error.message };
  }
};

// Send second alert 10 minutes after the first alert.
const sendSecondAlert = async (taskId, userPhone, userName, taskName) => {
  try {
    const message = `TaskMate Pro - Reminder 2/3\n\nHi ${userName}!\n\nYou have a pending task: "${taskName}"\n\nThis is your second reminder. Please complete it soon to avoid marking it as late.\n\n- TaskMate Pro`;

    const result = await sendSMS(userPhone, message);

    if (result.success) {
      await db.query(
        'UPDATE tasks SET alert_count = 2, second_alert_sent_at = NOW() WHERE id = ?',
        [taskId]
      );

      console.log(`[OK] Second alert sent for task ${taskId}: "${taskName}"`);
      return { success: true };
    }

    console.error(`[ERROR] Failed to send second alert for task ${taskId}`);
    return { success: false, error: result.error };
  } catch (error) {
    console.error('[ERROR] Second alert error:', error.message);
    return { success: false, error: error.message };
  }
};

// Send third alert 10 minutes after the second alert.
const sendThirdAlert = async (taskId, userPhone, userName, taskName) => {
  try {
    const message = `TaskMate Pro - Final Reminder 3/3\n\nHi ${userName}!\n\nTask: "${taskName}"\n\nThis is your final reminder. If not completed, this task will be marked as late.\n\nPlease complete it now.\n\n- TaskMate Pro`;

    const result = await sendSMS(userPhone, message);

    if (result.success) {
      await db.query(
        'UPDATE tasks SET alert_count = 3, third_alert_sent_at = NOW() WHERE id = ?',
        [taskId]
      );

      console.log(`[OK] Third alert sent for task ${taskId}: "${taskName}"`);
      return { success: true };
    }

    console.error(`[ERROR] Failed to send third alert for task ${taskId}`);
    return { success: false, error: result.error };
  } catch (error) {
    console.error('[ERROR] Third alert error:', error.message);
    return { success: false, error: error.message };
  }
};

// Send end-of-day reminder once per user per day.
const sendEndOfDayReminder = async (userPhone, userName, userId, date) => {
  try {
    const [existing] = await db.query(
      `SELECT id FROM end_of_day_reminders
       WHERE user_id = ? AND reminder_date = ?
       LIMIT 1`,
      [userId, date]
    );

    if (existing.length > 0) {
      console.log(`[SKIP] End-of-day reminder already sent to ${userName} for ${date}`);
      return { success: true, alreadySent: true };
    }

    const message = `Great job ${userName}!\n\nYou've completed all your tasks for today.\n\nLet's build tomorrow's list and keep the momentum going.\n\n- TaskMate Pro`;

    const result = await sendSMS(userPhone, message);

    if (result.success) {
      await db.query(
        'INSERT INTO end_of_day_reminders (user_id, reminder_date) VALUES (?, ?)',
        [userId, date]
      );

      console.log(`[OK] End-of-day reminder sent to ${userName} for ${date}`);
      return { success: true };
    }

    return { success: false, error: result.error };
  } catch (error) {
    console.error('[ERROR] End-of-day reminder error:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendFirstAlert,
  sendSecondAlert,
  sendThirdAlert,
  sendEndOfDayReminder
};
