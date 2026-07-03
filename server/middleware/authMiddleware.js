const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'connecthub_jwt_secret_super_key_2026';

const protect = async (req, res, next) => {
  let token;

  if (req.cookies && (req.cookies.jwt || req.cookies.token)) {
    token = req.cookies.jwt || req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findOne({ userId: decoded.userId }).select('-passwordHash');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User session invalid' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
  }
};

module.exports = { protect, JWT_SECRET };
