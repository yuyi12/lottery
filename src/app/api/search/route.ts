import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 30));

    const where: any = { AND: [] };

    // 和值范围
    const sumMin = searchParams.get("sum_min");
    const sumMax = searchParams.get("sum_max");
    if (sumMin || sumMax) {
      const cond: any = {};
      if (sumMin) cond.gte = Number(sumMin);
      if (sumMax) cond.lte = Number(sumMax);
      where.AND.push({ sumValue: cond });
    }

    // 跨度范围
    const spanMin = searchParams.get("span_min");
    const spanMax = searchParams.get("span_max");
    if (spanMin || spanMax) {
      const cond: any = {};
      if (spanMin) cond.gte = Number(spanMin);
      if (spanMax) cond.lte = Number(spanMax);
      where.AND.push({ span: cond });
    }

    // AC值范围
    const acMin = searchParams.get("ac_min");
    const acMax = searchParams.get("ac_max");
    if (acMin || acMax) {
      const cond: any = {};
      if (acMin) cond.gte = Number(acMin);
      if (acMax) cond.lte = Number(acMax);
      where.AND.push({ acValue: cond });
    }

    // 大小比（多选）
    const bigSmall = searchParams.get("big_small");
    if (bigSmall) {
      const values = bigSmall.split(",").filter(Boolean);
      if (values.length > 0) {
        where.AND.push({ bigSmallRatio: { in: values } });
      }
    }

    // 奇偶比（多选）
    const oddEven = searchParams.get("odd_even");
    if (oddEven) {
      const values = oddEven.split(",").filter(Boolean);
      if (values.length > 0) {
        where.AND.push({ oddEvenRatio: { in: values } });
      }
    }

    // 三区比（多选）
    const threeZone = searchParams.get("three_zone");
    if (threeZone) {
      const values = threeZone.split(",").filter(Boolean);
      if (values.length > 0) {
        where.AND.push({ threeZoneRatio: { in: values } });
      }
    }

    // 012路比（多选）
    const route012 = searchParams.get("route_012");
    if (route012) {
      const values = route012.split(",").filter(Boolean);
      if (values.length > 0) {
        where.AND.push({ route012Ratio: { in: values } });
      }
    }

    // 清理空的 AND
    if (where.AND.length === 0) delete where.AND;

    const [data, total] = await Promise.all([
      prisma.allLotteryRecord.findMany({
        where,
        orderBy: { id: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.allLotteryRecord.count({ where }),
    ]);

    const records = data.map((r) => ({
      id: r.id,
      red1: r.red1,
      red2: r.red2,
      red3: r.red3,
      red4: r.red4,
      red5: r.red5,
      red6: r.red6,
      sumValue: r.sumValue,
      bigSmallRatio: r.bigSmallRatio,
      oddEvenRatio: r.oddEvenRatio,
      span: r.span,
      threeZoneRatio: r.threeZoneRatio,
      acValue: r.acValue,
      route012Ratio: r.route012Ratio,
    }));

    return NextResponse.json({ data: records, total, page, pageSize });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}
