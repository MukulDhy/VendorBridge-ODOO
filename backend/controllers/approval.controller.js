import {
  findAllApprovals,
  findApprovalById,
  createApproval,
  updateApproval
} from "../repository/approval.repository.js";
import { updateRFQ, findRFQById } from "../repository/rfq.repository.js";
import { updateQuotation } from "../repository/quotation.repository.js";
import { createNotification } from "../repository/notification.repository.js";
import { createActivityLog } from "../repository/activity.repository.js";
import pool from "../config/pgDb.js";

export const getApprovals = async (req, res) => {
  try {
    const approvals = await findAllApprovals();
    res.status(200).json({ success: true, data: approvals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitApproval = async (req, res) => {
  try {
    const { rfqId, quotationId, amount, remarks } = req.body;
    
    // Create approval record
    const approval = await createApproval({
      rfqId,
      quotationId,
      amount,
      remarks,
      status: "Pending"
    });

    // Update quote status to Shortlisted
    await updateQuotation(quotationId, { status: "Shortlisted" });

    // Send notifications to all MANAGERS
    const { rows: managers } = await pool.query("SELECT id FROM users WHERE role = 'MANAGER'");
    for (const m of managers) {
      await createNotification({
        userId: m.id,
        title: "Approval Required",
        message: `RFQ code ${rfqId} requires review (₹${Number(amount).toLocaleString('en-IN')}).`,
        link: "/approvals"
      });
    }

    res.status(201).json({ success: true, data: approval });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const decideApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body; // Approved or Rejected

    const app = await findApprovalById(id);
    if (!app) {
      return res.status(404).json({ success: false, message: "Approval request not found" });
    }

    const updatedApp = await updateApproval(id, {
      status,
      remarks,
      approverId: req.user.id,
      decidedAt: new Date()
    });

    // Update quotation status based on decision
    if (status === "Approved") {
      await updateQuotation(app.quotationId, { status: "Awarded" });
      await updateRFQ(app.rfqId, { status: "Awarded" });
    } else {
      await updateQuotation(app.quotationId, { status: "Rejected" });
    }

    // Log Activity
    await createActivityLog({
      userId: req.user.id,
      action: status === "Approved" ? "APPROVE_RFQ" : "REJECT_RFQ",
      entityType: "Approval",
      entityId: id,
    });

    // Notify Procurement Officer (who created the RFQ)
    const rfq = await findRFQById(app.rfqId);
    if (rfq) {
      await createNotification({
        userId: rfq.createdBy,
        title: `RFQ ${status}`,
        message: `Your approval request for RFQ ${rfq.code} was ${status.toLowerCase()} by the manager.`,
        link: `/rfqs/${rfq.id}`
      });
    }

    res.status(200).json({ success: true, data: updatedApp });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
