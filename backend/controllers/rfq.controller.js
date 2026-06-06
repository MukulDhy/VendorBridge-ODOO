import { createRFQInDB, getAllRFQsFromDB } from "../models/rfq.model.js";
import { createRFQSchema } from "../validations/rfq.validation.js";
import { uploadToCloudinary } from "../utils/uploadImage.js";
import { ZodError } from "zod";

export const createRFQ = async (req, res, next) => {
  try {
    // 1. Upload files to Cloudinary (if any attachments exist)
    const attachmentUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // resourceType "auto" lets Cloudinary automatically handle PDFs, Docs, etc.
        const uploadResult = await uploadToCloudinary(file.path, {
          folder: "rfq_attachments",
          resourceType: "auto",
        });
        attachmentUrls.push(uploadResult.url);
      }
    }

    // 2. Parse JSON fields from multipart/form-data
    let items = [];
    let assignedVendors = [];
    try {
      if (req.body.items) items = JSON.parse(req.body.items);
      if (req.body.assigned_vendors) assignedVendors = JSON.parse(req.body.assigned_vendors);
    } catch (parseError) {
      return res.status(400).json({ success: false, message: "Invalid JSON format in items or assigned_vendors" });
    }

    // 3. Prepare payload for validation
    const payloadToValidate = {
      rfq_title: req.body.rfq_title,
      description: req.body.description,
      items: items,
      deadline: req.body.deadline,
      attachments: attachmentUrls,
      assigned_vendors: assignedVendors,
    };

    // 4. Validate using Zod schema
    const validatedData = createRFQSchema.parse(payloadToValidate);

    // 5. Add server-side fields
    validatedData.created_by = req.user.id || req.user._id.toString();
    validatedData.status = "published";

    // 6. Save to PostgreSQL database
    const newRFQ = await createRFQInDB(validatedData, validatedData.assigned_vendors);

    // 7. TODO: Notify Assigned Vendors
    // authEmail.service.js or notification.service.js pattern would be invoked here
    // e.g., sendVendorNotification(newRFQ.id, validatedData.assigned_vendors);

    // 8. Respond
    res.status(201).json({
      success: true,
      message: "RFQ created successfully",
      data: newRFQ,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues.map((e) => ({ field: e.path.join("."), message: e.message })),
      });
    }
    console.error("Error creating RFQ:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getAllRFQs = async (req, res, next) => {
  try {
    const rfqs = await getAllRFQsFromDB();
    res.status(200).json({
      success: true,
      count: rfqs.length,
      data: rfqs,
    });
  } catch (error) {
    console.error("Error fetching RFQs:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
