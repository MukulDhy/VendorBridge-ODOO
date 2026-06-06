import pool from "../config/pg_db.js";

// Helper to generate a unique PO number
const generatePONumber = async () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
  const prefix = `PO-${dateStr}-`;

  const query = `
    SELECT po_number 
    FROM purchase_orders 
    WHERE po_number LIKE $1 
    ORDER BY po_number DESC 
    LIMIT 1
  `;
  const result = await pool.query(query, [`${prefix}%`]);

  if (result.rows.length === 0) {
    return `${prefix}0001`;
  }

  const lastPO = result.rows[0].po_number;
  const lastNum = parseInt(lastPO.split("-")[2], 10);
  const nextNum = (lastNum + 1).toString().padStart(4, "0");
  
  return `${prefix}${nextNum}`;
};

export const createPurchaseOrderInDB = async (poData) => {
  const { quotation_id, tax_percentage, remarks, created_by } = poData;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Fetch quotation and verify status
    const quotationQuery = `
      SELECT q.*, r.items as rfq_items 
      FROM quotations q
      JOIN rfqs r ON q.rfq_id = r.id
      WHERE q.id = $1
    `;
    const quotationResult = await client.query(quotationQuery, [quotation_id]);

    if (quotationResult.rows.length === 0) {
      throw new Error("Quotation not found");
    }

    const quotation = quotationResult.rows[0];
    if (quotation.status !== "selected") {
      throw new Error("Only selected quotations can be converted to a PO");
    }

    // 2. Verify no PO already exists for this quotation
    const existingPOQuery = `SELECT id FROM purchase_orders WHERE quotation_id = $1`;
    const existingPOResult = await client.query(existingPOQuery, [quotation_id]);
    if (existingPOResult.rows.length > 0) {
      throw new Error("A PO already exists for this quotation");
    }

    // 3. Extract data for PO
    const rfq_id = quotation.rfq_id;
    const vendor_id = quotation.vendor_id;

    // Use items from RFQ but pricing from quotation's pricing_details
    // The prompt says: "items -> JSONB (copied from quotation) [{ name, quantity, unit, unit_price, total_price }]"
    // quotation.pricing_details actually just has { unit_price, total_price } in the mock, or we can just use the total_price from pricing_details
    // Wait, let's construct the items properly
    let items = [];
    let subtotal = 0;

    // If quotation has specific line items in pricing_details, use that.
    // Otherwise, we calculate subtotal from pricing_details.total_price and create a generic item.
    if (quotation.pricing_details && quotation.pricing_details.items) {
      items = quotation.pricing_details.items;
      subtotal = items.reduce((sum, item) => sum + (item.total_price || 0), 0);
    } else {
      // Fallback if no line items are stored in quotation, use RFQ items and total price
      items = quotation.rfq_items || [];
      // Calculate generic pricing based on quotation total
      subtotal = Number(quotation.pricing_details.total_price || 0);
    }

    const tax_amount = subtotal * (Number(tax_percentage) / 100);
    const total_amount = subtotal + tax_amount;

    // 4. Generate PO Number
    const po_number = await generatePONumber();

    // 5. Insert PO
    const insertPOQuery = `
      INSERT INTO purchase_orders 
        (po_number, rfq_id, quotation_id, vendor_id, created_by, items, subtotal, tax_percentage, tax_amount, total_amount, status, remarks)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending_approval', $11)
      RETURNING *;
    `;
    const poValues = [
      po_number,
      rfq_id,
      quotation_id,
      vendor_id,
      created_by,
      JSON.stringify(items),
      subtotal,
      tax_percentage,
      tax_amount,
      total_amount,
      remarks
    ];

    const poResult = await client.query(insertPOQuery, poValues);
    await client.query("COMMIT");
    return poResult.rows[0];

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getPurchaseOrdersFromDB = async (userId, role) => {
  let query = `
    SELECT po.*, r.rfq_title 
    FROM purchase_orders po
    JOIN rfqs r ON po.rfq_id = r.id
  `;
  const values = [];

  if (role !== "admin" && role !== "manager") {
    query += ` WHERE po.created_by = $1`;
    values.push(userId);
  }

  query += ` ORDER BY po.created_at DESC`;
  const result = await pool.query(query, values);
  return result.rows;
};

export const getPurchaseOrderByIdFromDB = async (poId) => {
  const query = `
    SELECT po.*, r.rfq_title, r.description as rfq_description, q.pricing_details, q.delivery_timeline, q.notes as quotation_notes
    FROM purchase_orders po
    JOIN rfqs r ON po.rfq_id = r.id
    JOIN quotations q ON po.quotation_id = q.id
    WHERE po.id = $1
  `;
  const result = await pool.query(query, [poId]);
  return result.rows[0];
};

export const updatePurchaseOrderInDB = async (poId, updateData) => {
  const { tax_percentage, remarks } = updateData;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const getQuery = `SELECT subtotal, status FROM purchase_orders WHERE id = $1`;
    const getResult = await client.query(getQuery, [poId]);
    if (getResult.rows.length === 0) throw new Error("Purchase Order not found");
    
    const po = getResult.rows[0];
    if (po.status !== "draft") throw new Error("PO cannot be edited after submission");

    const subtotal = Number(po.subtotal);
    const tax_amount = subtotal * (Number(tax_percentage) / 100);
    const total_amount = subtotal + tax_amount;

    const updateQuery = `
      UPDATE purchase_orders 
      SET tax_percentage = $1, tax_amount = $2, total_amount = $3, remarks = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *;
    `;
    const updateResult = await client.query(updateQuery, [tax_percentage, tax_amount, total_amount, remarks, poId]);
    
    await client.query("COMMIT");
    return updateResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const deletePurchaseOrderFromDB = async (poId) => {
  const getQuery = `SELECT status FROM purchase_orders WHERE id = $1`;
  const getResult = await pool.query(getQuery, [poId]);
  if (getResult.rows.length === 0) throw new Error("Purchase Order not found");
  
  if (getResult.rows[0].status !== "draft") {
    throw new Error("Only draft POs can be deleted");
  }

  const deleteQuery = `DELETE FROM purchase_orders WHERE id = $1 RETURNING id`;
  const deleteResult = await pool.query(deleteQuery, [poId]);
  return deleteResult.rows[0];
};
