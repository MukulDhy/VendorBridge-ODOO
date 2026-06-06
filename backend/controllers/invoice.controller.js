import {
  findAllInvoices,
  findInvoiceById,
  findInvoicesByVendorId,
  createInvoice,
  updateInvoiceStatus
} from "../repository/invoice.repository.js";
import { findPOById } from "../repository/po.repository.js";
import { createNotification } from "../repository/notification.repository.js";
import { createActivityLog } from "../repository/activity.repository.js";
import pool from "../config/pgDb.js";

export const getInvoices = async (req, res) => {
  try {
    const { vendorId } = req.query;
    let invoices;
    if (vendorId) {
      invoices = await findInvoicesByVendorId(vendorId);
    } else if (req.user.role === "VENDOR") {
      invoices = await findInvoicesByVendorId(req.user.vendorId);
    } else {
      invoices = await findAllInvoices();
    }
    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInvoice = async (req, res) => {
  try {
    const inv = await findInvoiceById(req.params.id);
    if (!inv) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }
    res.status(200).json({ success: true, data: inv });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addInvoice = async (req, res) => {
  try {
    // Determine vendorId (if VENDOR user, use their profile vendorId)
    let vendorId = req.body.vendorId || req.body.vendor_id;
    if (req.user.role === "VENDOR") {
      vendorId = req.user.vendorId;
    }
    
    const invoice = await createInvoice({
      ...req.body,
      vendorId
    });

    // Log activity
    await createActivityLog({
      userId: req.user.id,
      action: "GENERATE_INVOICE",
      entityType: "Invoice",
      entityId: invoice.id,
    });

    // Notify procurement officers (or admins)
    const { rows: officers } = await pool.query("SELECT id FROM users WHERE role = 'PROCUREMENT_OFFICER'");
    for (const o of officers) {
      await createNotification({
        userId: o.id,
        title: "New Invoice Generated",
        message: `Invoice ${invoice.code} has been uploaded for PO.`,
        link: `/invoices`
      });
    }

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changeInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const invoice = await updateInvoiceStatus(req.params.id, status);
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    // Log status change
    await createActivityLog({
      userId: req.user.id,
      action: status === "Paid" ? "PAY_INVOICE" : "UPDATE_INVOICE",
      entityType: "Invoice",
      entityId: invoice.id,
    });

    // Notify Vendor user
    const { rows: users } = await pool.query("SELECT id FROM users WHERE vendor_id = $1", [invoice.vendorId]);
    const targetUserId = users[0]?.id || `u-vendor-${invoice.vendorId}`;
    
    await createNotification({
      userId: targetUserId,
      title: "Invoice Status Updated",
      message: `Invoice ${invoice.code} status has been updated to ${status}.`,
      link: `/invoices`
    });

    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
