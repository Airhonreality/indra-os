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
$BOOTSTRAP_RUN_ID = [Guid]::NewGuid().ToString().Substring(0, 8)
$BOOTSTRAP_LOG_PATH = Join-Path $env:TEMP "indra-bootstrap-$BOOTSTRAP_RUN_ID.log"
$BOOTSTRAP_LOG_LAST_PATH = Join-Path $env:USERPROFILE "indra-bootstrap-last.log"
$ProgressPreference = "SilentlyContinue"
$KEEP_TEMP_ON_FAILURE = $false
$BOOTSTRAP_ABORT_REQUESTED = $false

# Colores
function Write-Log {
    param(
        [string]$Level,
        [string]$Message
    )

    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $line = "$timestamp [$Level] $Message"
    $line | Out-File -FilePath $BOOTSTRAP_LOG_PATH -Append -Encoding UTF8
    $line | Out-File -FilePath $BOOTSTRAP_LOG_LAST_PATH -Append -Encoding UTF8
}

function Show-LogHints {
    Write-Host ""
    Write-Host "Logs:" -ForegroundColor Yellow
    Write-Host "  - $BOOTSTRAP_LOG_PATH" -ForegroundColor Cyan
    Write-Host "  - $BOOTSTRAP_LOG_LAST_PATH" -ForegroundColor Cyan
}

function Stop-Bootstrap {
    param(
        [string]$Message,
        [int]$Code = 1,
        [System.Management.Automation.ErrorRecord]$ErrorRecord = $null
    )

    Write-Error-Custom $Message
    if ($ErrorRecord) {
        Write-ExceptionDetails -Context "Fallo fatal" -ErrorRecord $ErrorRecord
    }
    Write-Log -Level "FATAL" -Message "Salida con código $Code"
    $script:KEEP_TEMP_ON_FAILURE = $true
    $script:BOOTSTRAP_ABORT_REQUESTED = $true
    throw "__INDRA_ABORT__$Code::$Message"
}

function Validate-PowerShellScriptSyntax {
    param([string]$FilePath)

    $errors = $null
    $content = Get-Content $FilePath -Raw -ErrorAction Stop
    [void][System.Management.Automation.PSParser]::Tokenize($content, [ref]$errors)

    if ($errors -and $errors.Count -gt 0) {
        return @{
            IsValid = $false
            Errors = $errors
        }
    }

    return @{
        IsValid = $true
        Errors = @()
    }
}

function Convert-FileToUtf8Bom {
    param([string]$FilePath)

    $content = Get-Content $FilePath -Raw -ErrorAction Stop
    $utf8Bom = New-Object System.Text.UTF8Encoding($true)
    [System.IO.File]::WriteAllText($FilePath, $content, $utf8Bom)
}

function Write-ExceptionDetails {
    param(
        [string]$Context,
        [System.Management.Automation.ErrorRecord]$ErrorRecord
    )

    if (-not $ErrorRecord) {
        Write-Log -Level "ERROR" -Message "$Context | ErrorRecord vacío"
        return
    }

    Write-Log -Level "ERROR" -Message "$Context | Message: $($ErrorRecord.Exception.Message)"
    Write-Log -Level "ERROR" -Message "$Context | Type: $($ErrorRecord.Exception.GetType().FullName)"
    Write-Log -Level "ERROR" -Message "$Context | Category: $($ErrorRecord.CategoryInfo)"
    Write-Log -Level "ERROR" -Message "$Context | FQID: $($ErrorRecord.FullyQualifiedErrorId)"
    if ($ErrorRecord.InvocationInfo -and $ErrorRecord.InvocationInfo.PositionMessage) {
        Write-Log -Level "ERROR" -Message "$Context | Position: $($ErrorRecord.InvocationInfo.PositionMessage.Replace([Environment]::NewLine, ' '))"
    }
}

trap {
    $errMessage = $_.Exception.Message
    if ($errMessage -like "__INDRA_ABORT__*") {
        Write-Log -Level "FATAL" -Message "Abort controlado: $errMessage"
        Write-Host ""
        Write-Warning-Custom "Bootstrap detenido de forma controlada."
        Show-LogHints
        if ($script:KEEP_TEMP_ON_FAILURE -and $script:installPath -and (Test-Path $script:installPath)) {
            Write-Warning-Custom "Se mantiene carpeta temporal para diagnóstico: $script:installPath"
        }
        Read-Host "Presiona Enter para volver a la consola"
        break
    }

    Write-ExceptionDetails -Context "Trap global no controlado" -ErrorRecord $_
    Write-Error-Custom "Se produjo un error no controlado durante el bootstrap."
    Show-LogHints
    if ($script:installPath -and (Test-Path $script:installPath)) {
        $script:KEEP_TEMP_ON_FAILURE = $true
        Write-Warning-Custom "Se mantiene carpeta temporal para diagnóstico: $script:installPath"
    }
    Read-Host "Presiona Enter para volver a la consola"
    break
}

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Log -Level "STAGE" -Message $Message
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
    Write-Log -Level "SUCCESS" -Message $Message
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
    Write-Log -Level "INFO" -Message $Message
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
    Write-Log -Level "WARN" -Message $Message
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
    Write-Log -Level "ERROR" -Message $Message
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

Write-Host ""
Write-Host "Selecciona modo de instalación:" -ForegroundColor Yellow
Write-Host "  [N] Usuario final (non-dev, recomendado)" -ForegroundColor Cyan
Write-Host "  [D] Desarrollador (usa Git prioritariamente)" -ForegroundColor Cyan
$modeInput = (Read-Host "Modo [N/D]").Trim().ToUpper()
if ($modeInput -eq "D") {
    $ExecutionMode = "dev"
    Write-Info "Modo seleccionado: desarrollador (clone-first)."
} else {
    $ExecutionMode = "non-dev"
    Write-Info "Modo seleccionado: usuario final (ZIP-first)."
}
Write-Info "Log de ejecución: $BOOTSTRAP_LOG_PATH"
Write-Info "Copia del último log: $BOOTSTRAP_LOG_LAST_PATH"

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
                    Write-ExceptionDetails -Context "Install-Git descarga intento $attempt" -ErrorRecord $_
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
            Write-ExceptionDetails -Context "Install-Git instalación silenciosa" -ErrorRecord $_
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
    Write-Log -Level "INFO" -Message "Git no detectado en PATH durante verificación inicial"
}

if (-not $gitInstalled) {
    if ($ExecutionMode -eq "dev") {
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
            Stop-Bootstrap -Message "No se pudo asegurar la instalación de Git." -Code 1
        }

        $gitStatusAfterInstall = Test-GitReady
        if ($gitStatusAfterInstall.Installed) {
            Write-Success "Git listo para continuar: $($gitStatusAfterInstall.Version)"
            $gitInstalled = $true
        } else {
            Stop-Bootstrap -Message "Git no está disponible tras recuperación." -Code 1
        }
    } else {
        Write-Warning-Custom "Git no está instalado, pero en modo non-dev continuaremos sin Git (ZIP-first)."
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
Write-Info "Preparando descarga del repositorio..."
Write-Host ""

 $repoReady = $false
 $lastCloneError = $null
 $lastZipError = $null

 function Get-RepositoryFromZip {
    param(
        [string]$destinationPath,
        [string]$bootstrapToken
    )

    $zipUrl = "https://github.com/$REPO_OWNER/$REPO_NAME/archive/refs/heads/main.zip"
    $zipPath = Join-Path $env:TEMP "indra-bootstrap-main.zip"
    $extractRoot = Join-Path $env:TEMP "indra-bootstrap-extract-$bootstrapToken"

    if (Test-Path $zipPath) {
        Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
    }
    if (Test-Path $extractRoot) {
        Remove-Item $extractRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    Write-Info "Descargando ZIP del repositorio..."
    Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath -UseBasicParsing -TimeoutSec 300 -ErrorAction Stop

    Write-Info "Extrayendo contenido..."
    if (Get-Command Expand-Archive -ErrorAction SilentlyContinue) {
        Expand-Archive -Path $zipPath -DestinationPath $extractRoot -Force
    } else {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $extractRoot)
    }

    $expectedRoot = Join-Path $extractRoot "$REPO_NAME-main"
    if (-not (Test-Path $expectedRoot)) {
        throw "No se encontró estructura esperada del ZIP ($REPO_NAME-main)"
    }

    if (Test-Path $destinationPath) {
        Remove-Item $destinationPath -Recurse -Force -ErrorAction SilentlyContinue
    }
    New-Item -ItemType Directory -Path $destinationPath -Force | Out-Null
    Copy-Item -Path (Join-Path $expectedRoot "*") -Destination $destinationPath -Recurse -Force

    Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
    Remove-Item $extractRoot -Recurse -Force -ErrorAction SilentlyContinue

    if (-not (Test-Path (Join-Path $destinationPath "scripts\first-time-setup.ps1"))) {
        throw "ZIP descargado pero contenido incompleto para el setup"
    }
 }

 function Get-RepositoryByClone {
    param([string]$destinationPath)

    for ($cloneAttempt = 1; $cloneAttempt -le 3; $cloneAttempt++) {
        try {
            Write-Info "Clonando con Git (intento $cloneAttempt/3)..."
            $cloneOutput = git clone --branch main --single-branch $REPO_URL $destinationPath 2>&1
            $cloneOutput | ForEach-Object { Write-Host $_ }

            if ($LASTEXITCODE -eq 0 -and (Test-Path (Join-Path $destinationPath ".git"))) {
                return @{
                    Success = $true
                    Error = $null
                }
            }

            $cloneError = ($cloneOutput | Out-String).Trim()
        }
        catch {
            $cloneError = $_.Exception.Message
        }

        Write-Warning-Custom "Fallo en git clone (intento $cloneAttempt/3)."
        if ($cloneError) {
            Write-Host "Detalle: $cloneError" -ForegroundColor Yellow
        }

        if (Test-Path $destinationPath) {
            Remove-Item $destinationPath -Recurse -Force -ErrorAction SilentlyContinue
            New-Item -ItemType Directory -Path $destinationPath -Force | Out-Null
        }

        if ($cloneAttempt -lt 3) {
            Start-Sleep -Seconds $cloneAttempt
        }
    }

    return @{
        Success = $false
        Error = $cloneError
    }
 }

 if ($ExecutionMode -eq "non-dev") {
    Write-Info "Modo non-dev activo: intentando ZIP-first..."
    try {
        Get-RepositoryFromZip -destinationPath $installPath -bootstrapToken $bootstrapId
        $repoReady = $true
        Write-Success "Repositorio descargado exitosamente vía ZIP"
    }
    catch {
        $lastZipError = $_.Exception.Message
        Write-Warning-Custom "ZIP-first falló."
        Write-Host "Detalle ZIP: $lastZipError" -ForegroundColor Yellow
        Write-ExceptionDetails -Context "Get-RepositoryFromZip non-dev" -ErrorRecord $_

        if ($gitInstalled) {
            Write-Info "Git está disponible; intentando clone como fallback..."
            $cloneResult = Get-RepositoryByClone -destinationPath $installPath
            if ($cloneResult.Success) {
                $repoReady = $true
            } else {
                $lastCloneError = $cloneResult.Error
            }
        }
    }
 } else {
    Write-Info "Modo dev activo: intentando clone-first..."
    $cloneResult = Get-RepositoryByClone -destinationPath $installPath
    if ($cloneResult.Success) {
        $repoReady = $true
    } else {
        $lastCloneError = $cloneResult.Error
        Write-Warning-Custom "Clone-first falló. Activando fallback por ZIP..."
        try {
            Get-RepositoryFromZip -destinationPath $installPath -bootstrapToken $bootstrapId
            $repoReady = $true
            Write-Success "Repositorio descargado exitosamente vía ZIP fallback"
        }
        catch {
            $lastZipError = $_.Exception.Message
            Write-ExceptionDetails -Context "Get-RepositoryFromZip fallback dev" -ErrorRecord $_
        }
    }
 }

if (-not $repoReady) {
    Write-Error-Custom "Falló la descarga del repositorio por todos los métodos disponibles."
    if ($lastCloneError) {
        Write-Host "Detalle clone: $lastCloneError" -ForegroundColor Yellow
    }
    if ($lastZipError) {
        Write-Host "Detalle ZIP: $lastZipError" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Posibles causas:" -ForegroundColor Yellow
    Write-Host "  1. No hay conexión a internet o hay proxy/firewall" -ForegroundColor Cyan
    Write-Host "  2. Bloqueo TLS/SSL en red corporativa" -ForegroundColor Cyan
    Write-Host "  3. Permisos insuficientes en carpeta temporal" -ForegroundColor Cyan
    Stop-Bootstrap -Message "No fue posible obtener el repositorio por ZIP ni por clone." -Code 1
}

if ($repoReady) {
    Write-Success "Repositorio listo para continuar"
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
$setupStdoutPath = Join-Path $env:TEMP "indra-setup-$BOOTSTRAP_RUN_ID.stdout.log"
$setupStderrPath = Join-Path $env:TEMP "indra-setup-$BOOTSTRAP_RUN_ID.stderr.log"

if (-not (Test-Path $setupScriptPath)) {
    Write-Error-Custom "Script de setup no encontrado: $setupScriptPath"
    Write-Host ""
    Write-Host "El repositorio puede estar incompleto." -ForegroundColor Yellow
    Stop-Bootstrap -Message "No se encontró scripts/first-time-setup.ps1 en el contenido descargado." -Code 1
}

Write-Header "🧪 Pre-validación del setup"
try {
    $syntaxCheck = Validate-PowerShellScriptSyntax -FilePath $setupScriptPath
    if (-not $syntaxCheck.IsValid) {
        Write-Warning-Custom "Se detectaron errores de parseo iniciales en setup. Intentando normalizar encoding (UTF-8 BOM)..."
        Convert-FileToUtf8Bom -FilePath $setupScriptPath
        $syntaxCheck = Validate-PowerShellScriptSyntax -FilePath $setupScriptPath
    }

    if (-not $syntaxCheck.IsValid) {
        Write-Error-Custom "El setup tiene errores de sintaxis antes de ejecutar."
        foreach ($parseError in $syntaxCheck.Errors) {
            Write-Log -Level "ERROR" -Message "Setup parse error: $($parseError.Message) | Line $($parseError.Token.StartLine) Char $($parseError.Token.StartColumn)"
        }
        Stop-Bootstrap -Message "Se aborta: first-time-setup.ps1 no parsea correctamente. Revisa logs y archivo temporal." -Code 1
    }

    Write-Success "Pre-validación sintáctica del setup OK"
}
catch {
    Write-ExceptionDetails -Context "Pre-validación de sintaxis del setup" -ErrorRecord $_
    Stop-Bootstrap -Message "Error durante pre-validación del setup." -Code 1 -ErrorRecord $_
}

# Ejecutar el script de setup en bloque de autolimpieza
try {
    Write-Info "Ejecutando orquestador de despliegue en nube en proceso aislado..."
    Write-Info "Log STDOUT setup: $setupStdoutPath"
    Write-Info "Log STDERR setup: $setupStderrPath"

    if (Test-Path $setupStdoutPath) { Remove-Item $setupStdoutPath -Force -ErrorAction SilentlyContinue }
    if (Test-Path $setupStderrPath) { Remove-Item $setupStderrPath -Force -ErrorAction SilentlyContinue }

    $setupProcess = Start-Process -FilePath "powershell.exe" `
        -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $setupScriptPath) `
        -WorkingDirectory $installPath `
        -RedirectStandardOutput $setupStdoutPath `
        -RedirectStandardError $setupStderrPath `
        -PassThru `
        -Wait

    if ($setupProcess.ExitCode -ne 0) {
        Write-Error-Custom "Setup finalizó con código: $($setupProcess.ExitCode)"
        if (Test-Path $setupStderrPath) {
            $tailErr = Get-Content $setupStderrPath -Tail 40 -ErrorAction SilentlyContinue
            if ($tailErr) {
                Write-Host "--- Últimas líneas de error del setup ---" -ForegroundColor Yellow
                $tailErr | ForEach-Object { Write-Host $_ -ForegroundColor Yellow }
            }
        }
        Write-Log -Level "ERROR" -Message "Setup process failed with exit code $($setupProcess.ExitCode)"
        Stop-Bootstrap -Message "Fallo durante ejecución de first-time-setup.ps1 (ver logs stdout/stderr)." -Code 1
    }

    Write-Log -Level "SUCCESS" -Message "Setup process completed with exit code 0"
    
    Write-Host ""
    Write-Success "Indra ha sido propulsada exitosamente a tu nube de Google."
}
catch {
    Write-Error-Custom "Error crítico durante el despliegue: $_"
    Write-ExceptionDetails -Context "Ejecución setup principal" -ErrorRecord $_
    Write-Host ""
    Write-Warning-Custom "El proceso se ha detenido. El entorno temporal se mantendrá para diagnóstico."
    Stop-Bootstrap -Message "Fallo durante la ejecución del setup principal." -Code 1 -ErrorRecord $_
}
finally {
    # ── ELIMINACIÓN DE RASTRO (Soberanía Física) ──
    Write-Header "🧹 Autolimpieza Final"
    Write-Info "Borrando andamio temporal en: $installPath"
    
    # Pausa breve para cerrar handles de archivos
    Start-Sleep -Seconds 2
    
    if (Test-Path $installPath) {
        if ($KEEP_TEMP_ON_FAILURE -or $BOOTSTRAP_ABORT_REQUESTED) {
            Write-Warning-Custom "Se conserva carpeta temporal para diagnóstico: $installPath"
        }
        else {
            Remove-Item $installPath -Recurse -Force -ErrorAction SilentlyContinue
            Write-Success "Rastro local eliminado. Tu PC vuelve a estar limpio."
        }
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
Write-Info "Log final disponible en: $BOOTSTRAP_LOG_PATH"
Write-Info "Último log consolidado: $BOOTSTRAP_LOG_LAST_PATH"
Read-Host "Presiona Enter para finalizar y volver a la consola"
