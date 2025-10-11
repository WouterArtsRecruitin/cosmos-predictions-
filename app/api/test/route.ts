import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'API werkt correct!',
    timestamp: new Date().toISOString(),
    env: {
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
      keyLength: process.env.ANTHROPIC_API_KEY?.length || 0
    }
  });
}