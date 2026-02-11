import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const protectedPaths = ['/setting', '/users', '/model']; // เพิ่ม path ที่ต้องการเช็ค

  if (protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    const token = request.cookies.get('access_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // ถ้าอยากเช็ค level ต้องเรียก API ซึ่ง middleware ไม่เหมาะมาก (เพราะ sync)
    // แนะนำให้เช็คแค่ token ก่อน แล้วเช็ค level ในหน้า
    // หรือใช้ JWT ที่ encode level ไว้ใน token แล้ว decode ฝั่ง middleware
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/setting/:path*', '/users/:path*', '/model/:path*'],
};