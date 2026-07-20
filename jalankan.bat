@echo off
title EduQuest Launcher
cd /d "%~dp0"

echo =============================================
echo    Menjalankan EduQuest (Backend + Frontend)
echo =============================================
echo.
echo [1/2] Menyalakan Backend  (port 8000)...
start "EduQuest Backend" cmd /k "cd backend && .venv\Scripts\python.exe -m uvicorn app.main:app --port 8000"

echo [2/2] Menyalakan Frontend (port 5173)...
start "EduQuest Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Menunggu server siap, lalu membuka browser...
timeout /t 7 >nul
start "" http://localhost:5173

echo.
echo Selesai! Terbuka 2 jendela terminal: Backend dan Frontend.
echo   - Untuk BERHENTI: tutup kedua jendela itu (atau Ctrl+C di masing-masing).
echo   - Jendela ini boleh ditutup.
echo.
pause
