// In-Memory Database store fallback for seamless testing when Atlas DB is unreachable
const memoryStore = {
  users: [
    {
      userId: 'usr_alex_001',
      username: 'alex_dev',
      email: 'alex@connecthub.com',
      passwordHash: '$2a$10$gN47vU...placeholder', // will be generated dynamically
      profilePicture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=256',
      status: 'online',
      lastSeen: new Date(),
      createdAt: new Date()
    },
    {
      userId: 'usr_sarah_002',
      username: 'sarah_design',
      email: 'sarah@connecthub.com',
      passwordHash: '$2a$10$gN47vU...placeholder',
      profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256',
      status: 'online',
      lastSeen: new Date(),
      createdAt: new Date()
    },
    {
      userId: 'usr_john_003',
      username: 'john_admin',
      email: 'john@connecthub.com',
      passwordHash: '$2a$10$gN47vU...placeholder',
      profilePicture: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=256',
      status: 'away',
      lastSeen: new Date(Date.now() - 3600000),
      createdAt: new Date()
    },
    {
      userId: 'usr_emily_004',
      username: 'emily_tech',
      email: 'emily@connecthub.com',
      passwordHash: '$2a$10$gN47vU...placeholder',
      profilePicture: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=256',
      status: 'offline',
      lastSeen: new Date(Date.now() - 86400000),
      createdAt: new Date()
    }
  ],
  conversations: [
    {
      conversationId: 'conv_alex_sarah',
      type: 'individual',
      participants: ['usr_alex_001', 'usr_sarah_002'],
      groupName: '',
      groupAdmin: null,
      groupAvatar: '',
      createdAt: new Date(Date.now() - 172800000),
      updatedAt: new Date()
    },
    {
      conversationId: 'conv_alex_john',
      type: 'individual',
      participants: ['usr_alex_001', 'usr_john_003'],
      groupName: '',
      groupAdmin: null,
      groupAvatar: '',
      createdAt: new Date(Date.now() - 86400000),
      updatedAt: new Date(Date.now() - 3600000)
    },
    {
      conversationId: 'conv_group_devs',
      type: 'group',
      groupName: '🚀 ConnectHub Engineering Team',
      groupAdmin: 'usr_alex_001',
      groupAvatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=256',
      participants: ['usr_alex_001', 'usr_sarah_002', 'usr_john_003', 'usr_emily_004'],
      createdAt: new Date(Date.now() - 432000000),
      updatedAt: new Date()
    }
  ],
  messages: [
    {
      messageId: 'msg_001',
      conversationId: 'conv_alex_sarah',
      senderId: 'usr_sarah_002',
      text: 'Hey Alex! Have you reviewed the UI mockups for the new chat interface?',
      messageType: 'text',
      mediaUrl: '',
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
      messageType: 'text',
      mediaUrl: '',
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
      messageType: 'text',
      mediaUrl: '',
      status: 'read',
      reactions: [],
      createdAt: new Date(Date.now() - 3600000),
      readAt: new Date(Date.now() - 3500000)
    },
    {
      messageId: 'msg_004',
      conversationId: 'conv_alex_sarah',
      senderId: 'usr_alex_001',
      text: 'Will do! Socket.IO real-time delivery and Redis caching are working seamlessly now 🚀',
      messageType: 'text',
      mediaUrl: '',
      status: 'delivered',
      reactions: [],
      createdAt: new Date(Date.now() - 300000)
    },
    {
      messageId: 'msg_grp_001',
      conversationId: 'conv_group_devs',
      senderId: 'usr_john_003',
      text: 'Team, welcome to ConnectHub! Let us coordinate our deployment pipeline here.',
      messageType: 'text',
      mediaUrl: '',
      status: 'read',
      reactions: [],
      createdAt: new Date(Date.now() - 86400000)
    },
    {
      messageId: 'msg_grp_002',
      conversationId: 'conv_group_devs',
      senderId: 'usr_emily_004',
      text: 'Backend API endpoints and Redis cache invalidation strategy are completely verified.',
      messageType: 'text',
      mediaUrl: '',
      status: 'read',
      reactions: [],
      createdAt: new Date(Date.now() - 43200000)
    },
    {
      messageId: 'msg_grp_003',
      conversationId: 'conv_group_devs',
      senderId: 'usr_alex_001',
      text: 'Frontend Redux Toolkit state persistence and audio chime notifications are active!',
      messageType: 'text',
      mediaUrl: '',
      status: 'delivered',
      reactions: [{ userId: 'usr_sarah_002', emoji: '🔥' }, { userId: 'usr_john_003', emoji: '🎉' }],
      createdAt: new Date(Date.now() - 100000)
    }
  ]
};

module.exports = memoryStore;
