# Scripts de Setup - INDRA OS

Scripts de utilidad para configurar y mantener tu instancia de INDRA OS.

## 📋 Scripts Disponibles

### 1. `first-time-setup.sh` - Setup Inicial Completo

**Uso:**
```bash
bash scripts/first-time-setup.sh
```

**Qué hace:**
1. ✅ Verifica prerequisites (Node.js, Git)
2. ✅ Instala Google Clasp si no está instalado
3. ✅ Te autentica con Google
4. ✅ Crea proyecto en Google Apps Script
5. ✅ Sube código del backend a GAS
6. ⚠️  Te guía para configurar Web App (MANUAL, 2 min)
7. ✅ Captura la Web App URL
8. ✅ Genera archivo .env para el frontend
9. ✅ Instala dependencias del frontend
10. ✅ Genera build de producción

**Duración:** ~10 minutos (incluyendo paso manual)

**Prerequisites:**
- Node.js 16+ instalado
- Git instalado
- Cuenta de Google
- Conexión a internet

**Salidas generadas:**
- `OrbitalCore_Codex_v1/.clasp.json` - Configuración del proyecto GAS
- `.gas-url.txt` - URL del Web App de GAS
- `.gas-script-id.txt` - ID del script en GAS
- `system_core/client/.env` - Configuración del frontend
- `system_core/client/dist/` - Build de producción del frontend

---

## 🔧 Troubleshooting

### Error: "clasp: command not found"

**Causa:** Clasp no está instalado globalmente

**Solución:**
```bash
npm install -g @google/clasp
```

### Error: "Node.js no está instalado"

**Solución:** Descarga Node.js desde https://nodejs.org/

### Error: "Error al crear proyecto"

**Posibles causas:**
1. No estás autenticado con Google
2. No tienes permisos para crear proyectos en GAS
3. Límite de proyectos alcanzado

**Solución:**
```bash
# Re-autenticarse
clasp logout
clasp login

# Intentar de nuevo
bash scripts/first-time-setup.sh
```

### Error: "URL vacía. No se puede continuar."

**Causa:** No pegaste la Web App URL correctamente

**Solución:**
1. Vuelve al editor de GAS
2. Ve a Deploy → Manage deployments
3. Copia la URL del deployment activo
4. Vuelve a ejecutar el script y pega la URL cuando te lo pida

### Error: "Error al instalar dependencias"

**Causa:** Problemas con npm

**Solución:**
```bash
cd "system_core/client"
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 Notas Importantes

### Permisos en Linux/Mac

Antes de ejecutar el script por primera vez:
```bash
chmod +x scripts/first-time-setup.sh
```

### Re-ejecutar el Script

Si necesitas re-configurar tu instancia:

**El script detectará:**
- ✅ Si ya existe un proyecto GAS vinculado
- ✅ Si ya existe un archivo .env

**Te preguntará:**
- ¿Quieres sobrescribir el proyecto existente?
- ¿Quieres sobrescribir el .env existente?

**Puedes responder 'n' para mantener la configuración actual.**

### Configuración Manual del Web App

**¿Por qué es necesario?**

Google Apps Script no permite configurar Web Apps automáticamente por seguridad. Es una limitación de la plataforma, no del script.

**Pasos exactos:**
1. Abre el link que te muestra el script
2. Click "Deploy" → "New deployment"
3. Click ⚙️ → "Web app"
4. Configure:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click "Deploy"
6. Copia la URL que te da

**Tiempo:** 30-60 segundos

---

## 🔐 Seguridad

### Archivos sensibles

El script genera archivos que contienen información sensible:

```
.gas-url.txt          # URL pública, OK compartir
.gas-script-id.txt    # ID público, OK compartir
.clasp.json           # Contiene script ID (OK compartir)
~/.clasprc.json       # CREDENCIALES - NO compartir
.env                  # URLs y config - revisar antes de compartir
```

**Ya están en .gitignore:**
- ✅ `.env`
- ✅ `.gas-*.txt`
- ✅ `.clasp.json` (debería estar)

**Verifica que NO se suban a Git:**
```bash
git status
# No debería mostrar .env ni .gas-*.txt
```

### Secrets para GitHub Actions

Si quieres GitHub Actions automáticos, necesitas configurar secrets:

**Backend:**
```bash
# Contenido de ~/.clasprc.json
cat ~/.clasprc.json
# → Pegar en GitHub Secret: CLASPRC_JSON

# Contenido de .clasp.json
cat OrbitalCore_Codex_v1/.clasp.json
# → Pegar en GitHub Secret: CLASP_JSON
```

**Frontend:**
```bash
# URL del Web App
cat .gas-url.txt
# → Pegar en GitHub Secret: VITE_GAS_URL
```

---

## 🚀 Después del Setup

### Opción 1: Deploy a Vercel

```bash
cd "system_core/client"
npm run deploy:vercel
```

### Opción 2: Deploy a Netlify

```bash
cd "system_core/client"
npm run deploy:netlify
```

### Opción 3: Preview Local

```bash
cd "system_core/client"
npm run preview
# Abre http://localhost:4173
```

### Opción 4: Desarrollo

```bash
cd "system_core/client"
npm run dev
# Abre http://localhost:5173
```

---

## 📚 Recursos Adicionales

- [Guía de Setup Completa](../docs/SETUP_GUIDE.md)
- [Troubleshooting](../docs/TROUBLESHOOTING.md)
- [Arquitectura](../docs/ARCHITECTURE.md)
- [Documentación de Clasp](https://github.com/google/clasp)
- [GitHub Actions](.github/workflows/README.md)

---

## 💬 Soporte

Si el script falla o tienes problemas:

1. **Revisa los logs del script** - Mensajes de error detallados
2. **Consulta Troubleshooting** arriba
3. **Abre un Issue** en GitHub con:
   - Sistema operativo
   - Versión de Node.js
   - Logs completos del error
   - Paso donde falló

---

**¡Que la soberanía digital esté contigo!** ⚡🌞
