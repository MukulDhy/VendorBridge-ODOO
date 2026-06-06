import express from "express";
import {
  getQuotations,
  getQuotation,
  addQuotation,
  changeQuotationStatus
} from "../controllers/quotation.controller.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getQuotations);
router.get("/:id", getQuotation);
router.post("/", authorize("ADMIN", "VENDOR"), addQuotation);
router.patch("/:id/status", authorize("ADMIN", "PROCUREMENT_OFFICER", "MANAGER"), changeQuotationStatus);

export default router;
