const express = require('express');
const router = express.Router();
const { getUsers, getUserStatus } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getUsers);
router.get('/:userId/status', protect, getUserStatus);

module.exports = router;
