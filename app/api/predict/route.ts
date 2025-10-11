import { NextRequest, NextResponse } from 'next/server';
import { generatePredictions } from '@/lib/claude';

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    if (question.length > 500) {
      return NextResponse.json(
        { error: 'Question is too long (max 500 characters)' },
        { status: 400 }
      );
    }

    const result = await generatePredictions(question);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Prediction API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate predictions' },
      { status: 500 }
    );
  }
}

// Optional: GET for server-side rendering
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const question = searchParams.get('q');

  if (!question) {
    return NextResponse.json(
      { error: 'Question parameter is required' },
      { status: 400 }
    );
  }

  try {
    const result = await generatePredictions(question);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Prediction API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate predictions' },
      { status: 500 }
    );
  }
}
