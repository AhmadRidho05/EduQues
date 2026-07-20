@echo off
title PyQuest - Matikan Server
echo Mematikan server PyQuest (port 8000 dan 5173)...
echo.
for %%P in (8000 5173) do (
  for /f "tokens=5" %%A in ('netstat -ano ^| findstr :%%P ^| findstr LISTENING') do (
    echo   Menutup proses PID %%A pada port %%P
    taskkill /PID %%A /F >nul 2>&1
  )
)
echo.
echo Selesai. Semua server sudah dimatikan.
pause
