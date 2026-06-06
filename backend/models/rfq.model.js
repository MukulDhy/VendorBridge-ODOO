import pool from "../config/pg_db.js";

export const createRFQInDB = async (rfqData, assignedVendors) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Insert RFQ
    const insertRFQQuery = `
      INSERT INTO rfqs (rfq_title, description, items, deadline, attachments, status, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, rfq_title, description, items, deadline, attachments, status, created_by, created_at, updated_at;
    `;
    const rfqValues = [
      rfqData.rfq_title,
      rfqData.description,
      JSON.stringify(rfqData.items),
      rfqData.deadline,
      rfqData.attachments || [],
      rfqData.status || "draft",
      rfqData.created_by,
    ];
    
    const rfqResult = await client.query(insertRFQQuery, rfqValues);
    const newRFQ = rfqResult.rows[0];

    // Insert assigned vendors
    if (assignedVendors && assignedVendors.length > 0) {
      const vendorInsertQuery = `
        INSERT INTO rfq_vendors (rfq_id, vendor_id)
        VALUES ($1, $2)
      `;
      for (const vendorId of assignedVendors) {
        await client.query(vendorInsertQuery, [newRFQ.id, vendorId]);
      }
    }

    await client.query("COMMIT");
    
    newRFQ.assigned_vendors = assignedVendors || [];
    return newRFQ;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getAllRFQsFromDB = async () => {
  const query = `
    SELECT r.*, COALESCE(json_agg(rv.vendor_id) FILTER (WHERE rv.vendor_id IS NOT NULL), '[]') as assigned_vendors
    FROM rfqs r
    LEFT JOIN rfq_vendors rv ON r.id = rv.rfq_id
    GROUP BY r.id
    ORDER BY r.created_at DESC;
  `;
  const result = await pool.query(query);
  return result.rows;
};
