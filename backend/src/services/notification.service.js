const Notification = require('../models/Notification');
const User = require('../models/User');

const notify = async (userId, title, description, link, type = 'INFO', preference = 'updates') => {
  const user = await User.findById(userId).select('isActive settings.notifications');
  if (!user?.isActive || user.settings?.notifications?.[preference] === false) return;
  return Notification.create({ userId, title, description, link, type });
};

module.exports = { notify };
