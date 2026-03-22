# ============================================
# INDRA OS - Root Installer Entry Point
# ============================================
# Uso:
#   iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/Airhonreality/indra-os/main/install.ps1'))
#
# Este archivo existe para mantener una URL estable de instalación.
# Redirige y ejecuta el bootstrap oficial en scripts/bootstrap.ps1.
# ============================================

$ErrorActionPreference = 'Stop'

$BootstrapUrl = 'https://raw.githubusercontent.com/Airhonreality/indra-os/main/scripts/bootstrap.ps1'

try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
} catch {
    # Ignorar si no aplica en la versión de PowerShell
}

try {
    Write-Host 'INDRA installer: cargando bootstrap...' -ForegroundColor Cyan
    
    # Usar Invoke-RestMethod si disponible (más seguro que DownloadString + iex)
    $psVersion = $PSVersionTable.PSVersion.Major
    if ($psVersion -ge 3) {
        # PowerShell 3+: usar Invoke-RestMethod
        iex (Invoke-RestMethod -Uri $BootstrapUrl)
    } else {
        # Fallback para PS2: descargar a archivo temporal y ejecutar
        $tempFile = [System.IO.Path]::GetTempFileName() -replace '\.tmp$', '.ps1'
        try {
            $webClient = New-Object System.Net.WebClient
            $webClient.DownloadFile($BootstrapUrl, $tempFile)
            & $tempFile
        } finally {
            Remove-Item $tempFile -ErrorAction SilentlyContinue
        }
    }
} catch {
    Write-Host 'No se pudo descargar/ejecutar scripts/bootstrap.ps1.' -ForegroundColor Red
    Write-Host "Detalle: $($_.Exception.Message)" -ForegroundColor Yellow
    throw
}
