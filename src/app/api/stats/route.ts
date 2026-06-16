import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const codeFrom = searchParams.get("codeFrom") || "";
    const codeTo = searchParams.get("codeTo") || "";

    let query = supabaseAdmin.from("lottery_records").select("*", { count: "exact" });
    if (dateFrom) query = query.gte("draw_date", dateFrom);
    if (dateTo) query = query.lte("draw_date", dateTo);
    if (codeFrom) query = query.gte("code", codeFrom);
    if (codeTo) query = query.lte("code", codeTo);

    // 分批获取所有记录
    const allRows: any[] = [];
    let from = 0;
    const batchSize = 1000;
    while (true) {
      const { data, error } = await query.range(from, from + batchSize - 1);
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) break;
      allRows.push(...data);
      if (data.length < batchSize) break;
      from += batchSize;
    }

    // 聚合函数
    const groupBy = <T extends Record<string, any>>(rows: any[], key: string, labelKey: string, valueKey: string) => {
      const map = new Map<any, number>();
      for (const r of rows) {
        const v = r[key];
        map.set(v, (map.get(v) || 0) + 1);
      }
      return Array.from(map.entries())
        .map(([value, count]) => ({ [labelKey]: value, [valueKey]: count }))
        .sort((a, b) => {
          const va = a[labelKey], vb = b[labelKey];
          return typeof va === "number" ? va - vb : String(va).localeCompare(String(vb));
        });
    };

    return NextResponse.json({
      total: allRows.length,
      sumDistribution: groupBy(allRows, "sum_value", "value", "count"),
      spanDistribution: groupBy(allRows, "span", "value", "count"),
      acDistribution: groupBy(allRows, "ac_value", "value", "count"),
      bigSmallDistribution: groupBy(allRows, "big_small_ratio", "label", "count"),
      oddEvenDistribution: groupBy(allRows, "odd_even_ratio", "label", "count"),
      threeZoneDistribution: groupBy(allRows, "three_zone_ratio", "label", "count"),
      route012Distribution: groupBy(allRows, "route_012_ratio", "label", "count"),
    });
  } catch (err: any) {
    console.error("Stats error:", err);
    return NextResponse.json({ error: "统计查询失败" }, { status: 500 });
  }
}
