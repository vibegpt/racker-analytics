/**
 * Redis client for caching and rate limiting
 * Uses ioredis for Redis connection
 */

import Redis from 'ioredis';

// Initialize Redis client
const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : null;

// Cache helpers
export async function getCached<T>(key: string): Promise<T | null> {
  if (!redis) return null;

  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis GET error:', error);
    return null;
  }
}

export async function setCached<T>(
  key: string,
  value: T,
  expirySeconds?: number
): Promise<void> {
  if (!redis) return;

  try {
    const serialized = JSON.stringify(value);
    if (expirySeconds) {
      await redis.setex(key, expirySeconds, serialized);
    } else {
      await redis.set(key, serialized);
    }
  } catch (error) {
    console.error('Redis SET error:', error);
  }
}

export async function deleteCached(key: string): Promise<void> {
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (error) {
    console.error('Redis DELETE error:', error);
  }
}

// Rate limiting helper
export async function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowSeconds: number
): Promise<boolean> {
  if (!redis) return true; // Allow if Redis not configured

  const key = `ratelimit:${identifier}`;

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }
    return count <= maxRequests;
  } catch (error) {
    console.error('Redis rate limit error:', error);
    return true; // Allow on error
  }
}

export { redis };
