const Settings = require('../models/Settings');

// Block online order creation when sales are turned off
const onlineSalesCheck = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();

    if (!settings.onlineSalesEnabled) {
      return res.status(503).json({
        success: false,
        message: 'Online orders are currently closed.',
        closedPage: settings.closedPage,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = onlineSalesCheck;
