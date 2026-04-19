# 🚀 Quick Start: Implementación ADR-020

**Comenzar aquí ↓**

---

## 📚 Documentos de Referencia

| Documento | Propósito | Tiempo de lectura |
|-----------|----------|------------------|
| [ADR-020](ADR-020_OAUTH_HANDSHAKE_STEPWISE.md) | Especificación técnica completa | 20 min |
| [IMPLEMENTATION_PLAN](ADR-020_IMPLEMENTATION_PLAN.md) | Detalles de cada tarea con pseudocódigo | 30 min |
| [IMPLEMENTATION_STATUS](ADR-020_IMPLEMENTATION_STATUS.md) | Resumen ejecutivo + roadmap | 10 min |
| [Este archivo] | Quick start (5 min) | 5 min 👈 |

**Lectura recomendada:**
1. Comienza con este archivo (5 min)
2. Lee IMPLEMENTATION_STATUS para visión general (10 min)
3. Ve a IMPLEMENTATION_PLAN para detalles (cuando comiences cada tarea)
4. Consulta ADR-020 si necesitas especificación profunda

---

## 🎯 Flujo OAuth (Visual)

```
┌─────────────┐
│ User Form   │
└──────┬──────┘
       │ submit
       ▼
┌──────────────────────────┐
│ WORKFLOW_EXECUTE         │
│ s1: AEE (form data)      │
│ s_oauth: OAUTH_HANDLER   │ ◄─── [PAUSE AQUÍ]
│ ✓ Genera handshake_token │
│ ✓ Builds auth_url        │
└──────┬───────────────────┘
       │ Retorna: OAUTH_CHALLENGE
       ▼
┌──────────────────────────┐
│ Frontend                 │
│ Detecta: status=PENDING  │
│ Muestra popup            │
└──────┬───────────────────┘
       │ Click "Autorizar"
       ▼
┌──────────────────────────┐
│ Google OAuth Popup       │
│ User autoriza scopes     │
│ Callback: ?code=XXX      │
└──────┬───────────────────┘
       │ postMessage code
       ▼
┌──────────────────────────┐
│ Frontend                 │
│ Backend: exchange code→token
│ WORKFLOW_RESUME          │
│ ✓ Token inyectado en ctx │
└──────┬───────────────────┘
       │ Reanuda workflow
       ▼
┌──────────────────────────┐
│ WORKFLOW_RESUME          │
│ s2: DRIVE (user token)   │ ◄─── [REANUDA AQUÍ]
│ s3: Save PDF             │
│ ✓ Usa oauth_tokens.drive │
└──────┬───────────────────┘
       │ OK
       ▼
┌──────────────────────────┐
│ PDF en Drive del Usuario │
└──────────────────────────┘
```

---

## 🔴 Fase 1: Backend (¿Comienzo aquí?)

### Tarea 1.1: `oauth_handler.js` (90-120 líneas)

**Crear archivo:** `system_core/core/2_providers/oauth_handler.js`

**Funciones:**
- `oauthHandlerRouter(uqo)` - Router principal
- `_oauth_handleHandshake()` - Genera token + auth_url
- `_oauth_generateToken()` - `oauth_<UUID>_<TIMESTAMP>`
- `_oauth_buildAuthUrl()` - Construye URL OAuth

**Checkpoints:**
1. Token generado: `oauth_abc123_1711011234`
2. Guardado en CacheService con TTL 600s
3. Auth URL válida apunta a Google
4. Test pasa: `test_oauth_handleHandshake()`

**Pseudocódigo completo:** Ver [IMPLEMENTATION_PLAN.md](ADR-020_IMPLEMENTATION_PLAN.md#tarea-11-crear-oauth_handlerjs-90-120-líneas)

---

### Tarea 1.2: `provider_system_logic.js` (50 líneas)

**Modicar archivo:** `system_core/core/1_logic/provider_system_logic.js`

**Cambio:** Agregar cases para OAUTH_* protocols

```javascript
case 'OAUTH_HANDSHAKE':
  return oauthHandlerRouter(uqo);
case 'OAUTH_STATUS':
  return oauthHandlerRouter(uqo);
```

---

### Tarea 1.3: `workflow_executor.js` (150-200 líneas)

**Modificar archivo:** `system_core/core/1_logic/workflow_executor.js`

**Cambios principales:**
1. Función `_workflow_execute()`:
   - Detectar step con `engine: 'OAUTH_HANDLER'`
   - Si `on_success: 'PAUSE_FOR_USER_AUTH'` → retorna OAUTH_CHALLENGE
   - Pausa workflow, guarda contexto en Cache

2. Función `_workflow_resume()` (NUEVA):
   - Inyecta `access_token` en `$context.oauth_tokens[provider]`
   - Reanuda desde next step
   - Continúa ejecución

**Pseudocódigo completo:** Ver [IMPLEMENTATION_PLAN.md](ADR-020_IMPLEMENTATION_PLAN.md#tarea-13-actualizar-workflow_executorjs-150-200-líneas)

---

### Tarea 1.4: `provider_drive.js` (80-100 líneas)

**Modificar archivo:** `system_core/core/2_providers/provider_drive.js`

**Cambios:**
1. Función `_drive_handleAtomCreate_WithUserAuth()` (NUEVA):
   - Usa Google Drive API v3 + UrlFetchApp
   - Autenticación: `Authorization: Bearer <access_token>`
   - Crea carpeta en Drive del usuario

2. Modificar `_drive_handleAtomCreate()`:
   - Si `context.oauth_tokens.drive` existe → usar WithUserAuth
   - Si no existe → usar default (DriveApp del owner)

**Pseudocódigo completo:** Ver [IMPLEMENTATION_PLAN.md](ADR-020_IMPLEMENTATION_PLAN.md#tarea-14-actualizar-provider_drivejs-80-100-líneas)

---

### Tarea 1.5: OAuth Credentials (Setup)

**Pasos:**
1. Google Cloud Console:
   - Project → Credentials
   - Create OAuth 2.0: Web App
   - Redirect URI: `https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercallback`
   - Copy: `Client ID` + `Client Secret`

2. Script Properties:
   ```powershell
   clasp run setOAuthProperties
   # Ingresa Client ID y Secret
   ```

---

## 🟡 Fase 2: Frontend (Después de Fase 1)

### Tarea 2.1: `OAuthPopup.jsx` (60-80 líneas)

**Crear:** `system_core/client/src/components/OAuthPopup.jsx`

**QUÉ HACE:**
- Abre popup con `auth_url`
- Escucha postMessage desde callback
- Intercambia code → token (backend)
- Llama WORKFLOW_RESUME

---

### Tarea 2.2-2.6: Frontend integration

Ver [IMPLEMENTATION_PLAN.md](ADR-020_IMPLEMENTATION_PLAN.md#tarea-22-crear-oauthcallbackjsx-40-50-líneas) para detalles de:
- OAuthCallback.jsx
- useOAuth.js hook
- WorkflowRunner.jsx (modify)
- useWorkflow.js (modify)
- Backend endpoint `/api/oauth/exchange-code`

---

## 🟢 Fase 3: Validación (Después de Fase 2)

### E2E Test Completo

```
1. User llena formulario
2. Frontend WORKFLOW_EXECUTE (form data)
3. Workflow pausa en OAUTH_HANDLER
4. Frontend muestra popup (auth_url)
5. User autoriza en Google
6. Callback redirige con ?code=XXX
7. Frontend intercambia código por token
8. Frontend WORKFLOW_RESUME (token)
9. Workflow reanuda, next step usa oauth_tokens.drive
10. Carpeta creada en Drive del usuario (verificar!)
11. Workflow completa: status=OK ✓
```

---

## 🧪 Testing Strategy

### Unit Tests Día por Día

**Día 1-2 (oauth_handler.js)**
```javascript
test_oauth_generateToken()      // Token con formato correcto
test_oauth_handleHandshake()    // OAUTH_CHALLENGE válida
test_oauth_buildAuthUrl()       // URL apunta a Google
```

**Día 3-4 (workflow_executor.js)**
```javascript
test_workflow_execute()         // Pausa en OAUTH_HANDLER
test_workflow_resume()          // Reanuda con token
test_workflow_contextInjection() // oauth_tokens inyectados
```

**Día 4-5 (provider_drive.js)**
```javascript
test_drive_withUserAuth()       // Usa Drive API v3
test_drive_withoutUserAuth()    // Fallback a owner
```

**Verificación:** `clasp run test_*()` verde en cada step

---

## 📊 Timeline Sugerido

```
ESTA SEMANA (Lux-Viernes):
└─ Fase 1 (Backend)
   Day 1-2: oauth_handler.js + workflow_executor.js
   Day 3-4: provider_drive.js + OAuth credentials
   Day 5:   Tests + documentation

PRÓXIMA SEMANA (Lux-Viernes):
└─ Fase 2 (Frontend)
   Day 1-2: OAuthPopup + OAuthCallback
   Day 3-4: Hooks + WorkflowRunner integration
   Day 5:   E2E test form→popup→resume

SIGUIENTE SEMANA (Lux-Miércoles):
└─ Fase 3 (Validation)
   Day 1:   Security review
   Day 2-3: Final testing + documentation
```

---

## ❓ Common Questions

### ¿Por dónde empiezo?

**Responde:**
1. ¿Puedo dedicar 4-5 días full-time a backend?
   - SÍ → Comienza con Fase 1 hoy
   - NO → Agenda sesiones de pares conmigo (2h/día)

### ¿Qué si algo falla?

- Todos los tasks tienen IMPLEMENTATION_PLAN.md con pseudocódigo detallado
- Si test falla → Consulta "Error Scenarios" en ADR-020
- Si dudas → Preguntamos en contexto del error específico

### ¿Necesito cambiar archivos existentes?

- provider_system_logic.js: +5 lines (router cases)
- workflow_executor.js: +100 lines (nueva lógica), +50 lines (existing mods)
- provider_drive.js: +50 lines (nueva función), +10 lines (routing)
- NADA riesgoso, todo backward-compatible

### ¿Timeline realista?

- Backend (Fase 1): 4-5 días con 1 dev full-time
- Frontend (Fase 2): 4-5 días con 1 dev full-time
- Validation (Fase 3): 2-3 días
- **Total: 10-13 días = 2 semanas de implementación activa**

---

## 📍 Siguiente Paso

**Opciones:**

A) **"Vamos, comenzamos hoy"**
   → Responde: `listo para phase 1`
   → Creamos oauth_handler.js

B) **"Necesito review del plan primero"**
   → Responde: `tengo preguntas`
   → Discutimos cambios

C) **"Trabajo independientemente"**
   → Usa IMPLEMENTATION_PLAN.md
   → Yo reviso cuando terminAs tasks

---

**Status:** ✅ Plan 100% definido, listo para ejecución  
**Última actualización:** 2026-03-21  
**Siguiente:** Tu decisión → comenzamos Fase 1 ✨
