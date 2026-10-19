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

    const { title, deviceModelId, content } = await request.json();
    if (!title || !title.trim()) {
      return NextResponse.json({ error: "请输入标题" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("notes")
      .update({
        title: title.trim(),
        device_model_id: deviceModelId || null,
        content: content || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Update note error:", err);
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
      .from("notes")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete note error:", err);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
