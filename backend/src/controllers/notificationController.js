const { db } = require('../database/db');

exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await db.notifications.find({ userId: req.user._id });
    res.status(200).json({ status: 'success', data: { notifications } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await db.notifications.findByIdAndUpdate(id, { readStatus: true });
    res.status(200).json({ status: 'success', data: { notification: updated } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
