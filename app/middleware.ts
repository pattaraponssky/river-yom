// // middleware.ts (วางที่ root)
// import { NextRequest, NextResponse } from 'next/server';

// export function middleware(request: NextRequest) {
//   const pathname = request.nextUrl.pathname;

//   if (
//     pathname.startsWith('/api') ||
//     pathname.startsWith('/_next') ||
//     pathname.startsWith('/static') ||
//     pathname === '/favicon.ico' ||
//     pathname === '/login' ||
//     pathname === '/register'
//   ) {
//     return NextResponse.next();
//   }

//   const token = request.cookies.get('access_token')?.value;

//   console.log(`[Middleware] Path: ${pathname} | Token: ${token ? 'มี' : 'ไม่มี'}`);

//   if (!token) {
//     const loginUrl = new URL('/login', request.url);
//     loginUrl.searchParams.set('redirect', pathname);
//     return NextResponse.redirect(loginUrl);
//   }


//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     '/((?!api|_next/static|_next/image|favicon.ico|login|register|about|/).*)',
//   ],
// };