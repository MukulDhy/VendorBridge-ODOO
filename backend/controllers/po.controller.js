import {
  findAllPOs,
  findPOById,
  findPOsByVendorId,
  createPO,
  updatePOStatus
} from "../repository/po.repository.js";
import { createNotification } from "../repository/notification.repository.js";
import { createActivityLog } from "../repository/activity.repository.js";
import pool from "../config/pgDb.js";

export const getPOs = async (req, res) => {
  try {
    const { vendorId } = req.query;
    let pos;
    if (vendorId) {
      pos = await findPOsByVendorId(vendorId);
    } else if (req.user.role === "VENDOR") {
      pos = await findPOsByVendorId(req.user.vendorId);
    } else {
      pos = await findAllPOs();
    }
    res.status(200).json({ success: true, data: pos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPO = async (req, res) => {
  try {
    const po = await findPOById(req.params.id);
    if (!po) {
      return res.status(404).json({ success: false, message: "Purchase order not found" });
    }
    res.status(200).json({ success: true, data: po });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addPO = async (req, res) => {
  try {
    const po = await createPO(req.body);

    // Activity Log
    await createActivityLog({
      userId: req.user.id,
      action: "CREATE_PO",
      entityType: "PurchaseOrder",
      entityId: po.id,
    });

    // Find vendor user to notify
    const { rows: users } = await pool.query("SELECT id FROM users WHERE vendor_id = $1", [po.vendorId]);
    const targetUserId = users[0]?.id || `u-vendor-${po.vendorId}`;

    await createNotification({
      userId: targetUserId,
      title: "New Purchase Order Received",
      message: `PO ${po.code} has been issued to you.`,
      link: `/vendor/orders`
    });

    res.status(201).json({ success: true, data: po });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changePOStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const po = await updatePOStatus(req.params.id, status);
    if (!po) {
      return res.status(404).json({ success: false, message: "Purchase order not found" });
    }
    res.status(200).json({ success: true, data: po });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
