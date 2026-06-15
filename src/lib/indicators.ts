/**
 * 计算双色球所有技术指标
 * @param reds 6 个红球号码，已排序
 * @returns 技术指标对象
 */
export function calculateIndicators(reds: number[]) {
  if (reds.length !== 6) {
    throw new Error("红球数量必须为 6 个");
  }

  const sorted = [...reds].sort((a, b) => a - b);

  return {
    sumValue: calcSum(sorted),
    bigSmallRatio: calcBigSmallRatio(sorted),
    oddEvenRatio: calcOddEvenRatio(sorted),
    span: calcSpan(sorted),
    threeZoneRatio: calcThreeZoneRatio(sorted),
    acValue: calcAC(sorted),
    route012Ratio: calcRoute012(sorted),
  };
}

/** 和值：6 个红球之和 */
function calcSum(reds: number[]): number {
  return reds.reduce((a, b) => a + b, 0);
}

/** 大小比：大数(17-33)个数 : 小数(1-16)个数 */
function calcBigSmallRatio(reds: number[]): string {
  const big = reds.filter((n) => n >= 17).length;
  const small = reds.filter((n) => n <= 16).length;
  return `${big}:${small}`;
}

/** 奇偶比：奇数个数 : 偶数个数 */
function calcOddEvenRatio(reds: number[]): string {
  const odd = reds.filter((n) => n % 2 === 1).length;
  const even = reds.filter((n) => n % 2 === 0).length;
  return `${odd}:${even}`;
}

/** 跨度：max(红球) - min(红球) */
function calcSpan(reds: number[]): number {
  return reds[reds.length - 1] - reds[0];
}

/** 三区比：一区(1-11) : 二区(12-22) : 三区(23-33) */
function calcThreeZoneRatio(reds: number[]): string {
  const zone1 = reds.filter((n) => n >= 1 && n <= 11).length;
  const zone2 = reds.filter((n) => n >= 12 && n <= 22).length;
  const zone3 = reds.filter((n) => n >= 23 && n <= 33).length;
  return `${zone1}:${zone2}:${zone3}`;
}

/** AC 值：红球两两差值的正差值去重个数 - (红球数 - 1) = 去重差值数 - 5 */
function calcAC(reds: number[]): number {
  const diffs = new Set<number>();
  for (let i = 0; i < reds.length; i++) {
    for (let j = i + 1; j < reds.length; j++) {
      diffs.add(Math.abs(reds[i] - reds[j]));
    }
  }
  return diffs.size - (reds.length - 1);
}

/** 012 路比：除以 3 余 0 : 余 1 : 余 2 */
function calcRoute012(reds: number[]): string {
  const r0 = reds.filter((n) => n % 3 === 0).length;
  const r1 = reds.filter((n) => n % 3 === 1).length;
  const r2 = reds.filter((n) => n % 3 === 2).length;
  return `${r0}:${r1}:${r2}`;
}
