const dbDataService = require('../services/dbDataService');
const redisService = require('../config/redis');

// 4. GET /api/users (Strict Privacy: Returns only username to regular users; email is stripped unless requester is Admin)
const getUsers = async (req, res) => {
  try {
    const { search } = req.query;
    const currentUserId = req.user ? req.user.userId : null;

    // Privacy Protection: If no search query is specified, do NOT list database users
    if (!search || !search.trim()) {
      return res.status(200).json({
        success: true,
        users: []
      });
    }

    const users = await dbDataService.getUsers(search.trim(), currentUserId);

    // Privacy Protection: Email address is hidden from regular users and ONLY visible to Admin
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.userId === 'usr_admin' || req.user.email === 'admin@connecthub.com');

    const sanitizedUsers = users.map(u => {
      const { email, passwordHash, ...rest } = u;
      return isAdmin ? { ...rest, email } : rest;
    });

    return res.status(200).json({
      success: true,
      users: sanitizedUsers
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
