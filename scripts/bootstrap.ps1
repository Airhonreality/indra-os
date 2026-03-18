# ============================================
# INDRA OS - Bootstrap Installer v3.0
# ============================================
# Este script descarga INDRA OS y ejecuta el setup automáticamente
# Uso: irm https://raw.githubusercontent.com/Airhonreality/indra-os/main/scripts/bootstrap.ps1 | iex
# ============================================

$ErrorActionPreference = "Stop"

# CONFIGURACIÓN: Usuario real de GitHub
$REPO_OWNER = "Airhonreality"
$REPO_NAME = "indra-os"
$REPO_URL = "https://github.com/$REPO_OWNER/$REPO_NAME.git"
$RAW_URL_BASE = "https://raw.githubusercontent.com/$REPO_OWNER/$REPO_NAME/main"

# Colores
function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Banner
Clear-Host
Write-Host @"
   ___ _   _ ____  ____      _      ___  ____  
  |_ _| \ | |  _ \|  _ \    / \    / _ \/ ___| 
   | ||  \| | | | | |_) |  / _ \  | | | \___ \ 
   | || |\  | |_| |  _ <  / ___ \ | |_| |___) |
  |___|_| \_|____/|_| \_\/_/   \_(_)___/|____/ 
                                                
  🌞 Solar Punk Edition - Bootstrap Installer
"@ -ForegroundColor Cyan

Write-Host ""
Write-Host "Este script descargará e instalará INDRA OS automáticamente." -ForegroundColor Yellow
Write-Host "Duración estimada: 15 minutos" -ForegroundColor Yellow
Write-Host ""
Write-Host "Presiona Enter para continuar o Ctrl+C para cancelar..." -ForegroundColor Yellow
$null = Read-Host

# ============================================
# FUNCIÓN: Instalar Git automáticamente
# ============================================
function Install-Git {
    Write-Header "📦 Instalando Git automáticamente"
    
    Write-Info "Git no detectado - iniciando instalación automática..."
    
    # Detectar arquitectura
    $arch = if ([Environment]::Is64BitOperatingSystem) { "64" } else { "32" }
    
    # Obtener última versión de Git
    Write-Info "Obteniendo última versión de Git..."
    $gitReleasesUrl = "https://api.github.com/repos/git-for-windows/git/releases/latest"
    
    try {
        $latestRelease = Invoke-RestMethod -Uri $gitReleasesUrl -UseBasicParsing
        $gitVersion = $latestRelease.tag_name -replace 'v', ''
        
        # Construir URL de descarga
        $installerUrl = "https://github.com/git-for-windows/git/releases/download/v$gitVersion/Git-$gitVersion-$arch-bit.exe"
        $installerPath = "$env:TEMP\git-installer.exe"
        
        Write-Info "Descargando Git v$gitVersion para Windows $arch-bit..."
        Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
        Write-Success "Descarga completada"
        
        # Instalar Git (silencioso)
        Write-Info "Instalando Git (esto puede tardar 2-3 minutos)..."
        Write-Info "Por favor espera, no cierres esta ventana..."
        
        # Parámetros de instalación silenciosa
        $installArgs = @(
            "/VERYSILENT",
            "/NORESTART",
            "/NOCANCEL",
            "/SP-",
            "/CLOSEAPPLICATIONS",
            "/RESTARTAPPLICATIONS",
            "/COMPONENTS=`"icons,ext\shellhere,assoc,assoc_sh`""
        )
        
        $installProcess = Start-Process -FilePath $installerPath -ArgumentList $installArgs -Wait -PassThru
        
        if ($installProcess.ExitCode -eq 0) {
            Write-Success "Git instalado exitosamente"
            
            # Limpiar instalador
            Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
            
            # Crear marker
            $markerPath = Join-Path $env:TEMP ".git-installed-marker"
            "installed" | Out-File $markerPath -Encoding UTF8
            
            Write-Info "Reiniciando script automáticamente..."
            Start-Sleep -Seconds 2
            
            # Re-ejecutar el script bootstrap
            Start-Process powershell.exe -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", "irm $RAW_URL_BASE/scripts/bootstrap.ps1 | iex"
            
            exit 0
        }
        else {
            throw "La instalación falló con código: $($installProcess.ExitCode)"
        }
    }
    catch {
        Write-Error-Custom "Error al instalar Git: $_"
        Write-Host ""
        Write-Warning-Custom "FALLBACK: Instalación manual necesaria"
        Write-Host ""
        Write-Host "Por favor, instala Git manualmente:" -ForegroundColor Yellow
        Write-Host "  1. Ve a: https://git-scm.com/download/win" -ForegroundColor Cyan
        Write-Host "  2. Descarga Git para Windows" -ForegroundColor Cyan
        Write-Host "  3. Instala con opciones por defecto" -ForegroundColor Cyan
        Write-Host "  4. Reinicia PowerShell" -ForegroundColor Cyan
        Write-Host "  5. Ejecuta de nuevo el comando bootstrap" -ForegroundColor Cyan
        Write-Host ""
        Read-Host "Presiona Enter para salir"
        exit 1
    }
}

# ============================================
# Verificar si venimos de reinicio por Git
# ============================================
$gitMarkerPath = Join-Path $env:TEMP ".git-installed-marker"
if (Test-Path $gitMarkerPath) {
    Write-Host ""
    Write-Success "Reinicio detectado - continuando instalación..."
    Write-Host ""
    Remove-Item $gitMarkerPath -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# ============================================
# PASO 1: Verificar Git
# ============================================

Write-Header "📋 Verificando Git"

$gitInstalled = $false
try {
    $gitVersion = git --version 2>$null
    if ($gitVersion) {
        Write-Success "Git detectado: $gitVersion"
        $gitInstalled = $true
    }
}
catch {
    # No detectado
}

if (-not $gitInstalled) {
    Write-Warning-Custom "Git NO está instalado"
    Write-Info "Instalación automática iniciando en 3 segundos..."
    Write-Host ""
    
    for ($i = 3; $i -gt 0; $i--) {
        Write-Host "  Instalando en $i..." -ForegroundColor Yellow -NoNewline
        Start-Sleep -Seconds 1
        Write-Host "`r" -NoNewline
    }
    Write-Host ""
    
    Install-Git
    exit 1
}

# ============================================
# PASO 2: Preparar Territorio Efímero (Temporal)
# ============================================

Write-Header "🏗️  Zona de Construcción Efímera"

# Generar una ruta temporal única para el andamio de construcción
$bootstrapId = [Guid]::NewGuid().ToString().Substring(0,8)
$installPath = Join-Path $env:TEMP "indra-scaffolding-$bootstrapId"

Write-Info "Creando entorno temporal de despliegue..."
Write-Info "Ruta: $installPath"
Write-Warning-Custom "IMPORTANTE: Esta carpeta se autodestruirá al finalizar el despliegue."
Write-Host "Indra Core nacerá en la nube; no quedará rastro de código en este equipo." -ForegroundColor Yellow

# Crear carpeta temporal
if (-not (Test-Path $installPath)) {
    New-Item -ItemType Directory -Path $installPath -Force | Out-Null
}

Write-Success "Entorno temporal listo."

# ============================================
# PASO 3: Clonar Repositorio
# ============================================

Write-Header "📥 Descargando INDRA OS desde GitHub"

Write-Info "Repositorio: $REPO_URL"
Write-Info "Clonando... (esto puede tardar 1-2 minutos)"
Write-Host ""

try {
    git clone --branch main --single-branch $REPO_URL $installPath 2>&1 | ForEach-Object { Write-Host $_ }
    
    if ($LASTEXITCODE -ne 0) {
        throw "Git clone falló con código: $LASTEXITCODE"
    }
    
    Write-Success "Repositorio clonado exitosamente"
}
catch {
    Write-Error-Custom "Error al clonar repositorio: $_"
    Write-Host ""
    Write-Host "Posibles causas:" -ForegroundColor Yellow
    Write-Host "  1. No hay conexión a internet" -ForegroundColor Cyan
    Write-Host "  2. El repositorio no existe o es privado" -ForegroundColor Cyan
    Write-Host "  3. Problemas de permisos en la carpeta destino" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

# ============================================
# PASO 4: Ejecutar Setup
# ============================================

Write-Header "🚀 Iniciando Setup Automático"

Write-Info "Cambiando a carpeta de instalación..."
Set-Location $installPath

Write-Info "Ejecutando script de setup..."
Write-Host ""

$setupScriptPath = Join-Path $installPath "scripts\first-time-setup.ps1"

if (-not (Test-Path $setupScriptPath)) {
    Write-Error-Custom "Script de setup no encontrado: $setupScriptPath"
    Write-Host ""
    Write-Host "El repositorio puede estar incompleto." -ForegroundColor Yellow
    exit 1
}

# Ejecutar el script de setup en bloque de autolimpieza
try {
    Write-Info "Ejecutando orquestador de despliegue en nube..."
    & $setupScriptPath
    
    Write-Host ""
    Write-Success "Indra ha sido propulsada exitosamente a tu nube de Google." -ForegroundColor Green
}
catch {
    Write-Error-Custom "Error crítico durante el despliegue: $_"
    Write-Host ""
    Write-Warning-Custom "El proceso se ha detenido. El entorno temporal se mantendrá para diagnóstico."
    exit 1
}
finally {
    # ── ELIMINACIÓN DE RASTRO (Soberanía Física) ──
    Write-Header "🧹 Autolimpieza Final"
    Write-Info "Borrando andamio temporal en: $installPath"
    
    # Pausa breve para cerrar handles de archivos
    Start-Sleep -Seconds 2
    
    if (Test-Path $installPath) {
        Remove-Item $installPath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Success "Rastro local eliminado. Tu PC vuelve a estar limpio."
    }
}

# ============================================
# FIN
# ============================================

Write-Host ""
Write-Success "Bootstrap completado"
Write-Host ""
Write-Host "INDRA OS instalado en: $installPath" -ForegroundColor Green
Write-Host ""
