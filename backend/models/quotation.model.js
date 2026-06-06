import pool from "../config/pg_db.js";

export const getQuotationsForRFQInDB = async (rfqId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Auto-calculate and update is_lowest_price for the given RFQ
    const updateLowestPriceQuery = `
      WITH lowest AS (
        SELECT id
        FROM quotations
        WHERE rfq_id = $1
        ORDER BY (pricing_details->>'total_price')::numeric ASC
        LIMIT 1
      )
      UPDATE quotations q
      SET is_lowest_price = (q.id IN (SELECT id FROM lowest))
      WHERE q.rfq_id = $1;
    `;
    await client.query(updateLowestPriceQuery, [rfqId]);

    // Fetch the updated quotations
    const fetchQuery = `
      SELECT *
      FROM quotations
      WHERE rfq_id = $1
      ORDER BY (pricing_details->>'total_price')::numeric ASC;
    `;
    const result = await client.query(fetchQuery, [rfqId]);

    await client.query("COMMIT");
    return result.rows;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const selectQuotationInDB = async (rfqId, quotationId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Reject all other quotations for this RFQ
    const rejectOthersQuery = `
      UPDATE quotations
      SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
      WHERE rfq_id = $1 AND id != $2;
    `;
    await client.query(rejectOthersQuery, [rfqId, quotationId]);

    // Select the chosen quotation
    const selectQuery = `
      UPDATE quotations
      SET status = 'selected', updated_at = CURRENT_TIMESTAMP
      WHERE rfq_id = $1 AND id = $2
      RETURNING *;
    `;
    const result = await client.query(selectQuery, [rfqId, quotationId]);

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
