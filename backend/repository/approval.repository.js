import pool from "../config/pgDb.js";

function toApproval(row) {
  if (!row) return null;
  return {
    id: row.id,
    rfqId: row.rfq_id,
    quotationId: row.quotation_id,
    amount: Number(row.amount),
    status: row.status,
    remarks: row.remarks,
    approverId: row.approver_id,
    createdAt: row.created_at,
    decidedAt: row.decided_at,
  };
}

export async function findAllApprovals() {
  const { rows } = await pool.query("SELECT * FROM approvals ORDER BY created_at DESC");
  return rows.map(toApproval);
}

export async function findApprovalById(id) {
  const { rows } = await pool.query("SELECT * FROM approvals WHERE id = $1", [id]);
  return toApproval(rows[0]);
}

export async function createApproval(data) {
  const { rows } = await pool.query(
    `INSERT INTO approvals (rfq_id, quotation_id, amount, status, remarks)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      data.rfqId || data.rfq_id,
      data.quotationId || data.quotation_id,
      data.amount,
      data.status ?? "Pending",
      data.remarks
    ]
  );
  return toApproval(rows[0]);
}

export async function updateApproval(id, fields) {
  const columnMap = {
    status: "status",
    remarks: "remarks",
    approverId: "approver_id",
    decidedAt: "decided_at"
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
    `UPDATE approvals SET ${setClauses.join(", ")}
     WHERE id = $${i}
     RETURNING *`,
    values
  );
  return toApproval(rows[0]);
}
