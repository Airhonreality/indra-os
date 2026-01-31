<#
.SYNOPSIS
    Script de actualización COMPLETA de INDRA OS (Backend + Frontend)

.DESCRIPTION
    Actualiza tanto el backend (Google Apps Script) como el frontend (React).
    El backend se actualiza sin cambiar la URL del Web App.
    El frontend se despliega automáticamente en GitHub Pages.
    
.NOTES
    Autor: INDRA OS
    Requiere: Git, Clasp, Node.js
    Uso: .\scripts\update.ps1
#>

#Requires -Version 5.1

# ================================
# CONFIGURACIÓN
# ================================

$ErrorActionPreference = "Stop"
$backendPath = ".\OrbitalCore_Codex_v1"
$frontendPath = ".\INDRA_FRONT DEV"

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
# INICIO
# ================================

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "   INDRA OS - Actualización Completa (Backend + Frontend)" -ForegroundColor Magenta
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""

# ================================
# PASO 1: PULL DE CAMBIOS
# ================================

Write-Host ""
Write-Host "──────────────────────────────────────────────────────" -ForegroundColor Yellow
Write-Info "PASO 1/3: Descargando última versión desde GitHub"
Write-Host "──────────────────────────────────────────────────────" -ForegroundColor Yellow
Write-Host ""

try {
    git pull origin main
    
    if ($LASTEXITCODE -ne 0) {
        Write-Warning-Custom "Git pull falló o no hay cambios"
        Write-Info "Continuando con actualización local..."
    } else {
        Write-Success "Repositorio actualizado"
    }
} catch {
    Write-Warning-Custom "Error al hacer git pull: $_"
    Write-Info "Continuando con actualización local..."
}

# ================================
# PASO 2: ACTUALIZAR BACKEND
# ================================

Write-Host ""
Write-Host "──────────────────────────────────────────────────────" -ForegroundColor Yellow
Write-Info "PASO 2/3: Actualizando Backend (Google Apps Script)"
Write-Host "──────────────────────────────────────────────────────" -ForegroundColor Yellow
Write-Host ""

# Verificar que existe el Deployment ID
$deploymentIdPath = Join-Path $backendPath ".deployment-id"
if (-not (Test-Path $deploymentIdPath)) {
    Write-Error-Custom "No se encuentra el archivo .deployment-id"
    Write-Info "Ejecuta primero: .\scripts\first-time-setup.ps1"
    exit 1
}

# Leer Deployment ID
$deploymentId = Get-Content $deploymentIdPath -Encoding UTF8 | Select-Object -First 1
$deploymentId = $deploymentId.Trim()

Write-Info "Deployment ID: $deploymentId"

Push-Location $backendPath

try {
    # Push del código
    Write-Info "Subiendo código a Google Apps Script..."
    clasp push --force
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Error al ejecutar clasp push"
        Pop-Location
        exit 1
    }
    
    Write-Success "Código subido al editor"
    
    # Deploy usando el Deployment ID guardado
    $version = "update-$(Get-Date -Format 'yyyy-MM-dd-HHmm')"
    Write-Info "Desplegando versión: $version"
    
    clasp deploy --deploymentId $deploymentId --description $version
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Error al ejecutar clasp deploy"
        Write-Warning-Custom "El código se subió pero no se desplegó"
        Pop-Location
        exit 1
    }
    
    Write-Success "Backend actualizado (misma URL)"
    
} catch {
    Write-Error-Custom "Error durante actualización del backend: $_"
    Pop-Location
    exit 1
} finally {
    Pop-Location
}

# ================================
# PASO 3: ACTUALIZAR FRONTEND
# ================================

Write-Host ""
Write-Host "──────────────────────────────────────────────────────" -ForegroundColor Yellow
Write-Info "PASO 3/3: Actualizando Frontend (React + GitHub Pages)"
Write-Host "──────────────────────────────────────────────────────" -ForegroundColor Yellow
Write-Host ""

Push-Location $frontendPath

try {
    # Reinstalar dependencias si package.json cambió
    if (Test-Path "package.json") {
        Write-Info "Verificando dependencias..."
        npm install
        
        if ($LASTEXITCODE -ne 0) {
            Write-Warning-Custom "Error al instalar dependencias"
        } else {
            Write-Success "Dependencias actualizadas"
        }
    }
    
    # Compilar frontend
    Write-Info "Compilando frontend..."
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Error al compilar frontend"
        Pop-Location
        exit 1
    }
    
    Write-Success "Frontend compilado correctamente"
    
} catch {
    Write-Error-Custom "Error durante actualización del frontend: $_"
    Pop-Location
    exit 1
} finally {
    Pop-Location
}

# ================================
# PASO 4: DESPLEGAR A GITHUB
# ================================

Write-Host ""
Write-Host "──────────────────────────────────────────────────────" -ForegroundColor Yellow
Write-Info "PASO 4/3 (Bonus): Desplegando a GitHub Pages"
Write-Host "──────────────────────────────────────────────────────" -ForegroundColor Yellow
Write-Host ""

try {
    # Verificar si hay cambios
    $status = git status --porcelain
    
    if ([string]::IsNullOrWhiteSpace($status)) {
        Write-Info "No hay cambios que hacer commit"
    } else {
        Write-Info "Cambios detectados, haciendo commit..."
        
        # Commit de los cambios compilados
        git add .
        git commit -m "Update: $version - Auto-compiled"
        
        if ($LASTEXITCODE -ne 0) {
            Write-Warning-Custom "Error al hacer commit"
        } else {
            Write-Success "Commit creado"
        }
    }
    
    # Push a GitHub (esto dispara GitHub Actions automáticamente)
    Write-Info "Enviando a GitHub..."
    git push origin main
    
    if ($LASTEXITCODE -ne 0) {
        Write-Warning-Custom "Error al hacer push a GitHub"
        Write-Info "El sistema funciona localmente pero no se actualizó en la nube"
    } else {
        Write-Success "Código enviado a GitHub"
        Write-Info "GitHub Actions desplegará automáticamente en ~2 minutos"
    }
    
} catch {
    Write-Warning-Custom "Error durante despliegue a GitHub: $_"
    Write-Info "El sistema funciona localmente pero no se actualizó en la nube"
}

# ================================
# RESUMEN FINAL
# ================================

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "   ✅ ACTUALIZACIÓN COMPLETA FINALIZADA" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# Mostrar URLs
$urlPath = Join-Path $backendPath ".gas-url.txt"
if (Test-Path $urlPath) {
    $webAppUrl = Get-Content $urlPath -Encoding UTF8 | Select-Object -First 1
    Write-Info "Backend (misma URL):"
    Write-Host "   $webAppUrl" -ForegroundColor Cyan
}

Write-Host ""
Write-Info "Frontend (GitHub Pages - desplegando en ~2 min):"
Write-Host "   https://TU-USUARIO.github.io/indra-os" -ForegroundColor Cyan
Write-Host ""

Write-Success "Ambos sistemas actualizados correctamente"
Write-Host ""
Write-Info "Próxima actualización: solo ejecuta .\scripts\update.ps1"
Write-Host ""
