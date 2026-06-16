import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PROTECTED_PATHS = ["/api/records", "/api/search", "/api/stats", "/dashboard", "/search", "/stats"];
const AUTH_PAGE = "/login";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.redirect(new URL(AUTH_PAGE, request.url));
  }

  try {
    // 通过 Supabase Auth API 验证 token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      throw new Error("Invalid token");
    }

    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "登录已过期，请重新登录" }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL(AUTH_PAGE, request.url));
    response.cookies.delete("token");
    return response;
  }
}

export const config = {
  matcher: ["/api/records/:path*", "/api/search/:path*", "/api/stats/:path*", "/dashboard/:path*", "/search/:path*", "/stats/:path*"],
};
