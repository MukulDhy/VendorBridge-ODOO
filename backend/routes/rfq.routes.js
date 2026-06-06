import express from "express";
import {
  getRFQs,
  getRFQ,
  addRFQ,
  editRFQ,
  removeRFQ,
  changeRFQStatus
} from "../controllers/rfq.controller.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getRFQs);
router.get("/:id", getRFQ);
router.post("/", authorize("ADMIN", "PROCUREMENT_OFFICER"), addRFQ);
router.put("/:id", authorize("ADMIN", "PROCUREMENT_OFFICER"), editRFQ);
router.delete("/:id", authorize("ADMIN", "PROCUREMENT_OFFICER"), removeRFQ);
router.patch("/:id/status", authorize("ADMIN", "PROCUREMENT_OFFICER"), changeRFQStatus);

export default router;
