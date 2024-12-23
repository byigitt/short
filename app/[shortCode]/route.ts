import { NextRequest, NextResponse } from 'next/server';
import { Analytics } from '@/lib/models/analytics';
import { Url } from '@/lib/models/url';
import connectDB from '@/lib/db';
import { UAParser } from 'ua-parser-js';

function extractUtmParams(url: string) {
  try {
    const urlObj = new URL(url);
    return {
      source: urlObj.searchParams.get('utm_source') || undefined,
      medium: urlObj.searchParams.get('utm_medium') || undefined,
      campaign: urlObj.searchParams.get('utm_campaign') || undefined,
      term: urlObj.searchParams.get('utm_term') || undefined,
      content: urlObj.searchParams.get('utm_content') || undefined,
    };
  } catch {
    return {};
  }
}

function extractReferrerDomain(referrer: string): string | undefined {
  try {
    const url = new URL(referrer);
    return url.hostname;
  } catch {
    return undefined;
  }
}

function detectBot(userAgent: string): boolean {
  const botPatterns = [
    'bot', 'spider', 'crawl', 'slurp', 'mediapartners',
    'facebookexternalhit', 'whatsapp', 'telegram', 'twitter',
    'linkedinbot', 'pinterest'
  ];
  const lowerUA = userAgent.toLowerCase();
  return botPatterns.some(pattern => lowerUA.includes(pattern));
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ shortCode: string }> }
) {
  try {
    console.log('Starting URL redirection process...');
    await connectDB();
    const params = await context.params;
    const { shortCode } = params;

    console.log('Looking up URL with shortCode or alias:', shortCode);
    // Try to find URL by either shortCode or customAlias
    const url = await Url.findOne({
      $or: [
        { shortCode: shortCode },
        { customAlias: shortCode },
      ],
    });

    console.log('URL lookup result:', url);

    if (!url) {
      console.log('URL not found:', shortCode);
      return NextResponse.redirect(new URL('/404', req.url));
    }

    // Check if URL is inactive
    if (url.status === 'inactive') {
      console.log('URL is inactive:', shortCode);
      return new NextResponse('URL is inactive', { status: 410 });
    }

    // Check if URL has expired
    if (url.expiresAt && new Date(url.expiresAt) < new Date()) {
      console.log('URL has expired:', shortCode);
      url.status = 'inactive';
      await url.save();
      return new NextResponse('URL has expired', { status: 410 });
    }

    // Get request information
    const userAgent = req.headers.get('user-agent') || '';
    const referer = req.headers.get('referer') || '';
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const language = req.headers.get('accept-language');
    const protocol = req.headers.get('x-forwarded-proto') || 'http';

    // Parse user agent
    const parser = new UAParser();
    parser.setUA(userAgent);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const device = parser.getDevice();

    // Determine device type
    let deviceType: 'mobile' | 'tablet' | 'desktop' | 'other' = 'other';
    if (device.type === 'mobile') deviceType = 'mobile';
    else if (device.type === 'tablet') deviceType = 'tablet';
    else if (!device.type) deviceType = 'desktop';

    // Extract UTM parameters from referrer
    const utmParams = extractUtmParams(referer);

    console.log('Creating analytics entry for URL:', url._id);
    // Create analytics entry
    const analytics = await Analytics.create({
      urlId: url._id,
      userAgent: {
        browser: browser.name || '',
        version: browser.version || '',
        os: os.name || '',
        platform: os.version || '',
      },
      device: deviceType,
      referrer: referer,
      referrerDomain: extractReferrerDomain(referer),
      language: language?.split(',')[0],
      ipAddress: ip,
      isBot: detectBot(userAgent),
      protocol,
      isNewVisitor: true,
      utm: utmParams,
      timestamp: new Date(),
      performance: {
        redirectTime: Date.now(),
      },
    });

    console.log('Analytics entry created:', analytics._id);

    // Increment click count
    url.clickCount += 1;
    await url.save();
    console.log('Click count updated for URL:', url._id);

    console.log('Redirecting to:', url.originalUrl);
    // Redirect to original URL with permanent redirect status
    return NextResponse.redirect(url.originalUrl, { status: 301 });
  } catch (error) {
    console.error('Error in URL redirection:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return new NextResponse('Internal server error', { status: 500 });
  }
} 