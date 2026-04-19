# 📊 Estado: Implementación ADR-020 OAuth

**Última actualización:** 2026-03-21  
**Duración estimada:** 2-3 semanas  
**Status global:** 📋 Plan creado, listo para Fase 1

---

## 🎯 Visión General

```
Fase 1: CORE BACKEND (4-5 días)
├─ oauth_handler.js                    ⏳ PRÓXIMO
├─ workflow_executor.js (pausable)     ⏳ PRÓXIMO  
├─ provider_drive.js (use_oauth_token) ⏳ PRÓXIMO
└─ OAuth credentials configuradas      ⏳ PRÓXIMO

        ↓ All tests green

Fase 2: FRONTEND REACT (4-5 días)
├─ OAuthPopup.jsx                      ⏳ DESPUÉS
├─ OAuthCallback.jsx                   ⏳ DESPUÉS
├─ useOAuth hook                       ⏳ DESPUÉS
└─ WorkflowRunner integration          ⏳ DESPUÉS

        ↓ E2E test form→popup→resume

Fase 3: VALIDACIÓN (2-3 días)
├─ E2E completo (form → PDF → Drive)   ⏳ DESPUÉS
├─ Security review                     ⏳ DESPUÉS
└─ Documentation + deploy              ⏳ DESPUÉS
```

---

## 📋 Fase 1: CORE (Detalles)

### Archivo 1: `oauth_handler.js` (NUEVO)

**Ubicación:** `system_core/core/2_providers/oauth_handler.js`

**Responsabilidades:**
- Generar `handshake_token` con TTL 600s
- Guardar en CacheService
- Construir OAuth URL para Google
- Status quo tokens (TTL check)

**Funciones principales:**
```
• _oauth_handleHandshake(uqo)      ← OAUTH_HANDSHAKE protocol
• _oauth_handleStatus(uqo)         ← OAUTH_STATUS query
• _oauth_handleRevoke(uqo)         ← Limpia token
• _oauth_generateToken()           ← oauth_<UUID>_<TS>
• _oauth_buildAuthUrl()            ← Construye URL OAuth
```

**Test:** `test_oauth_handleHandshake()` → debe retornar OAUTH_CHALLENGE con auth_url

---

### Archivo 2: `workflow_executor.js` (MODIFICAR)

**Ubicación:** `system_core/core/1_logic/workflow_executor.js`

**Cambios:**
- Agregar protocolo `WORKFLOW_RESUME` (nuevo)
- Función `_workflow_execute()` → detecta OAUTH_HANDLER y pausa
- Función `_workflow_resume()` → inyecta token en contexto, reanuda
- Helpers de persistencia de estados

**Nuevas funciones:**
```
• _workflow_resume(uqo)            ← WORKFLOW_RESUME protocol
• _workflow_saveContext()          ← Guarda en Cache
• _workflow_loadContext()          ← Carga desde Cache
• _workflow_executeStep()          ← Delega a providers con contexto
```

**Estados soportados:**
```
RUNNING → PENDING_OAUTH ↔ RUNNING → OK/ERROR
```

**Test:** `test_workflow_pauseResume()` → ejecuta→pausa→reanuda→ok

---

### Archivo 3: `provider_drive.js` (MODIFICAR)

**Ubicación:** `system_core/core/2_providers/provider_drive.js`

**Cambios:**
- Nueva función `_drive_handleAtomCreate_WithUserAuth()` 
- Usa Google Drive API v3 con UrlFetchApp
- Si `context.oauth_tokens.drive` existe → API call en lugar de DriveApp

**Flujo:**
```
ATOM_CREATE request
    ↓
¿context.oauth_tokens.drive existe?
    ├─ SÍ → Usa Drive API v3 con Bearer token
    │       Carpeta creada en Drive del usuario
    └─ NO  → Usa DriveApp (owner)
```

**Test:** `test_drive_withUserAuth()` → carpeta en user Drive (no owner)

---

### Archivo 4: OAuth Credentials (CONFIGURACIÓN)

**Ubicación:** Google Cloud Console + Script Properties

**Pasos:**
1. Google Cloud Console → Create OAuth 2.0 Web App
2. Authorized redirect: `https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercallback`
3. Guardar en Script Properties:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

---

## 📊 Tareas por Día (Fase 1)

```
Día 1 (Afternoon)
├─ oauth_handler.js: _oauth_generateToken() + _oauth_buildAuthUrl()
├─ Test básico: token generado con formato correcto
└─ Deploy: clasp push

Día 2
├─ oauth_handler.js: _oauth_handleHandshake() completo
├─ Test: OAUTH_CHALLENGE respuesta válida con auth_url
├─ provider_system_logic.js: Agregar ruta
└─ Deploy: clasp push

Día 2-3
├─ workflow_executor.js: _workflow_execute() + pause logic
├─ Test: Workflow pausa en OAUTH_HANDLER step
└─ Deploy: clasp push

Día 3-4
├─ workflow_executor.js: _workflow_resume() + context injection
├─ provider_drive.js: _drive_handleAtomCreate_WithUserAuth()
├─ Tests: E2E pause→resume workflow
└─ Deploy: clasp push

Día 4-5
├─ OAuth credentials: Setup en Google Cloud + Script Properties
├─ E2E test completo: form→handshake→resume→drive
├─ Documentación: Actualizar ADR-020 con ejemplos reales
└─ Deploy + merge
```

---

## 🟨 Decisiones de Implementación

✅ **Pausable state es explícito:** Solo OAUTH_HANDLER steps con `on_success: 'PAUSE_FOR_USER_AUTH'` pausan  
✅ **Tokens en Cache:** TTL corto (10 min) = seguridad + simpleza, sin BD extra  
✅ **Context es JSON:** `$context.oauth_tokens[provider]` limpio y serializable  
✅ **Frontend maneja popup:** Core NO invoca navegador, solo genera URLs  
✅ **Provider-agnóstico:** Patrón `use_oauth_token` extensible a Notion, Slack, etc.

---

## 🔴 Riesgos Identificados

| Riesgo | Mitigación |
|--------|-----------|
| Token expirado antes de reanudar (>10 min) | TTL corto (600s), frontend muestra countdown |
| Scopes insuficientes (solo drive.readonly) | Error claro OAUTH_INSUFFICIENT_SCOPES, reintentar |
| CSRF attack en callback | State parameter = handshake_token, validar en callback |
| Token guardado en localStorage | Nunca guardar, solo en Transit (postMessage) |
| User rechaza OAuth | Registrar, permitir reintentar, no fallar workflow |

---

## 📚 Archivos de Referencia

| Archivo | Ubicación | Propósito |
|---------|-----------|----------|
| ADR-020 | `Documentacion/ADRs/` | Especificación técnica completa |
| IMPLEMENTATION_PLAN | `Documentacion/ADRs/` | Detalles de cada tarea (pseudocódigo) |
| STATUS (este archivo) | `Documentacion/ADRs/` | Resumen ejecutivo |

---

## ✅ Pre-requisitos Fase 1

- [ ] Google Cloud Project con OAuth 2.0 credentials
- [ ] Google Drive API habilitada
- [ ] Leer ADR-020 sección "Solución"
- [ ] Entender workflow DAG con stations
- [ ] Familiaridad con CacheService (GAS)

---

## 🎮 Testing Strategy Fase 1

### Unit Tests
```
✓ test_oauth_generateToken()
✓ test_oauth_handleHandshake()
✓ test_oauth_handleStatus() 
✓ test_workflow_pauseResume()
✓ test_drive_withUserAuth()
```

### Integration Tests
```
✓ route() → OAUTH_HANDSHAKE desencadenado por WORKFLOW_EXECUTE
✓ route() → WORKFLOW_RESUME con token válido
✓ Token inyectado en $context.oauth_tokens[provider]
```

### E2E Test
```
1. executeWorkflow(form_data)
   → Resultado: status=PENDING, items=[OAUTH_CHALLENGE]

2. resumeWorkflow(token)
   → Resultado: status=OK, metadata.steps_executed=N
   → Verificar: Carpeta en Drive del usuario (no owner)
```

---

## 🚀 Cómo Comenzar

**Opción A: Implementación Guiada**
> "Vamos paso a paso. Empezamos con oauth_handler.js"
- Yo creo la estructura base
- Tú proporciona feedback
- Iteramos hasta que funcione

**Opción B: Implementación Independiente**
> "Usa el plan como guía"
- Lees IMPLEMENTATION_PLAN.md
- Implementas los tasks
- Yo reviso + sugiero mejoras

**Recomendación:** Opción A (más rápido, menos errores)

---

## 📍 Próximos Pasos

1. ✅ **Plan creado** ← Estamos aquí
2. ⏳ **Aprobación** - ¿Looks good?
3. ⏳ **Fase 1: Kickoff** - Comenzamos con oauth_handler.js
4. ⏳ **Weekly check-ins** - Validamos progreso

---

**¿Listo para comenzar Fase 1?** 🚀

Responde con:
- `sí, opción A (guiada)` 
- `sí, opción B (independiente)`
- o `espera, tengo preguntas`
