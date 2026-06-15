import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

const PROTECTED_PATHS = ["/api/records", "/api/search", "/api/stats", "/dashboard", "/search", "/stats"];
const AUTH_PAGE = "/login";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 检查是否需要保护
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;

  if (!token) {
    // API 请求返回 401，页面请求重定向到登录
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.redirect(new URL(AUTH_PAGE, request.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "登录已过期，请重新登录" }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL(AUTH_PAGE, request.url));
    response.cookies.delete("token");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/records/:path*", "/api/search/:path*", "/api/stats/:path*", "/dashboard/:path*", "/search/:path*", "/stats/:path*"],
};
