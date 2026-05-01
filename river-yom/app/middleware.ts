// app/middleware.ts - แก้ใหม่
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose'; // npm install jose

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// กำหนด path → level ขั้นต่ำที่เข้าได้
const PROTECTED: { path: string; minLevel: number }[] = [
  { path: '/setting', minLevel: 2 },
  { path: '/users',   minLevel: 2 },
  { path: '/model',   minLevel: 2 },
  { path: '/equipment', minLevel: 1 },
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rule = PROTECTED.find(p => pathname.startsWith(p.path));
  if (!rule) return NextResponse.next();

  const token = request.cookies.get('access_token')?.value;

  // ไม่มี token → redirect
  if (!token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  try {
    // verify JWT และดึง level
    const { payload } = await jwtVerify(token, SECRET);
    const level = Number(payload.iduser_level ?? 0);

    if (level < rule.minLevel) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // ส่ง user info ไปใน header (ใช้ใน server component ได้)
    const res = NextResponse.next();
    res.headers.set('x-user-level', String(level));
    res.headers.set('x-user-id',    String(payload.sub ?? ''));
    return res;

  } catch {
    // token หมดอายุหรือ invalid → ล้าง cookie แล้ว redirect
    const res = NextResponse.redirect(new URL('/dashboard', request.url));
    res.cookies.delete('access_token');
    return res;
  }
}

export const config = {
  matcher: ['/setting/:path*', '/users/:path*', '/model/:path*', '/equipment/:path*'],
};