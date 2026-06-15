import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseLotteryJson } from "@/lib/parse-lottery";
import { calculateIndicators } from "@/lib/indicators";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 20));
    const code = searchParams.get("code") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    // 构建 where 条件
    const where: any = {};

    if (code) {
      where.code = { contains: code };
    }

    if (dateFrom || dateTo) {
      where.drawDate = {};
      if (dateFrom) {
        where.drawDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.drawDate.lte = new Date(dateTo);
      }
    }

    const [data, total] = await Promise.all([
      prisma.lotteryRecord.findMany({
        where,
        orderBy: { code: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.lotteryRecord.count({ where }),
    ]);

    // 格式化返回
    const records = data.map((r) => ({
      id: r.id,
      code: r.code,
      drawDate: r.drawDate.toISOString().split("T")[0],
      red1: r.red1,
      red2: r.red2,
      red3: r.red3,
      red4: r.red4,
      red5: r.red5,
      red6: r.red6,
      blue: r.blue,
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
    console.error("List records error:", error);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { json } = await request.json();

    if (!json || typeof json !== "string") {
      return NextResponse.json({ error: "请输入 JSON 数据" }, { status: 400 });
    }

    // 解析 JSON
    const parsed = parseLotteryJson(json.trim());

    // 检查期号是否已存在
    const existing = await prisma.lotteryRecord.findUnique({
      where: { code: parsed.code },
    });
    if (existing) {
      return NextResponse.json(
        { error: `期号 ${parsed.code} 已存在` },
        { status: 409 }
      );
    }

    // 计算技术指标
    const sorted = [...parsed.reds].sort((a, b) => a - b);
    const indicators = calculateIndicators(sorted);

    // 入库
    const record = await prisma.lotteryRecord.create({
      data: {
        code: parsed.code,
        drawDate: new Date(parsed.date),
        red1: sorted[0],
        red2: sorted[1],
        red3: sorted[2],
        red4: sorted[3],
        red5: sorted[4],
        red6: sorted[5],
        blue: parsed.blue,
        sumValue: indicators.sumValue,
        bigSmallRatio: indicators.bigSmallRatio,
        oddEvenRatio: indicators.oddEvenRatio,
        span: indicators.span,
        threeZoneRatio: indicators.threeZoneRatio,
        acValue: indicators.acValue,
        route012Ratio: indicators.route012Ratio,
      },
    });

    return NextResponse.json({
      id: record.id,
      code: record.code,
      drawDate: record.drawDate.toISOString().split("T")[0],
      red1: record.red1,
      red2: record.red2,
      red3: record.red3,
      red4: record.red4,
      red5: record.red5,
      red6: record.red6,
      blue: record.blue,
      sumValue: record.sumValue,
      bigSmallRatio: record.bigSmallRatio,
      oddEvenRatio: record.oddEvenRatio,
      span: record.span,
      threeZoneRatio: record.threeZoneRatio,
      acValue: record.acValue,
      route012Ratio: record.route012Ratio,
    });
  } catch (error: any) {
    console.error("Create record error:", error);
    const message = error?.message || "新增失败";
    const status = message.includes("已存在") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
