import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Url } from '@/lib/models/url';
import { generateShortCode, isReservedKeyword } from '@/lib/utils/url';
import { urlSchema } from '@/lib/validations/url';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

// Initialize DB connection at startup
connectDB().catch(console.error);

export const runtime = 'edge';
export const preferredRegion = 'fra1'; // Frankfurt for lower latency in Europe
export const maxDuration = 10;

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const json = await req.json();
    const result = urlSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const { url, customAlias, expiresAt } = result.data;

    // Quick validations
    if (customAlias) {
      if (isReservedKeyword(customAlias)) {
        return NextResponse.json(
          { error: 'This alias is reserved' },
          { status: 400 }
        );
      }

      // Check for existing alias
      const exists = await Url.exists({ shortCode: customAlias });
      if (exists) {
        return NextResponse.json(
          { error: 'This alias is already taken' },
          { status: 400 }
        );
      }
    }

    // Generate short code
    const shortCode = customAlias || await generateShortCode();

    // Create URL document
    await Url.create({
      originalUrl: url,
      shortCode,
      ...(expiresAt && { expiresAt }),
      createdBy: req.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous',
      userAgent: req.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({
      shortCode,
      shortUrl: `${APP_URL}/${shortCode}`,
      analyticsUrl: `${APP_URL}/a/${shortCode}`,
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
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 