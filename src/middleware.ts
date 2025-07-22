import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const userToken = request.cookies.get('user_token')?.value;

  if (!userToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Protect specific routes
export const config = {
  matcher: ['/dashboard/:path*'],
};
