import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "邮箱和密码不能为空" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少 6 位" }, { status: 400 });
    }

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      if (error.message?.includes("already") || error.message?.includes("exist")) {
        return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message || "注册失败" }, { status: 400 });
    }

    return NextResponse.json({
      token: data.session?.access_token || "",
      refreshToken: data.session?.refresh_token || "",
      email: data.user?.email || email,
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "注册失败" }, { status: 500 });
  }
}
