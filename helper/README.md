# PLC 本地助手

让部署在 Vercel 的网页能够打开本机的软件/文件夹。浏览器出于安全无法直接访问本地磁盘，因此需要一个装在本机、常驻运行的小程序作为桥接。

## 运行

```bash
node helper/server.cjs
# 或 Windows 双击 helper/start.bat
```

## 配置

| 环境变量 | 说明 | 默认 |
| --- | --- | --- |
| `PLC_HELPER_PORT` | 监听端口 | `43110` |
| `PLC_HELPER_TOKEN` | 与网页端 `NEXT_PUBLIC_PLC_HELPER_TOKEN` 一致的共享令牌 | 空（无鉴权） |

## 网页端配置

在 `.env`（本地）和 Vercel 环境变量中设置：

```
NEXT_PUBLIC_PLC_HELPER_URL=http://127.0.0.1:43110
NEXT_PUBLIC_PLC_HELPER_TOKEN=你的令牌
```

两者令牌必须一致。

## 安全说明

- 助手只监听 `127.0.0.1`，不对外网开放。
- 通过 `X-PLC-Token` 请求头做令牌校验，防止其他网页调用本机助手。
- `NEXT_PUBLIC_*` 变量会暴露到浏览器，令牌并非严格机密；它主要是阻止**其他网站**（同源策略下读不到你的令牌）驱动本机助手。本机多用户环境请把令牌换成随机长字符串。

## 打包成安装程序（可选）

需要分发给不装 Node 的电脑时，可用以下任一方式把脚本打成可执行文件：

- [Tauri](https://tauri.app) / [Electron](https://www.electronjs.org) 托盘程序
- [pkg](https://github.com/vercel/pkg)（已停止维护）或 [nexe](https://github.com/nexe/nexe) 打成单文件 exe
- Go/Rust/C# 编译成原生二进制
