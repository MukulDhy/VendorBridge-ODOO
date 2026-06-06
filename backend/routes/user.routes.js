import express from "express";
import {
  getUsers,
  addUser,
  editUser,
  removeUser
} from "../controllers/admin.controller.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);
router.use(authorize("ADMIN"));

router.get("/", getUsers);
router.post("/", addUser);
router.put("/:id", editUser);
router.delete("/:id", removeUser);

export default router;
