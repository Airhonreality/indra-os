# ============================================
# INDRA OS - Bootstrap Installer v4 (ASCII Safe)
# ============================================

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$REPO_OWNER = "Airhonreality"
$REPO_NAME = "indra-os"
$REPO_URL = "https://github.com/$REPO_OWNER/$REPO_NAME.git"
$ZIP_URL = "https://github.com/$REPO_OWNER/$REPO_NAME/archive/refs/heads/main.zip"

$RUN_ID = [Guid]::NewGuid().ToString().Substring(0, 8)
$BOOTSTRAP_LOG_PATH = Join-Path $env:TEMP "indra-bootstrap-$RUN_ID.log"
$BOOTSTRAP_LOG_LAST_PATH = Join-Path $env:USERPROFILE "indra-bootstrap-last.log"
$SETUP_STDOUT_PATH = Join-Path $env:TEMP "indra-setup-$RUN_ID.stdout.log"
$SETUP_STDERR_PATH = Join-Path $env:TEMP "indra-setup-$RUN_ID.stderr.log"

$ExecutionMode = "non-dev"
$keepTempOnFailure = $false
$abortRequested = $false
$installPath = $null

function Write-Log {
    param([string]$Level, [string]$Message)
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $line = "$timestamp [$Level] $Message"
    $line | Out-File -FilePath $BOOTSTRAP_LOG_PATH -Append -Encoding UTF8
    $line | Out-File -FilePath $BOOTSTRAP_LOG_LAST_PATH -Append -Encoding UTF8
}

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "--------------------------------------------------------------------------" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "--------------------------------------------------------------------------" -ForegroundColor Cyan
    Write-Host ""
    Write-Log -Level "STAGE" -Message $Message
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
    Write-Log -Level "INFO" -Message $Message
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
    Write-Log -Level "WARN" -Message $Message
}

function Write-Ok {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
    Write-Log -Level "SUCCESS" -Message $Message
}

function Write-Err {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    Write-Log -Level "ERROR" -Message $Message
}

function Show-LogHints {
    Write-Host ""
    Write-Host "Logs:" -ForegroundColor Yellow
    Write-Host "  $BOOTSTRAP_LOG_PATH" -ForegroundColor Cyan
    Write-Host "  $BOOTSTRAP_LOG_LAST_PATH" -ForegroundColor Cyan
    if (Test-Path $SETUP_STDOUT_PATH) { Write-Host "  $SETUP_STDOUT_PATH" -ForegroundColor Cyan }
    if (Test-Path $SETUP_STDERR_PATH) { Write-Host "  $SETUP_STDERR_PATH" -ForegroundColor Cyan }
}

function Write-ExceptionDetails {
    param([string]$Context, [System.Management.Automation.ErrorRecord]$ErrorRecord)

    if (-not $ErrorRecord) {
        Write-Log -Level "ERROR" -Message "$Context | ErrorRecord empty"
        return
    }

    Write-Log -Level "ERROR" -Message "$Context | Message: $($ErrorRecord.Exception.Message)"
    Write-Log -Level "ERROR" -Message "$Context | Type: $($ErrorRecord.Exception.GetType().FullName)"
    Write-Log -Level "ERROR" -Message "$Context | Category: $($ErrorRecord.CategoryInfo)"
    Write-Log -Level "ERROR" -Message "$Context | FQID: $($ErrorRecord.FullyQualifiedErrorId)"
    if ($ErrorRecord.InvocationInfo -and $ErrorRecord.InvocationInfo.PositionMessage) {
        $pos = $ErrorRecord.InvocationInfo.PositionMessage.Replace([Environment]::NewLine, ' ')
        Write-Log -Level "ERROR" -Message "$Context | Position: $pos"
    }
}

function Stop-Bootstrap {
    param(
        [string]$Message,
        [int]$Code = 1,
        [System.Management.Automation.ErrorRecord]$ErrorRecord = $null
    )

    Write-Err $Message
    if ($ErrorRecord) {
        Write-ExceptionDetails -Context "Fatal failure" -ErrorRecord $ErrorRecord
    }

    $script:keepTempOnFailure = $true
    $script:abortRequested = $true
    throw "__INDRA_ABORT__$Code::$Message"
}

trap {
    $errMessage = $_.Exception.Message

    if ($errMessage -like "__INDRA_ABORT__*") {
        Write-Log -Level "FATAL" -Message "Controlled abort: $errMessage"
        Write-Host ""
        Write-Warn "Bootstrap stopped in controlled mode."
        if ($script:keepTempOnFailure -and $script:installPath -and (Test-Path $script:installPath)) {
            Write-Warn "Temp folder preserved: $script:installPath"
        }
        Show-LogHints
        Read-Host "Press Enter to return to console"
        break
    }

    Write-ExceptionDetails -Context "Unhandled trap" -ErrorRecord $_
    Write-Err "Unhandled bootstrap error."
    $script:keepTempOnFailure = $true
    if ($script:installPath -and (Test-Path $script:installPath)) {
        Write-Warn "Temp folder preserved: $script:installPath"
    }
    Show-LogHints
    Read-Host "Press Enter to return to console"
    break
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
                return @{ Installed = $true; Version = $versionOutput; Path = $candidate }
            }
        } catch {}
    }

    return @{ Installed = $false; Version = $null; Path = $null }
}

function Test-TempWritable {
    try {
        $probe = Join-Path $env:TEMP "indra-write-test-$RUN_ID.tmp"
        "ok" | Out-File -FilePath $probe -Encoding UTF8 -ErrorAction Stop
        Remove-Item $probe -Force -ErrorAction SilentlyContinue
        return $true
    } catch {
        return $false
    }
}

function Validate-PowerShellScriptSyntax {
    param([string]$FilePath)

    $errors = $null
    [void][System.Management.Automation.PSParser]::Tokenize((Get-Content $FilePath -Raw -ErrorAction Stop), [ref]$errors)
    if ($errors -and $errors.Count -gt 0) {
        return @{ IsValid = $false; Errors = $errors }
    }
    return @{ IsValid = $true; Errors = @() }
}

function Convert-FileToUtf8Bom {
    param([string]$FilePath)
    $content = Get-Content $FilePath -Raw -ErrorAction Stop
    $utf8Bom = New-Object System.Text.UTF8Encoding($true)
    [System.IO.File]::WriteAllText($FilePath, $content, $utf8Bom)
}

function Acquire-RepositoryByZip {
    param([string]$DestinationPath)

    $zipPath = Join-Path $env:TEMP "indra-bootstrap-main-$RUN_ID.zip"
    $extractRoot = Join-Path $env:TEMP "indra-bootstrap-extract-$RUN_ID"

    if (Test-Path $zipPath) { Remove-Item $zipPath -Force -ErrorAction SilentlyContinue }
    if (Test-Path $extractRoot) { Remove-Item $extractRoot -Recurse -Force -ErrorAction SilentlyContinue }

    Write-Info "Downloading repository ZIP..."
    Invoke-WebRequest -Uri $ZIP_URL -OutFile $zipPath -UseBasicParsing -TimeoutSec 300 -ErrorAction Stop

    Write-Info "Extracting ZIP..."
    if (Get-Command Expand-Archive -ErrorAction SilentlyContinue) {
        Expand-Archive -Path $zipPath -DestinationPath $extractRoot -Force
    } else {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $extractRoot)
    }

    $expectedRoot = Join-Path $extractRoot ($REPO_NAME + "-main")
    if (-not (Test-Path $expectedRoot)) {
        throw ("Expected root folder not found in ZIP: {0}-main" -f $REPO_NAME)
    }

    if (Test-Path $DestinationPath) { Remove-Item $DestinationPath -Recurse -Force -ErrorAction SilentlyContinue }
    New-Item -ItemType Directory -Path $DestinationPath -Force | Out-Null
    Copy-Item -Path (Join-Path $expectedRoot "*") -Destination $DestinationPath -Recurse -Force

    Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
    Remove-Item $extractRoot -Recurse -Force -ErrorAction SilentlyContinue

    return $true
}

function Acquire-RepositoryByClone {
    param([string]$DestinationPath)

    for ($attempt = 1; $attempt -le 3; $attempt++) {
        try {
            Write-Info "Clone attempt $attempt/3"
            $cloneOutput = git clone --branch main --single-branch $REPO_URL $DestinationPath 2>&1
            $cloneOutput | ForEach-Object { Write-Host $_ }

            if ($LASTEXITCODE -eq 0 -and (Test-Path (Join-Path $DestinationPath ".git"))) {
                return @{ Success = $true; Error = $null }
            }

            $cloneError = ($cloneOutput | Out-String).Trim()
        } catch {
            $cloneError = $_.Exception.Message
        }

        Write-Warn "Clone failed on attempt $attempt/3"
        if ($cloneError) { Write-Log -Level "WARN" -Message "clone error: $cloneError" }

        if (Test-Path $DestinationPath) {
            Remove-Item $DestinationPath -Recurse -Force -ErrorAction SilentlyContinue
            New-Item -ItemType Directory -Path $DestinationPath -Force | Out-Null
        }

        if ($attempt -lt 3) { Start-Sleep -Seconds $attempt }
    }

    return @{ Success = $false; Error = $cloneError }
}

function Ensure-SetupScriptReady {
    param([string]$SetupScriptPath)

    if (-not (Test-Path $SetupScriptPath)) {
        Stop-Bootstrap -Message "scripts/first-time-setup.ps1 was not found." -Code 1
    }

    $syntaxCheck = Validate-PowerShellScriptSyntax -FilePath $SetupScriptPath
    if ($syntaxCheck.IsValid) {
        Write-Ok "Setup syntax precheck passed"
        return
    }

    Write-Warn "Setup parse errors detected. Trying UTF8 BOM normalization..."
    Convert-FileToUtf8Bom -FilePath $SetupScriptPath

    $syntaxCheck = Validate-PowerShellScriptSyntax -FilePath $SetupScriptPath
    if ($syntaxCheck.IsValid) {
        Write-Ok "Setup recovered after UTF8 BOM normalization"
        return
    }

    foreach ($parseError in $syntaxCheck.Errors) {
        Write-Log -Level "ERROR" -Message "Setup parse error: $($parseError.Message) | Line $($parseError.Token.StartLine) Col $($parseError.Token.StartColumn)"
    }

    Stop-Bootstrap -Message "first-time-setup.ps1 parse failed." -Code 1
}

function Execute-SetupIsolated {
    param([string]$SetupScriptPath, [string]$WorkingDirectory)

    if (Test-Path $SETUP_STDOUT_PATH) { Remove-Item $SETUP_STDOUT_PATH -Force -ErrorAction SilentlyContinue }
    if (Test-Path $SETUP_STDERR_PATH) { Remove-Item $SETUP_STDERR_PATH -Force -ErrorAction SilentlyContinue }

    Write-Info "Running setup in isolated process..."
    Write-Info "STDOUT: $SETUP_STDOUT_PATH"
    Write-Info "STDERR: $SETUP_STDERR_PATH"

    $setupProcess = Start-Process -FilePath "powershell.exe" `
        -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $SetupScriptPath) `
        -WorkingDirectory $WorkingDirectory `
        -RedirectStandardOutput $SETUP_STDOUT_PATH `
        -RedirectStandardError $SETUP_STDERR_PATH `
        -PassThru `
        -Wait

    if ($setupProcess.ExitCode -ne 0) {
        Write-Err ("Setup exit code: {0}" -f $setupProcess.ExitCode)
        if (Test-Path $SETUP_STDERR_PATH) {
            Write-Host "--- Last 40 STDERR lines ---" -ForegroundColor Yellow
            (Get-Content $SETUP_STDERR_PATH -Tail 40 -ErrorAction SilentlyContinue) | ForEach-Object { Write-Host $_ -ForegroundColor Yellow }
        }
        Stop-Bootstrap -Message "Setup execution failed." -Code 1
    }

    Write-Ok "Setup process completed successfully"
}

# ---- MAIN FLOW ----
Write-Log -Level "INFO" -Message "Bootstrap start | RunId=$RUN_ID"

Clear-Host
Write-Host "INDRA OS Bootstrap v4" -ForegroundColor Cyan
Write-Host "----------------------" -ForegroundColor Cyan
Write-Host ""
Write-Host "This installer deploys INDRA OS with robust diagnostics." -ForegroundColor Yellow
Write-Host "Press Enter to continue or Ctrl+C to cancel..." -ForegroundColor Yellow
$null = Read-Host

Write-Host ""
Write-Host "Select install mode:" -ForegroundColor Yellow
Write-Host "  [N] End user (non-dev, recommended)" -ForegroundColor Cyan
Write-Host "  [D] Developer (clone-first)" -ForegroundColor Cyan
$modeInput = (Read-Host "Mode [N/D]").Trim().ToUpper()
if ($modeInput -eq "D") { $ExecutionMode = "dev" }
Write-Info "Selected mode: $ExecutionMode"
Write-Info "Main log: $BOOTSTRAP_LOG_PATH"

Write-Header "Preflight"
try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13
} catch {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
}
Write-Info "TLS configured"

if (-not (Test-TempWritable)) {
    Stop-Bootstrap -Message "Temp folder is not writable." -Code 1
}
Write-Ok "Temp write check OK"

$gitStatus = Test-GitReady
if ($gitStatus.Installed) {
    Write-Ok ("Git detected: {0}" -f $gitStatus.Version)
} else {
    Write-Warn "Git not detected"
}

Write-Header "Prepare temp workspace"
$bootstrapId = [Guid]::NewGuid().ToString().Substring(0, 8)
$installPath = Join-Path $env:TEMP ("indra-scaffolding-" + $bootstrapId)
Write-Info ("Temp path: {0}" -f $installPath)
if (-not (Test-Path $installPath)) {
    New-Item -ItemType Directory -Path $installPath -Force | Out-Null
}

Write-Header "Acquire repository"
$repoReady = $false
$lastCloneError = $null
$lastZipError = $null

if ($ExecutionMode -eq "non-dev") {
    Write-Info "Strategy: ZIP-first"
    try {
        [void](Acquire-RepositoryByZip -DestinationPath $installPath)
        $repoReady = $true
        Write-Ok "Repository acquired via ZIP"
    } catch {
        $lastZipError = $_.Exception.Message
        Write-ExceptionDetails -Context "Acquire ZIP non-dev" -ErrorRecord $_
        if ($gitStatus.Installed) {
            Write-Warn "ZIP failed. Trying clone fallback..."
            $cloneResult = Acquire-RepositoryByClone -DestinationPath $installPath
            if ($cloneResult.Success) {
                $repoReady = $true
                Write-Ok "Repository acquired via clone fallback"
            } else {
                $lastCloneError = $cloneResult.Error
            }
        }
    }
} else {
    Write-Info "Strategy: clone-first"
    $cloneResult = Acquire-RepositoryByClone -DestinationPath $installPath
    if ($cloneResult.Success) {
        $repoReady = $true
        Write-Ok "Repository cloned"
    } else {
        $lastCloneError = $cloneResult.Error
        Write-Warn "Clone failed. Trying ZIP fallback..."
        try {
            [void](Acquire-RepositoryByZip -DestinationPath $installPath)
            $repoReady = $true
            Write-Ok "Repository acquired via ZIP fallback"
        } catch {
            $lastZipError = $_.Exception.Message
            Write-ExceptionDetails -Context "Acquire ZIP fallback dev" -ErrorRecord $_
        }
    }
}

if (-not $repoReady) {
    if ($lastCloneError) { Write-Log -Level "ERROR" -Message ("CloneError: {0}" -f $lastCloneError) }
    if ($lastZipError) { Write-Log -Level "ERROR" -Message ("ZipError: {0}" -f $lastZipError) }
    Stop-Bootstrap -Message "Repository acquisition failed (ZIP and clone)." -Code 1
}

Write-Header "Pre-validate setup"
$setupScriptPath = Join-Path $installPath "scripts\first-time-setup.ps1"
Ensure-SetupScriptReady -SetupScriptPath $setupScriptPath

Write-Header "Execute setup"
try {
    Execute-SetupIsolated -SetupScriptPath $setupScriptPath -WorkingDirectory $installPath
    Write-Ok "INDRA deployment completed"
} catch {
    Write-ExceptionDetails -Context "Execute setup stage" -ErrorRecord $_
    Stop-Bootstrap -Message "Setup stage failed." -Code 1 -ErrorRecord $_
}
finally {
    Write-Header "Cleanup"
    if ($installPath -and (Test-Path $installPath)) {
        if ($keepTempOnFailure -or $abortRequested) {
            Write-Warn ("Temp folder preserved: {0}" -f $installPath)
        } else {
            Remove-Item $installPath -Recurse -Force -ErrorAction SilentlyContinue
            Write-Ok "Temp folder removed"
        }
    }
}

Write-Host ""
Write-Ok "Bootstrap finished"
Show-LogHints
Read-Host "Press Enter to finish and return to console"
