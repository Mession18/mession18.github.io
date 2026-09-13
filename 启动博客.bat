@echo off
title Island Notes Blog
cd /d "%~dp0"

where pnpm >nul 2>nul
if errorlevel 1 (
  echo pnpm was not found. Install Node.js and pnpm first.
  pause
  exit /b 1
)

echo Starting the blog for this computer and the local network...
echo Close this window to stop the blog.
echo.
call pnpm dev --host 0.0.0.0 --open

if errorlevel 1 (
  echo.
  echo Startup failed. See the error above.
  pause
)
