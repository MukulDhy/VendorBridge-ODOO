// controllers/quotation.controller.js
import { pool } from "../config/db.js";

/* ────────────────────────────────────────────────────────────
   POST /api/v1/vendor/quotations
   Submit (or update) a quotation for an RFQ.
   Body: { rfqId, price, deliveryDays, comments? }
──────────────────────────────────────────────────────────── */
export const submitQuotation = async (req, res) => {
  const vendorId = req.user.vendorId;
  const { rfqId, price, deliveryDays, comments } = req.body;

  if (!rfqId || !price || !deliveryDays) {
    return res.status(400).json({
      success: false,
      message: "rfqId, price, and deliveryDays are required",
    });
  }
  if (Number(price) <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Price must be greater than 0" });
  }
  if (Number(deliveryDays) < 1) {
    return res
      .status(400)
      .json({ success: false, message: "Delivery days must be at least 1" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Verify vendor is assigned and RFQ is still open
    const rfqCheck = await client.query(
      `SELECT r.id, r.status FROM rfqs r
       JOIN rfq_vendors rv ON rv.rfq_id = r.id AND rv.vendor_id = $2
       WHERE r.id = $1`,
      [rfqId, vendorId]
    );

    if (!rfqCheck.rowCount) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        success: false,
        message: "RFQ not found or not assigned to you",
      });
    }
    if (rfqCheck.rows[0].status !== "open") {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "RFQ is no longer accepting quotations",
      });
    }

    // Upsert — one quotation per vendor per RFQ
    const { rows } = await client.query(
      `INSERT INTO quotations (rfq_id, vendor_id, price, delivery_days, comments)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (rfq_id, vendor_id) DO UPDATE SET
         price         = EXCLUDED.price,
         delivery_days = EXCLUDED.delivery_days,
         comments      = EXCLUDED.comments,
         submitted_at  = CURRENT_TIMESTAMP,
         status        = 'submitted'
       RETURNING *`,
      [rfqId, vendorId, price, deliveryDays, comments || null]
    );

    await client.query("COMMIT");
    res
      .status(201)
      .json({ success: true, data: { quotation: rows[0] } });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

/* ────────────────────────────────────────────────────────────
   GET /api/v1/vendor/quotations
   All quotations submitted by the logged-in vendor.
──────────────────────────────────────────────────────────── */
export const getMyQuotations = async (req, res) => {
  const vendorId = req.user.vendorId;

  try {
    const { rows } = await pool.query(
      `SELECT
         q.id,
         q.rfq_id          AS "rfqId",
         r.rfq_number      AS "rfqNumber",
         r.title           AS "rfqTitle",
         r.quantity,
         r.unit,
         r.deadline,
         q.price,
         q.delivery_days   AS "deliveryDays",
         q.comments,
         q.status,
         q.submitted_at    AS "submittedAt"
       FROM quotations q
       JOIN rfqs r ON r.id = q.rfq_id
       WHERE q.vendor_id = $1
       ORDER BY q.submitted_at DESC`,
      [vendorId]
    );

    res.status(200).json({ success: true, data: { quotations: rows } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ────────────────────────────────────────────────────────────
   DELETE /api/v1/vendor/quotations/:id
   Retract a quotation (only while status = 'submitted').
──────────────────────────────────────────────────────────── */
export const retractQuotation = async (req, res) => {
  const vendorId = req.user.vendorId;
  const { id } = req.params;

  try {
    const { rowCount } = await pool.query(
      `DELETE FROM quotations
       WHERE id = $1 AND vendor_id = $2 AND status = 'submitted'`,
      [id, vendorId]
    );

    if (!rowCount) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found or already processed",
      });
    }

    res
      .status(200)
      .json({ success: true, message: "Quotation retracted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ────────────────────────────────────────────────────────────
   POST /api/v1/officer/rfqs/:rfqId/award/:quotationId
   [PROCUREMENT OFFICER ONLY]
   Accept one quotation → rejects others → creates a PO.
──────────────────────────────────────────────────────────── */
export const awardQuotation = async (req, res) => {
  const { rfqId, quotationId } = req.params;
  const officerMongoId = req.user._id?.toString(); // Mongo ObjectId as string

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Fetch the winning quotation + RFQ details
    const qRes = await client.query(
      `SELECT q.*, r.quantity, r.title, r.unit
       FROM quotations q
       JOIN rfqs r ON r.id = q.rfq_id
       WHERE q.id = $1 AND q.rfq_id = $2`,
      [quotationId, rfqId]
    );
    if (!qRes.rowCount) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ success: false, message: "Quotation not found" });
    }
    const q = qRes.rows[0];

    // Mark winner as accepted, others as rejected
    await client.query(
      `UPDATE quotations SET status = 'accepted' WHERE id = $1`,
      [quotationId]
    );
    await client.query(
      `UPDATE quotations SET status = 'rejected'
       WHERE rfq_id = $1 AND id <> $2`,
      [rfqId, quotationId]
    );

    // Close the RFQ
    await client.query(
      `UPDATE rfqs SET status = 'awarded' WHERE id = $1`,
      [rfqId]
    );

    // Generate sequential PO number: PO-YYYY-NNNN
    const seqRes = await client.query(
      `SELECT COUNT(*) + 1 AS seq FROM purchase_orders
       WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())`
    );
    const poNumber = `PO-${new Date().getFullYear()}-${String(
      seqRes.rows[0].seq
    ).padStart(4, "0")}`;

    // Create PO
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + Number(q.delivery_days));

    const poRes = await client.query(
      `INSERT INTO purchase_orders
         (po_number, rfq_id, quotation_id, vendor_id, created_by,
          status, delivery_date)
       VALUES ($1, $2, $3, $4, $5, 'approved', $6)
       RETURNING *`,
      [
        poNumber,
        rfqId,
        quotationId,
        q.vendor_id,
        officerMongoId,
        deliveryDate.toISOString(),
      ]
    );
    const po = poRes.rows[0];

    // Add line-item derived from the RFQ
    await client.query(
      `INSERT INTO po_items (po_id, description, quantity, unit_price)
       VALUES ($1, $2, $3, $4)`,
      [po.id, q.title, q.quantity, q.price]
    );

    await client.query("COMMIT");
    res.status(201).json({
      success: true,
      message: "Quotation awarded and purchase order created",
      data: { purchaseOrder: po },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

/* ────────────────────────────────────────────────────────────
   GET /api/v1/officer/rfqs/:rfqId/quotations
   [PROCUREMENT OFFICER ONLY]
   All quotations for one RFQ (for the comparison/award view).
──────────────────────────────────────────────────────────── */
export const getRFQQuotations = async (req, res) => {
  const { rfqId } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT
         q.id,
         q.vendor_id     AS "vendorId",
         v.company_name  AS "vendorName",
         v.email         AS "vendorEmail",
         q.price,
         q.delivery_days AS "deliveryDays",
         q.comments,
         q.status,
         q.submitted_at  AS "submittedAt"
       FROM quotations q
       JOIN vendors v ON v.id = q.vendor_id
       WHERE q.rfq_id = $1
       ORDER BY q.price ASC`,
      [rfqId]
    );

    res.status(200).json({ success: true, data: { quotations: rows } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};