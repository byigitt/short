import { NextRequest, NextResponse } from 'next/server';
import { urlSchema } from '@/lib/validations/url';
import { generateShortCode, isReservedKeyword } from '@/lib/utils/url';
import connectDB from '@/lib/db';
import { Url } from '@/lib/models/url';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const body = urlSchema.parse(json);

    await connectDB();

    // Check if custom alias is provided and not reserved
    if (body.customAlias) {
      if (isReservedKeyword(body.customAlias)) {
        return NextResponse.json(
          { error: 'This alias is reserved and cannot be used' },
          { status: 400 }
        );
      }

      // Check if custom alias is already taken
      const existingUrl = await Url.findOne({
        customAlias: body.customAlias,
      });

      if (existingUrl) {
        return NextResponse.json(
          { error: 'This custom alias is already taken' },
          { status: 400 }
        );
      }
    }

    // Generate a unique short code
    let shortCode = body.customAlias || generateShortCode();
    let attempts = 0;
    const maxAttempts = 5;

    // Keep generating new codes if there's a collision
    while (attempts < maxAttempts) {
      try {
        const url = await Url.create({
          originalUrl: body.url,
          shortCode,
          customAlias: body.customAlias,
          expiresAt: body.expiresAt,
          creatorIp: req.headers.get('x-forwarded-for') || 'unknown',
        });

        const shortUrl = `${APP_URL}/${url.shortCode}`;
        const analyticsUrl = `${APP_URL}/a/${url.shortCode}`;

        return NextResponse.json({
          shortUrl,
          analyticsUrl,
          message: 'URL shortened successfully',
        });
      } catch (error: any) {
        if (error.code === 11000 && !body.customAlias) {
          // Only generate a new code if we're not using a custom alias
          shortCode = generateShortCode();
          attempts++;
        } else {
          throw error;
        }
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate a unique short code' },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Error creating short URL:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

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