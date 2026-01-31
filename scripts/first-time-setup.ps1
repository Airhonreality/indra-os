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

# Verificar si ya está autenticado PRIMERO
$alreadyAuthenticated = $false
$clasprcPath = Join-Path $env:USERPROFILE ".clasprc.json"

Write-Info "Verificando estado de autenticación..."

# Verificar si existe archivo de credenciales
if (Test-Path $clasprcPath) {
    Write-Info "Archivo .clasprc.json encontrado"
    
    try {
        $clasprc = Get-Content $clasprcPath -Raw -ErrorAction Stop | ConvertFrom-Json -ErrorAction Stop
        
        # Clasp guarda tokens en diferentes formatos dependiendo de la versión
        # Formato nuevo: tokens.default.access_token
        # Formato viejo: token.access_token
        $hasValidToken = $false
        
        if ($clasprc.tokens -and $clasprc.tokens.default -and $clasprc.tokens.default.access_token) {
            $hasValidToken = $true
            Write-Host "   Debug: Formato nuevo de tokens detectado" -ForegroundColor DarkGray
        }
        elseif ($clasprc.token -and $clasprc.token.access_token) {
            $hasValidToken = $true
            Write-Host "   Debug: Formato viejo de tokens detectado" -ForegroundColor DarkGray
        }
        
        if ($hasValidToken) {
            $alreadyAuthenticated = $true
            Write-Success "Ya estás autenticado con Google"
            
            Write-Host ""
            Write-Host "==============================================================================" -ForegroundColor Yellow
            Write-Host "Opciones:" -ForegroundColor Yellow
            Write-Host "  [C] Continuar con la cuenta actual" -ForegroundColor Cyan
            Write-Host "  [R] Re-autenticar con OTRA cuenta" -ForegroundColor Cyan
            Write-Host "  [S] Salir" -ForegroundColor Cyan
            Write-Host "==============================================================================" -ForegroundColor Yellow
            Write-Host ""
            
            $response = Read-Host "Selecciona (C/R/S)"
            
            if ($response -match '^[Rr]$') {
                Write-Info "Cerrando sesión actual..."
                clasp logout 2>&1 | Out-Null
                
                # Verificar que se eliminó el archivo
                if (Test-Path $clasprcPath) {
                    Remove-Item $clasprcPath -Force -ErrorAction SilentlyContinue
                }
                
                Start-Sleep -Seconds 1
                $alreadyAuthenticated = $false
                Write-Success "Sesión cerrada - listo para nueva autenticación"
            }
            elseif ($response -match '^[Ss]$') {
                Write-Host "Setup cancelado por el usuario" -ForegroundColor Yellow
                exit 0
            }
            else {
                Write-Success "Usando cuenta actual"
            }
        }
        else {
            Write-Warning-Custom "Archivo de credenciales existe pero no tiene tokens válidos"
            Write-Info "Procediendo a autenticación..."
            $alreadyAuthenticated = $false
        }
    }
    catch {
        Write-Warning-Custom "Error al leer credenciales: $_"
        Write-Info "Archivo puede estar corrupto"
        
        $response = Read-Host "¿Eliminar credenciales corruptas y re-autenticar? (Y/n)"
        if ($response -notmatch '^[Nn]$') {
            clasp logout 2>&1 | Out-Null
            if (Test-Path $clasprcPath) {
                Remove-Item $clasprcPath -Force -ErrorAction SilentlyContinue
                Write-Success "Credenciales eliminadas"
            }
            $alreadyAuthenticated = $false
        }
        else {
            Write-Error-Custom "No se puede continuar sin credenciales válidas"
            exit 1
        }
    }
}
else {
    Write-Info "No hay autenticación previa - primera vez"
    $alreadyAuthenticated = $false
}

# Si no está autenticado, pedir confirmación antes de abrir browser
if (-not $alreadyAuthenticated) {
    Write-Host ""
    Write-Host "Se abrirá tu browser para autenticarte con Google." -ForegroundColor Yellow
    Write-Host "Usa la cuenta donde quieres crear tu proyecto INDRA." -ForegroundColor Yellow
    Write-Host ""
    Write-Warning-Custom "IMPORTANTE: Debes permitir acceso a Google Drive y Apps Script"
    Write-Host ""
    Write-Host "Presiona Enter para continuar..." -ForegroundColor Yellow
    $null = Read-Host
    
    Write-Host ""
    Write-Info "Abriendo browser para autenticación con Google..."
    Write-Host ""
    Write-Warning-Custom "Si el browser no se abre automáticamente, busca el link en el output"
    Write-Host ""
    
    # Ejecutar clasp login directamente (PowerShell lo ejecuta como script npm)
    Write-Info "Ejecutando autenticación..."
    try {
        # Usar & para ejecutar como comando
        & clasp login
        
        Write-Host ""
        Write-Info "Verificando autenticación..."
        
        # Dar tiempo para que se complete el proceso
        Start-Sleep -Seconds 2
        
        # Verificar si fue exitoso comprobando si se creó/actualizó el archivo
        if (Test-Path $clasprcPath) {
            $clasprcModified = (Get-Item $clasprcPath).LastWriteTime
            $timeDiff = (Get-Date) - $clasprcModified
            
            if ($timeDiff.TotalSeconds -lt 120) {
                Write-Success "Autenticación exitosa"
                
                # Mostrar info de la cuenta si está disponible
                try {
                    $clasprc = Get-Content $clasprcPath -Raw | ConvertFrom-Json
                    if ($clasprc.token.refresh_token) {
                        Write-Info "Token de autenticación guardado correctamente"
                    }
                }
                catch {
                    # No importa si falla, lo importante es que el archivo existe
                }
            }
            else {
                Write-Warning-Custom "Las credenciales parecen antiguas"
                Write-Info "Si el browser se abrió y autenticaste, deberías estar listo"
                
                $response = Read-Host "¿Continuar de todas formas? (Y/n)"
                if ($response -match '^[Nn]$') {
                    exit 1
                }
            }
        }
        else {
            Write-Error-Custom "No se generaron credenciales"
            Write-Host ""
            Write-Host "Posibles causas:" -ForegroundColor Yellow
            Write-Host "  1. No completaste la autenticación en el browser" -ForegroundColor Cyan
            Write-Host "  2. El browser no se abrió automáticamente" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Intenta manualmente:" -ForegroundColor Yellow
            Write-Host "  clasp logout" -ForegroundColor Cyan
            Write-Host "  clasp login" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Y luego ejecuta de nuevo este script" -ForegroundColor Yellow
            exit 1
        }
    }
    catch {
        Write-Error-Custom "Error al ejecutar clasp login: $_"
        Write-Host ""
        Write-Host "Intenta manualmente:" -ForegroundColor Yellow
        Write-Host "  clasp login" -ForegroundColor Cyan
        exit 1
    }
}

# ============================================
# PASO 3: Crear Proyecto GAS
# ============================================

Write-Header "📂 Paso 3: Configurar Proyecto en Google Apps Script"

# Cambiar al directorio del backend
$backendPath = Join-Path $PSScriptRoot "..\OrbitalCore_Codex_v1"
Push-Location $backendPath

# Verificar si ya existe un proyecto
$claspJsonPath = ".clasp.json"
$scriptId = $null
$projectName = "INDRA-Core"

if (Test-Path $claspJsonPath) {
    Write-Info "Proyecto GAS existente detectado"
    
    try {
        $claspJson = Get-Content $claspJsonPath -Raw | ConvertFrom-Json
        $scriptId = $claspJson.scriptId
        $rootDir = $claspJson.rootDir
        
        Write-Success "Proyecto encontrado:"
        Write-Host "   Script ID: $scriptId" -ForegroundColor Cyan
        Write-Host "   Root Dir:  $rootDir" -ForegroundColor Cyan
        Write-Host "   URL:       https://script.google.com/home/projects/$scriptId/edit" -ForegroundColor Cyan
        
        Write-Host ""
        Write-Host "==============================================================================" -ForegroundColor Yellow
        Write-Host "Opciones:" -ForegroundColor Yellow
        Write-Host "  [U] Usar proyecto existente (recomendado para reinstalación)" -ForegroundColor Green
        Write-Host "  [N] Crear NUEVO proyecto (sobrescribirá el actual)" -ForegroundColor Yellow
        Write-Host "  [S] Salir" -ForegroundColor Cyan
        Write-Host "==============================================================================" -ForegroundColor Yellow
        Write-Host ""
        
        $response = Read-Host "Selecciona (U/N/S)"
        
        if ($response -match '^[Nn]$') {
            Write-Warning-Custom "Creando nuevo proyecto - esto sobrescribirá la configuración actual"
            
            Write-Host "Elige un nombre para el nuevo proyecto INDRA." -ForegroundColor Yellow
            $newProjectName = Read-Host "Nombre del proyecto (Enter para usar 'INDRA-Core')"
            if (-not [string]::IsNullOrWhiteSpace($newProjectName)) {
                $projectName = $newProjectName
            }
            
            Remove-Item $claspJsonPath -Force
            
            try {
                Write-Info "Creando proyecto '$projectName'..."
                clasp create --type standalone --title $projectName --rootDir .
                $claspJson = Get-Content $claspJsonPath | ConvertFrom-Json
                $scriptId = $claspJson.scriptId
                Write-Success "Nuevo proyecto creado: $projectName"
            }
            catch {
                Write-Error-Custom "Error al crear proyecto: $_"
                Pop-Location
                exit 1
            }
        }
        elseif ($response -match '^[Ss]$') {
            Write-Host "Setup cancelado por el usuario" -ForegroundColor Yellow
            Pop-Location
            exit 0
        }
        else {
            Write-Success "Usando proyecto existente"
            # Script ID ya está cargado arriba
        }
    }
    catch {
        Write-Warning-Custom "Error al leer .clasp.json: $_"
        Write-Info "El archivo puede estar corrupto"
        
        $response = Read-Host "¿Eliminar y crear proyecto nuevo? (Y/n)"
        if ($response -notmatch '^[Nn]$') {
            Remove-Item $claspJsonPath -Force -ErrorAction SilentlyContinue
            
            Write-Host "Elige un nombre para tu proyecto INDRA." -ForegroundColor Yellow
            $newProjectName = Read-Host "Nombre del proyecto (Enter para usar 'INDRA-Core')"
            if (-not [string]::IsNullOrWhiteSpace($newProjectName)) {
                $projectName = $newProjectName
            }
            
            try {
                Write-Info "Creando proyecto '$projectName'..."
                clasp create --type standalone --title $projectName --rootDir .
                $claspJson = Get-Content $claspJsonPath | ConvertFrom-Json
                $scriptId = $claspJson.scriptId
            }
            catch {
                Write-Error-Custom "Error al crear proyecto: $_"
                Pop-Location
                exit 1
            }
        }
        else {
            Write-Error-Custom "No se puede continuar sin proyecto GAS válido"
            Pop-Location
            exit 1
        }
    }
}
else {
    Write-Info "No hay proyecto GAS - primera instalación"
    
    Write-Host "Elige un nombre para tu proyecto INDRA." -ForegroundColor Yellow
    $newProjectName = Read-Host "Nombre del proyecto (Enter para usar 'INDRA-Core')"
    if (-not [string]::IsNullOrWhiteSpace($newProjectName)) {
        $projectName = $newProjectName
    }
    
    try {
        Write-Info "Creando proyecto '$projectName'..."
        clasp create --type standalone --title $projectName --rootDir .
        $claspJson = Get-Content $claspJsonPath | ConvertFrom-Json
        $scriptId = $claspJson.scriptId
        Write-Success "Proyecto creado: $projectName"
    }
    catch {
        Write-Error-Custom "Error al crear proyecto: $_"
        Pop-Location
        exit 1
    }
}

if ([string]::IsNullOrWhiteSpace($scriptId)) {
    Write-Error-Custom "Error: No se pudo obtener Script ID"
    Pop-Location
    exit 1
}

Write-Host ""
Write-Success "Proyecto GAS configurado correctamente"
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

Write-Header "⚙️  Paso 5: Configurar Web App"

# Verificar si ya existe URL guardada
$gasUrlFile = ".gas-url.txt"
$webAppUrl = $null

if (Test-Path $gasUrlFile) {
    $existingUrl = Get-Content $gasUrlFile -Raw -ErrorAction SilentlyContinue
    if (-not [string]::IsNullOrWhiteSpace($existingUrl)) {
        $existingUrl = $existingUrl.Trim()
        Write-Info "Web App URL existente encontrada"
        Write-Host "   URL: $existingUrl" -ForegroundColor Cyan
        
        Write-Host ""
        Write-Host "==============================================================================" -ForegroundColor Yellow
        Write-Host "Opciones:" -ForegroundColor Yellow
        Write-Host "  [U] Usar URL existente (recomendado para reinstalación)" -ForegroundColor Green
        Write-Host "  [N] Configurar NUEVA Web App" -ForegroundColor Yellow
        Write-Host "==============================================================================" -ForegroundColor Yellow
        Write-Host ""
        
        $response = Read-Host "Selecciona (U/N)"
        
        if ($response -notmatch '^[Nn]$') {
            $webAppUrl = $existingUrl
            Write-Success "Usando Web App URL existente"
        }
    }
}

if ([string]::IsNullOrWhiteSpace($webAppUrl)) {
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
        Write-Host "Y selecciona 'usar proyecto/URL existente' cuando te pregunte" -ForegroundColor Yellow
        exit 0
    }

    # Pedir la Web App URL
    Write-Host ""
    Write-Info "Pega aquí la Web App URL (Ctrl+V y Enter):"
    $webAppUrl = Read-Host "URL"
}

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

# Extraer Deployment ID de la URL
$deploymentId = $null
if ($webAppUrl -match '/s/([^/]+)/exec') {
    $deploymentId = $Matches[1]
    Write-Info "Deployment ID extraído: $deploymentId"
}

# Guardar configuración en carpeta del backend
Push-Location $backendPath

$webAppUrl | Out-File ".gas-url.txt" -Encoding UTF8
$scriptId | Out-File ".gas-script-id.txt" -Encoding UTF8

if ($deploymentId) {
    $deploymentId | Out-File ".deployment-id" -Encoding UTF8
    Write-Success "Deployment ID guardado para actualizaciones automáticas"
}

Pop-Location

Write-Success "Configuración del backend guardada"

# Obtener la Satellite API Key generada automáticamente
Write-Host ""
Write-Info "Obteniendo Satellite API Key del Core..."

try {
    $apiKeyCommand = "function getSatelliteKey() { var configurator = createConfigurator({ manifest: SYSTEM_MANIFEST, errorHandler: createErrorHandler() }); return configurator.retrieveParameter({ key: 'ORBITAL_CORE_SATELLITE_API_KEY' }); }"
    
    # Ejecutar función en el Core para obtener la API Key
    $satelliteApiKey = clasp run getSatelliteKey 2>&1
    
    # Filtrar la salida de clasp para obtener solo el valor
    if ($satelliteApiKey -match '([a-f0-9\-]{36})') {
        $satelliteApiKey = $Matches[1]
        Write-Success "Satellite API Key obtenida: $($satelliteApiKey.Substring(0,8))..."
        
        # Guardar API Key localmente
        $satelliteApiKey | Out-File ".satellite-api-key.txt" -Encoding UTF8
    }
    else {
        Write-Warning-Custom "No se pudo obtener la API Key automáticamente"
        Write-Info "La obtendrás del menú de Google Sheets en el siguiente paso"
        $satelliteApiKey = $null
    }
}
catch {
    Write-Warning-Custom "Error al obtener API Key: $_"
    Write-Info "La obtendrás del menú de Google Sheets en el siguiente paso"
    $satelliteApiKey = $null
}

Pop-Location

Write-Host ""
Write-Info "A partir de ahora, las actualizaciones serán 100% automáticas"
Write-Host "   Ejecuta: .\scripts\update.ps1" -ForegroundColor Cyan

# ============================================
# PASO 6: Configurar Frontend
# ============================================

Write-Header "🎨 Paso 6: Configurar Frontend"

$frontendPath = Join-Path $PSScriptRoot "..\INDRA_FRONT DEV"
Push-Location $frontendPath

# Verificar si existe .env
$envPath = ".env"
if (Test-Path $envPath) {
    Write-Info "Archivo .env existente detectado - actualizando configuración..."
    
    # Si no se obtuvo la API Key automáticamente, solicitarla
    if ([string]::IsNullOrWhiteSpace($satelliteApiKey)) {
        Write-Host ""
        Write-Host "==============================================================================" -ForegroundColor Yellow
        Write-Info "Necesitas obtener la Satellite API Key del backend:"
        Write-Host ""
        Write-Info "1. Ve al Google Sheet que se abrió en tu browser"
        Write-Info "2. En el menú, click: 🚀 Orbital Core → 🔑 Gestionar Conexiones"
        Write-Info "3. Busca 'ORBITAL_CORE_SATELLITE_API_KEY'"
        Write-Info "4. COPIA el valor completo (formato UUID)"
        Write-Host ""
        Write-Host "==============================================================================" -ForegroundColor Yellow
        Write-Host ""
        
        $satelliteApiKey = Read-Host "Pega aquí la Satellite API Key"
        
        if ([string]::IsNullOrWhiteSpace($satelliteApiKey)) {
            Write-Error-Custom "API Key vacía. No se puede continuar."
            Pop-Location
            exit 1
        }
    }
    
    $envContent = Get-Content $envPath -Raw
    $envContent = $envContent -replace "VITE_GAS_URL=.*", "VITE_GAS_URL=$webAppUrl"
    
    # Actualizar o agregar SATELLITE_API_KEY
    if ($envContent -match "VITE_SATELLITE_API_KEY=") {
        $envContent = $envContent -replace "VITE_SATELLITE_API_KEY=.*", "VITE_SATELLITE_API_KEY=$satelliteApiKey"
    }
    else {
        # Agregar después de VITE_GAS_URL
        $envContent = $envContent -replace "(VITE_GAS_URL=.*)", "`$1`n`n# Satellite API Key (autenticación con el Core)`nVITE_SATELLITE_API_KEY=$satelliteApiKey"
    }
    
    $envContent | Out-File $envPath -Encoding UTF8
    Write-Success "Archivo .env actualizado (URL + API Key)"
}
else {

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
}

# ============================================
# PASO 7: Instalar Dependencias y Build
# ============================================

Write-Header "📦 Paso 7: Instalar Dependencias del Frontend"

# Verificar si ya existen dependencias instaladas
if (Test-Path "node_modules") {
    Write-Success "Dependencias ya instaladas - usando node_modules/ existente"
}
else {
    Write-Info "Instalando dependencias (esto puede tardar 2-3 minutos)..."
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
}

Write-Header "🔨 Paso 8: Generar Build de Producción"

# Verificar si ya existe build válido
if (Test-Path "dist") {
    try {
        $distSize = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
        Write-Success "Build existente detectado ($([math]::Round($distSize, 2)) MB) - usando dist/ existente"
    }
    catch {
        Write-Info "Build detectado pero sin contenido - regenerando..."
    }
}
else {
    Write-Info "Compilando frontend..."
    Write-Host ""
    
    try {
        npm run build
        Write-Success "Build generado en ./dist/"
        
        $distSize = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
        Write-Info "Tamaño del build: $([math]::Round($distSize, 2)) MB"
    }
    catch {
        Write-Error-Custom "Error al generar build"
        Pop-Location
        exit 1
    }
}

# ============================================
# PASO 9: Crear Repositorio GitHub y Deploy Automático
# ============================================

Write-Header "🚀 Paso 9: Publicar en GitHub Pages"

Write-Host ""
Write-Host "Tu INDRA está configurado localmente." -ForegroundColor Green
Write-Host "Ahora lo publicaremos en GitHub para que sea accesible online." -ForegroundColor Yellow
Write-Host ""

# Verificar/instalar GitHub CLI
$ghInstalled = $false
try {
    $ghVersion = gh --version 2>$null
    if ($ghVersion) {
        Write-Success "GitHub CLI detectado: $ghVersion"
        $ghInstalled = $true
    }
}
catch {
    # No hacer nada, se instala abajo
}

if (-not $ghInstalled) {
    Write-Info "GitHub CLI no detectado - instalando automáticamente..."
    
    try {
        # Descargar instalador de GitHub CLI
        $ghInstallerUrl = "https://github.com/cli/cli/releases/latest/download/gh_windows_amd64.msi"
        $ghInstallerPath = "$env:TEMP\gh_installer.msi"
        
        Write-Info "Descargando GitHub CLI..."
        Invoke-WebRequest -Uri $ghInstallerUrl -OutFile $ghInstallerPath -UseBasicParsing
        
        Write-Info "Instalando GitHub CLI (esto puede tardar 1 minuto)..."
        $installProcess = Start-Process msiexec.exe -ArgumentList "/i `"$ghInstallerPath`" /qn /norestart" -Wait -PassThru
        
        if ($installProcess.ExitCode -eq 0) {
            Write-Success "GitHub CLI instalado"
            
            # Limpiar instalador
            Remove-Item $ghInstallerPath -Force -ErrorAction SilentlyContinue
            
            # Refrescar PATH
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
            
            # Verificar instalación
            Start-Sleep -Seconds 2
            $ghVersion = gh --version 2>$null
            if ($ghVersion) {
                $ghInstalled = $true
                Write-Success "GitHub CLI listo para usar"
            }
        }
        else {
            throw "La instalación falló con código: $($installProcess.ExitCode)"
        }
    }
    catch {
        Write-Warning-Custom "No se pudo instalar GitHub CLI automáticamente"
        Write-Info "Error: $_"
    }
}

# Autenticación con GitHub
if ($ghInstalled) {
    Write-Host ""
    Write-Host "==============================================================================" -ForegroundColor Cyan
    Write-Host "Autenticación con GitHub" -ForegroundColor Cyan
    Write-Host "==============================================================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Verificar si ya está autenticado
    $ghAuthStatus = gh auth status 2>&1
    $alreadyAuthenticated = $ghAuthStatus -match "Logged in to github.com"
    
    if ($alreadyAuthenticated) {
        Write-Success "Ya estás autenticado con GitHub"
        
        # Mostrar cuenta actual
        $ghUser = gh api user --jq .login 2>$null
        if ($ghUser) {
            Write-Host "   Usuario: $ghUser" -ForegroundColor Cyan
        }
        
        Write-Host ""
        $response = Read-Host "¿Continuar con esta cuenta? (Y/n)"
        
        if ($response -match '^[Nn]$') {
            Write-Info "Cerrando sesión actual..."
            gh auth logout --hostname github.com 2>&1 | Out-Null
            $alreadyAuthenticated = $false
        }
    }
    
    if (-not $alreadyAuthenticated) {
        Write-Host ""
        Write-Host "Se abrirá tu browser para autenticarte con GitHub." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Presiona Enter para continuar..." -ForegroundColor Yellow
        $null = Read-Host
        
        Write-Info "Abriendo browser para autenticación..."
        gh auth login --web --hostname github.com
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error-Custom "Error en autenticación con GitHub"
            $ghInstalled = $false
        }
        else {
            Write-Success "Autenticación exitosa con GitHub"
        }
    }
}

# Crear repositorio en GitHub
if ($ghInstalled) {
    Write-Host ""
    Write-Host "==============================================================================" -ForegroundColor Cyan
    Write-Host "Crear Repositorio en GitHub" -ForegroundColor Cyan
    Write-Host "==============================================================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Obtener nombre del directorio actual como sugerencia
    $currentDirName = Split-Path -Leaf (Get-Location)
    $defaultRepoName = "indra-os"
    
    Write-Host "Nombre para tu repositorio:" -ForegroundColor Yellow
    Write-Host "(Esto será parte de tu URL: usuario.github.io/NOMBRE)" -ForegroundColor Gray
    $repoName = Read-Host "Nombre (Enter para usar '$defaultRepoName')"
    
    if ([string]::IsNullOrWhiteSpace($repoName)) {
        $repoName = $defaultRepoName
    }
    
    # Descripción
    $repoDescription = "Mi instancia personal de INDRA OS - Solar Punk Edition"
    
    Write-Host ""
    Write-Info "Creando repositorio '$repoName' en GitHub..."
    
    try {
        # Inicializar git local si no existe
        if (-not (Test-Path ".git")) {
            Write-Info "Inicializando Git..."
            git init 2>&1 | Out-Null
            git branch -M main 2>&1 | Out-Null
        }
        
        # Agregar archivos
        Write-Info "Preparando archivos..."
        git add . 2>&1 | Out-Null
        git commit -m "Initial INDRA OS setup - Backend y Frontend configurados" 2>&1 | Out-Null
        
        # Crear repo en GitHub y hacer push
        Write-Info "Creando repositorio en GitHub y subiendo código..."
        gh repo create $repoName --public --source=. --remote=origin --description="$repoDescription" --push
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Repositorio creado y código subido"
            
            # Obtener usuario para construir URL
            $ghUser = gh api user --jq .login 2>$null
            $repoUrl = "https://github.com/$ghUser/$repoName"
            
            Write-Host ""
            Write-Host "   Repositorio: $repoUrl" -ForegroundColor Cyan
            
            # Guardar info del repo
            $repoUrl | Out-File ".github-repo-url.txt" -Encoding UTF8
            
            # Activar GitHub Pages automáticamente
            Write-Host ""
            Write-Info "Activando GitHub Pages..."
            
            # Esperar a que GitHub procese el push
            Start-Sleep -Seconds 3
            
            # Disparar workflow de deploy
            Write-Info "Iniciando deploy automático del frontend..."
            gh workflow run deploy-ui.yml 2>&1 | Out-Null
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Deploy iniciado automáticamente"
                
                $ghPagesUrl = "https://$ghUser.github.io/$repoName"
                
                Write-Host ""
                Write-Host "==============================================================================" -ForegroundColor Green
                Write-Host "                         ✅ ¡INDRA OS PUBLICADO!" -ForegroundColor Green
                Write-Host "==============================================================================" -ForegroundColor Green
                Write-Host ""
                Write-Host "Tu instancia estará disponible en ~1 minuto en:" -ForegroundColor Yellow
                Write-Host ""
                Write-Host "   $ghPagesUrl" -ForegroundColor Cyan -BackgroundColor DarkBlue
                Write-Host ""
                Write-Host "Puedes ver el progreso del deploy en:" -ForegroundColor Gray
                Write-Host "   $repoUrl/actions" -ForegroundColor Cyan
                Write-Host ""
            }
            else {
                Write-Warning-Custom "No se pudo disparar workflow automáticamente"
                Write-Info "Puedes iniciarlo manualmente en: $repoUrl/actions"
            }
        }
        else {
            throw "Error al crear repositorio (exit code: $LASTEXITCODE)"
        }
    }
    catch {
        Write-Error-Custom "Error al crear repositorio: $_"
        $ghInstalled = $false
    }
}

# Fallback manual si gh CLI no funciona
if (-not $ghInstalled) {
    Write-Host ""
    Write-Host "==============================================================================" -ForegroundColor Yellow
    Write-Host "                    DEPLOY MANUAL (GITHUB PAGES)" -ForegroundColor Green
    Write-Host "==============================================================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para deploy automático, instala GitHub CLI:" -ForegroundColor White
    Write-Host "   https://cli.github.com/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "O despliega manualmente:" -ForegroundColor White
    Write-Host ""
    Write-Host "1. Sube tu código a GitHub:" -ForegroundColor Yellow
    Write-Host "   git init" -ForegroundColor Cyan
    Write-Host "   git add ." -ForegroundColor Cyan
    Write-Host "   git commit -m 'Initial INDRA setup'" -ForegroundColor Cyan
    Write-Host "   git branch -M main" -ForegroundColor Cyan
    Write-Host "   git remote add origin https://github.com/TU-USER/TU-REPO.git" -ForegroundColor Cyan
    Write-Host "   git push -u origin main" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Ve a GitHub → Settings → Pages" -ForegroundColor Yellow
    Write-Host "   - Source: Deploy from a branch" -ForegroundColor White
    Write-Host "   - Branch: gh-pages" -ForegroundColor White
    Write-Host ""
    Write-Host "3. O ejecuta el workflow manualmente:" -ForegroundColor Yellow
    Write-Host "   GitHub → Actions → Deploy UI → Run workflow" -ForegroundColor White
    Write-Host ""
}

Write-Host "==============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "              ¡Que la soberanía digital esté contigo! ⚡[SUN]" -ForegroundColor Cyan
Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host ""
