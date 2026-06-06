import pool from "../config/pgDb.js";

async function toRFQ(row) {
  if (!row) return null;

  // Get assigned vendors for this RFQ
  const { rows: vendorRows } = await pool.query(
    "SELECT vendor_id FROM rfq_vendors WHERE rfq_id = $1",
    [row.id]
  );
  const assignedVendors = vendorRows.map(r => r.vendor_id);

  return {
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    quantity: row.quantity,
    deadline: row.deadline,
    status: row.status,
    createdBy: row.created_by,
    category: row.category,
    assignedVendors,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function findAllRFQs() {
  const { rows } = await pool.query("SELECT * FROM rfqs ORDER BY created_at DESC");
  const rfqs = [];
  for (const row of rows) {
    const rfq = await toRFQ(row);
    if (rfq) rfqs.push(rfq);
  }
  return rfqs;
}

export async function findRFQById(id) {
  const { rows } = await pool.query("SELECT * FROM rfqs WHERE id = $1", [id]);
  return toRFQ(rows[0]);
}

export async function createRFQ(data) {
  // Generate sequence code
  const seqResult = await pool.query("SELECT COUNT(*) FROM rfqs");
  const count = parseInt(seqResult.rows[0].count) + 1;
  const seq = String(count).padStart(3, "0");
  const code = `RFQ-2026-${seq}`;

  const { rows } = await pool.query(
    `INSERT INTO rfqs (code, title, description, quantity, deadline, status, created_by, category)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      code,
      data.title,
      data.description,
      data.quantity,
      data.deadline,
      data.status ?? "Open",
      data.createdBy || data.created_by,
      data.category
    ]
  );

  const rfq = rows[0];

  // Insert assigned vendors
  const assigned = data.assignedVendors || data.assigned_vendors || [];
  for (const vendorId of assigned) {
    await pool.query(
      "INSERT INTO rfq_vendors (rfq_id, vendor_id) VALUES ($1, $2)",
      [rfq.id, vendorId]
    );
  }

  return toRFQ(rfq);
}

export async function updateRFQ(id, fields) {
  const columnMap = {
    title: "title",
    description: "description",
    quantity: "quantity",
    deadline: "deadline",
    status: "status",
    category: "category"
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

  if (setClauses.length > 0) {
    setClauses.push(`updated_at = NOW()`);
    values.push(id);
    await pool.query(
      `UPDATE rfqs SET ${setClauses.join(", ")} WHERE id = $${i}`,
      values
    );
  }

  // Handle updates to assigned vendors if provided
  if (fields.assignedVendors !== undefined) {
    await pool.query("DELETE FROM rfq_vendors WHERE rfq_id = $1", [id]);
    for (const vendorId of fields.assignedVendors) {
      await pool.query(
        "INSERT INTO rfq_vendors (rfq_id, vendor_id) VALUES ($1, $2)",
        [id, vendorId]
      );
    }
  }

  return findRFQById(id);
}

export async function deleteRFQ(id) {
  await pool.query("DELETE FROM rfqs WHERE id = $1", [id]);
  return true;
}
