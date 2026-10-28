import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

let cachedCategories: unknown = null;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const simulateError = searchParams.get('simulateError') === 'true' || request.headers.get('x-simulate-error') === 'true';

  // Realistic network latency simulation (150ms - 250ms)
  await new Promise((resolve) => setTimeout(resolve, 200));

  if (simulateError) {
    return NextResponse.json(
      { error: 'Simulated Category API Failure (500 Internal Server Error)' },
      { status: 500 }
    );
  }

  try {
    if (!cachedCategories) {
      const filePath = path.join(process.cwd(), 'public/data/task1-service-explorer.json');
      const raw = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(raw);
      cachedCategories = data.categories || [];
    }

    return NextResponse.json(cachedCategories, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to load categories', details: String(err) },
      { status: 500 }
    );
  }
}
