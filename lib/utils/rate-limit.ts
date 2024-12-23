import { RateLimit } from '@/lib/models/ratelimit';
import { NextRequest } from 'next/server';

export interface RateLimitConfig {
  intervalInSeconds: number;
  maxRequests: number;
}

export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = { intervalInSeconds: 60, maxRequests: 10 }
) {
  try {
    // Get IP address from request headers
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous';
    const key = `${ip}:${request.nextUrl.pathname}`;
    const now = new Date();

    // Calculate expiration
    const expire = new Date(now.getTime() + config.intervalInSeconds * 1000);

    // Find or create rate limit document
    let rateLimit = await RateLimit.findOne({ key, expire: { $gt: now } });

    if (!rateLimit) {
      rateLimit = await RateLimit.create({
        key,
        points: 1,
        expire,
      });
      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        reset: expire,
      };
    }

    // Increment points
    if (rateLimit.points >= config.maxRequests) {
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        reset: rateLimit.expire,
      };
    }

    rateLimit.points += 1;
    await rateLimit.save();

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - rateLimit.points,
      reset: rateLimit.expire,
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    // If rate limiting fails, allow the request
    return { success: true, limit: config.maxRequests, remaining: config.maxRequests };
  }
} 