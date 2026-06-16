import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const RATIO_COLS = [
  { key: "bigSmall", col: "big_small_ratio" },
  { key: "oddEven", col: "odd_even_ratio" },
  { key: "threeZone", col: "three_zone_ratio" },
  { key: "route012", col: "route_012_ratio" },
];

export async function GET() {
  try {
    const result: any = {};

    for (const { key, col } of RATIO_COLS) {
      // Supabase JS doesn't have DISTINCT, so fetch all and deduplicate
      const { data } = await supabaseAdmin
        .from("all_lottery_records")
        .select(col)
        .limit(1000);

      const seen = new Set<string>();
      result[key] = [];
      for (const r of data || []) {
        const v = (r as any)[col];
        if (v && !seen.has(v)) {
          seen.add(v);
          result[key].push(v);
        }
      }
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({
      bigSmall: [], oddEven: [], threeZone: [], route012: [],
    });
  }
}
