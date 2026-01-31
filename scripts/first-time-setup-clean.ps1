# ============================================
# INDRA OS - First Time Setup Script (PowerShell)
# ============================================
# Este script configura tu instancia personal de INDRA OS
# Duración estimada: 10 minutos
# Compatible con: Windows 10/11 con PowerShell 5.1+
# ============================================

# Configurar para que errores detengan el script
$ErrorActionPreference = "Stop"

# Funciones de utilidad para output colorido
function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "===============================================================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "===============================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "[WARN]  $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO]  $Message" -ForegroundColor Blue
}

# Banner inicial
Clear-Host
Write-Host ""
Write-Host "  ===============================================================" -ForegroundColor Cyan
Write-Host "  |  INDRA OS - First Time Setup  |" -ForegroundColor Cyan  
Write-Host "  |  Solar Punk Edition - Beta    |" -ForegroundColor Yellow
Write-Host "  ===============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host ""
Write-Host "Este script configurará tu instancia personal de INDRA OS."
Write-Host "Duración estimada: 10 minutos"
Write-Host ""
Write-Host "Presiona Enter para continuar o Ctrl+C para cancelar..." -ForegroundColor Yellow
$null = Read-Host

# ============================================
# FUNCIÓN: Instalar Node.js automáticamente
# ============================================
function Install-NodeJS {
    Write-Header "📦 Instalando Node.js automáticamente"
    
    Write-Info "Node.js no detectado - iniciando instalación automática..."
    Write-Info "Descargando Node.js LTS (v20.x)..."
    
    # Detectar arquitectura (x64 o x86)
    $arch = if ([Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
    $nodeVersion = "20.11.0"
    $installerUrl = "https://nodejs.org/dist/v$nodeVersion/node-v$nodeVersion-$arch.msi"
    $installerPath = "$env:TEMP\nodejs-installer.msi"
    
    try {
        # Descargar instalador
        Write-Info "Descargando desde: $installerUrl"
        Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
        Write-Success "Descarga completada"
        
        # Instalar (silencioso)
        Write-Info "Instalando Node.js (esto puede tardar 2-3 minutos)..."
        Write-Info "Por favor espera, no cierres esta ventana..."
        
        $installProcess = Start-Process msiexec.exe -ArgumentList "/i `"$installerPath`" /qn /norestart" -Wait -PassThru
        
        if ($installProcess.ExitCode -eq 0) {
            Write-Success "Node.js instalado exitosamente"
            
            # Limpiar instalador
            Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
            
            # Crear marker para indicar que Node.js fue instalado
            $markerPath = Join-Path $PSScriptRoot ".nodejs-installed-marker"
            "installed" | Out-File $markerPath -Encoding UTF8
            
            Write-Info "Reiniciando script automáticamente..."
            Start-Sleep -Seconds 2
            
            # Re-ejecutar el script en una nueva sesión
            $scriptPath = $PSCommandPath
            Start-Process powershell.exe -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "`"$scriptPath`""
            
            # Salir de esta sesión
            exit 0
        }
        else {
            throw "La instalación falló con código: $($installProcess.ExitCode)"
        }
    }
    catch {
        Write-Error-Custom "Error al instalar Node.js: $_"
        Write-Host ""
        Write-Warning-Custom "FALLBACK: Instalación manual necesaria"
        Write-Host ""
        Write-Host "Por favor, instala Node.js manualmente:" -ForegroundColor Yellow
        Write-Host "  1. Ve a: https://nodejs.org/" -ForegroundColor Cyan
        Write-Host "  2. Descarga la versión LTS" -ForegroundColor Cyan
        Write-Host "  3. Instala y reinicia PowerShell" -ForegroundColor Cyan
        Write-Host "  4. Vuelve a ejecutar este script" -ForegroundColor Cyan
        Write-Host ""
        Read-Host "Presiona Enter para salir"
        exit 1
    }
}

# ============================================
# Verificar si venimos de un reinicio
# ============================================
$markerPath = Join-Path $PSScriptRoot ".nodejs-installed-marker"
if (Test-Path $markerPath) {
    Write-Host ""
    Write-Success "Reinicio detectado - continuando setup..."
    Write-Host ""
    # Eliminar marker
    Remove-Item $markerPath -Force -ErrorAction SilentlyContinue
    # Pequeña pausa para que cargue el PATH
    Start-Sleep -Seconds 1
}

# ============================================
# PASO 0: Verificar Prerequisites
# ============================================

Write-Header "📋 Verificando Prerequisites"

# Verificar Node.js
$nodeInstalled = $false
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Success "Node.js detectado: $nodeVersion"
        $nodeInstalled = $true
    }
}
catch {
    # No hacer nada, se maneja abajo
}

if (-not $nodeInstalled) {
    Write-Warning-Custom "Node.js NO está instalado"
    Write-Info "Instalación automática iniciando en 3 segundos..."
    Write-Host ""
    
    # Countdown para que el usuario vea el mensaje
    for ($i = 3; $i -gt 0; $i--) {
        Write-Host "  Instalando en $i..." -ForegroundColor Yellow -NoNewline
        Start-Sleep -Seconds 1
        Write-Host "`r" -NoNewline
    }
    Write-Host ""
    
    # Instalar automáticamente SIN preguntar
    Install-NodeJS
    # Si llega aquí es porque la instalación falló
    exit 1
}

# Verificar npm (viene con Node.js)
try {
    $npmVersion = npm --version 2>$null
    Write-Success "npm detectado: $npmVersion"
}
catch {
    Write-Error-Custom "npm no está disponible (debería venir con Node.js)"
    Write-Host "Reinstala Node.js desde: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Git no es estrictamente necesario para el script, pero es útil
try {
    $gitVersion = git --version 2>$null
    if ($gitVersion) {
        Write-Success "Git detectado: $gitVersion"
    }
}
catch {
    Write-Warning-Custom "Git no está instalado (opcional para este script)"
    Write-Info "Puedes instalarlo después desde: https://git-scm.com/"
}

# ============================================
# PASO 1: Instalar/Verificar Clasp
# ============================================

Write-Header "📦 Paso 1: Configurar Google Clasp"

$claspInstalled = $false
try {
    $claspVersion = clasp --version 2>$null
    if ($claspVersion) {
        Write-Success "Clasp ya está instalado: $claspVersion"
        $claspInstalled = $true
    }
}
catch {
    # No hacer nada, se instala abajo
}

if (-not $claspInstalled) {
    Write-Info "Instalando @google/clasp globalmente..."
    Write-Info "Esto puede tardar 1-2 minutos..."
    
    try {
        npm install -g @google/clasp 2>&1 | Out-Null
        Write-Success "Clasp instalado exitosamente"
        
        # Verificar instalación
        $claspVersion = clasp --version 2>$null
        Write-Info "Versión instalada: $claspVersion"
    }
    catch {
        Write-Error-Custom "Error al instalar Clasp"
        Write-Host "Intenta manualmente: npm install -g @google/clasp" -ForegroundColor Yellow
        exit 1
    }
}

# ============================================
# PASO 2: Autenticación con Google
# ============================================

Write-Header "🔐 Paso 2: Autenticación con Google"

Write-Host "Se abrirá tu browser para autenticarte con Google." -ForegroundColor Yellow
Write-Host "Usa la cuenta donde quieres crear tu proyecto INDRA." -ForegroundColor Yellow
Write-Host ""
Write-Warning-Custom "IMPORTANTE: Debes permitir acceso a Google Drive y Apps Script"
Write-Host ""
Write-Host "Presiona Enter para continuar..." -ForegroundColor Yellow
$null = Read-Host

# Verificar si ya está autenticado
$alreadyAuthenticated = $false
try {
    clasp login --status 2>&1 | Out-Null
    $alreadyAuthenticated = $true
    Write-Info "Ya estás autenticado con Clasp"
    $response = Read-Host "¿Quieres re-autenticarte con otra cuenta? (y/N)"
    
    if ($response -match '^[Yy]$') {
        clasp logout 2>&1 | Out-Null
        $alreadyAuthenticated = $false
    }
}
catch {
    # No autenticado, proceder con login
}

if (-not $alreadyAuthenticated) {
    try {
        Write-Info "Abriendo browser para autenticación..."
        clasp login
        
        # Verificar que funcionó
        clasp login --status 2>&1 | Out-Null
        Write-Success "Autenticación exitosa"
    }
    catch {
        Write-Error-Custom "Error en autenticación"
        Write-Host "Verifica que completaste el proceso en el browser" -ForegroundColor Yellow
        exit 1
    }
}

# ============================================
# PASO 3: Crear Proyecto GAS
# ============================================

Write-Header "📂 Paso 3: Crear Proyecto en Google Apps Script"

Write-Host "Elige un nombre para tu proyecto INDRA." -ForegroundColor Yellow
$projectName = Read-Host "Nombre del proyecto (Enter para usar 'INDRA-Core')"
if ([string]::IsNullOrWhiteSpace($projectName)) {
    $projectName = "INDRA-Core"
}

Write-Info "Creando proyecto '$projectName' en Google Apps Script..."

# Cambiar al directorio del backend
$backendPath = Join-Path $PSScriptRoot "..\OrbitalCore_Codex_v1"
Push-Location $backendPath

# Verificar si ya existe un proyecto
$claspJsonPath = ".clasp.json"
$scriptId = $null

if (Test-Path $claspJsonPath) {
    Write-Warning-Custom "Ya existe un proyecto GAS vinculado"
    $response = Read-Host "¿Quieres crear un nuevo proyecto? Esto sobrescribirá el existente (y/N)"
    
    if ($response -match '^[Yy]$') {
        Remove-Item $claspJsonPath -Force
        
        try {
            clasp create --type standalone --title $projectName --rootDir .
            $claspJson = Get-Content $claspJsonPath | ConvertFrom-Json
            $scriptId = $claspJson.scriptId
        }
        catch {
            Write-Error-Custom "Error al crear proyecto"
            Pop-Location
            exit 1
        }
    }
    else {
        Write-Info "Usando proyecto existente"
        $claspJson = Get-Content $claspJsonPath | ConvertFrom-Json
        $scriptId = $claspJson.scriptId
    }
}
else {
    try {
        clasp create --type standalone --title $projectName --rootDir .
        $claspJson = Get-Content $claspJsonPath | ConvertFrom-Json
        $scriptId = $claspJson.scriptId
    }
    catch {
        Write-Error-Custom "Error al crear proyecto"
        Pop-Location
        exit 1
    }
}

if ([string]::IsNullOrWhiteSpace($scriptId)) {
    Write-Error-Custom "Error al obtener Script ID"
    Pop-Location
    exit 1
}

Write-Success "Proyecto creado: $projectName"
Write-Info "Script ID: $scriptId"

# ============================================
# PASO 4: Subir Código al Proyecto
# ============================================

Write-Header "📤 Paso 4: Subiendo Código a Google Apps Script"

Write-Info "Esto puede tardar 30-60 segundos..."

try {
    clasp push --force
    Write-Success "Código subido exitosamente"
}
catch {
    Write-Error-Custom "Error al subir código"
    Pop-Location
    exit 1
}

# Volver al directorio raíz
Pop-Location

# ============================================
# PASO 5: Configuración Manual del Web App
# ============================================

$scriptUrl = "https://script.google.com/home/projects/$scriptId/edit"

Write-Header "⚙️  Paso 5: Configurar Web App (MANUAL - 2 minutos)"

Write-Host ""
Write-Warning-Custom "ACCIÓN MANUAL REQUERIDA (debido a limitaciones de Google Apps Script)"
Write-Host ""
Write-Host "Google no permite configurar Web Apps automáticamente por seguridad." -ForegroundColor Yellow
Write-Host "Debes hacerlo manualmente UNA SOLA VEZ. Es muy simple:" -ForegroundColor Yellow
Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Info "1. Abre este link en tu browser:"
Write-Host "   $scriptUrl" -ForegroundColor Green
Write-Host ""
Write-Info "2. En el editor de Google Apps Script:"
Write-Host "   ├─ Click en botón 'Deploy' (arriba derecha)"
Write-Host "   ├─ Click en 'New deployment'"
Write-Host "   ├─ Click en el ícono de engranaje ⚙️  junto a 'Select type'"
Write-Host "   ├─ Selecciona 'Web app'"
Write-Host "   └─ Configuración:"
Write-Host "       ├─ Description: 'INDRA Production'"
Write-Host "       ├─ Execute as: 'Me'"
Write-Host "       └─ Who has access: 'Anyone'"
Write-Host ""
Write-Info "3. Click 'Deploy'"
Write-Host ""
Write-Info "4. Si te pide autorización:"
Write-Host "   ├─ Click 'Authorize access'"
Write-Host "   ├─ Selecciona tu cuenta Google"
Write-Host "   ├─ Click 'Advanced' → 'Go to $projectName (unsafe)'"
Write-Host "   └─ Click 'Allow'"
Write-Host ""
Write-Info "5. COPIA la 'Web app URL' que te muestra"
Write-Host "   (algo como: https://script.google.com/macros/s/...../exec)"
Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

# Abrir browser automáticamente
Write-Info "Abriendo browser automáticamente..."
Start-Process $scriptUrl

Write-Host ""
$completed = Read-Host "¿Ya completaste la configuración del Web App? (y/N)"

if ($completed -notmatch '^[Yy]$') {
    Write-Host ""
    Write-Warning-Custom "Setup pausado"
    Write-Host ""
    Write-Host "Para continuar después de configurar el Web App, ejecuta de nuevo:" -ForegroundColor Yellow
    Write-Host "  .\scripts\first-time-setup.ps1" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "O selecciona 'usar proyecto existente' cuando te pregunte" -ForegroundColor Yellow
    exit 0
}

# Pedir la Web App URL
Write-Host ""
Write-Info "Pega aquí la Web App URL (Ctrl+V y Enter):"
$webAppUrl = Read-Host "URL"

# Validar URL
if ([string]::IsNullOrWhiteSpace($webAppUrl)) {
    Write-Error-Custom "URL vacía. No se puede continuar."
    exit 1
}

if ($webAppUrl -notmatch '^https://script\.google\.com/macros/s/.*/exec$') {
    Write-Warning-Custom "La URL no parece ser una Web App URL válida de GAS"
    Write-Warning-Custom "Formato esperado: https://script.google.com/macros/s/{ID}/exec"
    $response = Read-Host "¿Continuar de todas formas? (y/N)"
    
    if ($response -notmatch '^[Yy]$') {
        exit 1
    }
}

Write-Success "URL capturada: $webAppUrl"

# Guardar configuración
$webAppUrl | Out-File ".gas-url.txt" -Encoding UTF8
$scriptId | Out-File ".gas-script-id.txt" -Encoding UTF8

Write-Success "Configuración del backend guardada"

# ============================================
# PASO 6: Configurar Frontend
# ============================================

Write-Header "🎨 Paso 6: Configurar Frontend"

$frontendPath = Join-Path $PSScriptRoot "..\INDRA_FRONT DEV"
Push-Location $frontendPath

# Verificar si existe .env
$envPath = ".env"
if (Test-Path $envPath) {
    Write-Warning-Custom ".env ya existe"
    $response = Read-Host "¿Quieres sobrescribirlo? (y/N)"
    
    if ($response -notmatch '^[Yy]$') {
        Write-Info "Manteniendo .env existente"
        Pop-Location
        Write-Success "Setup completado (usando .env existente)"
        exit 0
    }
}

# Crear .env
Write-Info "Creando archivo .env..."

$envContent = @"
# ============================================
# INDRA OS - Configuración de Producción
# Generado automáticamente: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ============================================

# Backend URL (Google Apps Script Web App)
VITE_GAS_URL=$webAppUrl

# Application Metadata
VITE_APP_NAME=INDRA OS
VITE_APP_VERSION=1.0.0-beta
VITE_APP_ENVIRONMENT=production

# Debug Mode (deshabilitado en producción)
VITE_ENABLE_DEBUG_MODE=false

# Analytics (opcional - configura si tienes cuentas)
VITE_GA_ID=
VITE_SENTRY_DSN=

# Feature Flags
VITE_ENABLE_OFFLINE_MODE=false
"@

$envContent | Out-File $envPath -Encoding UTF8
Write-Success "Archivo .env creado"

# ============================================
# PASO 7: Instalar Dependencias y Build
# ============================================

Write-Header "📦 Paso 7: Instalar Dependencias del Frontend"

Write-Info "Esto puede tardar 2-3 minutos..."
Write-Host ""

try {
    npm install
    Write-Success "Dependencias instaladas"
}
catch {
    Write-Error-Custom "Error al instalar dependencias"
    Pop-Location
    exit 1
}

Write-Header "🔨 Paso 8: Generar Build de Producción"

Write-Info "Compilando frontend..."
Write-Host ""

try {
    npm run build
    Write-Success "Build generado en ./dist/"
    
    # Mostrar tamaño del build
    $distSize = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Info "Tamaño del build: $([math]::Round($distSize, 2)) MB"
}
catch {
    Write-Error-Custom "Error al generar build"
    Pop-Location
    exit 1
}

# ============================================
# PASO 9: Verificar Backend
# ============================================

Write-Header "🔍 Paso 9: Verificar Conectividad con Backend"

Write-Info "Verificando que el backend responda..."

try {
    $healthCheckUrl = "$webAppUrl?action=healthCheck"
    $response = Invoke-WebRequest -Uri $healthCheckUrl -TimeoutSec 10 -UseBasicParsing
    
    if ($response.StatusCode -eq 200) {
        Write-Success "Backend está online y responde correctamente"
    }
    else {
        Write-Warning-Custom "Backend no respondió como se esperaba (HTTP $($response.StatusCode))"
        Write-Info "Esto es normal si aún no has ejecutado el bootstrap del sistema"
    }
}
catch {
    Write-Warning-Custom "No se pudo verificar el backend"
    Write-Info "Esto puede ser normal - el backend podría necesitar unos minutos para activarse"
}

# Volver al directorio raíz
Pop-Location

# ============================================
# RESUMEN FINAL
# ============================================

Write-Header "🎉 Setup Completado Exitosamente"

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host "                    RESUMEN DE TU INSTALACIÓN                          " -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host ""
Write-Info "Backend (Google Apps Script):"
Write-Host "   URL:       $webAppUrl" -ForegroundColor Cyan
Write-Host "   Script ID: $scriptId" -ForegroundColor Cyan
Write-Host "   Editor:    $scriptUrl" -ForegroundColor Cyan
Write-Host ""
Write-Info "Frontend (React + Vite):"
Write-Host "   Source:    .\INDRA_FRONT DEV\src\" -ForegroundColor Cyan
Write-Host "   Build:     .\INDRA_FRONT DEV\dist\" -ForegroundColor Cyan
Write-Host "   Config:    .\INDRA_FRONT DEV\.env" -ForegroundColor Cyan
Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host ""

Write-Header "🚀 Próximos Pasos"

Write-Host ""
Write-Host "Tu instancia INDRA está configurada. Ahora puedes:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Opción 1: Deploy a Vercel" -ForegroundColor Cyan
Write-Host "   cd 'INDRA_FRONT DEV'"
Write-Host "   npm run deploy:vercel"
Write-Host ""
Write-Host "Opción 2: Deploy a Netlify" -ForegroundColor Cyan
Write-Host "   cd 'INDRA_FRONT DEV'"
Write-Host "   npm run deploy:netlify"
Write-Host ""
Write-Host "Opción 3: Preview Local" -ForegroundColor Cyan
Write-Host "   cd 'INDRA_FRONT DEV'"
Write-Host "   npm run preview"
Write-Host "   # Se abrirá en http://localhost:4173"
Write-Host ""
Write-Host "Opción 4: Desarrollo Local" -ForegroundColor Cyan
Write-Host "   cd 'INDRA_FRONT DEV'"
Write-Host "   npm run dev"
Write-Host "   # Se abrirá en http://localhost:5173"
Write-Host ""

Write-Header "🔄 Actualizaciones Futuras"

Write-Host ""
Write-Host "Para obtener actualizaciones del proyecto original:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   # 1. Agregar upstream (solo primera vez)"
Write-Host "   git remote add upstream https://github.com/tu-org/indra-os-template.git"
Write-Host ""
Write-Host "   # 2. Obtener actualizaciones"
Write-Host "   git fetch upstream"
Write-Host "   git merge upstream/main"
Write-Host ""
Write-Host "   # 3. Push (esto activará GitHub Actions si los configuraste)"
Write-Host "   git push origin main"
Write-Host ""

Write-Header "📚 Documentación"

Write-Host ""
Write-Host "   📘 Setup Guide:        docs\SETUP_GUIDE.md"
Write-Host "   🔧 Troubleshooting:    docs\TROUBLESHOOTING.md"
Write-Host "   🏗️  Architecture:       docs\ARCHITECTURE.md"
Write-Host "   📚 API Reference:      OrbitalCore_Codex_v1\_documentation\"
Write-Host ""

Write-Header "💬 Soporte"

Write-Host ""
Write-Host "Si encuentras problemas:" -ForegroundColor Yellow
Write-Host "   🐛 Issues: https://github.com/tu-org/indra-os-template/issues"
Write-Host "   💬 Discord: [tu-server-discord]"
Write-Host "   📧 Email: [tu-email]"
Write-Host ""

Write-Host "==============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "              ¡Que la soberanía digital esté contigo! ⚡[SUN]" -ForegroundColor Cyan
Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host ""
