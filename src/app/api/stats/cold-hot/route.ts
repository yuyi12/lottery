import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface NumberStat {
  number: number;
  count: number;
  missing: number;
  level: "hot" | "warm" | "cold";
  levelLabel: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const periods = Math.min(500, Math.max(5, Number(searchParams.get("periods")) || 30));

    // 查询最近 N 期记录，按 code 降序
    const records = await prisma.lotteryRecord.findMany({
      orderBy: { code: "desc" },
      take: periods,
      select: {
        code: true,
        red1: true, red2: true, red3: true,
        red4: true, red5: true, red6: true,
        blue: true,
      },
    });

    if (records.length === 0) {
      return NextResponse.json({ error: "暂无数据" }, { status: 404 });
    }

    const latestCode = records[0].code;

    // 初始化计数器
    const redCount: number[] = new Array(34).fill(0);   // 1-33
    const blueCount: number[] = new Array(17).fill(0);  // 1-16
    const redLastSeen: number[] = new Array(34).fill(-1);
    const blueLastSeen: number[] = new Array(17).fill(-1);

    // 统计频次 + 记录最后出现位置
    for (let idx = 0; idx < records.length; idx++) {
      const r = records[idx];
      const pos = idx; // 0 = 最近一期

      const reds = [r.red1, r.red2, r.red3, r.red4, r.red5, r.red6];
      for (const n of reds) {
        redCount[n]++;
        if (redLastSeen[n] === -1) redLastSeen[n] = pos;
      }

      const b = r.blue;
      blueCount[b]++;
      if (blueLastSeen[b] === -1) blueLastSeen[b] = pos;
    }

    // 理论平均值
    const redAvg = (periods * 6) / 33;
    const blueAvg = periods / 16;

    // 分类
    const classify = (count: number, avg: number): "hot" | "warm" | "cold" => {
      if (count >= avg * 1.3) return "hot";
      if (count <= avg * 0.6) return "cold";
      return "warm";
    };

    const levelLabels: Record<string, string> = {
      hot: "热号",
      warm: "温号",
      cold: "冷号",
    };

    // 红球统计
    const redStats: NumberStat[] = [];
    for (let n = 1; n <= 33; n++) {
      redStats.push({
        number: n,
        count: redCount[n],
        missing: redLastSeen[n] === -1 ? periods : redLastSeen[n],
        level: classify(redCount[n], redAvg),
        levelLabel: levelLabels[classify(redCount[n], redAvg)],
      });
    }

    // 蓝球统计
    const blueStats: NumberStat[] = [];
    for (let n = 1; n <= 16; n++) {
      blueStats.push({
        number: n,
        count: blueCount[n],
        missing: blueLastSeen[n] === -1 ? periods : blueLastSeen[n],
        level: classify(blueCount[n], blueAvg),
        levelLabel: levelLabels[classify(blueCount[n], blueAvg)],
      });
    }

    return NextResponse.json({
      periods,
      totalRecords: records.length,
      latestCode,
      redAvg: Math.round(redAvg * 100) / 100,
      blueAvg: Math.round(blueAvg * 100) / 100,
      redStats,
      blueStats,
    });
  } catch (error) {
    console.error("Cold-hot stats error:", error);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}
