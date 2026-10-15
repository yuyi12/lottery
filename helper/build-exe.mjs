/**
 * 将 helper/server.mjs 打包成单文件 exe（Node SEA，Single Executable Application）。
 * 依赖：本机已安装的 Node（>=20）+ npx 自动拉取的 postject 工具。
 * 运行：node helper/build-exe.mjs
 */
import { execSync } from "child_process";
import { copyFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const nodePath = process.execPath;
const FUSE = "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2";
const OUT = join(__dirname, "plc-helper.exe");
const BLOB = join(__dirname, "sea-prep.blob");

// 1. 生成 sea 配置
const config = {
  main: "server.cjs",
  output: "sea-prep.blob",
  disableExperimentalSEAWarning: true,
};
writeFileSync(join(__dirname, "sea-config.json"), JSON.stringify(config, null, 2));

console.log("1/3 生成 sea-prep.blob ...");
execSync(`"${nodePath}" --experimental-sea-config sea-config.json`, {
  cwd: __dirname,
  stdio: "inherit",
});

console.log("2/3 复制 node.exe ...");
copyFileSync(nodePath, OUT);

console.log("3/3 注入 blob 到 exe（postject）...");
execSync(
  `npx --yes postject "${OUT}" NODE_SEA_BLOB "${BLOB}" --sentinel-fuse ${FUSE}`,
  { cwd: __dirname, stdio: "inherit" }
);

console.log("✅ 打包完成:", OUT);
