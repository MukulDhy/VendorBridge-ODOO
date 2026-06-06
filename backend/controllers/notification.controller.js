import {
  findNotificationsByUserId,
  markNotificationAsRead
} from "../repository/notification.repository.js";

export const getNotifications = async (req, res) => {
  try {
    const notifs = await findNotificationsByUserId(req.user.id);
    res.status(200).json({ success: true, data: notifs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const readNotification = async (req, res) => {
  try {
    const notif = await markNotificationAsRead(req.params.id);
    if (!notif) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    res.status(200).json({ success: true, data: notif });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
