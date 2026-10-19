import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_BUCKETS = ["brand-logos", "device-model-images", "note-images"];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const bucketRaw = formData.get("bucket");
    const bucket =
      typeof bucketRaw === "string" && ALLOWED_BUCKETS.includes(bucketRaw)
        ? bucketRaw
        : "brand-logos";

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "请选择图片" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "只支持图片文件" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "图片不能超过 5MB" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const bytes = Buffer.from(await file.arrayBuffer());
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, bytes, { contentType: file.type, upsert: false });

    if (error) throw new Error(error.message);

    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);

    return NextResponse.json({ url: data.publicUrl });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message || "上传失败" }, { status: 500 });
  }
}
