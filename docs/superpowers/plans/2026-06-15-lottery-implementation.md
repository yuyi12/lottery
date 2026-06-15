# 双色球历史中奖记录系统 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建双色球历史中奖记录查询与更新系统，支持多用户登录、手动 JSON 粘贴录入、技术指标自动计算与列表展示。

**Architecture:** Next.js App Router 全栈应用，Prisma ORM 操作 PostgreSQL，JWT 鉴权保护 API 路由和页面。前端 Ant Design + Tailwind CSS，登录页和仪表盘两个页面。

**Tech Stack:** Next.js 14, Prisma, PostgreSQL (Supabase), JWT (jose + bcryptjs), Ant Design 5, Tailwind CSS 3, TypeScript

---

### Task 1: 项目初始化

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `tsconfig.json`
- Create: `.env`
- Create: `.env.example`
- Create: `src/types/index.ts`

- [ ] **Step 1: 创建 package.json**

```bash
mkdir -p src/app src/components src/lib src/types
```

创建 `package.json`:
```json
{
  "name": "lottery",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "postinstall": "prisma generate"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "antd": "^5.22.0",
    "@ant-design/nextjs-registry": "^1.0.0",
    "@ant-design/icons": "^5.5.0",
    "@prisma/client": "^5.22.0",
    "jose": "^5.9.0",
    "bcryptjs": "^2.4.3",
    "dayjs": "^1.11.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/bcryptjs": "^2.4.6",
    "prisma": "^5.22.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

- [ ] **Step 2: 安装依赖**

```bash
cd "D:\项目\lottery" && npm install
```
Expected: 无错误。

- [ ] **Step 3: 创建配置文件**

创建 `next.config.ts`:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["antd", "@ant-design/icons", "@ant-design/nextjs-registry"],
};

export default nextConfig;
```

创建 `tailwind.config.ts`:
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
```

创建 `postcss.config.mjs`:
```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
```

创建 `tsconfig.json`:
```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: 创建 .env 文件**

创建 `.env`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lottery?schema=public"
JWT_SECRET="dev-secret-change-in-production"
```

创建 `.env.example`:
```
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
```

- [ ] **Step 5: 创建共享类型**

创建 `src/types/index.ts`:
```typescript
export interface LotteryRecord {
  id: number;
  code: string;
  drawDate: string;
  red1: number;
  red2: number;
  red3: number;
  red4: number;
  red5: number;
  red6: number;
  blue: number;
  sumValue: number;
  bigSmallRatio: string;
  oddEvenRatio: string;
  span: number;
  threeZoneRatio: string;
  acValue: number;
  route012Ratio: string;
}

export interface CreateRecordInput {
  json: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AuthResponse {
  token: string;
  email: string;
}

export interface ApiError {
  error: string;
}
```

- [ ] **Step 6: 提交**

```bash
git add package.json package-lock.json next.config.ts tailwind.config.ts postcss.config.mjs tsconfig.json .env .env.example src/types/index.ts
git commit -m "chore: initialize Next.js project with dependencies and config"
```

---

### Task 2: Prisma Schema + 数据库

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`

- [ ] **Step 1: 创建 Prisma Schema**

创建 `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           Int      @id @default(autoincrement())
  email        String   @unique
  passwordHash String   @map("password_hash")

  @@map("users")
}

model LotteryRecord {
  id              Int      @id @default(autoincrement())
  code            String   @unique @db.VarChar(7)
  drawDate        DateTime @map("draw_date") @db.Date
  red1            Int
  red2            Int
  red3            Int
  red4            Int
  red5            Int
  red6            Int
  blue            Int
  sumValue        Int      @map("sum_value")
  bigSmallRatio   String   @map("big_small_ratio")
  oddEvenRatio    String   @map("odd_even_ratio")
  span            Int
  threeZoneRatio  String   @map("three_zone_ratio")
  acValue         Int      @map("ac_value")
  route012Ratio   String   @map("route_012_ratio")

  @@map("lottery_records")
}
```

- [ ] **Step 2: 创建 Prisma 客户端单例**

创建 `src/lib/prisma.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 3: 生成 Prisma Client 并执行 Migration**

```bash
npx prisma generate
npx prisma migrate dev --name init
```
Expected: Prisma Client 生成成功，数据库表创建成功（需确保 PostgreSQL 本地已启动且 .env 中 DATABASE_URL 正确）。

- [ ] **Step 4: 提交**

```bash
git add prisma/schema.prisma src/lib/prisma.ts prisma/migrations/
git commit -m "feat: add Prisma schema and database migration"
```

---

### Task 3: 技术指标计算库

**Files:**
- Create: `src/lib/indicators.ts`

- [ ] **Step 1: 实现技术指标计算函数**

创建 `src/lib/indicators.ts`:
```typescript
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
```

- [ ] **Step 2: 验证算法正确性**

用已知数据手动验证。以 "2026067" 为例，红球 04,19,27,29,30,32，蓝球 13：
- 和值 = 4+19+27+29+30+32 = 141
- 大小比 = 5:1 (>=17 的有 19,27,29,30,32 共5个, <=16 的只有 4 共1个)
- 奇偶比 = 3:3 (奇数 19,27,29 共3个, 偶数 4,30,32 共3个)
- 跨度 = 32 - 4 = 28
- 三区比 = 1(4) : 1(19) : 4(27,29,30,32) = 1:1:4
- AC 值计算——两两差值去重数: 15,23,25,26,28,8,10,11,13,2,3,5,1 → 13 个唯一差值 → AC = 13 - 5 = 8
- 012 路比 = 2(27,30 余0) : 2(4,19 余1) : 2(29,32 余2) = 2:2:2

- [ ] **Step 3: 提交**

```bash
git add src/lib/indicators.ts
git commit -m "feat: add lottery technical indicator calculation"
```

---

### Task 4: JSON 解析库

**Files:**
- Create: `src/lib/parse-lottery.ts`

- [ ] **Step 1: 实现 JSON 解析函数**

创建 `src/lib/parse-lottery.ts`:
```typescript
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
```

- [ ] **Step 2: 提交**

```bash
git add src/lib/parse-lottery.ts
git commit -m "feat: add lottery JSON parsing utility"
```

---

### Task 5: Auth 库 (JWT + 密码)

**Files:**
- Create: `src/lib/jwt.ts`
- Create: `src/lib/password.ts`

**注意：** 拆分为两个文件。JWT 工具（jose）兼容 Edge Runtime，供中间件使用；密码工具（bcryptjs）仅用于 Node.js API Routes。

- [ ] **Step 1: 实现 JWT 工具 (Edge 兼容)**

创建 `src/lib/jwt.ts`:
```typescript
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");
const TOKEN_EXPIRY = "7d";

export async function signToken(userId: number, email: string): Promise<string> {
  return new SignJWT({ sub: String(userId), email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<{ userId: number; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: Number(payload.sub),
      email: String(payload.email),
    };
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: 实现密码工具 (Node.js only)**

创建 `src/lib/password.ts`:
```typescript
import bcrypt from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

- [ ] **Step 3: 提交**

```bash
git add src/lib/jwt.ts src/lib/password.ts
git commit -m "feat: add JWT and password auth utilities"
```

---

### Task 6: 注册 API

**Files:**
- Create: `src/app/api/auth/register/route.ts`

- [ ] **Step 1: 实现注册接口**

```bash
mkdir -p src/app/api/auth/register
```

创建 `src/app/api/auth/register/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { signToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "邮箱和密码不能为空" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少 6 位" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash },
    });

    const token = await signToken(user.id, user.email);

    return NextResponse.json({ token, email: user.email });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "注册失败" }, { status: 500 });
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/app/api/auth/register/route.ts
git commit -m "feat: add user registration API"
```

---

### Task 7: 登录 API

**Files:**
- Create: `src/app/api/auth/login/route.ts`

- [ ] **Step 1: 实现登录接口**

```bash
mkdir -p src/app/api/auth/login
```

创建 `src/app/api/auth/login/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { signToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "邮箱和密码不能为空" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
    }

    const token = await signToken(user.id, user.email);

    return NextResponse.json({ token, email: user.email });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "登录失败" }, { status: 500 });
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/app/api/auth/login/route.ts
git commit -m "feat: add user login API"
```

---

### Task 8: Auth 中间件

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: 实现中间件**

创建 `src/middleware.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

const PROTECTED_PATHS = ["/api/records", "/dashboard"];
const AUTH_PAGE = "/login";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 检查是否需要保护
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;

  if (!token) {
    // API 请求返回 401，页面请求重定向到登录
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.redirect(new URL(AUTH_PAGE, request.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "登录已过期，请重新登录" }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL(AUTH_PAGE, request.url));
    response.cookies.delete("token");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/records/:path*", "/dashboard/:path*"],
};
```

- [ ] **Step 2: 提交**

```bash
git add src/middleware.ts
git commit -m "feat: add auth middleware for protected routes"
```

---

### Task 9: 记录列表与新增 API

**Files:**
- Create: `src/app/api/records/route.ts`

- [ ] **Step 1: 实现 GET 列表 + POST 新增**

```bash
mkdir -p src/app/api/records
```

创建 `src/app/api/records/route.ts`:
```typescript
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
```

- [ ] **Step 2: 提交**

```bash
git add src/app/api/records/route.ts
git commit -m "feat: add records list and create API endpoints"
```

---

### Task 10: 删除记录 API

**Files:**
- Create: `src/app/api/records/[id]/route.ts`

- [ ] **Step 1: 实现删除接口**

```bash
mkdir -p "src/app/api/records/[id]"
```

创建 `src/app/api/records/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的 ID" }, { status: 400 });
    }

    const record = await prisma.lotteryRecord.findUnique({ where: { id } });
    if (!record) {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    }

    await prisma.lotteryRecord.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete record error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add "src/app/api/records/[id]/route.ts"
git commit -m "feat: add record delete API endpoint"
```

---

### Task 11: 根布局 + 重定向

**Files:**
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`

- [ ] **Step 1: 全局样式**

创建 `src/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
```

- [ ] **Step 2: 根布局**

创建 `src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "./globals.css";

export const metadata: Metadata = {
  title: "双色球记录查询",
  description: "双色球历史中奖记录查询与更新",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: 首页重定向**

创建 `src/app/page.tsx`:
```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
```

- [ ] **Step 4: 提交**

```bash
git add src/app/globals.css src/app/layout.tsx src/app/page.tsx
git commit -m "feat: add root layout, global styles, and home redirect"
```

---

### Task 12: 登录/注册页面

**Files:**
- Create: `src/app/login/page.tsx`

- [ ] **Step 1: 实现登录页**

```bash
mkdir -p src/app/login
```

创建 `src/app/login/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Button, Tabs, message, Card, Typography } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const endpoint =
        activeTab === "login" ? "/api/auth/login" : "/api/auth/register";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        message.error(data.error || "操作失败");
        return;
      }

      // 存 token 到 cookie
      document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}`;

      message.success(activeTab === "login" ? "登录成功" : "注册成功");
      router.push("/dashboard");
    } catch {
      message.error("网络错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-md">
        <Title level={3} className="text-center mb-6">
          双色球记录系统
        </Title>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as "login" | "register")}
          centered
          items={[
            { key: "login", label: "登录" },
            { key: "register", label: "注册" },
          ]}
        />

        <Form
          name="auth"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          autoComplete="off"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "请输入邮箱" },
              { type: "email", message: "邮箱格式不正确" },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="邮箱" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: "请输入密码" },
              { min: 6, message: "密码至少 6 位" },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {activeTab === "login" ? "登录" : "注册"}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add src/app/login/page.tsx
git commit -m "feat: add login and registration page"
```

---

### Task 13: Ball 组件

**Files:**
- Create: `src/components/ball.tsx`

- [ ] **Step 1: 实现号码球展示组件**

创建 `src/components/ball.tsx`:
```tsx
interface BallProps {
  number: number;
  type: "red" | "blue";
  size?: "small" | "default";
}

export default function Ball({ number, type, size = "default" }: BallProps) {
  const isRed = type === "red";
  const sizeClass = size === "small" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold text-white ${sizeClass}`}
      style={{
        background: isRed
          ? "radial-gradient(circle at 35% 35%, #ff6b6b, #d93636)"
          : "radial-gradient(circle at 35% 35%, #4dabf7, #1c7ed6)",
        boxShadow: isRed
          ? "0 2px 4px rgba(217,54,54,0.4)"
          : "0 2px 4px rgba(28,126,214,0.4)",
      }}
    >
      {String(number).padStart(2, "0")}
    </span>
  );
}

export function RedBalls({ numbers, size }: { numbers: number[]; size?: "small" | "default" }) {
  return (
    <div className="flex gap-1.5">
      {numbers.map((n, i) => (
        <Ball key={i} number={n} type="red" size={size} />
      ))}
    </div>
  );
}

export function BlueBall({ number, size }: { number: number; size?: "small" | "default" }) {
  return <Ball number={number} type="blue" size={size} />;
}
```

- [ ] **Step 2: 提交**

```bash
git add src/components/ball.tsx
git commit -m "feat: add lottery ball display component"
```

---

### Task 14: 新增记录 Modal

**Files:**
- Create: `src/components/add-record-modal.tsx`

- [ ] **Step 1: 实现新增记录弹窗**

创建 `src/components/add-record-modal.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Modal, Input, message } from "antd";

const { TextArea } = Input;

interface AddRecordModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function AddRecordModal({
  open,
  onCancel,
  onSuccess,
}: AddRecordModalProps) {
  const [jsonText, setJsonText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    if (!jsonText.trim()) {
      message.warning("请输入 JSON 数据");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: jsonText.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        message.error(data.error || "新增失败");
        return;
      }

      message.success(`期号 ${data.code} 新增成功`);
      setJsonText("");
      onSuccess();
    } catch {
      message.error("网络错误");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setJsonText("");
    onCancel();
  };

  return (
    <Modal
      title="新增中奖记录"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="确认新增"
      cancelText="取消"
      width={600}
      destroyOnClose
    >
      <div className="py-4">
        <p className="text-gray-500 mb-3 text-sm">
          粘贴原始 JSON 数据，支持以下格式：
        </p>
        <ul className="text-gray-400 text-xs mb-3 list-disc pl-4 space-y-1">
          <li>直接格式: &#123;&quot;code&quot;:&quot;2026067&quot;,&quot;date&quot;:&quot;2026-06-14&quot;,&quot;red&quot;:&quot;04,19,27,29,30,32&quot;,&quot;blue&quot;:&quot;13&quot;&#125;</li>
          <li>封装格式: 含 result 数组的完整响应 JSON</li>
        </ul>
        <TextArea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder='{"code":"2026067","date":"2026-06-14","red":"04,19,27,29,30,32","blue":"13"}'
          rows={8}
          className="font-mono text-sm"
        />
      </div>
    </Modal>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add src/components/add-record-modal.tsx
git commit -m "feat: add record creation modal with JSON paste"
```

---

### Task 15: 仪表盘页面

**Files:**
- Create: `src/app/dashboard/page.tsx`

- [ ] **Step 1: 实现记录列表页**

```bash
mkdir -p src/app/dashboard
```

创建 `src/app/dashboard/page.tsx`:
```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  Button,
  Input,
  DatePicker,
  Space,
  message,
  Popconfirm,
  Typography,
  Card,
} from "antd";
import { PlusOutlined, LogoutOutlined, SearchOutlined } from "@ant-design/icons";
import { RedBalls, BlueBall } from "@/components/ball";
import AddRecordModal from "@/components/add-record-modal";
import dayjs from "dayjs";

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface RecordItem {
  id: number;
  code: string;
  drawDate: string;
  red1: number;
  red2: number;
  red3: number;
  red4: number;
  red5: number;
  red6: number;
  blue: number;
  sumValue: number;
  bigSmallRatio: string;
  oddEvenRatio: string;
  span: number;
  threeZoneRatio: string;
  acValue: number;
  route012Ratio: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // 筛选条件
  const [searchCode, setSearchCode] = useState("");
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (searchCode) params.set("code", searchCode);
      if (dateRange) {
        params.set("dateFrom", dateRange[0]);
        params.set("dateTo", dateRange[1]);
      }

      const res = await fetch(`/api/records?${params.toString()}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setRecords(data.data);
        setTotal(data.total);
      } else {
        message.error(data.error || "查询失败");
      }
    } catch {
      message.error("网络错误");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchCode, dateRange, router]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleLogout = () => {
    document.cookie = "token=; path=/; max-age=0";
    router.push("/login");
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/records/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        message.success("删除成功");
        fetchRecords();
      } else {
        message.error(data.error || "删除失败");
      }
    } catch {
      message.error("网络错误");
    }
  };

  const columns = [
    {
      title: "期号",
      dataIndex: "code",
      key: "code",
      width: 100,
    },
    {
      title: "开奖日期",
      dataIndex: "drawDate",
      key: "drawDate",
      width: 120,
    },
    {
      title: "红球",
      key: "reds",
      width: 200,
      render: (_: any, record: RecordItem) => (
        <RedBalls
          numbers={[
            record.red1,
            record.red2,
            record.red3,
            record.red4,
            record.red5,
            record.red6,
          ]}
        />
      ),
    },
    {
      title: "蓝球",
      key: "blue",
      width: 70,
      render: (_: any, record: RecordItem) => <BlueBall number={record.blue} />,
    },
    {
      title: "和值",
      dataIndex: "sumValue",
      key: "sumValue",
      width: 70,
      align: "center" as const,
    },
    {
      title: "大小比",
      dataIndex: "bigSmallRatio",
      key: "bigSmallRatio",
      width: 80,
      align: "center" as const,
    },
    {
      title: "奇偶比",
      dataIndex: "oddEvenRatio",
      key: "oddEvenRatio",
      width: 80,
      align: "center" as const,
    },
    {
      title: "跨度",
      dataIndex: "span",
      key: "span",
      width: 70,
      align: "center" as const,
    },
    {
      title: "三区比",
      dataIndex: "threeZoneRatio",
      key: "threeZoneRatio",
      width: 90,
      align: "center" as const,
    },
    {
      title: "AC值",
      dataIndex: "acValue",
      key: "acValue",
      width: 70,
      align: "center" as const,
    },
    {
      title: "012路比",
      dataIndex: "route012Ratio",
      key: "route012Ratio",
      width: 90,
      align: "center" as const,
    },
    {
      title: "操作",
      key: "action",
      width: 80,
      fixed: "right" as const,
      render: (_: any, record: RecordItem) => (
        <Popconfirm
          title="确认删除"
          description={`确定删除期号 ${record.code} 的记录吗？`}
          onConfirm={() => handleDelete(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" danger size="small">
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶栏 */}
      <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <Title level={4} className="!mb-0">
          双色球历史中奖记录
        </Title>
        <Button
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          type="text"
        >
          退出登录
        </Button>
      </div>

      <div className="p-6">
        <Card className="mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Input
              placeholder="搜索期号"
              prefix={<SearchOutlined />}
              value={searchCode}
              onChange={(e) => {
                setSearchCode(e.target.value);
                setPage(1);
              }}
              style={{ width: 180 }}
              allowClear
            />
            <RangePicker
              placeholder={["开始日期", "结束日期"]}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([
                    dates[0].format("YYYY-MM-DD"),
                    dates[1].format("YYYY-MM-DD"),
                  ]);
                } else {
                  setDateRange(null);
                }
                setPage(1);
              }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalOpen(true)}
            >
              新增记录
            </Button>
          </div>
        </Card>

        <Card>
          <Table
            dataSource={records}
            columns={columns}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1400 }}
            pagination={{
              current: page,
              pageSize: pageSize,
              total: total,
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条记录`,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
            }}
          />
        </Card>
      </div>

      <AddRecordModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          fetchRecords();
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: add dashboard page with records table, search, and pagination"
```

---

### Task 16: 最终验证与整理

**Files:**
- 无新文件，验证所有功能

- [ ] **Step 1: 确保 .gitignore 覆盖必要文件**

检查 `.gitignore`:
```
node_modules/
.next/
.env
```

- [ ] **Step 2: 开发服务器启动测试**

```bash
npm run dev
```
Expected: Next.js 启动在 localhost:3000，无编译错误。

- [ ] **Step 3: 测试完整流程**

1. 访问 http://localhost:3000 → 应重定向到 /dashboard
2. /dashboard 未登录 → 应重定向到 /login
3. 注册一个测试用户
4. 登录 → 跳转 /dashboard
5. 点击"新增记录"，粘贴 JSON
6. 验证列表中显示所有字段包括技术指标
7. 测试搜索、日期筛选
8. 测试删除功能
9. 退出登录

- [ ] **Step 4: 提交**

```bash
git add .gitignore
git commit -m "chore: finalize .gitignore and verify full flow"
```
