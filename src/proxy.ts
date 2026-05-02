import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = ["/dashboard", "/settings", "/cats/new"];

const MOBILE_API_PREFIX = "/api/mobile";

const ALLOWED_REQUEST_HEADERS = [
  "authorization",
  "content-type",
  "accept",
  "x-vercel-protection-bypass",
  "x-vercel-set-bypass-cookie",
].join(", ");

function applyMobileCorsHeaders(response: NextResponse, origin: string | null) {
  // Mobile clients (Expo native fetch) don't enforce CORS, but Expo Web
  // running in a browser does, and our custom bypass header triggers a
  // preflight. Allow any origin since the API itself is gated by the mobile
  // Bearer token.
  response.headers.set("Access-Control-Allow-Origin", origin ?? "*");
  response.headers.set("Vary", "Origin");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS"
  );
  response.headers.set("Access-Control-Allow-Headers", ALLOWED_REQUEST_HEADERS);
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin");

  if (pathname.startsWith(MOBILE_API_PREFIX)) {
    if (request.method === "OPTIONS") {
      return applyMobileCorsHeaders(
        new NextResponse(null, { status: 204 }),
        origin
      );
    }

    return applyMobileCorsHeaders(NextResponse.next(), origin);
  }

  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  if (isProtected) {
    // Check for auth session token (next-auth stores it as a cookie)
    const token =
      request.cookies.get("authjs.session-token") ??
      request.cookies.get("__Secure-authjs.session-token");

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    "/cats/:path*",
    "/api/mobile/:path*",
  ],
};
