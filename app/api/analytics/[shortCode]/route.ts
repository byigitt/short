import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Url } from '@/lib/models/url';
import { Analytics } from '@/lib/models/analytics';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ shortCode: string }> }
) {
  try {
    await connectDB();
    const params = await context.params;
    const { shortCode } = params;

    // Find the URL
    const url = await Url.findOne({
      $or: [
        { shortCode },
        { customAlias: shortCode },
      ],
    });

    if (!url) {
      return NextResponse.json(
        { error: 'URL not found' },
        { status: 404 }
      );
    }

    // Get analytics data
    const analytics = await Analytics.find({ urlId: url._id })
      .sort({ timestamp: -1 })
      .lean();

    // Construct the response
    const response = {
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      shortUrl: `${APP_URL}/${url.customAlias || url.shortCode}`,
      clickCount: url.clickCount,
      createdAt: url.createdAt,
      expiresAt: url.expiresAt,
      analytics: analytics,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 