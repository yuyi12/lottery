interface ParsedRecord {
  code: string;
  date: string;
  reds: number[];
  blue: number;
}

/**
 * 解析录入的 JSON 字符串
 * 支持两种格式：
 * 1. 直接格式: { code, date, red, blue }
 * 2. 封装格式: { state, result: [{ code, date, red, blue, ... }] }
 */
export function parseLotteryJson(jsonStr: string): ParsedRecord {
  let data: any;

  try {
    data = JSON.parse(jsonStr);
  } catch {
    throw new Error("JSON 格式无效");
  }

  // 封装格式：提取 result[0]
  if (data.result && Array.isArray(data.result) && data.result.length > 0) {
    data = data.result[0];
  }

  if (!data.code) {
    throw new Error("缺少期号 (code) 字段");
  }
  if (!data.red) {
    throw new Error("缺少红球 (red) 字段");
  }
  if (data.blue === undefined && data.blue !== 0) {
    throw new Error("缺少蓝球 (blue) 字段");
  }

  const code = String(data.code).trim();
  if (!/^\d{7}$/.test(code)) {
    throw new Error(`期号格式错误: "${code}"，应为 7 位数字`);
  }

  // 解析红球字符串
  const redStr = String(data.red).trim();
  const reds = parseNumberList(redStr);

  if (reds.length !== 6) {
    throw new Error(`红球数量应为 6 个，实际为 ${reds.length} 个`);
  }

  for (const r of reds) {
    if (r < 1 || r > 33) {
      throw new Error(`红球号码 "${r}" 超出范围 (1-33)`);
    }
  }

  // 检查重复
  const redSet = new Set(reds);
  if (redSet.size !== 6) {
    throw new Error("红球号码存在重复");
  }

  // 解析蓝球
  const blue = Number(data.blue);
  if (isNaN(blue) || blue < 1 || blue > 16) {
    throw new Error(`蓝球号码 "${data.blue}" 无效 (1-16)`);
  }

  // 解析日期
  const date = parseDateString(data.date);

  return { code, date, reds, blue };
}

function parseNumberList(str: string): number[] {
  // 支持逗号、空格、中文逗号分隔
  const parts = str.split(/[,，\s]+/).filter(Boolean);
  return parts.map((p) => {
    const n = parseInt(p, 10);
    if (isNaN(n)) {
      throw new Error(`无法解析号码: "${p}"`);
    }
    return n;
  });
}

function parseDateString(dateStr: string | undefined): string {
  if (!dateStr) {
    return new Date().toISOString().split("T")[0];
  }

  const str = String(dateStr).trim();

  // 处理 "2026-06-14(日)" 格式，去掉星期后缀
  const cleaned = str.replace(/\([^)]*\)/g, "").trim();

  // 尝试解析
  const d = new Date(cleaned);
  if (isNaN(d.getTime())) {
    throw new Error(`日期格式无效: "${str}"`);
  }

  return d.toISOString().split("T")[0];
}
