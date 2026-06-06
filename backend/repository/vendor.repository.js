import pool from "../config/pgDb.js";

function toVendor(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    gst: row.gst_number, // map to camelCase frontend name
    email: row.email,
    phone: row.phone,
    address: row.address,
    category: row.category,
    status: row.status,
    rating: Number(row.rating),
    onTime: row.on_time, // map to camelCase
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findAllVendors() {
  const { rows } = await pool.query("SELECT * FROM vendors ORDER BY created_at DESC");
  return rows.map(toVendor);
}

export async function findVendorById(id) {
  const { rows } = await pool.query("SELECT * FROM vendors WHERE id = $1", [id]);
  return toVendor(rows[0]);
}

export async function findVendorByEmail(email) {
  const { rows } = await pool.query("SELECT * FROM vendors WHERE email = $1", [email]);
  return toVendor(rows[0]);
}

export async function createVendor(data) {
  const { rows } = await pool.query(
    `INSERT INTO vendors (name, gst_number, email, phone, address, category, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      data.name,
      data.gst || data.gst_number,
      data.email,
      data.phone,
      data.address,
      data.category,
      data.status ?? "Active"
    ]
  );
  return toVendor(rows[0]);
}

export async function updateVendor(id, fields) {
  const columnMap = {
    name: "name",
    gst: "gst_number",
    email: "email",
    phone: "phone",
    address: "address",
    category: "category",
    status: "status",
    rating: "rating",
    onTime: "on_time"
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
    `UPDATE vendors SET ${setClauses.join(", ")}
     WHERE id = $${i}
     RETURNING *`,
    values
  );
  return toVendor(rows[0]);
}

export async function deleteVendor(id) {
  await pool.query("DELETE FROM vendors WHERE id = $1", [id]);
  return true;
}
