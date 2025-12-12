import redis from "../config/redis.js";

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  BOOKS_LIST: 86400, // 1 day
  PDF_FILE: 86400, // 1 day
  BOOK_DETAIL: 86400, // 1 day
};

/**
 * Check if Redis is connected
 * @returns {boolean} - Connection status
 */
const isRedisConnected = () => {
  try {
    return redis.isOpen || redis.isReady;
  } catch {
    return false;
  }
};

/**
 * Get cached data from Redis
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} - Cached data or null
 */
export const getCache = async (key) => {
  try {
    if (!isRedisConnected()) {
      return null;
    }
    const data = await redis.get(key);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error(`Cache get error for key ${key}:`, error.message);
    return null;
  }
};

/**
 * Get cached binary data from Redis
 * @param {string} key - Cache key
 * @returns {Promise<Buffer|null>} - Cached buffer or null
 */
export const getCacheBuffer = async (key) => {
  try {
    if (!isRedisConnected()) {
      return null;
    }
    // Official redis package returns string, need to convert to buffer
    const data = await redis.get(key);
    if (data) {
      // Convert base64 string back to buffer
      if (typeof data === "string") {
        return Buffer.from(data, "base64");
      }
      return data;
    }
    return null;
  } catch (error) {
    console.error(`Cache getBuffer error for key ${key}:`, error.message);
    return null;
  }
};

/**
 * Set cache in Redis
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} - Success status
 */
export const setCache = async (key, value, ttl = CACHE_TTL.BOOKS_LIST) => {
  try {
    if (!isRedisConnected()) {
      return false;
    }
    const serialized = JSON.stringify(value);
    await redis.setEx(key, ttl, serialized);
    return true;
  } catch (error) {
    console.error(`Cache set error for key ${key}:`, error.message);
    return false;
  }
};

/**
 * Set binary cache in Redis
 * @param {string} key - Cache key
 * @param {Buffer} buffer - Buffer to cache
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} - Success status
 */
export const setCacheBuffer = async (key, buffer, ttl = CACHE_TTL.PDF_FILE) => {
  try {
    if (!isRedisConnected()) {
      return false;
    }
    // Convert buffer to base64 string for storage (redis package stores as string)
    const bufferString = buffer.toString("base64");
    await redis.setEx(key, ttl, bufferString);
    return true;
  } catch (error) {
    console.error(`Cache setBuffer error for key ${key}:`, error.message);
    return false;
  }
};

/**
 * Delete cache from Redis
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} - Success status
 */
export const deleteCache = async (key) => {
  try {
    if (!isRedisConnected()) {
      return false;
    }
    await redis.del(key);
    return true;
  } catch (error) {
    console.error(`Cache delete error for key ${key}:`, error.message);
    return false;
  }
};

/**
 * Delete multiple cache keys matching a pattern
 * @param {string} pattern - Pattern to match (e.g., "books:*")
 * @returns {Promise<number>} - Number of keys deleted
 */
export const deleteCachePattern = async (pattern) => {
  try {
    if (!isRedisConnected()) {
      return 0;
    }
    // Use SCAN instead of KEYS for better performance (KEYS can block Redis)
    const keys = [];
    for await (const key of redis.scanIterator({
      MATCH: pattern,
      COUNT: 100,
    })) {
      keys.push(key);
    }
    if (keys.length > 0) {
      // del() accepts array of keys
      await redis.del(keys);
      return keys.length;
    }
    return 0;
  } catch (error) {
    console.error(`Cache deletePattern error for pattern ${pattern}:`, error.message);
    return 0;
  }
};

/**
 * Cache key generators
 */
export const cacheKeys = {
  booksList: () => "books:list:all",
  bookDetail: (id) => `books:detail:${id}`,
  pdfFile: (id) => `books:pdf:${id}`,
  coverImage: (id) => `books:cover:${id}`,
};

