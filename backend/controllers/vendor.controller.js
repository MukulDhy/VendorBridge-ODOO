import {
  findAllVendors,
  findVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
} from "../repository/vendor.repository.js";
import { createActivityLog } from "../repository/activity.repository.js";

export const getVendors = async (req, res) => {
  try {
    const vendors = await findAllVendors();
    res.status(200).json({ success: true, data: vendors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getVendor = async (req, res) => {
  try {
    const vendor = await findVendorById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }
    res.status(200).json({ success: true, data: vendor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addVendor = async (req, res) => {
  try {
    const vendor = await createVendor(req.body);
    await createActivityLog({
      userId: req.user.id,
      action: "ADD_VENDOR",
      entityType: "Vendor",
      entityId: vendor.id,
    });
    res.status(201).json({ success: true, data: vendor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const editVendor = async (req, res) => {
  try {
    const vendor = await updateVendor(req.params.id, req.body);
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }
    res.status(200).json({ success: true, data: vendor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeVendor = async (req, res) => {
  try {
    await deleteVendor(req.params.id);
    res.status(200).json({ success: true, message: "Vendor deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changeVendorStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const vendor = await updateVendor(req.params.id, { status });
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }
    res.status(200).json({ success: true, data: vendor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
