import express from "express";
import {
  getApprovals,
  submitApproval,
  decideApproval
} from "../controllers/approval.controller.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", authorize("ADMIN", "MANAGER", "PROCUREMENT_OFFICER"), getApprovals);
router.post("/submit", authorize("ADMIN", "PROCUREMENT_OFFICER"), submitApproval);
router.post("/:id/decide", authorize("ADMIN", "MANAGER"), decideApproval);

export default router;
