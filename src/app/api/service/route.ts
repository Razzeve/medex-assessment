import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

let cachedServices: unknown = null;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const simulateError = searchParams.get('simulateError') === 'true' || request.headers.get('x-simulate-error') === 'true';

  await new Promise((resolve) => setTimeout(resolve, 200));

  if (simulateError) {
    return NextResponse.json(
      { error: 'Simulated Services API Failure (500 Internal Server Error)' },
      { status: 500 }
    );
  }

  try {
    if (!cachedServices) {
      const filePath = path.join(process.cwd(), 'public/data/task1-service-explorer.json');
      const raw = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(raw);
      cachedServices = data.services || [];
    }

    return NextResponse.json(cachedServices, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to load services', details: String(err) },
      { status: 500 }
    );
  }
}
