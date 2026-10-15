import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function fmtDeviceUpgrade(r: any) {
  return {
    id: r.id,
    deviceModelId: r.device_model_id,
    softwarePath: r.software_path,
    firmwarePath: r.firmware_path,
    createdAt: r.created_at,
  };
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("device_upgrades")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw new Error(error.message);

    return NextResponse.json({ data: (data || []).map(fmtDeviceUpgrade) });
  } catch (err: any) {
    console.error("List device upgrades error:", err);
    return NextResponse.json({ error: err.message || "查询失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { deviceModelId, softwarePath, firmwarePath } = await request.json();

    if (!deviceModelId) {
      return NextResponse.json({ error: "请选择设备型号" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("device_upgrades")
      .insert({
        device_model_id: deviceModelId,
        software_path: softwarePath?.trim() || null,
        firmware_path: firmwarePath?.trim() || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ data: fmtDeviceUpgrade(data) });
  } catch (err: any) {
    console.error("Create device upgrade error:", err);
    return NextResponse.json({ error: err.message || "新增失败" }, { status: 400 });
  }
}
