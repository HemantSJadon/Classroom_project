import { Redis } from '@upstash/redis';

// Limits per user per route per minute
const LIMITS: Record<string, number> = {
  chat: 30,
  colearners: 40,
  reexplain: 20,
  mindmap: 10,
  card: 15,
  recap: 10,
  summarise: 10,
  intake: 20,
};

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  return redis;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
}

export async function checkRateLimit(userId: string, route: string): Promise<RateLimitResult> {
  const client = getRedis();
  const limit = LIMITS[route] ?? 20;

  // If Redis is not configured, allow all requests (dev mode)
  if (!client) return { allowed: true, remaining: limit, reset: 0 };

  const window = 60; // seconds
  const key = `rl:${userId}:${route}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - window;

  try {
    // Sliding window using a sorted set: score = timestamp, member = unique nano ID
    const id = `${now}-${Math.random()}`;
    await client.zadd(key, { score: now, member: id });
    await client.zremrangebyscore(key, 0, windowStart);
    await client.expire(key, window + 5);
    const count = await client.zcard(key);

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      reset: now + window,
    };
  } catch {
    // Redis errors are non-fatal — allow the request
    return { allowed: true, remaining: limit, reset: 0 };
  }
}

export function rateLimitResponse(reset: number) {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please wait before trying again.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(reset - Math.floor(Date.now() / 1000)),
      },
    }
  );
}
