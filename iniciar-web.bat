@echo off
cd /d "%~dp0"
echo Iniciant CyberGuard...
start "" "http://localhost:8080"
node server.js
