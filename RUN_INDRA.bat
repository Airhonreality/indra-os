@echo off
setlocal
TITLE INDRA_NUCLEUS_LAUNCHER
COLOR 0B
echo.
echo  =============================================================================
echo     INDRA NUCLEUS - OPERATIONAL INTERFACE (AUTO-AUTO)
echo     ESTADO: READY_FOR_SYNCING
echo  =============================================================================
echo.
cd /d "%~dp0"
echo [SYSTEM] NAVIGATING_TO_CORE_CLIENT...
cd /d "system_core\client"
if errorlevel 1 (
	echo [ERROR] No se encontro la ruta system_core\client
	goto end
)
if not exist "package.json" (
	echo [ERROR] package.json no encontrado en system_core\client
	goto end
)
where node >nul 2>&1
if errorlevel 1 (
	echo [ERROR] Node.js no esta instalado o no esta en PATH
	echo [HINT] Instala Node.js LTS desde https://nodejs.org/
	goto end
)
where npm >nul 2>&1
if errorlevel 1 (
	echo [ERROR] npm no esta disponible en PATH
	goto end
)
if not exist "node_modules\vite" (
	echo [SYSTEM] DEPENDENCIAS_FALTANTES_DETECTADAS...
	echo [SYSTEM] EJECUTANDO_NPM_INSTALL...
	call npm install
	if errorlevel 1 (
		echo [ERROR] Fallo la instalacion de dependencias
		goto end
	)
)
echo [SYSTEM] INICIALIZANDO_VITE_V2_CANONICAL...
call npm run dev

:end
echo.
pause
endlocal
