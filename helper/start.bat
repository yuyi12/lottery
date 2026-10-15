@echo off
chcp 65001 >nul
cd /d "%~dp0"
rem 请把令牌改成与网页端 NEXT_PUBLIC_PLC_HELPER_TOKEN 一致
set PLC_HELPER_TOKEN=change-me-token
set PLC_HELPER_PORT=43110
node server.cjs
pause
