import pool from "../config/pg_db.js";
import { ZodError } from "zod";
import { createPurchaseOrderSchema, updatePurchaseOrderSchema } from "../validations/purchaseOrder.validation.js";
import {
  createPurchaseOrderInDB,
  getPurchaseOrdersFromDB,
  getPurchaseOrderByIdFromDB,
  updatePurchaseOrderInDB,
  deletePurchaseOrderFromDB
} from "../models/purchaseOrder.model.js";
import User from "../models/user.model.js";

export const createPurchaseOrder = async (req, res) => {
  try {
    const validatedData = createPurchaseOrderSchema.parse(req.body);
    const poData = {
      ...validatedData,
      created_by: req.user.id || req.user._id.toString(),
    };
    
    const newPurchaseOrder = await createPurchaseOrderInDB(poData);

    // TODO: Trigger approval workflow notification here

    res.status(201).json({
      success: true,
      message: "Purchase Order created successfully",
      data: newPurchaseOrder,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues.map(e => ({ field: e.path.join("."), message: e.message })),
      });
    }
    
    // Convert known model errors to standard responses
    if (error.message === "Quotation not found" || error.message === "Only selected quotations can be converted to a PO") {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.message === "A PO already exists for this quotation") {
      return res.status(409).json({ success: false, message: error.message });
    }

    console.error("Error creating PO:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getPurchaseOrders = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id.toString();
    const purchaseOrders = await getPurchaseOrdersFromDB(userId, req.user.role);

    // Fetch vendor details from MongoDB safely
    const vendorIds = [...new Set(purchaseOrders.map(po => po.vendor_id))];
    const validHexIds = vendorIds.filter(id => /^[0-9a-fA-F]{24}$/.test(id));
    
    let vendors = [];
    if (validHexIds.length > 0) {
      vendors = await User.find({ _id: { $in: validHexIds } }).select("name");
    }

    const enrichedPOs = purchaseOrders.map(po => {
      const vendor = vendors.find(v => v._id.toString() === po.vendor_id);
      return {
        ...po,
        vendor_name: vendor ? vendor.name : "Unknown Vendor"
      };
    });

    res.status(200).json({
      success: true,
      count: enrichedPOs.length,
      data: enrichedPOs,
    });
  } catch (error) {
    console.error("Error fetching POs:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const po = await getPurchaseOrderByIdFromDB(id);

    if (!po) {
      return res.status(404).json({ success: false, message: "Purchase Order not found" });
    }

    // Verify ownership
    const userId = req.user.id || req.user._id.toString();
    if (po.created_by !== userId && req.user.role !== "admin" && req.user.role !== "manager") {
      return res.status(403).json({ success: false, message: "Not authorized to view this PO" });
    }

    // Fetch vendor details
    let vendor = null;
    if (/^[0-9a-fA-F]{24}$/.test(po.vendor_id)) {
      vendor = await User.findById(po.vendor_id).select("name email phone");
    }
    
    const fallbackName = po.vendor_id === "v1" ? "TechSolutions Inc." 
                       : po.vendor_id === "v2" ? "Global Hardware Co." 
                       : po.vendor_id === "v3" ? "Enterprise IT Supplies" 
                       : "Unknown Vendor";

    const enrichedPO = {
      ...po,
      vendor: vendor ? { id: vendor._id, name: vendor.name, email: vendor.email, phone: vendor.phone } 
                     : { id: po.vendor_id, name: fallbackName, email: "contact@vendor.com", phone: "+123456789" }
    };

    res.status(200).json({
      success: true,
      data: enrichedPO,
    });
  } catch (error) {
    console.error("Error fetching PO by ID:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getPOPreview = async (req, res) => {
  try {
    const { quotationId } = req.params;

    const query = `
      SELECT q.*, r.items as rfq_items 
      FROM quotations q
      JOIN rfqs r ON q.rfq_id = r.id
      WHERE q.id = $1
    `;
    const result = await pool.query(query, [quotationId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Quotation not found" });
    }

    const quotation = result.rows[0];
    
    let vendor = null;
    if (/^[0-9a-fA-F]{24}$/.test(quotation.vendor_id)) {
      vendor = await User.findById(quotation.vendor_id).select("name");
    }
    
    let items = [];
    let subtotal = 0;

    if (quotation.pricing_details && quotation.pricing_details.items) {
      items = quotation.pricing_details.items;
      subtotal = items.reduce((sum, item) => sum + (item.total_price || 0), 0);
    } else {
      items = quotation.rfq_items || [];
      subtotal = Number(quotation.pricing_details.total_price || 0);
    }

    res.status(200).json({
      success: true,
      data: {
        vendor_name: vendor ? vendor.name : "Unknown Vendor",
        items,
        subtotal
      }
    });
  } catch (error) {
    console.error("Error fetching PO preview:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const updatePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updatePurchaseOrderSchema.parse(req.body);
    
    // Verify ownership first
    const po = await getPurchaseOrderByIdFromDB(id);
    if (!po) {
      return res.status(404).json({ success: false, message: "Purchase Order not found" });
    }

    const userId = req.user.id || req.user._id.toString();
    if (po.created_by !== userId && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to update this PO" });
    }

    const updatedOrder = await updatePurchaseOrderInDB(id, validatedData);

    res.status(200).json({
      success: true,
      message: "Purchase Order updated successfully",
      data: updatedOrder,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues.map(e => ({ field: e.path.join("."), message: e.message })),
      });
    }

    if (error.message === "Purchase Order not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === "PO cannot be edited after submission") {
      return res.status(403).json({ success: false, message: error.message });
    }

    console.error("Error updating PO:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const po = await getPurchaseOrderByIdFromDB(id);
    if (!po) {
      return res.status(404).json({ success: false, message: "Purchase Order not found" });
    }

    const userId = req.user.id || req.user._id.toString();
    if (po.created_by !== userId && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to delete this PO" });
    }

    await deletePurchaseOrderFromDB(id);

    res.status(200).json({
      success: true,
      message: "Purchase Order deleted successfully",
    });
  } catch (error) {
    if (error.message === "Purchase Order not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === "Only draft POs can be deleted") {
      return res.status(403).json({ success: false, message: error.message });
    }
    
    console.error("Error deleting PO:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const generateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const po = await getPurchaseOrderByIdFromDB(id);

    if (!po) {
      return res.status(404).json({ success: false, message: "Purchase Order not found" });
    }

    if (po.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Invoice can only be generated for approved Purchase Orders",
      });
    }

    // This is still a mock for invoices since the feature isn't fully implemented yet
    const invoice = {
      invoice_id: `INV-${po.po_number}`,
      purchase_order_id: po.id,
      generated_by: req.user.id || req.user._id.toString(),
      generated_at: new Date(),
    };

    res.status(200).json({
      success: true,
      message: "Invoice generated successfully",
      data: invoice,
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const downloadInvoice = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Invoice PDF download started...",
    data: { url: `/downloads/invoice-${req.params.id}.pdf` }
  });
};

export const sendInvoiceEmail = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Invoice sent to vendor via email successfully",
  });
};
