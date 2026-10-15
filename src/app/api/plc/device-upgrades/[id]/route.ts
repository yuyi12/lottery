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

    const { deviceModelId, softwarePath, firmwarePath } = await request.json();
    if (!deviceModelId) {
      return NextResponse.json({ error: "请选择设备型号" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("device_upgrades")
      .update({
        device_model_id: deviceModelId,
        software_path: softwarePath?.trim() || null,
        firmware_path: firmwarePath?.trim() || null,
      })
      .eq("id", id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Update device upgrade error:", err);
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

    const { error } = await supabaseAdmin
      .from("device_upgrades")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete device upgrade error:", err);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
