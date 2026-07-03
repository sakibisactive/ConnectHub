const dbDataService = require('../services/dbDataService');
const redisService = require('../config/redis');

// 4. GET /api/users
const getUsers = async (req, res) => {
  try {
    const { search } = req.query;
    const currentUserId = req.user ? req.user.userId : null;

    const users = await dbDataService.getUsers(search, currentUserId);

    return res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('getUsers error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. GET /api/users/:userId/status
const getUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const cacheKey = `user:status:${userId}`;
    const cachedStatus = await redisService.get(cacheKey);

    if (cachedStatus) {
      return res.status(200).json({
        success: true,
        status: cachedStatus.status,
        lastSeen: cachedStatus.lastSeen,
        fromCache: true
      });
    }

    const user = await dbDataService.findUser({ userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const statusData = {
      status: user.status || 'offline',
      lastSeen: user.lastSeen || new Date()
    };

    await redisService.set(cacheKey, statusData, 15);

    return res.status(200).json({
      success: true,
      ...statusData
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUsers,
  getUserStatus
};
