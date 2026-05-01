// lib/rateLimit.ts
import { NextRequest } from 'next/server';

const store = new Map<string, { count: number; reset: number }>();

export function rateLimit(
  req: NextRequest,
  options = { limit: 10, windowMs: 60_000 }
): { success: boolean; remaining: number } {
  const ip  = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const key = `${ip}:${req.nextUrl.pathname}`;
  const now = Date.now();

  const current = store.get(key);

  if (!current || now > current.reset) {
    store.set(key, { count: 1, reset: now + options.windowMs });
    return { success: true, remaining: options.limit - 1 };
  }

  if (current.count >= options.limit) {
    return { success: false, remaining: 0 };
  }

  current.count++;
  return { success: true, remaining: options.limit - current.count };
}

// ใช้ใน API route หรือ middleware
// const { success } = rateLimit(request, { limit: 5, windowMs: 60_000 });
// if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });