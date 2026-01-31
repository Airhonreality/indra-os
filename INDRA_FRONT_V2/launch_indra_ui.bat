@echo off
echo ========================================
echo   INDRA FRONT-END v2 - ISK Designer
echo   The Stark Architect
echo ========================================
echo.
echo [1/3] Instalando dependencias...
call npm install
echo.
echo [2/3] Iniciando servidor de desarrollo...
echo.
echo ✅ UI disponible en: http://localhost:3000
echo ✅ Módulo 9 (ISK Designer) activo
echo.
echo Presiona Ctrl+C para detener el servidor
echo.
call npm run dev
