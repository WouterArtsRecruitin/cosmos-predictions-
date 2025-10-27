import { NextRequest, NextResponse } from 'next/server';
import { generatePredictions } from '@/lib/claude';
import { validateQuestion, RateLimiter } from '@/lib/validation';

// Rate limiter: max 5 requests per minute per IP
const rateLimiter = new RateLimiter(5, 60000);

/**
 * Get client IP address from request
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request);
    if (!rateLimiter.isAllowed(clientIp)) {
      return NextResponse.json(
        {
          error: 'Te veel verzoeken. Probeer het over een minuut opnieuw.',
          retryAfter: 60
        },
        { status: 429 }
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Ongeldige request body' },
        { status: 400 }
      );
    }

    // Validate body structure
    if (!body || typeof body !== 'object' || !('question' in body)) {
      return NextResponse.json(
        { error: 'Vraag is verplicht' },
        { status: 400 }
      );
    }

    // Validate and sanitize question
    const validation = validateQuestion((body as { question: unknown }).question);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Generate predictions
    const result = await generatePredictions(validation.sanitized!);

    return NextResponse.json(result, {
      headers: {
        'X-RateLimit-Remaining': rateLimiter.getRemaining(clientIp).toString()
      }
    });
  } catch (error) {
    console.error('Prediction API error:', error);

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Configuratiefout: API key ontbreekt' },
          { status: 503 }
        );
      }

      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Te veel verzoeken naar AI service' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Er ging iets mis bij het genereren van voorspellingen' },
      { status: 500 }
    );
  }
}

// Optional: GET for server-side rendering
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request);
    if (!rateLimiter.isAllowed(clientIp)) {
      return NextResponse.json(
        {
          error: 'Te veel verzoeken. Probeer het over een minuut opnieuw.',
          retryAfter: 60
        },
        { status: 429 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const question = searchParams.get('q');

    // Validate and sanitize question
    const validation = validateQuestion(question);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const result = await generatePredictions(validation.sanitized!);
    return NextResponse.json(result, {
      headers: {
        'X-RateLimit-Remaining': rateLimiter.getRemaining(clientIp).toString()
      }
    });
  } catch (error) {
    console.error('Prediction API error:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het genereren van voorspellingen' },
      { status: 500 }
    );
  }
}
