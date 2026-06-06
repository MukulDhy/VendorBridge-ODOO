// controllers/purchaseOrder.controller.js
import { pool } from "../config/db.js";

// ── shared query: full PO with items + invoice ─────────────────
const PO_DETAIL_SQL = `
  SELECT
    po.id,
    po.po_number        AS "poNumber",
    po.status,
    po.delivery_date    AS "deliveryDate",
    po.notes,
    po.created_at       AS "createdAt",
    po.rfq_id           AS "rfqId",
    r.rfq_number        AS "rfqNumber",
    r.title             AS "rfqTitle",
    po.created_by       AS "createdBy",
    -- aggregate line items
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'id',          i.id,
        'description', i.description,
        'quantity',    i.quantity,
        'unitPrice',   i.unit_price,
        'taxPct',      i.tax_pct,
        'amount',      i.amount
      ) ORDER BY i.id
    )                                              AS items,
    SUM(i.amount)                                  AS subtotal,
    SUM(i.amount * i.tax_pct / 100)                AS "taxAmount",
    SUM(i.amount + i.amount * i.tax_pct / 100)     AS total,
    -- invoice (if generated)
    inv.id              AS "invoiceId",
    inv.invoice_number  AS "invoiceNumber",
    inv.status          AS "invoiceStatus"
  FROM purchase_orders po
  JOIN po_items      i   ON i.po_id   = po.id
  LEFT JOIN rfqs     r   ON r.id      = po.rfq_id
  LEFT JOIN invoices inv ON inv.po_id = po.id
`;

/* ────────────────────────────────────────────────────────────
   GET /api/v1/vendor/purchase-orders
   All POs for the logged-in vendor.
──────────────────────────────────────────────────────────── */
export const getMyPurchaseOrders = async (req, res) => {
  const vendorId = req.user.vendorId;

  try {
    const { rows } = await pool.query(
      `${PO_DETAIL_SQL}
       WHERE po.vendor_id = $1
       GROUP BY po.id, r.rfq_number, r.title,
                inv.id, inv.invoice_number, inv.status
       ORDER BY po.created_at DESC`,
      [vendorId]
    );

    res.status(200).json({ success: true, data: { purchaseOrders: rows } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ────────────────────────────────────────────────────────────
   GET /api/v1/vendor/purchase-orders/:id
   Single PO detail.
──────────────────────────────────────────────────────────── */
export const getPurchaseOrderDetail = async (req, res) => {
  const vendorId = req.user.vendorId;
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `${PO_DETAIL_SQL}
       WHERE po.id = $1 AND po.vendor_id = $2
       GROUP BY po.id, r.rfq_number, r.title,
                inv.id, inv.invoice_number, inv.status`,
      [id, vendorId]
    );

    if (!rows.length) {
      return res
        .status(404)
        .json({ success: false, message: "Purchase order not found" });
    }

    res
      .status(200)
      .json({ success: true, data: { purchaseOrder: rows[0] } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ────────────────────────────────────────────────────────────
   PATCH /api/v1/vendor/purchase-orders/:id/status
   Vendor marks PO as dispatched or delivered.
   Body: { status: 'dispatched' | 'delivered' }
──────────────────────────────────────────────────────────── */
export const updatePOStatus = async (req, res) => {
  const vendorId = req.user.vendorId;
  const { id } = req.params;
  const { status } = req.body;

  const allowed = ["dispatched", "delivered"];
  if (!allowed.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Status must be one of: ${allowed.join(", ")}`,
    });
  }

  try {
    const { rows, rowCount } = await pool.query(
      `UPDATE purchase_orders
       SET status = $1
       WHERE id = $2 AND vendor_id = $3
         AND status NOT IN ('cancelled', 'delivered')
       RETURNING *`,
      [status, id, vendorId]
    );

    if (!rowCount) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found or cannot be updated",
      });
    }

    res
      .status(200)
      .json({ success: true, data: { purchaseOrder: rows[0] } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ────────────────────────────────────────────────────────────
   GET /api/v1/officer/purchase-orders
   [PROCUREMENT OFFICER ONLY] — all POs dashboard.
──────────────────────────────────────────────────────────── */
export const getAllPurchaseOrders = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         po.id, po.po_number AS "poNumber", po.status,
         po.created_at AS "createdAt", po.delivery_date AS "deliveryDate",
         v.company_name AS "vendorName", v.email AS "vendorEmail",
         r.rfq_number AS "rfqNumber", r.title AS "rfqTitle",
         COUNT(i.id)                                     AS "itemCount",
         SUM(i.amount + i.amount * i.tax_pct / 100)      AS total,
         inv.invoice_number AS "invoiceNumber",
         inv.status         AS "invoiceStatus"
       FROM purchase_orders po
       JOIN vendors   v   ON v.id    = po.vendor_id
       JOIN po_items  i   ON i.po_id = po.id
       LEFT JOIN rfqs r   ON r.id    = po.rfq_id
       LEFT JOIN invoices inv ON inv.po_id = po.id
       GROUP BY po.id, v.company_name, v.email,
                r.rfq_number, r.title,
                inv.invoice_number, inv.status
       ORDER BY po.created_at DESC`,
      []
    );

    res
      .status(200)
      .json({ success: true, data: { purchaseOrders: rows } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};