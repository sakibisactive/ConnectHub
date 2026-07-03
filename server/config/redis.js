const Redis = require('ioredis');

let redisClient = null;
let isRedisConnected = false;

// Simple in-memory fallback cache if Redis is unavailable
const memoryCache = new Map();
const memoryTTLs = new Map();

function initRedis() {
  const redisUrl = process.env.REDIS_URL;
  
  if (redisUrl && redisUrl !== 'redis://localhost:6379') {
    try {
      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        retryStrategy(times) {
          if (times > 3) {
            console.warn('⚠️  Redis connection failed. Falling back to in-memory cache.');
            return null; // stop retrying
          }
          return Math.min(times * 100, 2000);
        }
      });

      redisClient.on('connect', () => {
        console.log('✅ Connected to Redis cache service.');
        isRedisConnected = true;
      });

      redisClient.on('error', (err) => {
        console.warn('⚠️  Redis error:', err.message);
        isRedisConnected = false;
      });
    } catch (error) {
      console.warn('⚠️  Failed to initialize Redis client. Using in-memory fallback.');
    }
  } else {
    console.log('ℹ️  No external REDIS_URL specified. Operating with high-performance in-memory cache.');
  }
}

initRedis();

const redisService = {
  async get(key) {
    if (isRedisConnected && redisClient) {
      try {
        const val = await redisClient.get(key);
        return val ? JSON.parse(val) : null;
      } catch (err) {
        // fallback
      }
    }
    // Memory fallback
    if (memoryTTLs.has(key) && memoryTTLs.get(key) < Date.now()) {
      memoryCache.delete(key);
      memoryTTLs.delete(key);
      return null;
    }
    return memoryCache.has(key) ? memoryCache.get(key) : null;
  },

  async set(key, value, ttlSeconds = 60) {
    if (isRedisConnected && redisClient) {
      try {
        await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        return;
      } catch (err) {
        // fallback
      }
    }
    // Memory fallback
    memoryCache.set(key, value);
    if (ttlSeconds) {
      memoryTTLs.set(key, Date.now() + ttlSeconds * 1000);
    }
  },

  async del(key) {
    if (isRedisConnected && redisClient) {
      try {
        await redisClient.del(key);
      } catch (err) {}
    }
    memoryCache.delete(key);
    memoryTTLs.delete(key);
  },

  async delByPattern(pattern) {
    if (isRedisConnected && redisClient) {
      try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } catch (err) {}
    }
    // Memory pattern deletion
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of memoryCache.keys()) {
      if (regex.test(key)) {
        memoryCache.delete(key);
        memoryTTLs.delete(key);
      }
    }
  },

  // Socket map methods
  async setSocketUser(userId, socketId) {
    await this.set(`socket:${userId}`, socketId, 86400); // 24 hours
    await this.set(`user_by_socket:${socketId}`, userId, 86400);
  },

  async getSocketByUserId(userId) {
    return await this.get(`socket:${userId}`);
  },

  async getUserBySocketId(socketId) {
    return await this.get(`user_by_socket:${socketId}`);
  },

  async removeSocketUser(userId, socketId) {
    await this.del(`socket:${userId}`);
    await this.del(`user_by_socket:${socketId}`);
  }
};

module.exports = redisService;
