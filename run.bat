@echo off
TITLE Restaurant Ordering System - Launcher
echo ===================================================
echo     RESTAURANT ORDERING SYSTEM (ROS) LAUNCHER
echo ===================================================
echo.
echo Starting Backend Server on http://localhost:5000 ...
start "ROS Backend API" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak > nul

echo Starting Frontend React Client on http://localhost:5173 ...
start "ROS Frontend Web" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo System is launching!
echo Customer Portal & Admin: http://localhost:5173
echo Backend API Endpoint:    http://localhost:5000/api
echo ===================================================
pause
