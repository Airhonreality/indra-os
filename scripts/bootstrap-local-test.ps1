# ============================================
# INDRA OS - Bootstrap v4 LOCAL TESTING
# ============================================
# Testing versión: usa rutas locales, salta ZIP download
# En producción: usar bootstrap-v4-remote.ps1

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

# ============================================
# Configuracion LOCAL
# ============================================

$RUN_ID = [Guid]::NewGuid().ToString().Substring(0, 8)
$LOG_FILE = Join-Path $env:TEMP "indra-bootstrap-$RUN_ID.log"
$LOG_LAST = Join-Path $env:USERPROFILE 'indra-bootstrap-last.log'

# Usar el directorio actual como INSTALL_PATH (testing)
$INSTALL_PATH = Get-Location
$GIT_READY = $false

# ============================================
# Funciones de Logging
# ============================================

function Write-Log {
    param([string]$Message, [string]$Level = 'INFO')
    $ts = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
    $entry = "$ts [$Level] $Message"
    $entry | Out-File -FilePath $LOG_FILE -Append -Encoding UTF8
    $entry | Out-File -FilePath $LOG_LAST -Append -Encoding UTF8
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

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
    Write-Log -Message $Message -Level 'WARN'
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
# PREFLIGHT: Validar Entorno
# ============================================

Write-Header 'Preflight Checks'

# A1: TLS 1.2
Write-Info "Validando TLS 1.2..."
if ([System.Net.ServicePointManager]::SecurityProtocol -match 'Tls12') {
    Write-Success "TLS 1.2 habilitado"
} else {
    Write-Warn "TLS 1.2 no confirmado; continuando..."
}

# Detectar Git
Write-Info "Detectando Git..."
$gitPath = Get-Command git -ErrorAction SilentlyContinue
if ($gitPath) {
    $GIT_READY = $true
    Write-Success "Git detectado: $($gitPath.Source)"
} else {
    Write-Warn "Git no detectado"
}

# ============================================
# VALIDACION: Estructura local
# ============================================

Write-Header 'Validacion de Estructura'

Write-Info "Usando directorio local: $INSTALL_PATH"
$setupPath = Join-Path -Path $INSTALL_PATH -ChildPath 'scripts\setup-final.ps1'

if (-not (Test-Path $setupPath)) {
    Write-Err "Archivo critico no encontrado: setup-final.ps1"
    Write-Log -Message "setup-final.ps1 not found at $setupPath" -Level 'ABORT'
    exit 1
}

Write-Success "Estructura validada"
Write-Log -Message "Setup path: $setupPath" -Level 'INFO'

# ============================================
# SETUP: Ejecutar setup final aislado
# ============================================

Write-Header 'Ejecucion del Setup Final'

try {
    Write-Info "Iniciando setup final..."
    Write-Log -Message "Setup starting at $setupPath" -Level 'SETUP'
    
    # A4: Configurar Schannel si Git presente
    if ($GIT_READY) {
        Write-Info "Configurando Git con Schannel..."
        try {
            git config --system http.sslBackend schannel 2>$null
            Write-Success "Schannel configurado"
        }
        catch {
            Write-Warn "No se pudo configurar Schannel (continuando)"
        }
    }
    
    # A2: Refresh PATH
    $machineEnv = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $userEnv = [Environment]::GetEnvironmentVariable('Path', 'User')
    $env:Path = "$machineEnv;$userEnv"
    Write-Info "PATH refrescado"
    
    # Ejecutar setup aislado
    Write-Log -Message "Invoking setup-final.ps1" -Level 'SETUP'
    & $setupPath
    
    Write-Success "Setup completado"
    Write-Log -Message "Setup finished successfully" -Level 'OK'
}
catch {
    Write-Err "Setup fallo: $($_.Exception.Message)"
    Write-Log -Message "Setup error: $($_.Exception.Message)" -Level 'ERROR'
    Write-Log -Message "Script line: $($_.InvocationInfo.ScriptLineNumber)" -Level 'ERROR'
    Write-Host "Log completo: $LOG_FILE" -ForegroundColor Gray
    exit 1
}

# ============================================
# Finalizacion
# ============================================

Write-Header 'Instalacion Completada'
Write-Success "INDRA OS bootstrap completado"
Write-Host ""
Write-Host "Log de bootstrap: $LOG_FILE" -ForegroundColor Gray
Write-Host ""
