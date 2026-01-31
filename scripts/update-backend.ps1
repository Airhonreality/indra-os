<#
.SYNOPSIS
    Script de actualización automática del BACKEND (Google Apps Script)

.DESCRIPTION
    Actualiza el código en Google Apps Script utilizando el Deployment ID
    guardado durante el primer setup. Así no cambia la URL del Web App.
    
.NOTES
    Autor: INDRA OS
    Requiere: @google/clasp instalado globalmente
    Uso: .\scripts\update-backend.ps1
#>

#Requires -Version 5.1

# ================================
# CONFIGURACIÓN
# ================================

$ErrorActionPreference = "Stop"
$backendPath = ".\OrbitalCore_Codex_v1"

# ================================
# FUNCIONES DE UI
# ================================

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

# ================================
# VALIDACIONES
# ================================

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "   INDRA OS - Actualización Automática Backend" -ForegroundColor Magenta
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""

# Verificar que existe el directorio del backend
if (-not (Test-Path $backendPath)) {
    Write-Error-Custom "No se encuentra el directorio: $backendPath"
    exit 1
}

# Verificar que existe el Deployment ID
$deploymentIdPath = Join-Path $backendPath ".deployment-id"
if (-not (Test-Path $deploymentIdPath)) {
    Write-Error-Custom "No se encuentra el archivo .deployment-id"
    Write-Info "Probablemente no has ejecutado first-time-setup.ps1 correctamente"
    Write-Info "El Deployment ID es necesario para actualizar sin cambiar la URL"
    exit 1
}

# Leer Deployment ID
$deploymentId = Get-Content $deploymentIdPath -Encoding UTF8 | Select-Object -First 1
$deploymentId = $deploymentId.Trim()

if ([string]::IsNullOrWhiteSpace($deploymentId)) {
    Write-Error-Custom "El archivo .deployment-id está vacío"
    exit 1
}

Write-Success "Deployment ID encontrado: $deploymentId"

# ================================
# ACTUALIZACIÓN
# ================================

Write-Host ""
Write-Info "Enviando código actualizado a Google Apps Script..."

Push-Location $backendPath

try {
    # Verificar que clasp está instalado
    $claspVersion = clasp --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Clasp no está instalado"
        Write-Info "Ejecuta: npm install -g @google/clasp"
        exit 1
    }
    
    Write-Info "Usando clasp: $claspVersion"
    
    # Push del código a GAS
    Write-Info "1/2 - Subiendo código al editor de Apps Script..."
    clasp push --force
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Error al ejecutar clasp push"
        exit 1
    }
    
    Write-Success "Código subido al editor"
    
    # Generar versión con timestamp
    $version = "update-$(Get-Date -Format 'yyyy-MM-dd-HHmm')"
    
    # Deploy usando el Deployment ID guardado (esto mantiene la misma URL)
    Write-Info "2/2 - Desplegando nueva versión en Web App existente..."
    clasp deploy --deploymentId $deploymentId --description $version
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Error al ejecutar clasp deploy"
        Write-Warning-Custom "El código se subió pero no se desplegó"
        Write-Info "Puedes desplegar manualmente desde: https://script.google.com"
        exit 1
    }
    
    Write-Success "Nueva versión desplegada: $version"
    
} catch {
    Write-Error-Custom "Error durante la actualización: $_"
    exit 1
} finally {
    Pop-Location
}

# ================================
# RESUMEN
# ================================

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Success "Backend actualizado correctamente"
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# Mostrar la URL (si existe)
$urlPath = Join-Path $backendPath ".gas-url.txt"
if (Test-Path $urlPath) {
    $webAppUrl = Get-Content $urlPath -Encoding UTF8 | Select-Object -First 1
    Write-Info "Tu Web App sigue en la misma URL:"
    Write-Host "   $webAppUrl" -ForegroundColor Cyan
    Write-Host ""
}

Write-Info "La URL del Web App NO cambió (mismo Deployment ID)"
Write-Info "El frontend seguirá funcionando sin necesidad de cambios"
Write-Host ""
