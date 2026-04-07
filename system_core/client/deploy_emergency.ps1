# Script de Despliegue de Urgencia - Sistema de Colección Documental
# Autor: Airhonreality
# Destino: https://github.com/Airhonreality/semillero-de-bio-inspiracion

Write-Host ">>> INICIANDO COMPILACIÓN DEL MOTOR INDRA..." -ForegroundColor Cyan

# 1. Ejecutar Build de Vite
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "!!! Error en la compilación. Revisa los logs de Vite." -ForegroundColor Red
    exit
}

# 2. Entrar a la carpeta de distribución
cd dist

# 3. Preparar repositorio efímero de despliegue
Remove-Item -Path .git -Recurse -Force -ErrorAction SilentlyContinue 
git init
git add -A
git commit -m "Deploy: Sistema de Colección Documental - Barichara"

Write-Host ">>> CONECTANDO AL REPOSITORIO DE LA ORGANIZACIÓN..." -ForegroundColor Yellow

# 4. Forzar el push a la rama principal (CUIDADO: Esto reemplaza el contenido del repo remoto)
git remote add origin https://github.com/Airhonreality/semillero-de-bio-inspiracion.git
git push -f origin master:main

if ($LASTEXITCODE -eq 0) {
    Write-Host ">>> DESPLIEGUE EXITOSO." -ForegroundColor Green
    Write-Host ">>> Enlace público sugerido: https://airhonreality.github.io/semillero-de-bio-inspiracion/#/fast" -ForegroundColor Magenta
} else {
    Write-Host "!!! Error en el push. Asegúrate de que el repositorio sea PÚBLICO." -ForegroundColor Red
}

cd ..
