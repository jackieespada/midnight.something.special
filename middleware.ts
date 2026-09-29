import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Only DJ-only, queue-mutating routes are protected. Anything a viewer needs
// (submitting a request, tipping, voting, reading state) stays open.
const PROTECTED_PATHS = [
  "/dj",
  "/api/advance",
  "/api/manual-add",
  "/api/queue-boost",
  "/api/queue-edit",
  "/api/queue-reorder",
  "/api/new-episode",
  "/api/now-playing",
  "/api/theme",
  "/api/hooks-harmony/advance",
  "/api/hooks-harmony/manual-add",
  "/api/hooks-harmony/queue-boost",
  "/api/hooks-harmony/queue-edit",
  "/api/hooks-harmony/queue-reorder",
  "/api/hooks-harmony/new-episode",
  "/api/hooks-harmony/now-playing",
  "/api/hooks-harmony/theme",
  "/api/hooks-harmony/poll-set",
  "/api/hooks-harmony/poll-clear",
  "/site-admin",
  "/api/site/links",
  "/api/site/calendar",
  "/api/site/affiliates",
  "/api/site/suggestions-admin",
];

// Uses the Web Crypto API (available in both the Edge runtime middleware
// runs on, and in Node) rather than Node's "crypto" module, which isn't
// available in the Edge runtime.
async function expectedToken(): Promise<string> {
  const pw = process.env.DJ_PASSWORD || "";
  const data = new TextEncoder().encode(pw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!isProtected) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get("dj_auth")?.value;
  const expected = await expectedToken();
  const isAuthed = Boolean(cookie) && cookie === expected;

  if (isAuthed) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/dj-login", req.url);
  loginUrl.searchParams.set("next", pathname + req.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dj", "/api/:path*"],
};
