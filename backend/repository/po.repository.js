import pool from "../config/pgDb.js";

function toPO(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    rfqId: row.rfq_id,
    quotationId: row.quotation_id,
    vendorId: row.vendor_id,
    items: typeof row.items === "string" ? JSON.parse(row.items) : row.items,
    taxRate: Number(row.tax_rate),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findAllPOs() {
  const { rows } = await pool.query("SELECT * FROM purchase_orders ORDER BY created_at DESC");
  return rows.map(toPO);
}

export async function findPOById(id) {
  const { rows } = await pool.query("SELECT * FROM purchase_orders WHERE id = $1", [id]);
  return toPO(rows[0]);
}

export async function findPOsByVendorId(vendorId) {
  const { rows } = await pool.query("SELECT * FROM purchase_orders WHERE vendor_id = $1 ORDER BY created_at DESC", [vendorId]);
  return rows.map(toPO);
}

export async function createPO(data) {
  // Generate sequence code
  const seqResult = await pool.query("SELECT COUNT(*) FROM purchase_orders");
  const count = parseInt(seqResult.rows[0].count) + 1;
  const seq = String(count).padStart(3, "0");
  const code = `PO-2026-${seq}`;

  const { rows } = await pool.query(
    `INSERT INTO purchase_orders (code, rfq_id, quotation_id, vendor_id, items, tax_rate, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      code,
      data.rfqId || data.rfq_id,
      data.quotationId || data.quotation_id,
      data.vendorId || data.vendor_id,
      JSON.stringify(data.items),
      data.taxRate || data.tax_rate || 18.00,
      data.status ?? "Issued"
    ]
  );
  return toPO(rows[0]);
}

export async function updatePOStatus(id, status) {
  const { rows } = await pool.query(
    `UPDATE purchase_orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return toPO(rows[0]);
}
