const Notification = require('../models/Notification');

// GET /api/notifications
exports.getNotifications = async (req, res, next) => {
  try {
    const { recipientType, recipientId, read, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (recipientType) filter.recipientType = recipientType;
    if (recipientId) filter.recipientId = recipientId;
    if (read !== undefined) filter.read = read === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, read: false }),
    ]);

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/notifications/:id/read
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

// PUT /api/notifications/mark-all-read
exports.markAllAsRead = async (req, res, next) => {
  try {
    const { recipientType, recipientId } = req.body;
    const filter = {};
    if (recipientType) filter.recipientType = recipientType;
    if (recipientId) filter.recipientId = recipientId;

    await Notification.updateMany(filter, { read: true });

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};
