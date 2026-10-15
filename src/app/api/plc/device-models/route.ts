import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function fmtDeviceModel(r: any) {
  return {
    id: r.id,
    name: r.name,
    brandId: r.brand_id,
    deviceTypeId: r.device_type_id,
    description: r.description,
    image: r.image,
    createdAt: r.created_at,
  };
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("device_models")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw new Error(error.message);

    return NextResponse.json({ data: (data || []).map(fmtDeviceModel) });
  } catch (err: any) {
    console.error("List device models error:", err);
    return NextResponse.json({ error: err.message || "查询失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const { data, error } = await supabaseAdmin
      .from("device_models")
      .insert({
        name: name.trim(),
        brand_id: brandId,
        device_type_id: deviceTypeId,
        description: description?.trim() || null,
        image: image || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ data: fmtDeviceModel(data) });
  } catch (err: any) {
    console.error("Create device model error:", err);
    return NextResponse.json({ error: err.message || "新增失败" }, { status: 400 });
  }
}
