# ============================================
# INDRA OS - Final Setup Script v4
# ============================================
# Axioma A1: TLS 1.2
# Axioma A2: Refresh PATH
# Axioma A6: Silencioso + Logging

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

$LOG_FILE = Join-Path $env:USERPROFILE 'indra-setup-last.log'

# ============================================
# Funciones
# ============================================

function Write-Log {
    param([string]$Message, [string]$Level = 'INFO')
    $ts = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
    $entry = "$ts [$Level] $Message"
    $entry | Out-File -FilePath $LOG_FILE -Append -Encoding UTF8
}

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host $Title -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Log -Message $Title -Level 'STAGE'
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
    Write-Log -Message $Message -Level 'INFO'
}

function Write-Err {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    Write-Log -Message $Message -Level 'ERROR'
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
    Write-Log -Message $Message -Level 'OK'
}

# ============================================
# PASO 1: Detectar Node.js
# ============================================

Write-Header 'Paso 1: Validar Node.js'

$nodePath = Get-Command node -ErrorAction SilentlyContinue
if ($nodePath) {
    $nodeVersion = & node --version
    Write-Success "Node.js detectado: $nodeVersion"
} else {
    Write-Err "Node.js no detectado. Por favor instala desde https://nodejs.org/"
    exit 1
}

# A2: Refresh PATH
$machineEnv = [Environment]::GetEnvironmentVariable('Path', 'Machine')
$userEnv = [Environment]::GetEnvironmentVariable('Path', 'User')
$env:Path = "$machineEnv;$userEnv"
Write-Info "PATH refrescado"

# ============================================
# PASO 2: Frontend - Instalar dependencias
# ============================================

Write-Header 'Paso 2: Instalar Dependencias Frontend'

$frontendPath = Join-Path -Path $PSScriptRoot -ChildPath '..\system_core\client'
$frontendPath = Resolve-Path $frontendPath -ErrorAction SilentlyContinue

if (-not (Test-Path $frontendPath)) {
    Write-Err "Directorio frontend no encontrado: $frontendPath"
    exit 1
}

Push-Location $frontendPath

try {
    Write-Info "Instalando npm packages..."
    npm install
    Write-Success "Dependencias instaladas"
}
catch {
    Write-Err "Error en npm install: $($_.Exception.Message)"
    Pop-Location
    exit 1
}

# ============================================
# PASO 3: Frontend - Build
# ============================================

Write-Header 'Paso 3: Compilar Frontend'

try {
    Write-Info "Generando build..."
    npm run build
    Write-Success "Build completado"
}
catch {
    Write-Err "Error en npm build: $($_.Exception.Message)"
    Pop-Location
    exit 1
}

Pop-Location

# ============================================
# PASO 4: Configurar .env
# ============================================

Write-Header 'Paso 4: Configurar Ambiente'

$envPath = Join-Path -Path $frontendPath -ChildPath '.env'
$timestamp = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')

$envLines = @(
    '# INDRA OS - Environment Configuration',
    "# Generated: $timestamp",
    '',
    'VITE_APP_NAME=INDRA OS',
    'VITE_APP_VERSION=1.0.0-beta',
    'VITE_APP_ENVIRONMENT=production',
    'VITE_ENABLE_DEBUG_MODE=false',
    'VITE_ENABLE_OFFLINE_MODE=false',
    '',
    '# Analytics (optional)',
    'VITE_GA_ID=',
    'VITE_SENTRY_DSN='
)

$envContent = ($envLines -join [Environment]::NewLine)
$envContent | Out-File -FilePath $envPath -Encoding UTF8
Write-Success "Archivo .env creado"

# ============================================
# Finalizacion
# ============================================

Write-Header 'Setup Completado'
Write-Success "INDRA OS setup finalizado exitosamente"
Write-Host ""
Write-Host "Siguientes pasos:" -ForegroundColor Yellow
Write-Host "  1. Abre una nueva consola PowerShell"
Write-Host "  2. Ve a: $frontendPath"
Write-Host "  3. Ejecuta: npm run dev"
Write-Host ""
Write-Host "Log: $LOG_FILE" -ForegroundColor Gray
