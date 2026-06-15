import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的 ID" }, { status: 400 });
    }

    const record = await prisma.lotteryRecord.findUnique({ where: { id } });
    if (!record) {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    }

    await prisma.lotteryRecord.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete record error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
