@echo off
setlocal
chcp 65001 >nul

rem Keep this script in the installer folder next to the ScriptLauncher folder.
for %%I in ("%~dp0..\ScriptLauncher") do set "SOURCE=%%~fI"
set "DESTINATION=%APPDATA%\Autodesk\Autodesk Fusion 360\API\AddIns\ScriptLauncher"

if not exist "%SOURCE%\ScriptLauncher.manifest" (
    echo ERROR: ScriptLauncher folder was not found next to the installer folder.
    echo エラー: installer フォルダーの隣に ScriptLauncher フォルダーが見つかりません。
    echo Expected / 想定パス: "%SOURCE%"
    pause
    exit /b 1
)

echo ScriptLauncher will be copied to:
echo ScriptLauncher のコピー先:
echo "%DESTINATION%"
echo.
choice /C YN /M "Copy ScriptLauncher to the Fusion add-ins folder? / Fusion のアドインフォルダーに ScriptLauncher をコピーしますか？"
if errorlevel 2 (
    echo Installation cancelled.
    echo インストールを中止しました。
    pause
    exit /b 0
)

robocopy "%SOURCE%" "%DESTINATION%" /E /R:2 /W:1
if errorlevel 8 (
    echo.
    echo ERROR: ScriptLauncher installation failed. See the copy errors above.
    echo エラー: ScriptLauncher のインストールに失敗しました。上のコピーエラーを確認してください。
    pause
    exit /b 1
)

echo.
echo ScriptLauncher installation completed. Restart Fusion if it is running.
echo ScriptLauncher のインストールが完了しました。Fusion が起動中の場合は再起動してください。
explorer.exe "%DESTINATION%"
pause
exit /b 0
