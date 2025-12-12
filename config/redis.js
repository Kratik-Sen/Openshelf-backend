import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisConfig = process.env.REDIS_URL
  ? {
      url: process.env.REDIS_URL,
    }
  : {
      socket: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error("❌ Redis: Too many reconnection attempts");
            return new Error("Too many retries");
          }
          const delay = Math.min(retries * 50, 2000);
          return delay;
        },
      },
      password: process.env.REDIS_PASSWORD || undefined,
    };

// Create Redis client
const redis = createClient(redisConfig);

// Handle connection events
redis.on("connect", () => {
  console.log("🔄 Redis: Connecting...");
});

redis.on("ready", () => {
  console.log("✅ Redis: Connected and ready");
});

redis.on("error", (err) => {
  console.error("❌ Redis Connection Error:", err.message);
  // Continue without Redis if connection fails
});

redis.on("reconnecting", () => {
  console.log("🔄 Redis: Reconnecting...");
});

redis.on("end", () => {
  console.log("🔌 Redis: Connection closed");
});

// Connect to Redis (async)
let connectionAttempted = false;
const connectRedis = async () => {
  if (connectionAttempted) return;
  connectionAttempted = true;
  
  try {
    if (!redis.isOpen && !redis.isReady) {
      await redis.connect();
      console.log("✅ Redis: Connection established");
    }
  } catch (error) {
    console.error("❌ Redis: Failed to connect:", error.message);
    console.log("⚠️  App will continue without Redis caching");
    // Continue without Redis - app will work without caching
  }
};

// Auto-connect on import (non-blocking)
connectRedis().catch(() => {
  // Silently handle - already logged above
});

export default redis;

