import express from "express";
import { getActivityLogs } from "../controllers/activity.controller.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", authorize("ADMIN"), getActivityLogs);

export default router;
