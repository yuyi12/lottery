/**
 * PLC 本地助手 —— 常驻本机，接收网页端发来的「打开软件/文件夹」请求并执行。
 * 零依赖，仅使用 Node 内置模块。
 *
 * 运行：node helper/server.cjs  （或双击 helper/start.bat）
 * 环境变量：
 *   PLC_HELPER_PORT   监听端口，默认 43110
 *   PLC_HELPER_TOKEN  与网页端 NEXT_PUBLIC_PLC_HELPER_TOKEN 一致的共享令牌
 */
const http = require("http");
const { exec } = require("child_process");

const HOST = "127.0.0.1"; // 只监听本机回环，不对外暴露
const PORT = Number(process.env.PLC_HELPER_PORT || 43110);
const TOKEN = process.env.PLC_HELPER_TOKEN || "";

if (!TOKEN) {
  console.warn("⚠️  未设置 PLC_HELPER_TOKEN，助手将以无鉴权方式运行（仅建议本机可信环境）。");
}

function sanitizePath(p) {
  return String(p).replace(/["&|;<>`$\r\n]/g, "");
}

function openLocal(path, isFolder) {
  const p = sanitizePath(String(path).trim());
  if (!p) return Promise.reject(new Error("路径不能为空"));

  let cmd;
  if (process.platform === "win32") {
    cmd = isFolder ? `explorer "${p}"` : `start "" "${p}"`;
  } else if (process.platform === "darwin") {
    cmd = `open "${p}"`;
  } else {
    cmd = `xdg-open "${p}"`;
  }

  return new Promise((resolve, reject) => {
    exec(cmd, { windowsHide: true }, (err) => (err ? reject(err) : resolve()));
  });
}

function sendJson(res, status, obj) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
}

const server = http.createServer((req, res) => {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-PLC-Token");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "POST" || req.url !== "/open") {
    sendJson(res, 404, { error: "not found" });
    return;
  }

  const token = req.headers["x-plc-token"] || "";
  if (TOKEN && token !== TOKEN) {
    sendJson(res, 401, { error: "鉴权失败：令牌不匹配" });
    return;
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", async () => {
    try {
      const { path, mode } = JSON.parse(body || "{}");
      await openLocal(path, mode === "folder");
      sendJson(res, 200, { success: true });
    } catch (e) {
      sendJson(res, 400, { error: e.message || "打开失败" });
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`✅ PLC 本地助手已启动：http://${HOST}:${PORT}`);
  console.log(`   鉴权令牌：${TOKEN ? "已配置" : "未配置（无鉴权）"}`);
});
