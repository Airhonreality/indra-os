#!/bin/bash
# ============================================
# INDRA OS - First Time Setup Script
# ============================================
# Este script configura tu instancia personal de INDRA OS
# Duración estimada: 10 minutos
# Requiere: Node.js 16+, Git
# ============================================

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de utilidad
print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Banner inicial
clear
echo -e "${BLUE}"
cat << "EOF"
   ___ _   _ ____  ____      _      ___  ____  
  |_ _| \ | |  _ \|  _ \    / \    / _ \/ ___| 
   | ||  \| | | | | |_) |  / _ \  | | | \___ \ 
   | || |\  | |_| |  _ <  / ___ \ | |_| |___) |
  |___|_| \_|____/|_| \_\/_/   \_(_)___/|____/ 
                                                
  🌞 Solar Punk Edition - First Time Setup
EOF
echo -e "${NC}"

echo "Este script configurará tu instancia personal de INDRA OS."
echo "Duración estimada: 10 minutos"
echo ""
read -p "Presiona Enter para continuar o Ctrl+C para cancelar..."

# ============================================
# PASO 0: Verificar Prerequisites
# ============================================

print_header "📋 Verificando Prerequisites"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado"
    echo "   Instálalo desde: https://nodejs.org/"
    exit 1
fi
print_success "Node.js detectado: $(node --version)"

# Verificar npm
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado"
    exit 1
fi
print_success "npm detectado: $(npm --version)"

# Verificar Git
if ! command -v git &> /dev/null; then
    print_error "Git no está instalado"
    echo "   Instálalo desde: https://git-scm.com/"
    exit 1
fi
print_success "Git detectado: $(git --version)"

# ============================================
# PASO 1: Instalar/Verificar Clasp
# ============================================

print_header "📦 Paso 1: Configurar Google Clasp"

if ! command -v clasp &> /dev/null; then
    print_info "Instalando @google/clasp globalmente..."
    npm install -g @google/clasp
    print_success "Clasp instalado exitosamente"
else
    print_success "Clasp ya está instalado: $(clasp --version 2>&1 | head -n 1)"
fi

# ============================================
# PASO 2: Autenticación con Google
# ============================================

print_header "🔐 Paso 2: Autenticación con Google"

echo "Se abrirá tu browser para autenticarte con Google."
echo "Usa la cuenta donde quieres crear tu proyecto INDRA."
echo ""
print_warning "IMPORTANTE: Debes permitir acceso a Google Drive y Apps Script"
echo ""
read -p "Presiona Enter para continuar..."

if clasp login --status &> /dev/null; then
    print_info "Ya estás autenticado con Clasp"
    read -p "¿Quieres re-autenticarte con otra cuenta? (y/N): " REAUTH
    if [[ $REAUTH =~ ^[Yy]$ ]]; then
        clasp logout
        clasp login
    fi
else
    clasp login
fi

if [ $? -ne 0 ]; then
    print_error "Error en autenticación"
    exit 1
fi

print_success "Autenticación exitosa"

# ============================================
# PASO 3: Crear Proyecto GAS
# ============================================

print_header "📂 Paso 3: Crear Proyecto en Google Apps Script"

# Pedir nombre del proyecto
echo "Elige un nombre para tu proyecto INDRA."
read -p "Nombre del proyecto (default: INDRA-Core): " PROJECT_NAME
PROJECT_NAME=${PROJECT_NAME:-INDRA-Core}

print_info "Creando proyecto '$PROJECT_NAME' en Google Apps Script..."

# Ir a la carpeta del backend
cd "OrbitalCore_Codex_v1"

# Verificar si ya existe un proyecto
if [ -f ".clasp.json" ]; then
    print_warning "Ya existe un proyecto GAS vinculado"
    read -p "¿Quieres crear un nuevo proyecto? Esto sobrescribirá el existente (y/N): " RECREATE
    if [[ ! $RECREATE =~ ^[Yy]$ ]]; then
        print_info "Usando proyecto existente"
        SCRIPT_ID=$(grep -o '"scriptId":"[^"]*' .clasp.json | cut -d'"' -f4)
    else
        rm .clasp.json
        clasp create --type standalone --title "$PROJECT_NAME" --rootDir .
        SCRIPT_ID=$(grep -o '"scriptId":"[^"]*' .clasp.json | cut -d'"' -f4)
    fi
else
    clasp create --type standalone --title "$PROJECT_NAME" --rootDir .
    SCRIPT_ID=$(grep -o '"scriptId":"[^"]*' .clasp.json | cut -d'"' -f4)
fi

if [ -z "$SCRIPT_ID" ]; then
    print_error "Error al obtener Script ID"
    exit 1
fi

print_success "Proyecto creado: $PROJECT_NAME"
print_info "Script ID: $SCRIPT_ID"

# ============================================
# PASO 4: Subir Código al Proyecto
# ============================================

print_header "📤 Paso 4: Subiendo Código a Google Apps Script"

print_info "Esto puede tardar 30-60 segundos..."

clasp push --force

if [ $? -ne 0 ]; then
    print_error "Error al subir código"
    exit 1
fi

print_success "Código subido exitosamente"

# ============================================
# PASO 5: Configuración Manual del Web App
# ============================================

SCRIPT_URL="https://script.google.com/home/projects/$SCRIPT_ID/edit"

print_header "⚙️  Paso 5: Configurar Web App (MANUAL - 2 minutos)"

echo ""
print_warning "ACCIÓN MANUAL REQUERIDA (debido a limitaciones de Google Apps Script)"
echo ""
echo "Google no permite configurar Web Apps automáticamente por seguridad."
echo "Debes hacerlo manualmente UNA SOLA VEZ. Es muy simple:"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
print_info "1. Abre este link en tu browser:"
echo -e "   ${GREEN}$SCRIPT_URL${NC}"
echo ""
print_info "2. En el editor de Google Apps Script:"
echo "   ├─ Click en botón 'Deploy' (arriba derecha)"
echo "   ├─ Click en 'New deployment'"
echo "   ├─ Click en el ícono de engranaje ⚙️  junto a 'Select type'"
echo "   ├─ Selecciona 'Web app'"
echo "   └─ Configuración:"
echo "       ├─ Description: 'INDRA Production'"
echo "       ├─ Execute as: 'Me'"
echo "       └─ Who has access: 'Anyone'"
echo ""
print_info "3. Click 'Deploy'"
echo ""
print_info "4. Si te pide autorización:"
echo "   ├─ Click 'Authorize access'"
echo "   ├─ Selecciona tu cuenta Google"
echo "   ├─ Click 'Advanced' → 'Go to $PROJECT_NAME (unsafe)'"
echo "   └─ Click 'Allow'"
echo ""
print_info "5. COPIA la 'Web app URL' que te muestra"
echo "   (algo como: https://script.google.com/macros/s/...../exec)"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Esperar confirmación
read -p "¿Ya completaste la configuración del Web App? (y/N): " COMPLETED

if [[ ! $COMPLETED =~ ^[Yy]$ ]]; then
    echo ""
    print_warning "Setup pausado"
    echo ""
    echo "Para continuar después de configurar el Web App, ejecuta:"
    echo "   cd .."
    echo "   bash scripts/continue-setup.sh"
    echo ""
    echo "O vuelve a ejecutar este script y selecciona 'usar proyecto existente'"
    exit 0
fi

# Pedir la Web App URL
echo ""
print_info "Pega aquí la Web App URL:"
read -p "URL: " WEB_APP_URL

# Validar URL
if [ -z "$WEB_APP_URL" ]; then
    print_error "URL vacía. No se puede continuar."
    exit 1
fi

if [[ ! $WEB_APP_URL =~ ^https://script\.google\.com/macros/s/.*/exec$ ]]; then
    print_warning "La URL no parece ser una Web App URL válida de GAS"
    print_warning "Formato esperado: https://script.google.com/macros/s/{ID}/exec"
    read -p "¿Continuar de todas formas? (y/N): " FORCE_CONTINUE
    if [[ ! $FORCE_CONTINUE =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

print_success "URL capturada: $WEB_APP_URL"

# Guardar configuración
cd ..
echo "$WEB_APP_URL" > .gas-url.txt
echo "$SCRIPT_ID" > .gas-script-id.txt

print_success "Configuración del backend guardada"

# ============================================
# PASO 6: Configurar Frontend
# ============================================

print_header "🎨 Paso 6: Configurar Frontend"

cd "INDRA_FRONT DEV"

# Verificar si existe .env
if [ -f ".env" ]; then
    print_warning ".env ya existe"
    read -p "¿Quieres sobrescribirlo? (y/N): " OVERWRITE
    if [[ ! $OVERWRITE =~ ^[Yy]$ ]]; then
        print_info "Manteniendo .env existente"
        cd ..
        print_success "Setup completado (usando .env existente)"
        exit 0
    fi
fi

# Crear .env
print_info "Creando archivo .env..."

cat > .env << EOF
# ============================================
# INDRA OS - Configuración de Producción
# Generado automáticamente: $(date)
# ============================================

# Backend URL (Google Apps Script Web App)
VITE_GAS_URL=$WEB_APP_URL

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
EOF

print_success "Archivo .env creado"

# ============================================
# PASO 7: Instalar Dependencias y Build
# ============================================

print_header "📦 Paso 7: Instalar Dependencias del Frontend"

print_info "Esto puede tardar 2-3 minutos..."

npm install

if [ $? -ne 0 ]; then
    print_error "Error al instalar dependencias"
    exit 1
fi

print_success "Dependencias instaladas"

print_header "🔨 Paso 8: Generar Build de Producción"

print_info "Compilando frontend..."

npm run build

if [ $? -ne 0 ]; then
    print_error "Error al generar build"
    exit 1
fi

print_success "Build generado en ./dist/"

# ============================================
# PASO 9: Verificar Backend
# ============================================

print_header "🔍 Paso 9: Verificar Conectividad con Backend"

print_info "Verificando que el backend responda..."

# Intentar health check
HEALTH_CHECK_URL="${WEB_APP_URL}?action=healthCheck"

if command -v curl &> /dev/null; then
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_CHECK_URL" --max-time 10)
    if [ "$RESPONSE" = "200" ]; then
        print_success "Backend está online y responde correctamente"
    else
        print_warning "Backend no respondió como se esperaba (HTTP $RESPONSE)"
        print_info "Esto es normal si aún no has ejecutado el bootstrap del sistema"
    fi
else
    print_warning "curl no disponible, omitiendo health check"
fi

# ============================================
# RESUMEN FINAL
# ============================================

cd ..

print_header "🎉 Setup Completado Exitosamente"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}                    RESUMEN DE TU INSTALACIÓN                          ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
print_info "Backend (Google Apps Script):"
echo "   URL:       $WEB_APP_URL"
echo "   Script ID: $SCRIPT_ID"
echo "   Editor:    $SCRIPT_URL"
echo ""
print_info "Frontend (React + Vite):"
echo "   Source:    ./INDRA_FRONT DEV/src/"
echo "   Build:     ./INDRA_FRONT DEV/dist/"
echo "   Config:    ./INDRA_FRONT DEV/.env"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

print_header "🚀 Próximos Pasos"

echo ""
echo "Tu instancia INDRA está configurada. Ahora puedes:"
echo ""
echo -e "${BLUE}Opción 1: Deploy a Vercel${NC}"
echo "   cd 'INDRA_FRONT DEV'"
echo "   npm run deploy:vercel"
echo ""
echo -e "${BLUE}Opción 2: Deploy a Netlify${NC}"
echo "   cd 'INDRA_FRONT DEV'"
echo "   npm run deploy:netlify"
echo ""
echo -e "${BLUE}Opción 3: Preview Local${NC}"
echo "   cd 'INDRA_FRONT DEV'"
echo "   npm run preview"
echo "   # Se abrirá en http://localhost:4173"
echo ""
echo -e "${BLUE}Opción 4: Desarrollo Local${NC}"
echo "   cd 'INDRA_FRONT DEV'"
echo "   npm run dev"
echo "   # Se abrirá en http://localhost:5173"
echo ""

print_header "🔄 Actualizaciones Futuras"

echo ""
echo "Para obtener actualizaciones del proyecto original:"
echo ""
echo "   # 1. Agregar upstream (solo primera vez)"
echo "   git remote add upstream https://github.com/Airhonreality/indra-os.git"
echo ""
echo "   # 2. Obtener actualizaciones"
echo "   git fetch upstream"
echo "   git merge upstream/main"
echo ""
echo "   # 3. Push (esto activará GitHub Actions si los configuraste)"
echo "   git push origin main"
echo ""

print_header "📚 Documentación"

echo ""
echo "   📘 Setup Guide:        docs/SETUP_GUIDE.md"
echo "   🔧 Troubleshooting:    docs/TROUBLESHOOTING.md"
echo "   🏗️  Architecture:       docs/ARCHITECTURE.md"
echo "   📚 API Reference:      OrbitalCore_Codex_v1/_documentation/"
echo ""

print_header "💬 Soporte"

echo ""
echo "Si encuentras problemas:"
echo "   🐛 Issues: https://github.com/Airhonreality/indra-os/issues"
echo "   💬 Discord: [tu-server-discord]"
echo "   📧 Email: [tu-email]"
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}              ¡Que la soberanía digital esté contigo! ⚡🌞${NC}"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
