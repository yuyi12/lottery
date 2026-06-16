import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { parseLotteryJsonBatch } from "@/lib/parse-lottery";
import { calculateIndicators } from "@/lib/indicators";

function fmtRecord(r: any) {
  return {
    id: r.id,
    code: r.code,
    drawDate: r.draw_date,
    red1: r.red1, red2: r.red2, red3: r.red3,
    red4: r.red4, red5: r.red5, red6: r.red6,
    blue: r.blue,
    sumValue: r.sum_value,
    bigSmallRatio: r.big_small_ratio,
    oddEvenRatio: r.odd_even_ratio,
    span: r.span,
    threeZoneRatio: r.three_zone_ratio,
    acValue: r.ac_value,
    route012Ratio: r.route_012_ratio,
    prizegrades: r.prizegrades,
    content: r.content,
    poolmoney: r.poolmoney,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 20));
    const code = searchParams.get("code") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    let query = supabaseAdmin.from("lottery_records").select("*", { count: "exact" });

    if (code) query = query.ilike("code", `%${code}%`);
    if (dateFrom) query = query.gte("draw_date", dateFrom);
    if (dateTo) query = query.lte("draw_date", dateTo);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order("code", { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);

    return NextResponse.json({
      data: (data || []).map(fmtRecord),
      total: count || 0,
      page,
      pageSize,
    });
  } catch (err: any) {
    console.error("List records error:", err);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { json } = await request.json();

    if (!json || typeof json !== "string") {
      return NextResponse.json({ error: "请输入 JSON 数据" }, { status: 400 });
    }

    const parsedRecords = parseLotteryJsonBatch(json.trim());
    const results: any[] = [];
    let inserted = 0;
    let updated = 0;

    for (const parsed of parsedRecords) {
      const sorted = [...parsed.reds].sort((a, b) => a - b);
      const indicators = calculateIndicators(sorted);

      const row: any = {
        code: parsed.code,
        draw_date: parsed.date,
        red1: sorted[0], red2: sorted[1], red3: sorted[2],
        red4: sorted[3], red5: sorted[4], red6: sorted[5],
        blue: parsed.blue,
        sum_value: indicators.sumValue,
        big_small_ratio: indicators.bigSmallRatio,
        odd_even_ratio: indicators.oddEvenRatio,
        span: indicators.span,
        three_zone_ratio: indicators.threeZoneRatio,
        ac_value: indicators.acValue,
        route_012_ratio: indicators.route012Ratio,
      };
      if (parsed.prizegrades) row.prizegrades = parsed.prizegrades;
      if (parsed.content) row.content = parsed.content;
      if (parsed.poolmoney) row.poolmoney = parsed.poolmoney;

      // Upsert
      const { data: existing } = await supabaseAdmin
        .from("lottery_records")
        .select("id")
        .eq("code", parsed.code)
        .single();

      if (existing) {
        const { error } = await supabaseAdmin
          .from("lottery_records")
          .update(row)
          .eq("code", parsed.code);
        if (error) throw new Error(error.message);
        updated++;
        results.push({ ...row, id: existing.id, drawDate: parsed.date });
      } else {
        const { data: created, error } = await supabaseAdmin
          .from("lottery_records")
          .insert(row)
          .select()
          .single();
        if (error) throw new Error(error.message);
        inserted++;
        results.push(created ? fmtRecord(created) : row);
      }
    }

    return NextResponse.json({ results, total: results.length, inserted, updated });
  } catch (err: any) {
    console.error("Create record error:", err);
    return NextResponse.json({ error: err.message || "新增失败" }, { status: 400 });
  }
}
