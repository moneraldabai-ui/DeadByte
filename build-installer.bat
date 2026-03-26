@echo off
:: ============================================
:: DeadBYTE - Build Installer Script
:: ============================================
:: This script builds the Electron app and creates
:: the Windows installer using Inno Setup.
:: ============================================

title DeadBYTE Installer Builder
color 0A

echo.
echo  ============================================
echo   DeadBYTE Installer Builder
echo  ============================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo  [ERROR] Node.js is not installed or not in PATH
    echo  Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo  [ERROR] npm is not installed or not in PATH
    pause
    exit /b 1
)

:: Navigate to project directory
cd /d "%~dp0"

echo  [1/5] Checking dependencies...
echo.

:: Check if node_modules exists
if not exist "node_modules" (
    echo  Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo  [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
)

echo  [2/5] Building Electron app (unpacked)...
echo.

:: Build the Electron app using electron-builder (unpacked for Inno Setup)
call npm run build:dir
if %errorlevel% neq 0 (
    color 0C
    echo  [ERROR] Failed to build Electron app
    pause
    exit /b 1
)

echo.
echo  [3/5] Electron app built successfully!
echo.

:: Check if Inno Setup is installed
set "ISCC="
if exist "%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe" (
    set "ISCC=%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe"
) else if exist "%ProgramFiles%\Inno Setup 6\ISCC.exe" (
    set "ISCC=%ProgramFiles%\Inno Setup 6\ISCC.exe"
) else (
    echo  [INFO] Inno Setup 6 not found. Skipping Inno Setup installer.
    echo  [INFO] You can still use the electron-builder NSIS installer from dist/
    echo.
    echo  To create Inno Setup installer:
    echo  1. Install Inno Setup 6 from https://jrsoftware.org/isdl.php
    echo  2. Run this script again, OR
    echo  3. Open installer\DeadBYTE-Setup.iss in Inno Setup and compile
    echo.
    goto :skip_inno
)

echo  [4/5] Building Inno Setup installer...
echo.

:: Create output directory if it doesn't exist
if not exist "installer\output" mkdir "installer\output"

:: Run Inno Setup Compiler
"%ISCC%" /Q "installer\DeadBYTE-Setup.iss"
if %errorlevel% neq 0 (
    color 0E
    echo  [WARNING] Inno Setup compilation failed
    echo  The Electron NSIS installer should still be available in dist/
) else (
    echo  [SUCCESS] Inno Setup installer created!
)

:skip_inno

echo.
echo  [5/5] Build complete!
echo.
echo  ============================================
echo   OUTPUT FILES:
echo  ============================================
echo.

:: Show output files
if exist "dist\DeadBYTE-*.exe" (
    echo  Electron-Builder NSIS Installer:
    dir /b "dist\DeadBYTE-*.exe" 2>nul
    echo.
)

if exist "dist\DeadBYTE-*-Portable.exe" (
    echo  Portable Version:
    dir /b "dist\DeadBYTE-*-Portable.exe" 2>nul
    echo.
)

if exist "installer\output\DeadBYTE-Setup-*.exe" (
    echo  Inno Setup Installer:
    dir /b "installer\output\DeadBYTE-Setup-*.exe" 2>nul
    echo.
)

echo  ============================================
echo.
echo  Press any key to open the output folder...
pause >nul

:: Open output folders
if exist "dist" start "" "dist"
if exist "installer\output" start "" "installer\output"

exit /b 0
