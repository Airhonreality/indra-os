# 🚀 PLAN DE LANZAMIENTO BETA - INDRA OS (Solar Punk Edition v3.0)

> **Estrategia Final:** Bootstrap con UN SOLO COMANDO  
> **Público Objetivo:** Resistencia Solar Punk (Beta Testers)  
> **Fecha Objetivo:** Q1 2026  
> **Dharma:** Soberanía Digital en 5 Minutos

---

## 📋 RESUMEN EJECUTIVO

### El Usuario Solo Hace ESTO:

```powershell
# Abrir PowerShell y pegar:
irm https://raw.githubusercontent.com/JAVIER/indra-os/main/scripts/bootstrap.ps1 | iex
```

**Eso es TODO.** 5 minutos después tiene su INDRA online.

---

## 🎯 FLUJO COMPLETO (Automático)

### 1️⃣ BOOTSTRAP DESCARGA TODO

```
Usuario ejecuta: irm ... | iex
     ↓
Script bootstrap.ps1:
  ├─ ✅ Detecta/instala Git
  ├─ ✅ Clona repositorio completo
  ├─ ✅ Cambia a carpeta clonada
  └─ ✅ Ejecuta first-time-setup.ps1
```

### 2️⃣ SETUP CONFIGURA TODO

```
Script first-time-setup.ps1:
  ├─ ✅ Detecta/instala Node.js
  ├─ ✅ Detecta/instala Clasp
  ├─ ✅ Detecta/instala GitHub CLI
  │
  ├─ ✅ Autentica Google (browser)
  ├─ ✅ Crea proyecto GAS
  ├─ ✅ Sube código backend
  ├─ ⚠️  Usuario configura Web App (30 seg) ← ÚNICO PASO MANUAL
  │
  ├─ ✅ Compila frontend (npm build)
  ├─ ✅ Crea .env con URL backend
  │
  ├─ ✅ Autentica GitHub (browser)
  ├─ ✅ Usuario elige nombre repo
  ├─ ✅ Crea repositorio GitHub
  ├─ ✅ Sube código a GitHub

  └─ ✅ Genera la "Llave Maestra" (Master Key)

> 💡 **ESTRATEGIA "ZEN" (Resistencia Solar Punk):**
> Indra arranca con **CERO LOGINS** adicionales. Instalamos la versión "Core Prime" que usa servicios libres o ya incluidos en tu cuenta de Google (Maps, YouTube Metadata, Gmail, Google TTS). Los servicios complejos (Notion, Wit.ai, WhatsApp) se activan DESPUÉS desde el panel de control.

  └─ ✅ Dispara GitHub Actions
```

### 3️⃣ GITHUB ACTIONS DESPLIEGA

```
.github/workflows/deploy-ui.yml:
  ├─ ✅ Compila frontend
  ├─ ✅ Despliega a GitHub Pages
  └─ ✅ URL: https://usuario.github.io/repo
```

---

## 🔐 PROTOCOLO DE LLAVES SOBERANAS (Zero-Trust Delivery)

El diseño de seguridad se basa en que **GitHub Pages NO conoce tus secretos**.

### 1. Entrega de Llaves (Key Handover)
El script de instalación (`first-time-setup.ps1`) NO inyecta la API Key en el código del Frontend. En su lugar:
1.  Genera una **MASTER KEY** única criptográficamente segura.
2.  La configura en el Backend (Core).
3.  Al finalizar, la muestra en la terminal (stdout) **UNA SOLA VEZ**.

> 🛑 **MANDATO DE USUARIO:** El usuario tiene la responsabilidad absoluta de copiar esta llave y guardarla en su gestor de contraseñas. **"Not your keys, not your cloud."**

### 2. Hidratación del Cliente (Client-Side Hydration)
Cuando el usuario visita su URL (`usuario.github.io/indra`):
1.  El Frontend carga "vacío" (sin secretos).
2.  Detecta que no hay llave en el `localStorage`.
3.  Presenta la pantalla de **"Inicialización de Enlace"**:
    *   Input: `Core URL` (opcional si usa setup con .env para URL)
    *   Input: `Master Key` (Obligatorio)
4.  Al ingresar la llave, se guarda en el navegador y se establece la sesión persistente.

### 3. Recuperación de Desastres (Browser Cleaning)
Si el usuario borra el caché/cookies del navegador:
*   **Consecuencia:** Se pierde el acceso inmediato (Logout forzoso).
*   **Recuperación:** El usuario simplemente vuelve a ingresar su URL y su Master Key guardada.
*   **Estado:** Los datos NO se pierden (viven en Google Drive), solo se pierde la "ventana" de acceso. Al volver a loguearse, el sistema recupera todo el estado intacto.

---

## 📊 COMPONENTES DEL SISTEMA

### Archivos Clave

```
indra-os/
├─ scripts/
│  ├─ bootstrap.ps1          ← Punto de entrada (descarga repo)
│  └─ first-time-setup.ps1   ← Setup completo (backend + frontend)
│
├─ .github/workflows/
│  └─ deploy-ui.yml          ← Deploy automático a GitHub Pages
│
├─ OrbitalCore_Codex_v1/     ← Backend GAS
│  ├─ .clasp.json            (generado por setup)
│  └─ appsscript.json        ✅ Listo
│
└─ INDRA_FRONT DEV/          ← Frontend React
   ├─ .env                   (generado por setup)
   ├─ dist/                  (generado por npm build)
   └─ vite.config.js         ✅ Listo
```

### Herramientas Auto-Instaladas

| Herramienta | Para qué | Instalación |
|-------------|----------|-------------|
| **Git** | Clonar repo, version control | Auto (bootstrap.ps1) |
| **Node.js** | Compilar frontend | Auto (first-time-setup.ps1) |
| **Clasp** | Deploy backend GAS | Auto (npm install -g) |
| **GitHub CLI** | Crear repo, autenticar | Auto (first-time-setup.ps1) |

---

## ⏱️ TIMELINE DE EJECUCIÓN

| Minuto | Acción | Quién |
|--------|--------|-------|
| 0 | Usuario pega comando bootstrap | 👤 Usuario |
| 0-1 | Instalación Git (si necesario) | 🤖 Script |
| 1 | Clonación del repositorio | 🤖 Script |
| 1-2 | Instalación Node.js (si necesario) | 🤖 Script |
| 2 | Instalación Clasp y GitHub CLI | 🤖 Script |
| 2-3 | Autenticación Google + Creación proyecto GAS | 🤖 Script + 👤 Usuario |
| 3 | **Configuración Web App en GAS** | 👤 **Usuario (30 seg)** |
| 3-4 | **Obtención Satellite API Key** | 🤖 **Auto** (o 👤 10 seg) |
| 4 | Compilación frontend + Autenticación GitHub | 🤖 Script + 👤 Usuario |
| 5 | Creación repo GitHub y push | 🤖 Script |
| 5.5 | **✅ CORE ONLINE (Modo Autónomo)** | 🎉 **LISTO** |
| 6+ | **ETAPA 2: LA HIDRATACIÓN (Sensorium)** | 👤 **Usuario (Front)** |

---

## 🎭 MODELO DE DOS ETAPAS (Fricción Cero)

### 🚀 ETAPA 1: El Bootstrap (5 Minutos)
El usuario solo configura Google y GitHub (necesarios para el hosting).
*   **Resultados:** Indra ya puede buscar en Google (via Jina), analizar YouTube (metadata), calcular rutas (Maps), enviar emails y hablar (Google TTS).
*   **Veredicto:** Instalación completa, core funcional al 70%.

### 🏗️ ETAPA 2: El Sensorium (Post-Configuración)
Desde la elegante interfaz de Indra (Frontend), el usuario ve un mapa estelar de "Senses" (Adapters). Cada uno tiene un botón de **"Despertar"**:
*   **WhatsApp/Telegram**: Guía visual paso a paso para obtener el Token.
*   **Wit.ai (Oídos)**: Link directo a la creación de App y pegado de Token.
*   **Notion**: OAuth directo o pegado de secret.
*   **Oracle Avanzado (Tavily)**: Configuración opcional para investigación profunda.

> **Ventaja:** El usuario entra a Indra viendo que YA funciona. La configuración adicional se siente como un "Subir de Nivel" y no como un muro de entrada.

---

## 🛠️ REQUISITOS DEL USUARIO

### Obligatorios

1. ✅ **Windows 10/11** con PowerShell
2. ✅ **Cuenta de Google** (gratis)
3. ✅ **Cuenta de GitHub** (gratis)
4. ✅ **Conexión a internet**

### Opcionales (se instalan automáticamente)

- Node.js
- Git
- Clasp
- GitHub CLI

---

## 📝 PASOS MANUALES (Solo 2)

### ⚠️ 1. Configurar Web App en Google Apps Script

**Por qué es manual:** Google no permite automatizar esto por seguridad.

**Tiempo:** 30 segundos

**Pasos exactos:**

1. Script abre browser con el editor de GAS
2. Usuario hace click en **Deploy** → **New deployment**
3. Click en engranaje ⚙️ → **Web app**
4. Configurar:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**
6. Si pide autorización → **Allow**
7. **Copiar** la Web App URL (https://script.google.com/macros/s/.../exec)
8. **Pegar** en el script de PowerShell

### ⚠️ 2. Obtener Satellite API Key (Automático con Fallback Manual)

**Por qué existe:** Seguridad L7 - Autenticación frontend ↔ backend

**Tiempo:** 10 segundos (si automático falla)

**Flujo Automático (Predeterminado):**
- El script ejecuta `clasp run getSatelliteKey`
- Extrae el UUID autogenerado por el Core
- Lo incluye automáticamente en el `.env`

**Fallback Manual (si clasp run falla):**
1. Ir al Google Sheet que se abrió
2. Menú: **🚀 Orbital Core → 🔑 Gestionar Conexiones**
3. Buscar: **ORBITAL_CORE_SATELLITE_API_KEY**
4. **Copiar** el UUID (550e8400-e29b-41d4-...)
5. **Pegar** en el script de PowerShell cuando lo solicite

**Eso es TODO.**

---

## 🎁 RESULTADO FINAL

### El Usuario Obtiene:

```yaml
Backend GAS:
  URL: https://script.google.com/macros/s/.../exec
  Editor: https://script.google.com/home/projects/SCRIPT_ID/edit

Frontend:
  URL Pública: https://usuario.github.io/nombre-repo
  Build: Compilado y optimizado
  CDN: GitHub Pages (global)

Repositorio:
  URL: https://github.com/usuario/nombre-repo
  Código: Todo el source code
  Deploy: Automático vía GitHub Actions

Datos:
  Google Drive: Carpeta INDRA_ORBITAL_CORE
  Google Sheets: JobQueue, AuditLog
  Soberanía: 100% del usuario
```

---

## 🔄 ACTUALIZACIONES FUTURAS

### Usuario Quiere Nueva Versión del Core

```bash
# 1. Ir a la carpeta de instalación
cd ruta/a/mi-indra

# 2. Obtener cambios del repositorio oficial
git pull origin main

# 3. Actualizar backend y frontend automáticamente
.\scripts\update.ps1

# ✅ Backend actualizado (misma Web App URL)
# ✅ Frontend recompilado y desplegado a GitHub Pages
```

### ¿Qué hace el script `update.ps1`?

1. **Backend:** Ejecuta `clasp push` + `clasp deploy --deploymentId` (mantiene la misma URL)
2. **Frontend:** Ejecuta `npm install` + `npm run build` (compila React a archivos estáticos)
3. **Deploy:** Ejecuta `git push` (dispara GitHub Actions → GitHub Pages)

**Tiempo:** ~2 minutos

---

## 📦 ¿Por qué necesitamos compilar el frontend?

**React NO es HTML** - es código JavaScript (JSX) que los navegadores NO pueden ejecutar directamente.

**El proceso de compilación (`npm run build`):**
```
React/JSX (código fuente)
        ↓
   [Vite Compiler]  ← Herramienta de compilación (como un traductor)
        ↓
HTML + CSS + JS estático (archivos que los navegadores SÍ entienden)
        ↓
   dist/ folder  ← Esto es lo que GitHub Pages sirve
```

**GitHub Pages solo sirve archivos estáticos** (HTML/CSS/JS). No puede ejecutar React directamente.

**Por eso:**
- El script ejecuta `npm run build` (usa Vite para compilar)
- El resultado va a la carpeta `dist/`
- GitHub Actions sube `dist/` a la rama `gh-pages`
- GitHub Pages sirve esos archivos compilados

**NO es "desarrollo local"** - es compilación para producción. Sin esto, no hay nada que publicar.

---

## 🚀 DISTRIBUCIÓN A BETA TESTERS

### Mensaje para Usuarios

```markdown
## 🌞 Instala tu INDRA OS Personal

**Requisitos:** Cuenta de Google y GitHub (gratis)

**Instalación (5 minutos):**

1. Abre PowerShell (Windows)
2. Pega este comando:

   ```powershell
   irm https://raw.githubusercontent.com/JAVIER/indra-os/main/scripts/bootstrap.ps1 | iex
   ```

3. Sigue las instrucciones en pantalla
4. ¡Listo! Tendrás tu URL pública

**Soporte:**
- Discord: [link]
- Issues: https://github.com/JAVIER/indra-os/issues
```

---

## 📊 VENTAJAS vs OTRAS OPCIONES

| Aspecto | Otras opciones | **INDRA (Bootstrap)** |
|---------|----------------|----------------------|
| **Comando inicial** | Múltiples | **1 solo** |
| **Pasos manuales** | 5-10 | **1** (Web App) |
| **Cuentas necesarias** | 3+ (Google, GitHub, Vercel) | **2** (Google, GitHub) |
| **Instalaciones manuales** | Node, Git, Clasp, etc. | **0** (todo auto) |
| **Crear repo GitHub** | Manual | **Automático** |
| **Deploy frontend** | `npm run deploy:vercel` | **Automático** |
| **Configurar secrets** | Manualmente obtener tokens | **Automático** |
| **Tiempo total** | 15-20 min | **5 min** |
| **Experiencia** | Técnica | **Plug & Play** |

---

## ✅ CHECKLIST DE LANZAMIENTO

### Pre-Lanzamiento (TU trabajo)

- [ ] Testear bootstrap.ps1 end-to-end
- [ ] Testear first-time-setup.ps1 en máquina limpia
- [x] Verificar deploy-ui.yml funciona ✅ Build exitoso
- [x] Crear repositorio público en GitHub ✅ https://github.com/Airhonreality/indra-os
- [x] Actualizar URLs en scripts (cambiar "tu-org" por tu user real) ✅
- [x] Documentar en README.md ✅
- [x] Configurar GitHub Pages automático ✅ https://airhonreality.github.io/indra-os/
- [ ] Crear video tutorial (opcional, 2 min)

**SIGUIENTE PASO:** Testear scripts de instalación en máquina limpia

### Lanzamiento

- [ ] Anunciar en Discord/Twitter
- [ ] Publicar en Product Hunt (opcional)
- [ ] Enviar invitaciones a beta testers
- [ ] Monitorear GitHub Issues
- [ ] Recopilar feedback

### Post-Lanzamiento

- [ ] Fix bugs críticos (primeras 48h)
- [ ] Actualizar docs basado en preguntas frecuentes
- [ ] Release v1.1 con mejoras
- [ ] Escribir blog post "Lessons Learned"

---

## 🎯 MÉTRICAS DE ÉXITO

### KPIs Objetivo

| Métrica | Target Semana 1 |
|---------|-----------------|
| **Instalaciones exitosas** | 50+ |
| **Tasa de éxito** | >80% |
| **Tiempo promedio setup** | <7 min |
| **Issues críticos** | <3 |
| **Stars en GitHub** | 100+ |

---

## 🔧 TROUBLESHOOTING COMÚN

### "Git no se instala automáticamente"

**Solución:** Instalar manualmente desde https://git-scm.com/

### "Clasp login no abre browser"

**Solución:** Copiar URL manualmente y pegar código de autorización

### "GitHub Pages no se activa"

**Solución:** Ir a Settings → Pages → Source: gh-pages branch

### "Web App URL no funciona"

**Solución:** Verificar que "Who has access" está en "Anyone"

---

## 📚 RECURSOS

- **Repositorio Template:** https://github.com/JAVIER/indra-os
- **Documentación:** [docs/README.md](../../README.md)
- **Discord:** [Enlace a servidor]
- **Video Tutorial:** [YouTube/TikTok]

---

## 🌟 CONCLUSIÓN

Has creado el **sistema de instalación más automático posible** para una app de esta complejidad:

✅ **UN solo comando**  
✅ **TODO se instala automáticamente**  
✅ **Repositorio creado automáticamente**  
✅ **Deploy automático**  
✅ **Solo 1 paso manual** (inevitable por Google)  

**Esto es literalmente lo MÁS SIMPLE humanamente posible.**

---

**Versión:** 3.0.0 (Un Solo Comando - Bootstrap)  
**Última actualización:** 16 enero 2026  
**Autor:** La Resistencia Solar Punk  
**Licencia:** MIT  

⚡🌞 **¡Que la soberanía digital esté contigo!** 🌞⚡
