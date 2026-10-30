@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo   NexusAG - Fast Build and Package
echo ========================================================
echo.

cd /d "%~dp0"

:: 1. Node & NPM Check
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    pause
    exit /b 1
)

:: 2. Check node_modules
if not exist "node_modules\" (
    echo [*] Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed!
        pause
        exit /b 1
    )
)

:: 2.5 Sync Version from .env
echo [*] Syncing version from .env...
call node scripts/sync-version.js
if %errorlevel% neq 0 (
    echo [ERROR] Version sync failed!
    pause
    exit /b 1
)

:: 3. Compile Extension (TypeScript)
echo [*] Compiling extension TypeScript...
call npm run compile:extension
if %errorlevel% neq 0 (
    echo [ERROR] TypeScript compilation failed!
    pause
    exit /b 1
)

:: 4. Build Webview (esbuild)
echo [*] Building webview bundle...
node esbuild.webview.mjs --production
if %errorlevel% neq 0 (
    echo [ERROR] Webview build failed!
    pause
    exit /b 1
)

:: 4.5 Clean previous .vsix packages and checksums
if exist "*.vsix" del /q "*.vsix"
if exist "SHA256SUMS.txt" del /q "SHA256SUMS.txt"

:: 5. Package VSIX
echo [*] Packaging .vsix extension...
call npx @vscode/vsce package --no-dependencies
if %errorlevel% neq 0 (
    echo [ERROR] VSIX packaging failed!
    pause
    exit /b 1
)

:: 5.5 Generate SHA256 Checksum
echo [*] Generating SHA256SUMS.txt...
call node scripts/generate-checksum.js
if %errorlevel% neq 0 (
    echo [ERROR] Checksum generation failed!
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   [SUCCESS] VSIX package and checksum built successfully.
echo ========================================================
echo.

set "VSIX_NAME="
set "VSIX_PATH="
set "VSIX_SIZE="
for %%F in (*.vsix) do (
    set "VSIX_NAME=%%~nxF"
    set "VSIX_PATH=%%~fF"
    set "VSIX_SIZE=%%~zF"
)
echo Package:  !VSIX_NAME! [!VSIX_SIZE! bytes]
if exist "SHA256SUMS.txt" (
    for /f "usebackq tokens=*" %%C in ("SHA256SUMS.txt") do echo SHA256:   %%C
)

:: Check for --install parameter
if "%1"=="--install" goto install_ext
goto done

:install_ext
set "AG_CLI=%LOCALAPPDATA%\Programs\Antigravity IDE\bin\antigravity-ide.cmd"
if not exist "%AG_CLI%" (
    for /f "delims=" %%I in ('where antigravity-ide.cmd 2^>nul') do set "AG_CLI=%%I"
)
if exist "%AG_CLI%" (
    echo [*] Installing into Antigravity IDE...
    call "%AG_CLI%" --install-extension "!VSIX_PATH!" --force
    echo [OK] Extension installed into Antigravity IDE.
) else (
    echo [INFO] Antigravity IDE CLI not found at default location or PATH.
)

:done
echo.
echo You can install it using:
echo   antigravity-ide.cmd --install-extension "!VSIX_NAME!" --force
echo   (or: code --install-extension "!VSIX_NAME!")
echo.
endlocal
