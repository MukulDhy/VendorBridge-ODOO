import {
  findAllRFQs,
  findRFQById,
  createRFQ,
  updateRFQ,
  deleteRFQ,
} from "../repository/rfq.repository.js";
import { createNotification } from "../repository/notification.repository.js";
import { createActivityLog } from "../repository/activity.repository.js";
import pool from "../config/pgDb.js";

export const getRFQs = async (req, res) => {
  try {
    const rfqs = await findAllRFQs();
    res.status(200).json({ success: true, data: rfqs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRFQ = async (req, res) => {
  try {
    const rfq = await findRFQById(req.params.id);
    if (!rfq) {
      return res.status(404).json({ success: false, message: "RFQ not found" });
    }
    res.status(200).json({ success: true, data: rfq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addRFQ = async (req, res) => {
  try {
    const rfqData = {
      ...req.body,
      createdBy: req.user.id
    };
    const rfq = await createRFQ(rfqData);

    // Create activity log
    await createActivityLog({
      userId: req.user.id,
      action: "CREATE_RFQ",
      entityType: "RFQ",
      entityId: rfq.id,
    });

    // Notify assigned vendors
    const assignedVendors = req.body.assignedVendors || [];
    for (const vendorId of assignedVendors) {
      // Find user matching vendor_id
      const { rows } = await pool.query("SELECT id FROM users WHERE vendor_id = $1", [vendorId]);
      const targetUserId = rows[0]?.id || `u-vendor-${vendorId}`; // Fallback if no user profile is bound yet

      await createNotification({
        userId: targetUserId,
        title: "New RFQ Assigned",
        message: `${rfq.title} — please submit your quotation.`,
        link: `/vendor/rfqs`,
      });
    }

    res.status(201).json({ success: true, data: rfq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const editRFQ = async (req, res) => {
  try {
    const rfq = await updateRFQ(req.params.id, req.body);
    if (!rfq) {
      return res.status(404).json({ success: false, message: "RFQ not found" });
    }
    res.status(200).json({ success: true, data: rfq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeRFQ = async (req, res) => {
  try {
    await deleteRFQ(req.params.id);
    res.status(200).json({ success: true, message: "RFQ deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changeRFQStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const rfq = await updateRFQ(req.params.id, { status });
    if (!rfq) {
      return res.status(404).json({ success: false, message: "RFQ not found" });
    }
    res.status(200).json({ success: true, data: rfq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
