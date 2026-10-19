import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const MISSING_TABLE_MSG =
  "数据表 device_documents 不存在，请先在 Supabase SQL Editor 执行 sql/create_device_documents_table.sql";

function isMissingTable(error: any) {
  return (
    error?.code === "PGRST205" ||
    String(error?.message || "").includes("Could not find the table")
  );
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的 ID" }, { status: 400 });
    }

    const { description, path } = await request.json();
    const docPath = typeof path === "string" ? path.trim() : "";
    if (!docPath) {
      return NextResponse.json({ error: "请填写文档路径" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("device_documents")
      .update({
        description: typeof description === "string" ? description.trim() || null : null,
        doc_path: docPath,
      })
      .eq("id", id);

    if (error) {
      if (isMissingTable(error)) {
        return NextResponse.json({ error: MISSING_TABLE_MSG }, { status: 500 });
      }
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Update device document error:", err);
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
      .from("device_documents")
      .delete()
      .eq("id", id);

    if (error) {
      if (isMissingTable(error)) {
        return NextResponse.json({ error: MISSING_TABLE_MSG }, { status: 500 });
      }
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete device document error:", err);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
