// controllers/invoice.controller.js
import { pool } from "../config/db.js";
import nodemailer from "nodemailer";

// ── Email transporter ─────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || "smtp.gmail.com",
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ── Helpers ───────────────────────────────────────────────────
function fmtINR(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 2,
  }).format(amount);
}

function buildInvoiceHTML(inv) {
  const rows = inv.items.map((it) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${it.description}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">${it.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">${fmtINR(it.unitPrice)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">${it.taxPct}%</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">${fmtINR(Number(it.amount) + Number(it.amount) * Number(it.taxPct) / 100)}</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Invoice ${inv.invoiceNumber}</title>
  <style>
    body{font-family:'Segoe UI',sans-serif;margin:0;padding:32px;color:#111827;background:#f9fafb}
    .card{background:#fff;border-radius:12px;padding:40px;box-shadow:0 1px 4px rgba(0,0,0,.08);max-width:720px;margin:auto}
    h1{margin:0 0 4px;font-size:28px;font-weight:700}
    .badge{display:inline-block;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;background:#d1fae5;color:#065f46}
    table{width:100%;border-collapse:collapse;margin-top:24px}
    th{background:#f3f4f6;text-align:left;padding:10px 12px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#6b7280}
    .total-row td{padding:10px 12px;font-weight:700;font-size:16px;border-top:2px solid #111827}
    .muted{color:#6b7280;font-size:13px}
  </style>
</head>
<body>
<div class="card">
  <div style="display:flex;justify-content:space-between;align-items:flex-start">
    <div>
      <h1>Invoice</h1>
      <span class="badge">${inv.invoiceStatus}</span>
    </div>
    <div style="text-align:right">
      <p style="margin:0;font-size:20px;font-weight:700;color:#2563eb">${inv.invoiceNumber}</p>
      <p class="muted">Issued: ${inv.issuedDate}</p>
      ${inv.dueDate ? `<p class="muted">Due: ${inv.dueDate}</p>` : ""}
    </div>
  </div>

  <div style="display:flex;gap:32px;margin-top:28px">
    <div style="flex:1">
      <p class="muted" style="margin:0 0 4px">FROM (Vendor)</p>
      <p style="margin:0;font-weight:600">${inv.vendorName}</p>
      <p class="muted">${inv.vendorEmail}</p>
      <p class="muted">GST: ${inv.vendorGST}</p>
    </div>
    <div style="flex:1">
      <p class="muted" style="margin:0 0 4px">TO (Company)</p>
      <p style="margin:0;font-weight:600">${inv.companyName}</p>
      <p class="muted">${inv.officerEmail}</p>
    </div>
  </div>

  <p class="muted" style="margin-top:16px">PO Reference: <strong>${inv.poNumber}</strong></p>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align:right">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">GST</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr><td colspan="4" style="padding:8px 12px;text-align:right;color:#6b7280">Subtotal</td>
          <td style="padding:8px 12px;text-align:right">${fmtINR(inv.subtotal)}</td></tr>
      <tr><td colspan="4" style="padding:8px 12px;text-align:right;color:#6b7280">GST</td>
          <td style="padding:8px 12px;text-align:right">${fmtINR(inv.taxAmount)}</td></tr>
      <tr class="total-row">
        <td colspan="4" style="text-align:right">Amount Due</td>
        <td style="text-align:right;color:#2563eb">${fmtINR(inv.total)}</td>
      </tr>
    </tfoot>
  </table>

  ${inv.notes ? `<p style="margin-top:24px;color:#6b7280;font-size:13px">${inv.notes}</p>` : ""}
  <p style="margin-top:24px;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px">
    This is a computer-generated invoice.
  </p>
</div>
</body>
</html>`;
}

// ── shared query: full invoice with items ─────────────────────
const INVOICE_DETAIL_SQL = `
  SELECT
    inv.id,
    inv.invoice_number  AS "invoiceNumber",
    inv.status          AS "invoiceStatus",
    inv.issued_date     AS "issuedDate",
    inv.due_date        AS "dueDate",
    inv.subtotal,
    inv.tax_amount      AS "taxAmount",
    inv.total,
    inv.notes,
    po.po_number        AS "poNumber",
    v.company_name      AS "vendorName",
    v.email             AS "vendorEmail",
    v.gst               AS "vendorGST",
    u.name              AS "officerName",
    u.email             AS "officerEmail",
    'Acme Corp'         AS "companyName",
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'description', i.description,
        'quantity',    i.quantity,
        'unitPrice',   i.unit_price,
        'taxPct',      i.tax_pct,
        'amount',      i.amount
      ) ORDER BY i.id
    ) AS items
  FROM invoices inv
  JOIN purchase_orders po ON po.id    = inv.po_id
  JOIN vendors          v  ON v.id    = inv.vendor_id
  JOIN po_items          i  ON i.po_id = po.id
  LEFT JOIN users        u  ON u.id   = po.created_by
`;

/* ────────────────────────────────────────────────────────────
   POST /api/v1/vendor/purchase-orders/:poId/invoice
   Generate invoice for a PO and email it to the procurement officer.
──────────────────────────────────────────────────────────── */
export const generateAndSendInvoice = async (req, res) => {
  const vendorId = req.user.vendorId;
  const { poId } = req.params;
  const { notes, dueDate } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const poRes = await client.query(
      `SELECT
         po.id, po.po_number AS "poNumber", po.status,
         v.id AS "vendorId", v.company_name AS "vendorName",
         v.email AS "vendorEmail", v.gst AS "vendorGST",
         u.name AS "officerName", u.email AS "officerEmail",
         'Acme Corp' AS "companyName",
         JSON_AGG(
           JSON_BUILD_OBJECT(
             'description', i.description, 'quantity', i.quantity,
             'unitPrice', i.unit_price, 'taxPct', i.tax_pct, 'amount', i.amount
           ) ORDER BY i.id
         ) AS items,
         SUM(i.amount)                              AS subtotal,
         SUM(i.amount * i.tax_pct / 100)            AS "taxAmount",
         SUM(i.amount + i.amount * i.tax_pct / 100) AS total
       FROM purchase_orders po
       JOIN vendors  v  ON v.id    = po.vendor_id
       JOIN po_items i  ON i.po_id = po.id
       LEFT JOIN users u ON u.id   = po.created_by
       WHERE po.id = $1 AND po.vendor_id = $2
       GROUP BY po.id, po.po_number, po.status,
                v.id, v.company_name, v.email, v.gst,
                u.name, u.email`,
      [poId, vendorId]
    );

    if (!poRes.rowCount) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ success: false, message: "Purchase order not found" });
    }
    const po = poRes.rows[0];

    const existing = await client.query(
      "SELECT id, invoice_number AS \"invoiceNumber\" FROM invoices WHERE po_id = $1",
      [poId]
    );
    if (existing.rowCount) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "Invoice already exists",
        data: {
          invoiceId:     existing.rows[0].id,
          invoiceNumber: existing.rows[0].invoiceNumber,
        },
      });
    }

    const seqRes = await client.query(
      `SELECT COUNT(*) + 1 AS seq FROM invoices
       WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())`
    );
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(seqRes.rows[0].seq).padStart(4, "0")}`;

    const { rows } = await client.query(
      `INSERT INTO invoices
         (invoice_number, po_id, vendor_id, issued_date, due_date,
          subtotal, tax_amount, total, status, notes)
       VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, 'unpaid', $8)
       RETURNING *`,
      [invoiceNumber, poId, vendorId, dueDate || null,
       po.subtotal, po.taxAmount, po.total, notes || null]
    );
    const invoice = rows[0];

    await client.query("COMMIT");

    // Send email non-blocking — does not affect the API response
    const invData = {
      ...po,
      invoiceNumber,
      invoiceStatus: "unpaid",
      issuedDate: new Date().toLocaleDateString("en-IN"),
      dueDate: dueDate || null,
      notes,
    };
    transporter.sendMail({
      from:    `"${po.vendorName}" <${process.env.SMTP_USER}>`,
      to:      po.officerEmail,
      subject: `Invoice ${invoiceNumber} for PO ${po.poNumber}`,
      html:    buildInvoiceHTML(invData),
    }).catch((err) => {
      console.error("Invoice email failed (non-fatal):", err.message);
    });

    res.status(201).json({
      success: true,
      data: { invoice, invoiceNumber },
      message: "Invoice generated and emailed to procurement officer",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

/* ────────────────────────────────────────────────────────────
   GET /api/v1/vendor/invoices
   All invoices for the logged-in vendor.
──────────────────────────────────────────────────────────── */
export const getMyInvoices = async (req, res) => {
  const vendorId = req.user.vendorId;

  try {
    const { rows } = await pool.query(
      `SELECT
         inv.id,
         inv.invoice_number AS "invoiceNumber",
         inv.issued_date    AS "issuedDate",
         inv.due_date       AS "dueDate",
         inv.subtotal,
         inv.tax_amount     AS "taxAmount",
         inv.total,
         inv.status,
         inv.notes,
         po.po_number       AS "poNumber"
       FROM invoices inv
       JOIN purchase_orders po ON po.id = inv.po_id
       WHERE inv.vendor_id = $1
       ORDER BY inv.issued_date DESC`,
      [vendorId]
    );

    res.status(200).json({ success: true, data: { invoices: rows } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ────────────────────────────────────────────────────────────
   GET /api/v1/vendor/invoices/:id/html
   Rendered HTML for preview / print.
──────────────────────────────────────────────────────────── */
export const getInvoiceHTML = async (req, res) => {
  const vendorId = req.user.vendorId;
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `${INVOICE_DETAIL_SQL}
       WHERE inv.id = $1 AND inv.vendor_id = $2
       GROUP BY inv.id, inv.invoice_number, inv.status, inv.issued_date,
                inv.due_date, inv.subtotal, inv.tax_amount, inv.total,
                inv.notes, po.po_number, v.company_name, v.email, v.gst,
                u.name, u.email`,
      [id, vendorId]
    );

    if (!rows.length) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    res.set("Content-Type", "text/html");
    res.send(buildInvoiceHTML(rows[0]));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};