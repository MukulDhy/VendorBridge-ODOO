import {
  findAllUsers,
  createUserByAdmin,
  updateUserByAdmin,
  deleteUserByAdmin
} from "../repository/admin.repository.js";
import { createActivityLog } from "../repository/activity.repository.js";

export const getUsers = async (req, res) => {
  try {
    const users = await findAllUsers();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addUser = async (req, res) => {
  try {
    const user = await createUserByAdmin(req.body);
    await createActivityLog({
      userId: req.user.id,
      action: "CREATE_USER",
      entityType: "User",
      entityId: user.id
    });
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const editUser = async (req, res) => {
  try {
    const user = await updateUserByAdmin(req.params.id, req.body);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeUser = async (req, res) => {
  try {
    await deleteUserByAdmin(req.params.id);
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
