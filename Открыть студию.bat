@echo off
chcp 65001 >nul
rem Opens Remotion Studio for the project folder (default: first-reel). Usage: double-click, or "Открыть студию.bat my-reel"
set PROJECT=%~1
if "%PROJECT%"=="" set PROJECT=first-reel
cd /d "%~dp0%PROJECT%" || (echo Project folder "%PROJECT%" not found & pause & exit /b 1)
echo Запускаю Remotion Studio... Не закрывайте это окно, пока работаете в студии.
call npx remotion studio
pause
