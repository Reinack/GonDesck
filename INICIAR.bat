@echo off
cd /d "%~dp0"
echo Iniciando GonFlow...
start "" "http://localhost:3000"
npm start
pause
