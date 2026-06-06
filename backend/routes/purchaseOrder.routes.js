import express from "express";
import {
  createPurchaseOrder,
  getPurchaseOrders,
  getPOPreview,
  getPurchaseOrderById,
  updatePurchaseOrder,
  deletePurchaseOrder,
  generateInvoice,
  downloadInvoice,
  sendInvoiceEmail,
} from "../controllers/purchaseOrder.controller.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

// Apply protect middleware to all routes below
router.use(protect);

// ─── Purchase Order Core Routes ──────────────────────────────────────────────

router
  .route("/")
  .post(authorize("procurement_officer", "admin"), createPurchaseOrder)
  .get(authorize("procurement_officer", "manager", "admin"), getPurchaseOrders);

router.get(
  "/preview/:quotationId",
  authorize("procurement_officer", "admin"),
  getPOPreview
);

router
  .route("/:id")
  .get(authorize("procurement_officer", "manager", "admin"), getPurchaseOrderById)
  .patch(authorize("procurement_officer", "admin"), updatePurchaseOrder)
  .delete(authorize("procurement_officer", "admin"), deletePurchaseOrder);

// ─── Invoice Routes ──────────────────────────────────────────────────────────

router.post(
  "/:id/invoice",
  authorize("procurement_officer"),
  generateInvoice
);

router.get(
  "/:id/invoice/download",
  authorize("procurement_officer", "manager", "admin"),
  downloadInvoice
);

router.post(
  "/:id/invoice/send",
  authorize("procurement_officer"),
  sendInvoiceEmail
);

export default router;
