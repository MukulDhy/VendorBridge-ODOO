import { getQuotationsForRFQInDB, selectQuotationInDB } from "../models/quotation.model.js";
import pool from "../config/pg_db.js";
import User from "../models/user.model.js";

// Helper to verify RFQ ownership
const verifyRFQOwnership = async (rfqId, userId) => {
  const result = await pool.query("SELECT created_by FROM rfqs WHERE id = $1", [rfqId]);
  if (result.rows.length === 0) return false;
  return result.rows[0].created_by === userId;
};

// GET /api/rfq/:rfqId/quotations
export const getQuotationsForRFQ = async (req, res) => {
  try {
    const { rfqId } = req.params;
    const userId = req.user.id || req.user._id.toString();

    // Check ownership
    const isOwner = await verifyRFQOwnership(rfqId, userId);
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to view these quotations" });
    }

    const quotations = await getQuotationsForRFQInDB(rfqId);

    // Fetch vendor details from MongoDB safely
    const vendorIds = [...new Set(quotations.map(q => q.vendor_id))];
    const validHexIds = vendorIds.filter(id => /^[0-9a-fA-F]{24}$/.test(id));
    
    let vendors = [];
    if (validHexIds.length > 0) {
      vendors = await User.find({ _id: { $in: validHexIds } }).select("name");
    }

    const enrichedQuotations = quotations.map(q => {
      const vendor = vendors.find(v => v._id.toString() === q.vendor_id);
      return {
        ...q,
        vendor_name: vendor ? vendor.name : "Unknown Vendor"
      };
    });

    res.status(200).json({
      success: true,
      count: enrichedQuotations.length,
      data: enrichedQuotations,
    });
  } catch (error) {
    console.error("Error fetching quotations:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET /api/rfq/:rfqId/quotations/compare
export const getQuotationComparison = async (req, res) => {
  try {
    const { rfqId } = req.params;
    const userId = req.user.id || req.user._id.toString();

    // Check ownership
    const isOwner = await verifyRFQOwnership(rfqId, userId);
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to view these quotations" });
    }

    const quotations = await getQuotationsForRFQInDB(rfqId);

    // Fetch vendor details from MongoDB safely
    const vendorIds = [...new Set(quotations.map(q => q.vendor_id))];
    const validHexIds = vendorIds.filter(id => /^[0-9a-fA-F]{24}$/.test(id));
    
    let vendors = [];
    if (validHexIds.length > 0) {
      vendors = await User.find({ _id: { $in: validHexIds } }).select("name");
    }

    let comparisonData = quotations.map(q => {
      const vendor = vendors.find(v => v._id.toString() === q.vendor_id);
                         
      return {
        id: q.id,
        vendorId: q.vendor_id,
        vendorName: vendor ? vendor.name : "Unknown Vendor",
        price: q.pricing_details.total_price || 0,
        deliveryDays: q.delivery_timeline,
        notes: q.notes,
        status: q.status,
        isLowestPrice: q.is_lowest_price,
        submittedAt: q.submitted_at
      };
    });

    // Sorting functionality based on query parameters
    const sortBy = req.query.sort_by || 'price';
    const order = req.query.order === 'desc' ? -1 : 1;

    comparisonData.sort((a, b) => {
      if (sortBy === 'price') return (a.price - b.price) * order;
      if (sortBy === 'delivery') return (a.deliveryDays - b.deliveryDays) * order;
      return 0;
    });

    res.status(200).json({
      success: true,
      data: comparisonData,
    });
  } catch (error) {
    console.error("Error getting quotation comparison:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// PATCH /api/rfq/:rfqId/quotations/:quotationId/select
export const selectQuotation = async (req, res) => {
  try {
    const { rfqId, quotationId } = req.params;
    const userId = req.user.id || req.user._id.toString();

    // Check ownership
    const isOwner = await verifyRFQOwnership(rfqId, userId);
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to select a quotation" });
    }

    const updatedQuotation = await selectQuotationInDB(rfqId, quotationId);

    // TODO: Trigger approval workflow here

    res.status(200).json({
      success: true,
      message: "Quotation selected successfully",
      data: updatedQuotation,
    });
  } catch (error) {
    console.error("Error selecting quotation:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
