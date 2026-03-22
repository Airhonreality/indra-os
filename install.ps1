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
    $script = (New-Object System.Net.WebClient).DownloadString($BootstrapUrl)
    iex $script
} catch {
    Write-Host 'No se pudo descargar/ejecutar scripts/bootstrap.ps1.' -ForegroundColor Red
    Write-Host "Detalle: $($_.Exception.Message)" -ForegroundColor Yellow
    throw
}
