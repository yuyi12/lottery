import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const periods = Math.min(500, Math.max(5, Number(searchParams.get("periods")) || 30));

    // 获取最近 N 期
    const { data: records, error } = await supabaseAdmin
      .from("lottery_records")
      .select("code, red1, red2, red3, red4, red5, red6, blue")
      .order("code", { ascending: false })
      .limit(periods);

    if (error) throw new Error(error.message);
    if (!records || records.length === 0) {
      return NextResponse.json({ error: "暂无数据" }, { status: 404 });
    }

    const latestCode = records[0].code;

    const redCount: number[] = new Array(34).fill(0);
    const blueCount: number[] = new Array(17).fill(0);
    const redLastSeen: number[] = new Array(34).fill(-1);
    const blueLastSeen: number[] = new Array(17).fill(-1);

    for (let idx = 0; idx < records.length; idx++) {
      const r = records[idx];
      const reds = [r.red1, r.red2, r.red3, r.red4, r.red5, r.red6];
      for (const n of reds) {
        redCount[n]++;
        if (redLastSeen[n] === -1) redLastSeen[n] = idx;
      }
      blueCount[r.blue]++;
      if (blueLastSeen[r.blue] === -1) blueLastSeen[r.blue] = idx;
    }

    const redAvg = (records.length * 6) / 33;
    const blueAvg = records.length / 16;

    const classify = (count: number, avg: number): "hot" | "warm" | "cold" => {
      if (count >= avg * 1.3) return "hot";
      if (count <= avg * 0.6) return "cold";
      return "warm";
    };

    const levelLabels: Record<string, string> = { hot: "热号", warm: "温号", cold: "冷号" };

    const makeStats = (len: number, countArr: number[], lastSeenArr: number[]) => {
      const stats = [];
      for (let n = 1; n <= len; n++) {
        const level = classify(countArr[n], len === 33 ? redAvg : blueAvg);
        stats.push({
          number: n,
          count: countArr[n],
          missing: lastSeenArr[n] === -1 ? records.length : lastSeenArr[n],
          level,
          levelLabel: levelLabels[level],
        });
      }
      return stats;
    };

    return NextResponse.json({
      periods,
      totalRecords: records.length,
      latestCode,
      redAvg: Math.round(redAvg * 100) / 100,
      blueAvg: Math.round(blueAvg * 100) / 100,
      redStats: makeStats(33, redCount, redLastSeen),
      blueStats: makeStats(16, blueCount, blueLastSeen),
    });
  } catch (err: any) {
    console.error("Cold-hot error:", err);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}
