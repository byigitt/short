import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Url } from '@/lib/models/url';
import { generateShortCode, isReservedKeyword } from '@/lib/utils/url';
import { urlSchema } from '@/lib/validations/url';
import { rateLimit } from '@/lib/utils/rate-limit';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

// Rate limit configuration: 20 requests per minute
const rateLimitConfig = {
  intervalInSeconds: 60,
  maxRequests: 20,
};

// URL patterns for spam prevention
const spamPatterns = [
  /porn/i, /xxx/i, /sex/i, /adult/i, /gambling/i,
  /casino/i, /phish/i, /malware/i, /virus/i, /hack/i,
];

// Initialize database connection at module level
connectDB().catch(console.error);

export async function POST(req: NextRequest) {
  try {
    // Check rate limit
    const rateLimitResult = await rateLimit(req, rateLimitConfig);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toISOString(),
          }
        }
      );
    }

    const json = await req.json();
    const result = urlSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const { url, customAlias, expiresAt } = result.data;

    if (spamPatterns.some(pattern => pattern.test(url.toLowerCase()))) {
      return NextResponse.json(
        { error: 'This URL has been flagged as potentially harmful or inappropriate.' },
        { status: 400 }
      );
    }

    if (customAlias && isReservedKeyword(customAlias)) {
      return NextResponse.json(
        { error: 'This alias is reserved' },
        { status: 400 }
      );
    }

    if (customAlias) {
      const existingUrl = await Url.findOne({ shortCode: customAlias }).lean();
      if (existingUrl) {
        return NextResponse.json(
          { error: 'This alias is already taken' },
          { status: 400 }
        );
      }
    }

    const shortCode = customAlias || await generateShortCode();
    const urlDoc = await Url.create({
      originalUrl: url,
      shortCode,
      ...(expiresAt && { expiresAt }),
      createdBy: req.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous',
      userAgent: req.headers.get('user-agent') || 'unknown',
    });

    const shortUrl = `${APP_URL}/${shortCode}`;
    const analyticsUrl = `${APP_URL}/a/${shortCode}`;

    return NextResponse.json({
      shortCode,
      shortUrl,
      analyticsUrl,
    });
  } catch (error) {
    console.error('Error creating short URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const shortCode = searchParams.get('code');

    if (!shortCode) {
      return NextResponse.json(
        { error: 'Short code is required' },
        { status: 400 }
      );
    }

    const url = await Url.findOne({
      $or: [{ shortCode }, { customAlias: shortCode }],
      status: 'active',
    });

    if (!url) {
      return NextResponse.json(
        { error: 'URL not found' },
        { status: 404 }
      );
    }

    // Check if URL has expired
    if (url.expiresAt && new Date(url.expiresAt) < new Date()) {
      url.status = 'inactive';
      await url.save();
      return NextResponse.json(
        { error: 'URL has expired' },
        { status: 410 }
      );
    }

    const shortUrl = `${APP_URL}/${url.customAlias || url.shortCode}`;

    return NextResponse.json({
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      shortUrl,
      clickCount: url.clickCount,
      createdAt: url.createdAt,
      expiresAt: url.expiresAt,
    });
  } catch (error) {
    console.error('Error fetching URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 