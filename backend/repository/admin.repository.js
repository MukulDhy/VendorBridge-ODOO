import pool from "../config/pgDb.js";
import bcrypt from "bcryptjs";

function toUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    phone: row.phone,
    profilePicture: row.profile_picture,
    vendorId: row.vendor_id,
    isEmailVerified: row.is_email_verified,
    isActive: row.is_active,
    createdAt: row.created_at
  };
}

export async function findAllUsers() {
  const { rows } = await pool.query("SELECT * FROM users ORDER BY created_at DESC");
  return rows.map(toUser);
}

export async function createUserByAdmin(data) {
  const hashedPw = await bcrypt.hash(data.password || "Password123!", 12);
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password, role, phone, vendor_id, is_email_verified)
     VALUES ($1, $2, $3, $4, $5, $6, TRUE)
     RETURNING *`,
    [
      data.name,
      data.email,
      hashedPw,
      data.role,
      data.phone || null,
      data.vendorId || data.vendor_id || null
    ]
  );
  return toUser(rows[0]);
}

export async function updateUserByAdmin(id, fields) {
  const columnMap = {
    name: "name",
    email: "email",
    role: "role",
    phone: "phone",
    vendorId: "vendor_id",
    isActive: "is_active"
  };

  const setClauses = [];
  const values = [];
  let i = 1;

  for (const [key, val] of Object.entries(fields)) {
    const col = columnMap[key];
    if (!col) continue;

    values.push(val);
    setClauses.push(`${col} = $${i++}`);
  }

  if (setClauses.length === 0) return null;

  setClauses.push(`updated_at = NOW()`);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE users SET ${setClauses.join(", ")}
     WHERE id = $${i}
     RETURNING *`,
    values
  );
  return toUser(rows[0]);
}

export async function deleteUserByAdmin(id) {
  await pool.query("DELETE FROM users WHERE id = $1", [id]);
  return true;
}
