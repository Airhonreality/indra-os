# ADR-020: Protocolo de Autenticación Escalonada en Workflows

**Estado:** PROPUESTO  
**Fecha:** 2026-03-21  
**Autor:** INDRA Engineering  
**Impacto:** Workflows, Protocolos, Autenticación  

---

## Problema

Los workflows requieren acceso a recursos pertenecientes al **usuario final** (su Google Drive, Notion, etc.), pero INDRA corre bajo las credenciales del **propietario del deployment**. 

Hoy:
- ❌ Un workflow que necesita escribir en Drive del usuario → FALLA (permisos del owner)
- ❌ No hay forma de "pausar" un workflow para que el usuario autorice
- ❌ Tokens de acceso no son componibles en DAGs

**Necesidad:** Un workflow debe poder detener su ejecución en un punto específico, solicitar autorización OAuth del usuario, reanudar con el token obtenido, e inyectarlo en steps posteriores.

---

## Solución: Protocolo OAUTH_HANDSHAKE (PAUSABLE WORKFLOW STATE)

### 1. Arquitectura General

```
Frontend (Usuario)           Core (GAS)
    │                          │
    ├─ Rellena form ─────────→ SCHEMA_SUBMIT
    │                          │
    │                    ┌─────▼─────┐
    │◄─ OAUTH_CHALLENGE ─│ s1: OAuth │
    │   (pendiente)      │ Handshake │
    │                    └───────────┘
    │
    ├─ Popup Auth ────────────→ Google OAuth Flow
    │                          │
    │◄─ Token desde callback ──┘
    │
    ├─ WORKFLOW_RESUME────────→ Inyecta token en contexto
    │   (handshake_token,      │
    │    access_token)    ┌────▼───────┐
    │                     │ s2: Drive   │
    │                     │ (autorizado)│
    │                     └─────────────┘
    │
    │                     ┌─────────────┐
    │                     │ s3: Guardar │
    │                     │ en Drive    │
    │                     └─────┬───────┘
    │◄─ WORKFLOW_SUCCESS ──────┘
```

### 2. Conceptos Clave

#### 2.1 Estados de Workflow

```
RUNNING
  ├─ OK (todos los steps completados)
  ├─ ERROR (un step falló)
  └─ PENDING (pausado esperando acción externa)
       └─ PENDING_OAUTH (específicamente, esperando autorización)
```

#### 2.2 Handshake Token

Token temporal generado por el Core:
```
Formato:  oauth_<UUID_SHORT>_<TIMESTAMP>
TTL:      600 segundos (10 minutos)
Storage:  CacheService (GAS)
Payload:
{
  "workflow_id": "wf_abc123",
  "engine": "OAUTH_HANDLER",
  "provider": "drive",            // drive, notion, slack, etc.
  "scopes": ["drive"],
  "created_at": 1711011234,
  "resumed": false,
  "access_token": null
}
```

---

## 3. Protocolos Involucrados

### 3.1 OAUTH_HANDSHAKE (nuevo)

**Responsable:** `provider_system_logic.js`

```javascript
{
  provider: 'system',
  protocol: 'OAUTH_HANDSHAKE',
  workspace_id: 'ws_demo',
  data: {
    workflow_id: 'wf_abc123',
    engine: 'OAUTH_HANDLER',
    provider: 'drive',        // Qué servicio pide autorización
    scopes: ['drive'],        // OAuth scopes
    redirect_uri: 'https://indra.system/oauth/callback'
  }
}
```

**Respuesta:**
```javascript
{
  items: [{
    id: 'HANDSHAKE_TOKEN',
    class: 'OAUTH_CHALLENGE',
    handle: { label: 'Autoriza acceso a Google Drive' },
    payload: {
      handshake_token: 'oauth_a1b2c3_1711011234',
      auth_url: 'https://accounts.google.com/o/oauth2/v2/auth?...',
      provider: 'drive',
      ttl: 600
    }
  }],
  metadata: {
    status: 'PENDING',
    workflow_id: 'wf_abc123',
    message: 'Esperando autorización del usuario'
  }
}
```

**Acción del frontend:**
1. Detecta `status: 'PENDING'` y `class: 'OAUTH_CHALLENGE'`
2. Abre popup con `auth_url`
3. Usuario autoriza → callback redirige a frontend con `code`
4. Frontend intercambia `code` por `access_token` (server-side en Core o via Google)
5. Llama `WORKFLOW_RESUME`

### 3.2 WORKFLOW_RESUME (nuevo)

**Responsable:** `workflow_executor.js`

```javascript
{
  provider: 'system',
  protocol: 'WORKFLOW_RESUME',
  workspace_id: 'ws_demo',
  data: {
    workflow_id: 'wf_abc123',
    handshake_token: 'oauth_a1b2c3_1711011234',
    access_token: 'ya29.a0AfH6SMBx...',
    access_token_type: 'Bearer',
    expires_in: 3599
  }
}
```

**Flujo interno:**
1. Validar `handshake_token` en Cache
2. Verificar que no esté resumido ya
3. Inyectar `access_token` en `$context.oauth_tokens[provider]`
4. Reanudar execution desde el siguiente step
5. Si error → `status: 'ERROR'`
6. Si éxito → continúa hasta el siguiente OAUTH_HANDSHAKE o fin

**Respuesta:**
```javascript
{
  items: [],
  metadata: {
    status: 'OK',
    workflow_id: 'wf_abc123',
    message: 'Flujo reanudado. Continuando desde step s2...',
    execution: { ... }
  }
}
```

### 3.3 WORKFLOW_STATUS (nuevo, auxiliar)

Permite verificar estado sin reanudar:

```javascript
{
  provider: 'system',
  protocol: 'WORKFLOW_STATUS',
  query: { workflow_id: 'wf_abc123', handshake_token: '...' }
}
```

---

## 4. Descriptor de Workflow (DAG)

### 4.1 Sintaxis de Steps con OAuth

```json
{
  "id": "my_workflow",
  "handle": { "label": "Mi Flujo con Login" },
  "trigger": { "type": "SCHEMA_SUBMIT" },
  "payload": {
    "stations": [
      {
        "id": "s1",
        "label": "Captura de datos",
        "engine": "AEE_RUNNER",
        "schema_id": "schema_abc123"
      },
      {
        "id": "s_oauth",
        "label": "Autoriza acceso a tu Drive",
        "engine": "OAUTH_HANDLER",
        "provider": "drive",
        "scopes": ["drive.file"],
        "depends_on": ["s1"],
        "on_success": "PAUSE_FOR_USER_AUTH"
      },
      {
        "id": "s2",
        "label": "Crear carpeta en tu Drive",
        "engine": "DRIVE_ENGINE",
        "protocol": "ATOM_CREATE",
        "context_id": "ROOT",
        "data": {
          "name": "=payload.folder_name"
        },
        "depends_on": ["s_oauth"],
        "use_oauth_token": "drive"
      },
      {
        "id": "s3",
        "label": "Guardar archivo",
        "engine": "DRIVE_ENGINE",
        "protocol": "ATOM_CREATE",
        "context_id": "=$steps.s2.items[0].id",
        "use_oauth_token": "drive",
        "depends_on": ["s2"]
      }
    ]
  }
}
```

### 4.2 Evaluación de `use_oauth_token`

Cuando un step tiene `use_oauth_token: 'drive'`:

1. El provider del step verifica `$context.oauth_tokens['drive']`
2. Si existe token → lo usa (en lugar de credenciales del owner)
3. Si no existe → ERROR `OAUTH_TOKEN_MISSING`

**Implementación en provider_drive.js:**
```javascript
function _drive_handleAtomCreate(uqo) {
  // ...
  const accessToken = uqo.context?.oauth_tokens?.drive;
  
  if (accessToken) {
    // Usar DriveApp del usuario (via UrlFetchApp + Google Drive API v3)
    return _drive_handleAtomCreate_WithUserAuth(uqo, accessToken);
  } else {
    // Usar DriveApp del owner (comportamiento actual)
    return _drive_handleAtomCreate_Default(uqo);
  }
}
```

---

## 5. Ciclo de Vida Completo

### Secuencia UML

```
User            Frontend          Core            Cache (GAS)
  │                │                │                │
  ├─ Llena form ──→│ SCHEMA_SUBMIT  │                │
  │                ├───────────────→│                │
  │                │                ├─ s1: AEE ─────┤
  │                │                ├─ s_oauth ─────┤
  │                │                │ genera token  │ oauth_XXX
  │                │◄─ PENDING ─────┤                │ { workflow_id, ... }
  │                │ CHALLENGE      │                │
  │                │                │                │
  ├─ Pulsa Auth ──→│ Abre popup     │                │
  │                ├─ Google OAuth  │                │
  │◄─ Autoriza ────┤                │                │
  │                ├─ code param ───┤                │
  │                │                ├─ Intercambia  │
  │                │                │ code→token    │
  │                │                │                │
  ├─ [cont] ──────→│ WORKFLOW_RESUME│                │
  │                │ (token)        ├────────────────┤
  │                │                │ Valida token  │
  │                │                │ Inyecta en ctx│
  │                │◄─ OK (s2 init) │ Reanuda desde │
  │                │ RUNNING        │ s2            │
  │                │                │                │
  │                │                ├─ s2: Drive ───┤
  │                │                │ (user auth)   │
  │                │                ├─ s3: Drive ───┤
  │                │                │ (user auth)   │
  │                │◄─ SUCCESS ─────┤                │
  │◄─ resultado ───│                │                │
```

---

## 6. Casos de Error

### 6.1 Token Expirado

- **Payload:** `WORKFLOW_RESUME` pero token ya pasado en Cache
- **Respuesta:** `{ status: 'ERROR', code: 'OAUTH_TOKEN_EXPIRED', message: '10 minutos sin reanudar' }`
- **Frontend:** Reinicia desde s_oauth (nuevo popup)

### 6.2 Step Requiere OAuth pero Faltan Credenciales

- **Condición:** `use_oauth_token: 'drive'` pero contexto vacío
- **Respuesta:** `{ status: 'ERROR', code: 'OAUTH_TOKEN_MISSING' }`
- **Frontend:** Intenta saltar al step anterior con OAuth

### 6.3 Provider No Soporta OAuth

- **Condición:** `OAUTH_HANDLER` con `provider: 'notion'` pero sin handler
- **Respuesta:** `{ status: 'ERROR', code: 'PROVIDER_OAUTH_UNSUPPORTED' }`
- **Solución:** ADR futura para Notion + API key

---

## 7. Implementación (Fases)

### Fase 1: Core (INMEDIATO)
- [ ] `oauth_handler.js` - Genera handshake tokens
- [ ] Actualizar `workflow_executor.js` - Soporte para PAUSE y RESUME
- [ ] Actualizar `provider_drive.js` - Aceptar `use_oauth_token`

### Fase 2: Frontend (DESPUÉS)
- [ ] Detectar `OAUTH_CHALLENGE` en respuesta
- [ ] Popup de OAuth con manejo de callback
- [ ] Llamar `WORKFLOW_RESUME` con token

### Fase 3: Seguridad (FUTURO)
- [ ] Encriptar tokens en Cache
- [ ] Validar origen de callback (CSRF)
- [ ] Auditar acceso de tokens

---

## 8. Referencias

- **ADR-003:** Soberanía Glandular (workflows)
- **ADR-018:** Red de Pulsos (async)
- **DATA_CONTRACTS §7.1:** DAG canónico
- **RFC 6749:** OAuth 2.0 Authorization Framework

---

## 9. Decisiones Tomadas

✅ **PAUSE es explícito:** Un step con `on_success: 'PAUSE_FOR_USER_AUTH'` detiene y espera  
✅ **Tokens vía Cache:** TTL corto (10 min) → seguridad + simpleza  
✅ **Frontend maneja popup:** Core no invoca navegador  
✅ **Inyección en contexto:** `$context.oauth_tokens[provider]` limpio y accesible  
✅ **Provider-agnóstico:** Fácil agregar Notion, Slack, etc.

---

## Aprobación

- [ ] Tech Lead
- [ ] Security Review
- [ ] UX Review (popup flow)
