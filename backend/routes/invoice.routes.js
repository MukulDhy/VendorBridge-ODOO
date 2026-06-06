import express from "express";
import {
  getInvoices,
  getInvoice,
  addInvoice,
  changeInvoiceStatus
} from "../controllers/invoice.controller.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getInvoices);
router.get("/:id", getInvoice);
router.post("/", authorize("ADMIN", "PROCUREMENT_OFFICER", "VENDOR", "MANAGER"), addInvoice);
router.patch("/:id/status", authorize("ADMIN", "PROCUREMENT_OFFICER"), changeInvoiceStatus);

export default router;
