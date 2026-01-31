# GitHub Actions Workflows

Este directorio contiene los workflows de CI/CD para INDRA OS.

## 📋 Workflows Disponibles

### 1. `update-backend.yml` - Actualización del Backend

**Trigger:** Push a `main` con cambios en `OrbitalCore_Codex_v1/`

**Qué hace:**
- Instala Google Clasp
- Autentíca con Google usando secrets
- Empuja código actualizado a Google Apps Script
- No requiere re-deployment (cambios son inmediatos)

**Secrets requeridos:**
- `CLASPRC_JSON`: Contenido de `~/.clasprc.json` (credenciales de Clasp)
- `CLASP_JSON`: Contenido de `OrbitalCore_Codex_v1/.clasp.json` (config del proyecto)

**Cómo obtener los secrets:**

```bash
# 1. Después de ejecutar first-time-setup.sh:

# CLASPRC_JSON (credenciales de usuario)
cat ~/.clasprc.json
# Copia el contenido completo

# CLASP_JSON (configuración del proyecto)
cat OrbitalCore_Codex_v1/.clasp.json
# Copia el contenido completo
```

### 2. `update-frontend.yml` - Actualización del Frontend

**Trigger:** Push a `main` con cambios en `INDRA_FRONT DEV/`

**Qué hace:**
- Instala dependencias npm
- Carga variables de entorno
- Genera build de producción
- Despliega a Vercel/Netlify/GitHub Pages según secrets configurados

**Secrets requeridos (elige UNA plataforma):**

**Opción A: Vercel**
- `VERCEL_TOKEN`: Token de API ([obtener](https://vercel.com/account/tokens))
- `VERCEL_ORG_ID`: ID de organización (en settings del proyecto)
- `VERCEL_PROJECT_ID`: ID del proyecto (en settings del proyecto)
- `VITE_GAS_URL`: URL del Web App de GAS (opcional, puede usar .env)

**Opción B: Netlify**
- `NETLIFY_AUTH_TOKEN`: Personal Access Token ([obtener](https://app.netlify.com/user/applications))
- `NETLIFY_SITE_ID`: ID del sitio (en site settings)
- `VITE_GAS_URL`: URL del Web App de GAS (opcional, puede usar .env)

**Opción C: GitHub Pages**
- No requiere secrets (usa `GITHUB_TOKEN` automático)
- Opcional: `CUSTOM_DOMAIN` para dominio personalizado
- `VITE_GAS_URL`: URL del Web App de GAS (debe estar en .env en el repo)

## 🔧 Configuración de Secrets

### Paso 1: Obtener valores de los secrets

Después de ejecutar `scripts/first-time-setup.sh`, tendrás:

```bash
# Backend secrets
~/.clasprc.json              # → CLASPRC_JSON
OrbitalCore_Codex_v1/.clasp.json  # → CLASP_JSON

# Frontend secrets
.gas-url.txt                 # → VITE_GAS_URL
```

### Paso 2: Configurar en GitHub

1. Ve a tu repositorio en GitHub
2. Click en **Settings** → **Secrets and variables** → **Actions**
3. Click en **New repository secret**
4. Agrega cada secret con su nombre exacto y valor

### Ejemplo:

**Secret:** `CLASPRC_JSON`  
**Valor:**
```json
{
  "token": {
    "access_token": "ya29.xxxxxxxxxxxxx",
    "refresh_token": "1//xxxxxxxxxxxxx",
    "scope": "https://www.googleapis.com/auth/...",
    "token_type": "Bearer",
    "expiry_date": 1234567890123
  },
  "oauth2ClientSettings": {
    "clientId": "xxxxxxxxxxxx.apps.googleusercontent.com",
    "clientSecret": "xxxxxxxxxxxxx",
    "redirectUri": "http://localhost"
  },
  "isLocalCreds": false
}
```

## ⚙️ Configuración Opcional

### Variables de Entorno Globales

Puedes configurar variables de entorno para todos los workflows:

1. **Settings** → **Secrets and variables** → **Actions**
2. Tab **Variables**
3. Click **New repository variable**

Variables útiles:
- `NODE_VERSION`: Versión de Node.js (default: 18)
- `VITE_APP_NAME`: Nombre de la app
- `VITE_APP_ENVIRONMENT`: Entorno (production/staging)

## 🚫 Workflows NO Incluidos

### ❌ `setup-indra.yml` (Eliminado)

**Por qué no existe:**

Debido a limitaciones de Google Apps Script, NO es posible automatizar completamente el setup inicial vía GitHub Actions:

1. `clasp deploy` NO configura Web Apps automáticamente
2. OAuth requiere autorización manual en browser
3. La URL del Web App solo se obtiene después de configuración manual

**Solución:** Usamos `scripts/first-time-setup.sh` que guía al usuario paso a paso.

## 🔄 Flujo de Trabajo Típico

### Setup Inicial (Una vez)

```bash
# Local
bash scripts/first-time-setup.sh
# → Crea proyecto GAS
# → Configura Web App manualmente
# → Genera .env con URL
```

### Desarrollo Continuo (Automático)

```bash
# Local
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main

# GitHub Actions (automático)
# → Detecta cambios
# → Despliega backend si cambió OrbitalCore_Codex_v1/
# → Despliega frontend si cambió INDRA_FRONT DEV/
```

## 📊 Monitoring

### Ver estado de workflows:

1. Ve a tu repositorio
2. Click en tab **Actions**
3. Selecciona un workflow para ver detalles

### Badges para README:

```markdown
[![Update Backend](https://github.com/tu-user/tu-repo/actions/workflows/update-backend.yml/badge.svg)](https://github.com/tu-user/tu-repo/actions/workflows/update-backend.yml)

[![Update Frontend](https://github.com/tu-user/tu-repo/actions/workflows/update-frontend.yml/badge.svg)](https://github.com/tu-user/tu-repo/actions/workflows/update-frontend.yml)
```

## 🐛 Troubleshooting

### Error: "CLASPRC_JSON secret not found"

**Solución:** Configura el secret con el contenido de `~/.clasprc.json`

### Error: "clasp login status failed"

**Causas:**
- Token expirado en CLASPRC_JSON
- Formato JSON inválido

**Solución:** 
1. Ejecuta `clasp login` localmente
2. Actualiza el secret CLASPRC_JSON con el nuevo contenido

### Error: "Vercel deployment failed"

**Causas:**
- Secrets de Vercel incorrectos
- Proyecto Vercel no existe

**Solución:**
1. Verifica los 3 secrets: TOKEN, ORG_ID, PROJECT_ID
2. Asegúrate de que el proyecto existe en Vercel
3. Verifica permisos del token

### Build exitoso pero app no funciona

**Causas:**
- VITE_GAS_URL no configurada o incorrecta
- Backend no desplegado

**Solución:**
1. Verifica que VITE_GAS_URL esté en secrets o .env
2. Verifica que el backend responda: `curl {URL}?action=healthCheck`

## 📚 Recursos

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Clasp Documentation](https://github.com/google/clasp)
- [Vercel GitHub Integration](https://vercel.com/docs/git/vercel-for-github)
- [Netlify GitHub Integration](https://docs.netlify.com/configure-builds/repo-permissions-linking/)
