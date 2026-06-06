// controllers/vendorRFQ.controller.js
import { pool } from "../config/db.js";

export const getMyRFQs = async (req, res) => {
  const vendorId = req.user.vendorId;

  try {
    const { rows } = await pool.query(
      `SELECT
         r.id,
         r.rfq_number     AS "rfqNumber",
         r.title,
         r.description,
         r.category,
         r.quantity,
         r.unit,
         r.deadline,
         r.status,
         r.created_at     AS "createdAt",
         -- this vendor's own quotation (if any)
         q.id             AS "myQuotationId",
         q.status         AS "myQuotationStatus",
         q.price          AS "myQuotationPrice",
         q.delivery_days  AS "myDeliveryDays"
       FROM rfqs r
       JOIN rfq_vendors rv ON rv.rfq_id = r.id AND rv.vendor_id = $1
       LEFT JOIN quotations q
              ON q.rfq_id = r.id AND q.vendor_id = $1
       WHERE r.status = 'open'
       ORDER BY r.deadline ASC`,
      [vendorId]
    );

    res.status(200).json({ success: true, data: { rfqs: rows } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ────────────────────────────────────────────────────────────
   GET /api/v1/vendor/rfqs/:rfqId
   Single RFQ detail (used by the submit-quotation modal).
──────────────────────────────────────────────────────────── */
export const getRFQDetail = async (req, res) => {
  const vendorId = req.user.vendorId;
  const { rfqId } = req.params;

  try {
    // Make sure this vendor is actually assigned
    const access = await pool.query(
      `SELECT 1 FROM rfq_vendors WHERE rfq_id = $1 AND vendor_id = $2`,
      [rfqId, vendorId]
    );
    if (!access.rowCount) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied" });
    }

    const { rows } = await pool.query(
      `SELECT
         r.*,
         q.id AS "myQuotationId", q.status AS "myQuotationStatus",
         q.price AS "myQuotationPrice", q.delivery_days AS "myDeliveryDays",
         q.comments AS "myComments", q.submitted_at AS "mySubmittedAt"
       FROM rfqs r
       LEFT JOIN quotations q ON q.rfq_id = r.id AND q.vendor_id = $2
       WHERE r.id = $1`,
      [rfqId, vendorId]
    );

    if (!rows.length) {
      return res
        .status(404)
        .json({ success: false, message: "RFQ not found" });
    }

    res.status(200).json({ success: true, data: { rfq: rows[0] } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};