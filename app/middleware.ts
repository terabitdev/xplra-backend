import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = ['/signin', '/signup', '/forgot-password'];

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value || ''; // Get token from cookies (or use another storage mechanism)

  const { pathname } = req.nextUrl;

  // If the user is not authenticated and trying to access a protected route
  if (!token && !publicRoutes.includes(pathname)) {
    // Redirect to the sign-in page
    const signInUrl = new URL('/signin', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Allow the request to continue if it's a public route or the user is authenticated
  return NextResponse.next();
}

// Enable middleware for all routes
export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)'],
};
