import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "elizee_worship_super_secret_key_2026"
);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  const { pathname } = request.nextUrl;

  // 1. Redirection si l'utilisateur non connecté tente d'accéder à /dashboard ou /admin
  if (!token && (pathname.startsWith("/dashboard") || pathname.startsWith("/admin"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET_KEY);
      const role = payload.role as "user" | "admin";

      // 2. Redirection si l'utilisateur connecté tente d'accéder aux pages /login ou /register
      if (pathname === "/login" || pathname === "/register") {
        const target = role === "admin" ? "/admin" : "/dashboard";
        return NextResponse.redirect(new URL(target, request.url));
      }

      // 3. Empêcher un rôle "user" d'accéder aux routes /admin
      if (pathname.startsWith("/admin") && role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch {
      // Jeton invalide ou expiré -> Redirection vers /login
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/register"],
};