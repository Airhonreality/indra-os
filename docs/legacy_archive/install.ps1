# ============================================
# INDRA OS - Remote Bootstrap Entrypoint v4
# ============================================
# Axioma A1: TLS 1.2+ requerido
# Axioma A6: Sin UI, logging a disk

$ErrorActionPreference = 'Stop'

[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

$bootstrapUrl = 'https://raw.githubusercontent.com/Airhonreality/indra-os/main/scripts/bootstrap.ps1'
$bootstrapPath = Join-Path $env:TEMP 'indra-bootstrap.ps1'

try {
    Write-Host 'INDRA: descargando bootstrap...' -ForegroundColor Cyan
    Invoke-WebRequest -Uri $bootstrapUrl -OutFile $bootstrapPath -UseBasicParsing
    Unblock-File -Path $bootstrapPath -ErrorAction SilentlyContinue
    
    & $bootstrapPath
}
catch {
    Write-Host "[ERROR] No se pudo cargar bootstrap: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    Remove-Item $bootstrapPath -Force -ErrorAction SilentlyContinue
}
