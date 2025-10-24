
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const cookie = req.cookies.get("microsite_auth")?.value;
  const pass = process.env.SITE_PASSWORD;
  const url = req.nextUrl;

  if (cookie === pass) return NextResponse.next();
  if (url.pathname.startsWith("/login")) return NextResponse.next();

  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = { matcher: ["/((?!_next|public|api).*)"] };
