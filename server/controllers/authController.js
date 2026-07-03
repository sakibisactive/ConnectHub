const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const redisService = require('../config/redis');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
  
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return token;
};

// 1. POST /api/auth/register
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const userExists = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }]
    });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with that email or username already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = `usr_${uuidv4().substring(0, 12)}`;

    const user = await User.create({
      userId,
      username,
      email: email.toLowerCase(),
      passwordHash,
      status: 'online',
      profilePicture: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`
    });

    const token = generateToken(user.userId, res);

    return res.status(201).json({
      success: true,
      token,
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        status: user.status,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. POST /api/auth/login
const login = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ success: false, message: 'Please enter credentials' });
    }

    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername.toLowerCase() }
      ]
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    user.status = 'online';
    user.lastSeen = new Date();
    await user.save();

    // Invalidate Redis status cache
    await redisService.del(`user:status:${user.userId}`);

    const token = generateToken(user.userId, res);

    return res.status(200).json({
      success: true,
      token,
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        status: user.status,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. POST /api/auth/logout
const logout = async (req, res) => {
  try {
    if (req.user) {
      await User.findOneAndUpdate(
        { userId: req.user.userId },
        { status: 'offline', lastSeen: new Date() }
      );
      await redisService.del(`user:status:${req.user.userId}`);
    }

    res.cookie('jwt', '', {
      httpOnly: true,
      expires: new Date(0)
    });

    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { username, profilePicture, status } = req.body;
    const user = await User.findOne({ userId: req.user.userId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (username) user.username = username;
    if (profilePicture) user.profilePicture = profilePicture;
    if (status) user.status = status;

    await user.save();
    await redisService.del(`user:status:${user.userId}`);

    return res.status(200).json({
      success: true,
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        status: user.status
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile
};
