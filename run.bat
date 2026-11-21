@echo off
setlocal EnableDelayedExpansion
title Restaurant Ordering System - Developer Launcher
color 0A

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

echo ===================================================================
echo     AURA BISTRO (ROS) - DEVELOPER MODE LAUNCHER
echo ===================================================================
echo.

:: 1. Set Developer Environment Variable
set NODE_ENV=development

:: 2. Auto-Check & Install Backend Dependencies if missing
if not exist "%ROOT_DIR%backend\node_modules\" (
    echo [DEV] Missing backend dependencies. Installing now...
    pushd "%ROOT_DIR%backend"
    call npm install
    popd
    echo [DEV] Backend dependencies installed successfully.
    echo.
)

:: 3. Auto-Check & Seed Initial SQLite Database if missing
if not exist "%ROOT_DIR%backend\data\restaurant.db" (
    echo [DEV] Database not found. Seeding initial restaurant database...
    pushd "%ROOT_DIR%backend"
    call npm run seed
    popd
    echo [DEV] Database seeded successfully.
    echo.
)

:: 4. Auto-Check & Install Frontend Dependencies if missing
if not exist "%ROOT_DIR%frontend\node_modules\" (
    echo [DEV] Missing frontend dependencies. Installing now...
    pushd "%ROOT_DIR%frontend"
    call npm install
    popd
    echo [DEV] Frontend dependencies installed successfully.
    echo.
)

:: 5. Launch Backend Server in Developer Watch Mode (Node --watch)
echo [DEV] Launching Backend Server on http://localhost:5050 (Watch Mode)...
start "ROS Backend API (Port 5050)" cmd /k "cd /d "%ROOT_DIR%backend" && set NODE_ENV=development && npm run dev"

ping 127.0.0.1 -n 4 > nul

:: 6. Launch Frontend Client in Vite HMR Mode
echo [DEV] Launching Frontend React Client on http://localhost:5173 (Vite HMR)...
start "ROS Frontend Vite (Port 5173)" cmd /k "cd /d "%ROOT_DIR%frontend" && set NODE_ENV=development && npm run dev"

ping 127.0.0.1 -n 3 > nul

:: 7. Automatically Open the Web Application in Default Browser
echo [DEV] Opening Browser to http://localhost:5173 ...
start http://localhost:5173

echo.
echo ===================================================================
echo   DEVELOPER MODE IS ACTIVATED AND RUNNING!
echo ===================================================================
echo   Customer Web Menu:   http://localhost:5173
echo   Bistro Admin Panel:   http://localhost:5173/admin-panel-bistro
echo   Admin Staff Login:    http://localhost:5173/admin-panel-bistro-login
echo   Backend REST API:     http://localhost:5050/api
echo   API Health Status:    http://localhost:5050/api/health
echo ===================================================================
echo   Default Credentials:
echo     - Admin:   username: admin   ^| password: admin123
echo     - Manager: username: manager ^| password: manager123
echo     - Staff:   username: staff   ^| password: staff123
echo     - Kitchen: username: kitchen ^| password: kitchen123
echo ===================================================================
echo.
echo Leave this launcher window or press any key to close this console.
echo (The two Developer consoles will remain running in background).
pause > nul
