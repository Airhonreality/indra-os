@echo off
echo ========================================
echo   INDRA FRONT-END v2 - ISK Designer
echo   The Axiom Architect
echo ========================================
echo.
echo [1/2] Sincronizando URL desde el archivo maestro...
powershell -Command "$url = Get-Content '..\..\.gas-url.txt' -Raw; if($url) { \"VITE_CORE_URL=$url`nVITE_SYSTEM_TOKEN=c6c4625b-267c-4d42-a351-86540c5a1b56`nVITE_CLIENT_NAME=INDRA_V2_AXIOM_ARCHITECT`nVITE_VERSION=2.0.0\" | Out-File -FilePath .env -Encoding utf8; echo '✅ URL y Token Sincronizados.' } else { echo '⚠️ No se encontro .gas-url.txt, usando valores previos.' }"

echo.
echo [2/2] Iniciando servidor de desarrollo (Vite)...
echo.
echo ✅ UI disponible en: http://localhost:3000
echo ✅ Módulo 9 (ISK Designer) activo
echo.
echo Presiona Ctrl+C para detener el servidor
echo.
call npm run dev



