import pool from "../config/pgDb.js";

function toQuotation(row) {
  if (!row) return null;
  return {
    id: row.id,
    rfqId: row.rfq_id, // camelCase
    vendorId: row.vendor_id, // camelCase
    price: Number(row.price),
    deliveryDays: row.delivery_days, // camelCase
    comments: row.comments,
    status: row.status,
    submittedAt: row.submitted_at,
  };
}

export async function findAllQuotations() {
  const { rows } = await pool.query("SELECT * FROM quotations ORDER BY submitted_at DESC");
  return rows.map(toQuotation);
}

export async function findQuotationById(id) {
  const { rows } = await pool.query("SELECT * FROM quotations WHERE id = $1", [id]);
  return toQuotation(rows[0]);
}

export async function findQuotationsByRfqId(rfqId) {
  const { rows } = await pool.query("SELECT * FROM quotations WHERE rfq_id = $1 ORDER BY price ASC", [rfqId]);
  return rows.map(toQuotation);
}

export async function findQuotationsByVendorId(vendorId) {
  const { rows } = await pool.query("SELECT * FROM quotations WHERE vendor_id = $1 ORDER BY submitted_at DESC", [vendorId]);
  return rows.map(toQuotation);
}

export async function createQuotation(data) {
  const { rows } = await pool.query(
    `INSERT INTO quotations (rfq_id, vendor_id, price, delivery_days, comments, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (rfq_id, vendor_id)
     DO UPDATE SET price = EXCLUDED.price,
                   delivery_days = EXCLUDED.delivery_days,
                   comments = EXCLUDED.comments,
                   status = EXCLUDED.status,
                   submitted_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [
      data.rfqId || data.rfq_id,
      data.vendorId || data.vendor_id,
      data.price,
      data.deliveryDays || data.delivery_days,
      data.comments,
      data.status ?? "Submitted"
    ]
  );
  return toQuotation(rows[0]);
}

export async function updateQuotation(id, fields) {
  const columnMap = {
    price: "price",
    deliveryDays: "delivery_days",
    comments: "comments",
    status: "status"
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

  values.push(id);

  const { rows } = await pool.query(
    `UPDATE quotations SET ${setClauses.join(", ")}
     WHERE id = $${i}
     RETURNING *`,
    values
  );
  return toQuotation(rows[0]);
}
