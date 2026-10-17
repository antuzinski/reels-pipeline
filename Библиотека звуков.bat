@echo off
chcp 65001 >nul
title Библиотека звуков
node "%~dp0tools\sfx-board-server.mjs"
pause
