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

function Test-GitReady {
    $gitCandidates = @(
        "git",
        "$env:ProgramFiles\Git\cmd\git.exe",
        "$env:ProgramFiles\Git\bin\git.exe",
        "$env:ProgramFiles(x86)\Git\cmd\git.exe",
        "$env:LocalAppData\Programs\Git\cmd\git.exe"
    )

    foreach ($candidate in $gitCandidates) {
        try {
            if ($candidate -ne "git" -and -not (Test-Path $candidate)) {
                continue
            }

            $versionOutput = & $candidate --version 2>$null
            if ($LASTEXITCODE -eq 0 -and $versionOutput) {
                return @{
                    Installed = $true
                    Version = $versionOutput
                    Path = $candidate
                }
            }
        } catch {
            # continuar intentando
        }
    }

    return @{
        Installed = $false
        Version = $null
        Path = $null
    }
}

function Start-GitManualRecovery {
    while ($true) {
        Write-Host ""
        Write-Header "🛟 Recuperación de instalación de Git"
        Write-Host "Selecciona una opción:" -ForegroundColor Yellow
        Write-Host "  [R] Reintentar instalación automática" -ForegroundColor Cyan
        Write-Host "  [M] Abrir instalación manual de Git (navegador)" -ForegroundColor Cyan
        Write-Host "  [C] Comprobar si Git ya quedó instalado" -ForegroundColor Cyan
        Write-Host "  [S] Salir" -ForegroundColor Cyan
        $choice = (Read-Host "Opción").Trim().ToUpper()

        switch ($choice) {
            "R" { return "retry" }
            "M" {
                Write-Info "Abriendo página oficial de Git..."
                Start-Process "https://git-scm.com/download/win"

                Write-Info "Esperando instalación manual en esta misma consola (hasta 10 minutos)..."
                Write-Host "Puedes instalar Git ahora. Detectaré automáticamente cuando quede listo." -ForegroundColor Yellow

                for ($i = 1; $i -le 120; $i++) {
                    $status = Test-GitReady
                    if ($status.Installed) {
                        Write-Success "Git detectado: $($status.Version)"
                        return "installed"
                    }

                    if ($i % 12 -eq 0) {
                        Write-Info "Sigo esperando instalación de Git... ($([int]($i / 12)) min)"
                    }

                    Start-Sleep -Seconds 5
                }

                Write-Warning-Custom "Aún no detecto Git. Puedes comprobar manualmente o reintentar."
            }
            "C" {
                $status = Test-GitReady
                if ($status.Installed) {
                    Write-Success "Git detectado: $($status.Version)"
                    return "installed"
                }

                Write-Warning-Custom "Git todavía no está disponible en el sistema."
                Write-Host "Si ya lo instalaste, cierra y abre PowerShell, luego vuelve a comprobar." -ForegroundColor Yellow
            }
            "S" { return "exit" }
            default { Write-Warning-Custom "Opción no válida. Usa R, M, C o S." }
        }
    }
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
Write-Host "Este script construirá un puente temporal para lanzar INDRA OS a tu Google Drive." -ForegroundColor Yellow
Write-Host "No se instalará ningún software local en tu PC y este proceso no dejará rastro." -ForegroundColor Cyan
Write-Host "Duración estimada: 15 minutos" -ForegroundColor Yellow
Write-Host ""
Write-Host "Presiona Enter para iniciar la ignición o Ctrl+C para cancelar..." -ForegroundColor Yellow
$null = Read-Host

# ============================================
# FUNCIÓN: Instalar Git automáticamente
# ============================================
function Install-Git {
    while ($true) {
        Write-Header "📦 Instalando Git (requerido para INDRA)"

        Write-Info "Iniciando descarga e instalación automática de Git..."
        Write-Info "Esto puede tomar algunos minutos. Por favor, espera..."

        # Detectar arquitectura
        $arch = if ([Environment]::Is64BitOperatingSystem) { "64" } else { "32" }
        $installerPath = "$env:TEMP\git-installer.exe"

        # Configurar TLS y SSL
        try {
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13
        } catch {
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        }

        # URLs de descarga con fallback - versiones estables conocidas
        $downloadSources = @(
        # Fuente 1: GitHub Releases (más reciente)
        @{
            name = "GitHub Releases (última versión)"
            url = {
                param($version)
                "https://github.com/git-for-windows/git/releases/download/v$version/Git-$version-$arch-bit.exe"
            }
            getVersion = {
                try {
                    $response = Invoke-RestMethod -Uri "https://api.github.com/repos/git-for-windows/git/releases/latest" `
                        -UseBasicParsing `
                        -TimeoutSec 15 `
                        -MaximumRetryCount 2 `
                        -RetryIntervalSec 3 `
                        -ErrorAction Stop
                    return $response.tag_name -replace 'v', ''
                } catch {
                    Write-Warning-Custom "No se pudo obtener versión desde API, usando fallback"
                    return "2.45.0"
                }
            }
        }
        # Fuente 2: Versión estable conocida (fallback)
        @{
            name = "GitHub Releases (versión estable)"
            url = {
                "https://github.com/git-for-windows/git/releases/download/v2.45.0/Git-2.45.0-$arch-bit.exe"
            }
            getVersion = { $null }
        }
        # Fuente 3: git-scm.com (CDN distribuida)
        @{
            name = "git-scm.com (CDN)"
            url = {
                if ($arch -eq "64") {
                    "https://www.git-scm.com/download/win"  # Página que redirige al instalador
                } else {
                    "https://www.git-scm.com/download/win?bit=32"
                }
            }
            getVersion = { $null }
        }
        )

        $downloadSuccess = $false
        $maxAttempts = 3

        # Intentar descargar desde cada fuente
        foreach ($source in $downloadSources) {
            if ($downloadSuccess) { break }

            Write-Host ""
            Write-Info "Intento desde: $($source.name)"

            for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
                try {
                # Obtener URL
                $downloadUrl = if ($source.getVersion) {
                    $version = & $source.getVersion
                    if ($version) {
                        Write-Info "Versión detectada: $version"
                        & $source.url $version
                    } else {
                        & $source.url
                    }
                } else {
                    & $source.url
                }
                
                # Limpiar intentos previos
                if (Test-Path $installerPath) {
                    Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
                }
                
                Write-Info "Descargando ($attempt/$maxAttempts)..."
                
                # Descargar con timeouts y reintentos configurados
                $params = @{
                    Uri                       = $downloadUrl
                    OutFile                   = $installerPath
                    UseBasicParsing           = $true
                    TimeoutSec                = 300  # 5 minutos
                    MaximumRetryCount         = 1
                    RetryIntervalSec          = 5
                    SkipCertificateCheck      = $false
                    ErrorAction               = 'Stop'
                }
                
                # Usar WebClient si Invoke-WebRequest falla (compatible con PS 2.0+)
                if ($PSVersionTable.PSVersion.Major -lt 6) {
                    $webClient = New-Object System.Net.WebClient
                    $webClient.DownloadFile($downloadUrl, $installerPath)
                } else {
                    Invoke-WebRequest @params
                }
                
                # Validar tamaño de descarga
                if (Test-Path $installerPath) {
                    $fileSize = (Get-Item $installerPath).Length
                    if ($fileSize -gt 50MB) {  # Git suele ser > 50 MB
                        Write-Success "Descarga exitosa: $([Math]::Round($fileSize/1MB, 2)) MB"
                        $downloadSuccess = $true
                        break
                    } else {
                        Write-Warning-Custom "Descarga incompleta ($([Math]::Round($fileSize/1MB, 2)) MB), reintentando..."
                        Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
                    }
                }
                } catch {
                    $errorMsg = $_.Exception.Message
                    Write-Warning-Custom "Error en intento $attempt`: $errorMsg"
                    Remove-Item $installerPath -Force -ErrorAction SilentlyContinue

                    if ($attempt -lt $maxAttempts) {
                        Write-Info "Esperando antes de reintentar (${attempt}s)..."
                        Start-Sleep -Seconds $attempt
                    }
                }
            }
        }

        if (-not $downloadSuccess) {
            Write-Error-Custom "No se pudo descargar Git desde ninguna fuente disponible"
            $recoveryAction = Start-GitManualRecovery

            if ($recoveryAction -eq "retry") {
                continue
            }

            if ($recoveryAction -eq "installed") {
                return $true
            }

            return $false
        }

        # Instalar Git silenciosamente
        try {
            Write-Header "Instalando Git en tu sistema"
            Write-Info "Esto puede tardar 2-3 minutos..."

            $installArgs = @(
                "/VERYSILENT",
                "/NORESTART",
                "/NOCANCEL",
                "/SP-",
                "/CLOSEAPPLICATIONS",
                "/RESTARTAPPLICATIONS",
                "/COMPONENTS=`"icons,ext\shellhere,assoc,assoc_sh`""
            )

            $installProcess = Start-Process -FilePath $installerPath `
                -ArgumentList $installArgs `
                -Wait `
                -PassThru `
                -NoNewWindow

            Remove-Item $installerPath -Force -ErrorAction SilentlyContinue

            if ($installProcess.ExitCode -eq 0) {
                $status = Test-GitReady
                if ($status.Installed) {
                    Write-Success "Git instalado exitosamente en tu sistema"
                    Write-Success "$($status.Version)"
                    return $true
                }

                Write-Warning-Custom "La instalación terminó, pero Git aún no se detecta en esta sesión."
                $recoveryAction = Start-GitManualRecovery
                if ($recoveryAction -eq "retry") {
                    continue
                }
                if ($recoveryAction -eq "installed") {
                    return $true
                }
                return $false
            } else {
                Write-Error-Custom "La instalación falló con código: $($installProcess.ExitCode)"
                $recoveryAction = Start-GitManualRecovery
                if ($recoveryAction -eq "retry") {
                    continue
                }
                if ($recoveryAction -eq "installed") {
                    return $true
                }
                return $false
            }
        } catch {
            Write-Error-Custom "Error durante la instalación: $($_.Exception.Message)"
            $recoveryAction = Start-GitManualRecovery
            if ($recoveryAction -eq "retry") {
                continue
            }
            if ($recoveryAction -eq "installed") {
                return $true
            }
            return $false
        }
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
    
    $installedNow = Install-Git
    if (-not $installedNow) {
        Write-Error-Custom "No se pudo asegurar la instalación de Git."
        exit 1
    }

    $gitStatusAfterInstall = Test-GitReady
    if ($gitStatusAfterInstall.Installed) {
        Write-Success "Git listo para continuar: $($gitStatusAfterInstall.Version)"
        $gitInstalled = $true
    } else {
        Write-Error-Custom "Git no está disponible tras recuperación."
        exit 1
    }
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
Write-Success "Secuencia de Ignición y Limpieza finalizada."
Write-Host ""
Write-Host "INDRA OS ahora orbita tu Google Drive. Tu PC está limpio." -ForegroundColor Green
Write-Host ""
