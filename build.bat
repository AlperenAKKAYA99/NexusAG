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

:: 4.5 Clean previous .vsix packages
if not exist "dist\" mkdir dist
if exist "dist\*.vsix" del /q "dist\*.vsix"
if exist "*.vsix" del /q "*.vsix"

:: 5. Package VSIX
echo [*] Packaging .vsix extension into dist/...
call npx @vscode/vsce package --no-dependencies -o dist/
if %errorlevel% neq 0 (
    echo [ERROR] VSIX packaging failed!
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   [SUCCESS] VSIX package built successfully.
echo ========================================================
echo.

set "VSIX_NAME="
set "VSIX_PATH="
set "VSIX_SIZE="
for %%F in (dist\*.vsix) do (
    set "VSIX_NAME=%%~nxF"
    set "VSIX_PATH=%%~fF"
    set "VSIX_SIZE=%%~zF"
)
echo Package: !VSIX_NAME! [!VSIX_SIZE! bytes] in dist/

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
