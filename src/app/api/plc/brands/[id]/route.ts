import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的 ID" }, { status: 400 });
    }

    const { name, logo, description, deviceTypeIds } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "请输入品牌名称" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("brands")
      .update({
        name: name.trim(),
        logo: logo || null,
        description: description?.trim() || null,
        device_type_ids: Array.isArray(deviceTypeIds) ? deviceTypeIds : [],
      })
      .eq("id", id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Update brand error:", err);
    return NextResponse.json({ error: err.message || "更新失败" }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的 ID" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("brands").delete().eq("id", id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete brand error:", err);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
