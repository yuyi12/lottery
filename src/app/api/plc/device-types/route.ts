import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function fmtDeviceType(r: any) {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    createdAt: r.created_at,
  };
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("device_types")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw new Error(error.message);

    return NextResponse.json({ data: (data || []).map(fmtDeviceType) });
  } catch (err: any) {
    console.error("List device types error:", err);
    return NextResponse.json({ error: err.message || "查询失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "请输入设备类型" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("device_types")
      .insert({ name: name.trim(), description: description?.trim() || null })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ data: fmtDeviceType(data) });
  } catch (err: any) {
    console.error("Create device type error:", err);
    return NextResponse.json({ error: err.message || "新增失败" }, { status: 400 });
  }
}
