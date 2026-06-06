import pool from "../config/pgDb.js";

function toInvoice(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    poId: row.po_id,
    vendorId: row.vendor_id,
    amount: Number(row.amount),
    taxRate: Number(row.tax_rate),
    status: row.status,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findAllInvoices() {
  const { rows } = await pool.query("SELECT * FROM invoices ORDER BY created_at DESC");
  return rows.map(toInvoice);
}

export async function findInvoiceById(id) {
  const { rows } = await pool.query("SELECT * FROM invoices WHERE id = $1", [id]);
  return toInvoice(rows[0]);
}

export async function findInvoicesByVendorId(vendorId) {
  const { rows } = await pool.query("SELECT * FROM invoices WHERE vendor_id = $1 ORDER BY created_at DESC", [vendorId]);
  return rows.map(toInvoice);
}

export async function createInvoice(data) {
  // Generate sequence code
  const seqResult = await pool.query("SELECT COUNT(*) FROM invoices");
  const count = parseInt(seqResult.rows[0].count) + 1;
  const seq = String(count).padStart(3, "0");
  const code = `INV-2026-${seq}`;

  const { rows } = await pool.query(
    `INSERT INTO invoices (code, po_id, vendor_id, amount, tax_rate, status, due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      code,
      data.poId || data.po_id,
      data.vendorId || data.vendor_id,
      data.amount,
      data.taxRate || data.tax_rate || 18.00,
      data.status ?? "Pending",
      data.dueDate || data.due_date || new Date(Date.now() + 15 * 86400000)
    ]
  );
  return toInvoice(rows[0]);
}

export async function updateInvoiceStatus(id, status) {
  const { rows } = await pool.query(
    `UPDATE invoices SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return toInvoice(rows[0]);
}
