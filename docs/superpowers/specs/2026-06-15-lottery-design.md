# 双色球历史中奖记录查询与更新系统 — 设计文档

**日期**: 2026-06-15
**状态**: 已确认

---

## 1. 项目概述

双色球历史中奖记录查询与更新系统（一期），支持手动录入/JSON 粘贴解析中奖数据，列表查询展示，含技术指标自动计算。

---

## 2. 技术选型

| 层 | 选型 |
|---|---|
| 框架 | Next.js 14+ App Router |
| ORM | Prisma |
| 数据库 | PostgreSQL (Supabase) |
| 认证 | 自实现 JWT（bcrypt + jose） |
| UI | Ant Design 5.x + Tailwind CSS 3.x |
| 部署 | Vercel + Supabase |

---

## 3. 数据库设计

### users

| 列 | 类型 | 说明 |
|---|---|---|
| id | SERIAL PK | 用户 ID |
| email | VARCHAR UNIQUE | 登录邮箱 |
| password_hash | VARCHAR | bcrypt 哈希 |

### lottery_records

| 列 | 类型 | 说明 |
|---|---|---|
| id | SERIAL PK | 主键 |
| code | VARCHAR(7) UNIQUE | 期号，如 "2026067" |
| draw_date | DATE | 开奖日期 |
| red_1~6 | INTEGER | 6 个红球 (1-33) |
| blue | INTEGER | 蓝球 (1-16) |
| sum_value | INTEGER | 和值 |
| big_small_ratio | VARCHAR | 大小比，如 "3:3" |
| odd_even_ratio | VARCHAR | 奇偶比，如 "4:2" |
| span | INTEGER | 跨度 |
| three_zone_ratio | VARCHAR | 三区比，如 "2:2:2" |
| ac_value | INTEGER | AC 值 |
| route_012_ratio | VARCHAR | 012 路比，如 "2:2:2" |

> 技术指标在录入时自动计算并存储，查询时直接展示。

---

## 4. API 设计

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /api/auth/register | 注册 |
| POST | /api/auth/login | 登录，返回 JWT |
| GET | /api/records | 分页查询（支持期号/日期范围筛选） |
| POST | /api/records | 新增记录（接收原始 JSON，解析 + 计算技术指标） |
| DELETE | /api/records/:id | 删除记录 |

`POST /api/records` 接收原始 JSON 字符串，后端解析 `code`、`date`、`red`（6 个红球）、`blue`，自动计算和值、大小比、奇偶比、跨度、三区比、AC 值、012 路比后入库，返回完整记录。

---

## 5. 前端页面

### 路由

| 路径 | 页面 | 说明 |
|---|---|---|
| /login | 登录/注册 | 邮箱+密码表单，Tab 切换登录/注册 |
| /dashboard | 记录列表（首页） | 需登录，主功能页 |

### 登录/注册页
- 两个 Tab：登录 / 注册
- 邮箱 + 密码表单
- 登录成功跳转 /dashboard，JWT 存 cookie

### 记录列表页 (/dashboard)
- **顶部栏**：期号搜索框 + 日期范围筛选 + "新增"按钮
- **表格列**：期号 | 开奖日期 | 红球(6) | 蓝球 | 和值 | 大小比 | 奇偶比 | 跨度 | 三区比 | AC值 | 012路比 | 操作
- **红球**：红色圆形标签展示 6 个号码
- **蓝球**：蓝色圆形标签展示 1 个号码
- **操作列**：删除按钮（带确认弹窗）
- **分页**：Ant Design Pagination

### 新增记录 Modal
- 文本域粘贴原始 JSON 字符串
- 点击确认 → 后端解析入库 → 关闭弹窗 → 刷新列表
- 后端返回错误时 toast 提示

---

## 6. 技术指标算法

| 指标 | 算法 |
|---|---|
| 和值 | 6 个红球之和 |
| 大小比 | 大数 (17-33) 个数 : 小数 (1-16) 个数 |
| 奇偶比 | 奇数个数 : 偶数个数 |
| 跨度 | max(红球) - min(红球) |
| 三区比 | 一区(1-11)个数 : 二区(12-22)个数 : 三区(23-33)个数 |
| AC 值 | 红球两两差值的正差值个数 - (红球数 - 1)，即差集去重后的个数 - 5 |
| 012 路比 | 除以 3 余 0 的个数 : 余 1 的个数 : 余 2 的个数 |

---

## 7. JSON 录入格式

输入示例：
```json
{
  "code": "2026067",
  "date": "2026-06-14",
  "red": "04,19,27,29,30,32",
  "blue": "13"
}
```

也接受封装格式（自动识别解析）：
```json
{"state":0,"message":"查询成功","result":[{"code":"2026067","date":"2026-06-14(日)","red":"04,19,27,29,30,32","blue":"13",...}]}
```

---

## 8. 错误处理

- 前端：网络错误 toast 提示、表单校验
- 后端：参数校验返回 400、认证失败返回 401、重复期号返回 409
- JWT 过期自动跳转登录页
