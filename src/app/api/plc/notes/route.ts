import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function fmtNote(r: any) {
  return {
    id: r.id,
    title: r.title,
    deviceModelId: r.device_model_id,
    content: r.content,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function parseId(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 20));
    const brandId = parseId(searchParams.get("brandId"));
    const deviceTypeId = parseId(searchParams.get("deviceTypeId"));
    const keyword = (searchParams.get("keyword") || "").trim();

    // 品牌/设备类型筛选：先定位匹配的设备型号 id 列表
    let modelIds: number[] | null = null;
    if (brandId !== null || deviceTypeId !== null) {
      let mq = supabaseAdmin.from("device_models").select("id");
      if (brandId !== null) mq = mq.eq("brand_id", brandId);
      if (deviceTypeId !== null) mq = mq.eq("device_type_id", deviceTypeId);
      const { data: models, error: modelErr } = await mq;
      if (modelErr) throw new Error(modelErr.message);
      modelIds = (models || []).map((m: any) => m.id);
      if (modelIds.length === 0) {
        return NextResponse.json({ data: [], total: 0, page, pageSize });
      }
    }

    let query = supabaseAdmin.from("notes").select("*", { count: "exact" });
    if (modelIds) query = query.in("device_model_id", modelIds);
    if (keyword) query = query.ilike("title", `%${keyword}%`);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order("id", { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);

    return NextResponse.json({
      data: (data || []).map(fmtNote),
      total: count || 0,
      page,
      pageSize,
    });
  } catch (err: any) {
    console.error("List notes error:", err);
    return NextResponse.json({ error: err.message || "查询失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, deviceModelId, content } = await request.json();

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "请输入标题" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("notes")
      .insert({
        title: title.trim(),
        device_model_id: deviceModelId || null,
        content: content || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ data: fmtNote(data) });
  } catch (err: any) {
    console.error("Create note error:", err);
    return NextResponse.json({ error: err.message || "新增失败" }, { status: 400 });
  }
}
