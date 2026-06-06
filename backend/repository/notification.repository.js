import pool from "../config/pgDb.js";

function toNotification(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    read: row.read,
    link: row.link,
    createdAt: row.created_at,
  };
}

export async function findNotificationsByUserId(userId) {
  const { rows } = await pool.query(
    "SELECT * FROM notifications WHERE user_id = $1 OR user_id = 'all' ORDER BY created_at DESC",
    [userId]
  );
  return rows.map(toNotification);
}

export async function createNotification(data) {
  const { rows } = await pool.query(
    `INSERT INTO notifications (user_id, title, message, read, link)
     VALUES ($1, $2, $3, FALSE, $4)
     RETURNING *`,
    [
      data.userId || data.user_id,
      data.title,
      data.message,
      data.link
    ]
  );
  return toNotification(rows[0]);
}

export async function markNotificationAsRead(id) {
  const { rows } = await pool.query(
    `UPDATE notifications SET read = TRUE WHERE id = $1 RETURNING *`,
    [id]
  );
  return toNotification(rows[0]);
}
