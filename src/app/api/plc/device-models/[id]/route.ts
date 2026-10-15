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

    const { name, brandId, deviceTypeId, description, image } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "请输入设备名称" }, { status: 400 });
    }
    if (!brandId) {
      return NextResponse.json({ error: "请选择品牌" }, { status: 400 });
    }
    if (!deviceTypeId) {
      return NextResponse.json({ error: "请选择设备类型" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("device_models")
      .update({
        name: name.trim(),
        brand_id: brandId,
        device_type_id: deviceTypeId,
        description: description?.trim() || null,
        image: image || null,
      })
      .eq("id", id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Update device model error:", err);
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

    const { error } = await supabaseAdmin.from("device_models").delete().eq("id", id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete device model error:", err);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
