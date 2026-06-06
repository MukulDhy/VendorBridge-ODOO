import express from "express";
import {
  getVendors,
  getVendor,
  addVendor,
  editVendor,
  removeVendor,
  changeVendorStatus
} from "../controllers/vendor.controller.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", authorize("ADMIN", "PROCUREMENT_OFFICER", "MANAGER"), getVendors);
router.get("/:id", getVendor);
router.post("/", authorize("ADMIN", "PROCUREMENT_OFFICER"), addVendor);
router.put("/:id", authorize("ADMIN", "PROCUREMENT_OFFICER"), editVendor);
router.delete("/:id", authorize("ADMIN"), removeVendor);
router.patch("/:id/status", authorize("ADMIN"), changeVendorStatus);

export default router;
