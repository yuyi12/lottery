import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [bigSmall, oddEven, threeZone, route012] = await Promise.all([
      prisma.allLotteryRecord.findMany({
        select: { bigSmallRatio: true },
        distinct: ["bigSmallRatio"],
        orderBy: { bigSmallRatio: "asc" },
      }),
      prisma.allLotteryRecord.findMany({
        select: { oddEvenRatio: true },
        distinct: ["oddEvenRatio"],
        orderBy: { oddEvenRatio: "asc" },
      }),
      prisma.allLotteryRecord.findMany({
        select: { threeZoneRatio: true },
        distinct: ["threeZoneRatio"],
        orderBy: { threeZoneRatio: "asc" },
      }),
      prisma.allLotteryRecord.findMany({
        select: { route012Ratio: true },
        distinct: ["route012Ratio"],
        orderBy: { route012Ratio: "asc" },
      }),
    ]);

    return NextResponse.json({
      bigSmall: bigSmall.map((r) => r.bigSmallRatio),
      oddEven: oddEven.map((r) => r.oddEvenRatio),
      threeZone: threeZone.map((r) => r.threeZoneRatio),
      route012: route012.map((r) => r.route012Ratio),
    });
  } catch (error) {
    console.error("Options error:", error);
    return NextResponse.json({ error: "获取选项失败" }, { status: 500 });
  }
}
