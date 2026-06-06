import { findAllActivityLogs } from "../repository/activity.repository.js";

export const getActivityLogs = async (req, res) => {
  try {
    const logs = await findAllActivityLogs();
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
