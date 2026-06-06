import express from "express";
import {
  getNotifications,
  readNotification
} from "../controllers/notification.controller.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getNotifications);
router.patch("/:id/read", readNotification);

export default router;
