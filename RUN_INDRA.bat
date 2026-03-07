@echo off
TITLE INDRA_NUCLEUS_LAUNCHER
COLOR 0B
echo.
echo  =============================================================================
echo     INDRA NUCLEUS - OPERATIONAL INTERFACE (AUTO-AUTO)
echo     ESTADO: READY_FOR_SYNCING
echo  =============================================================================
echo.
echo [SYSTEM] NAVIGATING_TO_CORE_CLIENT...
cd system_core\client
echo [SYSTEM] INICIALIZANDO_VITE_V2_CANONICAL...
npm run dev
pause
