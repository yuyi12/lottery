-- ============================================================
-- 双色球红球全组合生成 SQL
-- 生成 C(33,6) = 1,947,792 条记录 + 所有技术指标
-- 在 Supabase SQL Editor 中执行
-- 预计耗时：3-8 分钟
-- ============================================================

-- 1. 建表
DROP TABLE IF EXISTS all_lottery_records;
CREATE TABLE all_lottery_records (
  id              SERIAL PRIMARY KEY,
  red1            INT NOT NULL,
  red2            INT NOT NULL,
  red3            INT NOT NULL,
  red4            INT NOT NULL,
  red5            INT NOT NULL,
  red6            INT NOT NULL,
  sum_value       INT NOT NULL,
  big_small_ratio VARCHAR NOT NULL,
  odd_even_ratio  VARCHAR NOT NULL,
  span            INT NOT NULL,
  three_zone_ratio VARCHAR NOT NULL,
  ac_value        INT NOT NULL,
  route_012_ratio VARCHAR NOT NULL
);

-- 2. 创建计算 AC 值的辅助函数
CREATE OR REPLACE FUNCTION calc_ac(r1 INT, r2 INT, r3 INT, r4 INT, r5 INT, r6 INT)
RETURNS INT AS $$
  SELECT COUNT(DISTINCT d) - 5 FROM unnest(ARRAY[
    r2-r1, r3-r1, r4-r1, r5-r1, r6-r1,
    r3-r2, r4-r2, r5-r2, r6-r2,
    r4-r3, r5-r3, r6-r3,
    r5-r4, r6-r4,
    r6-r5
  ]) AS t(d)
$$ LANGUAGE sql IMMUTABLE;

-- 3. 插入全量组合数据
INSERT INTO all_lottery_records
  (red1, red2, red3, red4, red5, red6,
   sum_value, big_small_ratio, odd_even_ratio, span,
   three_zone_ratio, ac_value, route_012_ratio)
SELECT
  r1, r2, r3, r4, r5, r6,

  -- 和值
  r1 + r2 + r3 + r4 + r5 + r6,

  -- 大小比 (大数 17-33 : 小数 1-16)
  CONCAT(
    (CASE WHEN r1>=17 THEN 1 ELSE 0 END +
     CASE WHEN r2>=17 THEN 1 ELSE 0 END +
     CASE WHEN r3>=17 THEN 1 ELSE 0 END +
     CASE WHEN r4>=17 THEN 1 ELSE 0 END +
     CASE WHEN r5>=17 THEN 1 ELSE 0 END +
     CASE WHEN r6>=17 THEN 1 ELSE 0 END),
    ':',
    (CASE WHEN r1<=16 THEN 1 ELSE 0 END +
     CASE WHEN r2<=16 THEN 1 ELSE 0 END +
     CASE WHEN r3<=16 THEN 1 ELSE 0 END +
     CASE WHEN r4<=16 THEN 1 ELSE 0 END +
     CASE WHEN r5<=16 THEN 1 ELSE 0 END +
     CASE WHEN r6<=16 THEN 1 ELSE 0 END)
  ),

  -- 奇偶比
  CONCAT(
    (MOD(r1,2) + MOD(r2,2) + MOD(r3,2) + MOD(r4,2) + MOD(r5,2) + MOD(r6,2)),
    ':',
    ((MOD(r1+1,2)) + (MOD(r2+1,2)) + (MOD(r3+1,2)) +
     (MOD(r4+1,2)) + (MOD(r5+1,2)) + (MOD(r6+1,2)))
  ),

  -- 跨度
  r6 - r1,

  -- 三区比 (1-11 : 12-22 : 23-33)
  CONCAT(
    (CASE WHEN r1<=11 THEN 1 ELSE 0 END +
     CASE WHEN r2<=11 THEN 1 ELSE 0 END +
     CASE WHEN r3<=11 THEN 1 ELSE 0 END +
     CASE WHEN r4<=11 THEN 1 ELSE 0 END +
     CASE WHEN r5<=11 THEN 1 ELSE 0 END +
     CASE WHEN r6<=11 THEN 1 ELSE 0 END),
    ':',
    (CASE WHEN r1 BETWEEN 12 AND 22 THEN 1 ELSE 0 END +
     CASE WHEN r2 BETWEEN 12 AND 22 THEN 1 ELSE 0 END +
     CASE WHEN r3 BETWEEN 12 AND 22 THEN 1 ELSE 0 END +
     CASE WHEN r4 BETWEEN 12 AND 22 THEN 1 ELSE 0 END +
     CASE WHEN r5 BETWEEN 12 AND 22 THEN 1 ELSE 0 END +
     CASE WHEN r6 BETWEEN 12 AND 22 THEN 1 ELSE 0 END),
    ':',
    (CASE WHEN r1>=23 THEN 1 ELSE 0 END +
     CASE WHEN r2>=23 THEN 1 ELSE 0 END +
     CASE WHEN r3>=23 THEN 1 ELSE 0 END +
     CASE WHEN r4>=23 THEN 1 ELSE 0 END +
     CASE WHEN r5>=23 THEN 1 ELSE 0 END +
     CASE WHEN r6>=23 THEN 1 ELSE 0 END)
  ),

  -- AC 值
  calc_ac(r1, r2, r3, r4, r5, r6),

  -- 012 路比
  CONCAT(
    (CASE WHEN MOD(r1,3)=0 THEN 1 ELSE 0 END +
     CASE WHEN MOD(r2,3)=0 THEN 1 ELSE 0 END +
     CASE WHEN MOD(r3,3)=0 THEN 1 ELSE 0 END +
     CASE WHEN MOD(r4,3)=0 THEN 1 ELSE 0 END +
     CASE WHEN MOD(r5,3)=0 THEN 1 ELSE 0 END +
     CASE WHEN MOD(r6,3)=0 THEN 1 ELSE 0 END),
    ':',
    (CASE WHEN MOD(r1,3)=1 THEN 1 ELSE 0 END +
     CASE WHEN MOD(r2,3)=1 THEN 1 ELSE 0 END +
     CASE WHEN MOD(r3,3)=1 THEN 1 ELSE 0 END +
     CASE WHEN MOD(r4,3)=1 THEN 1 ELSE 0 END +
     CASE WHEN MOD(r5,3)=1 THEN 1 ELSE 0 END +
     CASE WHEN MOD(r6,3)=1 THEN 1 ELSE 0 END),
    ':',
    (CASE WHEN MOD(r1,3)=2 THEN 1 ELSE 0 END +
     CASE WHEN MOD(r2,3)=2 THEN 1 ELSE 0 END +
     CASE WHEN MOD(r3,3)=2 THEN 1 ELSE 0 END +
     CASE WHEN MOD(r4,3)=2 THEN 1 ELSE 0 END +
     CASE WHEN MOD(r5,3)=2 THEN 1 ELSE 0 END +
     CASE WHEN MOD(r6,3)=2 THEN 1 ELSE 0 END)
  )

FROM
  generate_series(1, 28) r1,
  generate_series(r1+1, 29) r2,
  generate_series(r2+1, 30) r3,
  generate_series(r3+1, 31) r4,
  generate_series(r4+1, 32) r5,
  generate_series(r5+1, 33) r6;

-- 4. 创建索引
CREATE INDEX idx_all_lottery_code ON all_lottery_records(red1, red2, red3, red4, red5, red6);
CREATE INDEX idx_all_lottery_sum ON all_lottery_records(sum_value);
CREATE INDEX idx_all_lottery_ac ON all_lottery_records(ac_value);

-- 5. 验证数据量
SELECT COUNT(*) AS total_rows FROM all_lottery_records;
-- 预期: 1,947,792

-- 6. 预览前 10 条
SELECT * FROM all_lottery_records ORDER BY id LIMIT 10;
