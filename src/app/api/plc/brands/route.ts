import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function fmtBrand(r: any) {
  return {
    id: r.id,
    name: r.name,
    logo: r.logo,
    description: r.description,
    deviceTypeIds: Array.isArray(r.device_type_ids) ? r.device_type_ids : [],
    createdAt: r.created_at,
  };
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("brands")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw new Error(error.message);

    return NextResponse.json({ data: (data || []).map(fmtBrand) });
  } catch (err: any) {
    console.error("List brands error:", err);
    return NextResponse.json({ error: err.message || "查询失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, logo, description, deviceTypeIds } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "请输入品牌名称" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("brands")
      .insert({
        name: name.trim(),
        logo: logo || null,
        description: description?.trim() || null,
        device_type_ids: Array.isArray(deviceTypeIds) ? deviceTypeIds : [],
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ data: fmtBrand(data) });
  } catch (err: any) {
    console.error("Create brand error:", err);
    return NextResponse.json({ error: err.message || "新增失败" }, { status: 400 });
  }
}
