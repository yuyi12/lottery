import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function fmt(r: any) {
  return {
    id: r.id, red1: r.red1, red2: r.red2, red3: r.red3,
    red4: r.red4, red5: r.red5, red6: r.red6,
    sumValue: r.sum_value, bigSmallRatio: r.big_small_ratio,
    oddEvenRatio: r.odd_even_ratio, span: r.span,
    threeZoneRatio: r.three_zone_ratio, acValue: r.ac_value,
    route012Ratio: r.route_012_ratio,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 30));

    let query = supabaseAdmin.from("all_lottery_records").select("*", { count: "exact" });

    // 范围筛选
    const sumMin = searchParams.get("sum_min");
    const sumMax = searchParams.get("sum_max");
    if (sumMin) query = query.gte("sum_value", Number(sumMin));
    if (sumMax) query = query.lte("sum_value", Number(sumMax));

    const spanMin = searchParams.get("span_min");
    const spanMax = searchParams.get("span_max");
    if (spanMin) query = query.gte("span", Number(spanMin));
    if (spanMax) query = query.lte("span", Number(spanMax));

    const acMin = searchParams.get("ac_min");
    const acMax = searchParams.get("ac_max");
    if (acMin) query = query.gte("ac_value", Number(acMin));
    if (acMax) query = query.lte("ac_value", Number(acMax));

    // 多选
    const filterIn = (param: string, col: string) => {
      const v = searchParams.get(param);
      if (v) {
        const vals = v.split(",").filter(Boolean);
        if (vals.length > 0) query = query.in(col, vals);
      }
    };
    filterIn("big_small", "big_small_ratio");
    filterIn("odd_even", "odd_even_ratio");
    filterIn("three_zone", "three_zone_ratio");
    filterIn("route_012", "route_012_ratio");

    // 红球包含
    const include = searchParams.get("include");
    if (include) {
      const nums = include.split(",").filter(Boolean).map(Number);
      for (const n of nums) {
        query = query.or(`red1.eq.${n},red2.eq.${n},red3.eq.${n},red4.eq.${n},red5.eq.${n},red6.eq.${n}`);
      }
    }

    // 红球排除
    const exclude = searchParams.get("exclude");
    if (exclude) {
      const nums = exclude.split(",").filter(Boolean).map(Number);
      for (const n of nums) {
        query = query.neq("red1", n).neq("red2", n).neq("red3", n)
          .neq("red4", n).neq("red5", n).neq("red6", n);
      }
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order("id")
      .range(from, to);

    if (error) throw new Error(error.message);

    return NextResponse.json({
      data: (data || []).map(fmt),
      total: count || 0,
      page,
      pageSize,
    });
  } catch (err: any) {
    console.error("Search error:", err);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}
