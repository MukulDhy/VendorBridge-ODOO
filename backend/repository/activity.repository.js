import pool from "../config/pgDb.js";

function toActivity(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    timestamp: row.timestamp,
  };
}

export async function findAllActivityLogs() {
  const { rows } = await pool.query("SELECT * FROM activity_logs ORDER BY timestamp DESC");
  return rows.map(toActivity);
}

export async function createActivityLog(data) {
  const { rows } = await pool.query(
    `INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [
      data.userId || data.user_id,
      data.action,
      data.entityType || data.entity_type,
      data.entityId || data.entity_id
    ]
  );
  return toActivity(rows[0]);
}
