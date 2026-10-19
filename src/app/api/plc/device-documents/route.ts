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

function fmtDeviceDocument(r: any) {
  return {
    id: r.id,
    deviceModelId: r.device_model_id,
    description: r.description,
    docPath: r.doc_path,
    createdAt: r.created_at,
  };
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("device_documents")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      if (isMissingTable(error)) {
        return NextResponse.json({ error: MISSING_TABLE_MSG }, { status: 500 });
      }
      throw new Error(error.message);
    }

    return NextResponse.json({ data: (data || []).map(fmtDeviceDocument) });
  } catch (err: any) {
    console.error("List device documents error:", err);
    return NextResponse.json({ error: err.message || "查询失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { deviceModelId, documents } = await request.json();

    if (!deviceModelId) {
      return NextResponse.json({ error: "请选择设备型号" }, { status: 400 });
    }
    if (!Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json({ error: "请至少添加一条文档" }, { status: 400 });
    }

    const rows = documents
      .map((d: any) => ({
        device_model_id: deviceModelId,
        description: typeof d?.description === "string" ? d.description.trim() || null : null,
        doc_path: typeof d?.path === "string" ? d.path.trim() : "",
      }))
      .filter((d: any) => d.doc_path);

    if (rows.length === 0) {
      return NextResponse.json({ error: "请填写文档路径" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("device_documents")
      .insert(rows)
      .select();

    if (error) {
      if (isMissingTable(error)) {
        return NextResponse.json({ error: MISSING_TABLE_MSG }, { status: 500 });
      }
      throw new Error(error.message);
    }

    return NextResponse.json({ data: (data || []).map(fmtDeviceDocument) });
  } catch (err: any) {
    console.error("Create device documents error:", err);
    return NextResponse.json({ error: err.message || "新增失败" }, { status: 400 });
  }
}
