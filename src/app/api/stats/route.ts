import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const codeFrom = searchParams.get("codeFrom") || "";
    const codeTo = searchParams.get("codeTo") || "";

    // Build WHERE clause fragments
    const conditions: string[] = [];
    const params: any[] = [];

    if (dateFrom) {
      params.push(dateFrom);
      conditions.push(`draw_date >= $${params.length}::date`);
    }
    if (dateTo) {
      params.push(dateTo);
      conditions.push(`draw_date <= $${params.length}::date`);
    }
    if (codeFrom) {
      params.push(codeFrom);
      conditions.push(`code >= $${params.length}`);
    }
    if (codeTo) {
      params.push(codeTo);
      conditions.push(`code <= $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // 和值分布
    const sumDistribution = await prisma.$queryRawUnsafe(
      `SELECT sum_value as value, COUNT(*)::int as count
       FROM lottery_records ${whereClause}
       GROUP BY sum_value ORDER BY sum_value`,
      ...params,
    );

    // 跨度分布
    const spanDistribution = await prisma.$queryRawUnsafe(
      `SELECT span as value, COUNT(*)::int as count
       FROM lottery_records ${whereClause}
       GROUP BY span ORDER BY span`,
      ...params,
    );

    // AC值分布
    const acDistribution = await prisma.$queryRawUnsafe(
      `SELECT ac_value as value, COUNT(*)::int as count
       FROM lottery_records ${whereClause}
       GROUP BY ac_value ORDER BY ac_value`,
      ...params,
    );

    // 大小比分布
    const bigSmallDistribution = await prisma.$queryRawUnsafe(
      `SELECT big_small_ratio as label, COUNT(*)::int as count
       FROM lottery_records ${whereClause}
       GROUP BY big_small_ratio ORDER BY big_small_ratio`,
      ...params,
    );

    // 奇偶比分布
    const oddEvenDistribution = await prisma.$queryRawUnsafe(
      `SELECT odd_even_ratio as label, COUNT(*)::int as count
       FROM lottery_records ${whereClause}
       GROUP BY odd_even_ratio ORDER BY odd_even_ratio`,
      ...params,
    );

    // 三区比分布
    const threeZoneDistribution = await prisma.$queryRawUnsafe(
      `SELECT three_zone_ratio as label, COUNT(*)::int as count
       FROM lottery_records ${whereClause}
       GROUP BY three_zone_ratio ORDER BY three_zone_ratio`,
      ...params,
    );

    // 012路比分布
    const route012Distribution = await prisma.$queryRawUnsafe(
      `SELECT route_012_ratio as label, COUNT(*)::int as count
       FROM lottery_records ${whereClause}
       GROUP BY route_012_ratio ORDER BY route_012_ratio`,
      ...params,
    );

    // 总记录数
    const totalResult = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int as total FROM lottery_records ${whereClause}`,
      ...params,
    ) as any[];

    return NextResponse.json({
      total: totalResult[0]?.total || 0,
      sumDistribution,
      spanDistribution,
      acDistribution,
      bigSmallDistribution,
      oddEvenDistribution,
      threeZoneDistribution,
      route012Distribution,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "统计查询失败" }, { status: 500 });
  }
}
