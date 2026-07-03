const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const mongoURI = process.env.MONGO_URI || '';

const seedData = async () => {
  if (!mongoURI || mongoURI.includes('<db_password>')) {
    console.log('ℹ️  MongoDB URI is blank or contains placeholder `<db_password>`. Skipping Atlas seeding until real link is provided.');
    console.log('💡 You can run `npm run seed` anytime after updating `.env` with your active MongoDB Atlas connection URI.');
    process.exit(0);
  }

  try {
    console.log('🌱 Connecting to MongoDB Atlas for Seeding...');
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB Atlas.');

    // Clear existing data
    console.log('🧹 Clearing existing seed records...');
    await User.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});

    console.log('👥 Creating seed users...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const users = [
      {
        userId: 'usr_alex_001',
        username: 'alex_dev',
        email: 'alex@connecthub.com',
        passwordHash,
        profilePicture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=256',
        status: 'online',
        lastSeen: new Date()
      },
      {
        userId: 'usr_sarah_002',
        username: 'sarah_design',
        email: 'sarah@connecthub.com',
        passwordHash,
        profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256',
        status: 'online',
        lastSeen: new Date()
      },
      {
        userId: 'usr_john_003',
        username: 'john_admin',
        email: 'john@connecthub.com',
        passwordHash,
        profilePicture: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=256',
        status: 'away',
        lastSeen: new Date(Date.now() - 3600000)
      },
      {
        userId: 'usr_emily_004',
        username: 'emily_tech',
        email: 'emily@connecthub.com',
        passwordHash,
        profilePicture: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=256',
        status: 'offline',
        lastSeen: new Date(Date.now() - 86400000)
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`✅ ${createdUsers.length} test users created!`);

    console.log('💬 Creating test conversations...');
    await Conversation.create({
      conversationId: 'conv_alex_sarah',
      type: 'individual',
      participants: ['usr_alex_001', 'usr_sarah_002'],
      createdAt: new Date(Date.now() - 172800000),
      updatedAt: new Date()
    });

    await Conversation.create({
      conversationId: 'conv_alex_john',
      type: 'individual',
      participants: ['usr_alex_001', 'usr_john_003'],
      createdAt: new Date(Date.now() - 86400000),
      updatedAt: new Date(Date.now() - 3600000)
    });

    await Conversation.create({
      conversationId: 'conv_group_devs',
      type: 'group',
      groupName: '🚀 ConnectHub Engineering Team',
      groupAdmin: 'usr_alex_001',
      groupAvatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=256',
      participants: ['usr_alex_001', 'usr_sarah_002', 'usr_john_003', 'usr_emily_004'],
      createdAt: new Date(Date.now() - 432000000),
      updatedAt: new Date()
    });

    console.log('✉️ Populating messages history...');
    const messages = [
      {
        messageId: 'msg_001',
        conversationId: 'conv_alex_sarah',
        senderId: 'usr_sarah_002',
        text: 'Hey Alex! Have you reviewed the UI mockups for the new chat interface?',
        status: 'read',
        reactions: [{ userId: 'usr_alex_001', emoji: '👍' }],
        createdAt: new Date(Date.now() - 7200000),
        readAt: new Date(Date.now() - 7100000)
      },
      {
        messageId: 'msg_002',
        conversationId: 'conv_alex_sarah',
        senderId: 'usr_alex_001',
        text: 'Yes! The glassmorphism dark theme and smooth micro-animations look incredible.',
        status: 'read',
        reactions: [{ userId: 'usr_sarah_002', emoji: '❤️' }],
        createdAt: new Date(Date.now() - 7000000),
        readAt: new Date(Date.now() - 6900000)
      },
      {
        messageId: 'msg_003',
        conversationId: 'conv_alex_sarah',
        senderId: 'usr_sarah_002',
        text: 'Awesome! Let me know if you need higher-resolution SVG icons for status indicators.',
        status: 'read',
        createdAt: new Date(Date.now() - 3600000),
        readAt: new Date(Date.now() - 3500000)
      },
      {
        messageId: 'msg_004',
        conversationId: 'conv_alex_sarah',
        senderId: 'usr_alex_001',
        text: 'Will do! Socket.IO real-time delivery and Redis caching are working seamlessly now 🚀',
        status: 'delivered',
        createdAt: new Date(Date.now() - 300000)
      },
      {
        messageId: 'msg_grp_001',
        conversationId: 'conv_group_devs',
        senderId: 'usr_john_003',
        text: 'Team, welcome to ConnectHub! Let us coordinate our deployment pipeline here.',
        status: 'read',
        createdAt: new Date(Date.now() - 86400000)
      },
      {
        messageId: 'msg_grp_002',
        conversationId: 'conv_group_devs',
        senderId: 'usr_emily_004',
        text: 'Backend API endpoints and Redis cache invalidation strategy are completely verified.',
        status: 'read',
        createdAt: new Date(Date.now() - 43200000)
      },
      {
        messageId: 'msg_grp_003',
        conversationId: 'conv_group_devs',
        senderId: 'usr_alex_001',
        text: 'Frontend Redux Toolkit state persistence and audio chime notifications are active!',
        status: 'delivered',
        reactions: [{ userId: 'usr_sarah_002', emoji: '🔥' }, { userId: 'usr_john_003', emoji: '🎉' }],
        createdAt: new Date(Date.now() - 100000)
      }
    ];

    await Message.insertMany(messages);
    console.log(`✅ ${messages.length} sample messages created!`);

    console.log('🎉 Seeding successfully completed!');
    process.exit(0);
  } catch (error) {
    console.warn('⚠️ MongoDB Atlas Seeding notice:', error.message);
    console.log('💡 The server is configured to fall back to memory store until MongoDB Atlas connection is active.');
    process.exit(0);
  }
};

seedData();
