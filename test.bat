@echo off
setlocal
title Aura Bistro (ROS) - Automated Test Suite

echo ================================================================
echo   AURA BISTRO (ROS) - EXECUTING AUTOMATED TEST SUITE
echo ================================================================
echo.

cd /d "%~dp0"

node tests\run-all-tests.js

if %ERRORLEVEL% EQU 0 (
    echo [TEST SUCCESS] All End-to-End tests executed cleanly.
) else (
    echo [TEST FAILED] Some tests encountered errors. Check output above.
)

echo.
pause
