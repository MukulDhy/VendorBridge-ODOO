import {
  findAllQuotations,
  findQuotationById,
  findQuotationsByRfqId,
  findQuotationsByVendorId,
  createQuotation,
  updateQuotation
} from "../repository/quotation.repository.js";
import { findRFQById } from "../repository/rfq.repository.js";
import { findVendorById } from "../repository/vendor.repository.js";
import { createNotification } from "../repository/notification.repository.js";
import { createActivityLog } from "../repository/activity.repository.js";

export const getQuotations = async (req, res) => {
  try {
    const { rfqId, vendorId } = req.query;
    let quotes;
    if (rfqId) {
      quotes = await findQuotationsByRfqId(rfqId);
    } else if (vendorId) {
      quotes = await findQuotationsByVendorId(vendorId);
    } else {
      quotes = await findAllQuotations();
    }
    res.status(200).json({ success: true, data: quotes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getQuotation = async (req, res) => {
  try {
    const quote = await findQuotationById(req.params.id);
    if (!quote) {
      return res.status(404).json({ success: false, message: "Quotation not found" });
    }
    res.status(200).json({ success: true, data: quote });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addQuotation = async (req, res) => {
  try {
    // If the logged in user is a vendor, force their own vendorId
    let vendorId = req.body.vendorId || req.body.vendor_id;
    if (req.user.role === "VENDOR") {
      vendorId = req.user.vendorId;
    }

    if (!vendorId) {
      return res.status(400).json({ success: false, message: "Vendor ID is required" });
    }

    const quoteData = {
      ...req.body,
      vendorId,
      status: "Submitted"
    };

    const quote = await createQuotation(quoteData);

    // Activity Log
    await createActivityLog({
      userId: req.user.id,
      action: "SUBMIT_QUOTATION",
      entityType: "Quotation",
      entityId: quote.id,
    });

    // Notify RFQ Creator
    const rfq = await findRFQById(quote.rfqId);
    const vendor = await findVendorById(vendorId);
    if (rfq && vendor) {
      await createNotification({
        userId: rfq.createdBy,
        title: "Quotation Received",
        message: `${vendor.name} submitted a quotation for ${rfq.title}.`,
        link: `/rfqs/${rfq.id}`
      });
    }

    res.status(201).json({ success: true, data: quote });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changeQuotationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const quote = await updateQuotation(req.params.id, { status });
    if (!quote) {
      return res.status(404).json({ success: false, message: "Quotation not found" });
    }
    res.status(200).json({ success: true, data: quote });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
