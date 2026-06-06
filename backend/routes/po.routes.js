import express from "express";
import {
  getPOs,
  getPO,
  addPO,
  changePOStatus
} from "../controllers/po.controller.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getPOs);
router.get("/:id", getPO);
router.post("/", authorize("ADMIN", "PROCUREMENT_OFFICER", "MANAGER"), addPO);
router.patch("/:id/status", authorize("ADMIN", "PROCUREMENT_OFFICER", "VENDOR"), changePOStatus);

export default router;
