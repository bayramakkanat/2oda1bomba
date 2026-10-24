@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Ilk kurulum: ws paketi indiriliyor. Bu adim icin bir kez internet gerekir.
  call npm install
)
node sunucu.js
pause
