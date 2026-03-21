# 🛠️ Plan de Implementación: ADR-020 (OAuth en Workflows)

**Objetivo:** Implementar protocolo de autenticación escalonada en workflows  
**Duración estimada:** 2-3 semanas (3 fases secuenciales)  
**Status:** 📋 PLANIFICACIÓN  

---

## 📊 Resumen Ejecutivo

| Fase | Duración | Responsabilidad | Status |
|------|----------|-----------------|--------|
| **1: Core** | 4-5 días | Backend (GAS) | ⏳ Próximo |
| **2: Frontend** | 4-5 días | Frontend (React) | ⏳ Después |
| **3: Seguridad** | 2-3 días | Security Review | ⏳ Final |

**Salidas esperadas:**
- ✅ Workflows pueden pausarse esperando OAuth
- ✅ Usuarios autorizan directamente (sin owner)
- ✅ Tokens inyectados en contexto de steps posteriores
- ✅ Seed demo funciona con OAuth flow

---

## 🔴 FASE 1: CORE BACKEND (4-5 días)

### Objetivo
Implementar protocolos `OAUTH_HANDSHAKE` y `WORKFLOW_RESUME` en GAS.

### Archivos a Crear/Modificar

```
system_core/core/
├── 2_providers/
│   ├── oauth_handler.js         ← CREAR (nuevo)
│   └── provider_drive.js         ← MODIFICAR (agregar use_oauth_token)
├── 1_logic/
│   ├── workflow_executor.js      ← MODIFICAR (pausable states)
│   ├── provider_system_logic.js  ← MODIFICAR (OAUTH_HANDSHAKE handler)
│   └── protocol_router.js        ← VERIFICAR (ya soporta protocolos)
└── 0_utils/
    └── token_cache_manager.js    ← CREAR (opcional, para manejo de TTL)
```

---

### TAREA 1.1: Crear `oauth_handler.js` (90-120 líneas)

**Ubicación:** `system_core/core/2_providers/oauth_handler.js`

**Responsabilidad:** Generar handshake tokens y gestionar lifecycle de autenticación.

**Pseudocódigo:**

```javascript
/**
 * OAUTH_HANDLER Provider
 * Genera tokens temporales (oauth_<UUID>_<TIMESTAMP>) con TTL 600s
 * Soporta: drive, notion, slack (extensible)
 */

function oauthHandlerRouter(uqo) {
  const { protocol, data } = uqo;
  
  switch (protocol) {
    case 'OAUTH_HANDSHAKE':
      return _oauth_handleHandshake(uqo);
    case 'OAUTH_STATUS':
      return _oauth_handleStatus(uqo);
    case 'OAUTH_REVOKE':
      return _oauth_handleRevoke(uqo);
    default:
      return ErrorResult('OAUTH_PROTOCOL_UNKNOWN', protocol);
  }
}

/**
 * Genera handshake token y auth URL
 */
function _oauth_handleHandshake(uqo) {
  const { workflow_id, engine, provider, scopes, redirect_uri } = uqo.data;
  
  // 1. Validar provider soportado
  const authConfig = _oauth_getAuthConfig(provider);
  if (!authConfig) {
    return ErrorResult('PROVIDER_OAUTH_UNSUPPORTED', provider);
  }
  
  // 2. Generar handshake_token
  const handshakeToken = _oauth_generateToken();  // oauth_abc123_1711011234
  
  // 3. Crear payload de cache
  const payload = {
    workflow_id,
    engine,
    provider,
    scopes,
    created_at: Math.floor(Date.now() / 1000),
    resumed: false,
    access_token: null,
    expires_at: Math.floor(Date.now() / 1000) + 600  // +10 min
  };
  
  // 4. Guardar en Cache (GAS CacheService)
  CacheService.getScriptCache().put(handshakeToken, JSON.stringify(payload), 600);
  
  // 5. Generar OAuth URL (Google)
  const authUrl = _oauth_buildAuthUrl(provider, {
    client_id: PropertiesService.getScriptProperties().getProperty('OAUTH_CLIENT_ID'),
    redirect_uri,
    scopes,
    state: handshakeToken  // ← Importante para validación
  });
  
  // 6. Retornar desafío
  return SuccessResult({
    items: [{
      id: 'HANDSHAKE_TOKEN',
      class: 'OAUTH_CHALLENGE',
      handle: { label: `Autoriza acceso a ${provider}` },
      payload: {
        handshake_token: handshakeToken,
        auth_url: authUrl,
        provider,
        ttl: 600,
        expires_at: payload.expires_at
      }
    }],
    metadata: {
      status: 'PENDING',
      workflow_id,
      message: 'Esperando autorización del usuario'
    }
  });
}

/**
 * Verifica estado de handshake_token
 */
function _oauth_handleStatus(uqo) {
  const { handshake_token } = uqo.query;
  
  const cached = CacheService.getScriptCache().get(handshakeToken);
  
  if (!cached) {
    return ErrorResult('OAUTH_TOKEN_EXPIRED', handshake_token);
  }
  
  const payload = JSON.parse(cached);
  
  return SuccessResult({
    items: [{
      id: handshake_token,
      class: 'OAUTH_STATUS',
      payload: {
        workflow_id: payload.workflow_id,
        provider: payload.provider,
        resumed: payload.resumed,
        has_token: !!payload.access_token,
        expires_in: payload.expires_at - Math.floor(Date.now() / 1000)
      }
    }]
  });
}

/**
 * Limpia handshake_token (revoke)
 */
function _oauth_handleRevoke(uqo) {
  const { handshake_token } = uqo.data;
  
  CacheService.getScriptCache().remove(handshake_token);
  
  return SuccessResult({
    metadata: { status: 'OK', message: 'Token revocado' }
  });
}

// ===== HELPERS =====

function _oauth_generateToken() {
  const uuid = Utilities.getUuid().substring(0, 8);
  const timestamp = Math.floor(Date.now() / 1000);
  return `oauth_${uuid}_${timestamp}`;
}

function _oauth_getAuthConfig(provider) {
  const configs = {
    'drive': {
      client_id: PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID'),
      auth_endpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      token_endpoint: 'https://oauth2.googleapis.com/token',
      default_scopes: ['drive.file', 'drive.readonly']
    },
    'notion': {
      // Futuro: API key en lugar de OAuth
      unsupported: true
    }
  };
  return configs[provider] || null;
}

function _oauth_buildAuthUrl(provider, params) {
  const config = _oauth_getAuthConfig(provider);
  
  const query = {
    client_id: params.client_id,
    redirect_uri: params.redirect_uri,
    response_type: 'code',
    scope: params.scopes.join(' '),
    state: params.state,
    access_type: 'offline',
    prompt: 'consent'
  };
  
  const queryString = Object.entries(query)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  
  return `${config.auth_endpoint}?${queryString}`;
}
```

**Loggers/Errores:**
- `OAUTH_TOKEN_CREATED` - Éxito
- `PROVIDER_OAUTH_UNSUPPORTED` - Provider no implementado
- `OAUTH_TOKEN_EXPIRED` - Token pasó TTL
- `OAUTH_CONFIG_MISSING` - Credenciales no configuradas

**Testing:**
```javascript
function test_oauth_handleHandshake() {
  const uqo = {
    protocol: 'OAUTH_HANDSHAKE',
    data: {
      workflow_id: 'wf_test',
      engine: 'OAUTH_HANDLER',
      provider: 'drive',
      scopes: ['drive.file'],
      redirect_uri: 'https://indra.system/oauth/callback'
    }
  };
  
  const result = oauthHandlerRouter(uqo);
  Logger.log(result);  // Debe retornar OAUTH_CHALLENGE con auth_url válida
}
```

---

### TAREA 1.2: Actualizar `provider_system_logic.js` (50 líneas)

**Ubicación:** `system_core/core/1_logic/provider_system_logic.js`

**Cambio:** Agregar handler para OAUTH_HANDSHAKE protocol

**Pseudocódigo:**

```javascript
// En provider_system_logic.gs, función principal route()

function _system_routeProtocol(uqo) {
  const { protocol } = uqo;
  
  // Protocolos existentes...
  
  switch (protocol) {
    // ... casos existentes ...
    
    case 'OAUTH_HANDSHAKE':
      return oauthHandlerRouter(uqo);  // Delegar a oauth_handler.js
    
    case 'OAUTH_STATUS':
      return oauthHandlerRouter(uqo);
    
    case 'OAUTH_REVOKE':
      return oauthHandlerRouter(uqo);
    
    // ... más casos ...
  }
}
```

**Validation:**
- Protocolo registrado en `protocol_router.js`
- Logs en `_system_logRouting()`

---

### TAREA 1.3: Actualizar `workflow_executor.js` (150-200 líneas)

**Ubicación:** `system_core/core/1_logic/workflow_executor.js`

**Cambios:**
1. Agregar soporte para estados PENDING y PENDING_OAUTH
2. Implementar WORKFLOW_RESUME protocol
3. Inyectar oauth_tokens en contexto

**Pseudocódigo:**

```javascript
/**
 * WORKFLOW_EXECUTOR - Actualizado para OAuth
 */

function workflowExecutorRoute(uqo) {
  const { protocol, data } = uqo;
  
  switch (protocol) {
    case 'WORKFLOW_EXECUTE':
      return _workflow_execute(uqo);
    case 'WORKFLOW_RESUME':       // ← NUEVO
      return _workflow_resume(uqo);
    case 'WORKFLOW_STATUS':
      return _workflow_getStatus(uqo);
    default:
      return ErrorResult('WORKFLOW_PROTOCOL_UNKNOWN', protocol);
  }
}

/**
 * Ejecuta workflow step por step
 * Si encuentra step con engine: OAUTH_HANDLER → pausa
 */
function _workflow_execute(uqo) {
  const { workflow_id, schema_id, payload } = uqo.data;
  
  // Cargar definición de workflow
  const workflow = _workflow_loadDefinition(workflow_id);
  if (!workflow) {
    return ErrorResult('WORKFLOW_NOT_FOUND', workflow_id);
  }
  
  // Crear contexto de ejecución
  const context = {
    workflow_id,
    schema_id,
    payload,      // Datos del formulario
    $steps: {},   // Resultados de steps anteriores
    oauth_tokens: {},  // ← Tokens OAuth inyectados aquí
    state: 'RUNNING',
    started_at: Math.floor(Date.now() / 1000),
    error: null
  };
  
  // Ejecutar stations
  try {
    for (const station of workflow.stations) {
      // ✓ Validar dependencias
      if (!_workflow_checkDependencies(station, context)) {
        context.state = 'ERROR';
        context.error = { code: 'DEPENDENCY_FAILED', station_id: station.id };
        break;
      }
      
      // ✓ Ejecutar step
      const result = _workflow_executeStep(station, context);
      context.$steps[station.id] = result;
      
      // ✓ Si es OAUTH_HANDLER y tiene on_success: PAUSE_FOR_USER_AUTH
      if (station.engine === 'OAUTH_HANDLER' &&
          station.on_success === 'PAUSE_FOR_USER_AUTH') {
        
        // PAUSAR WORKFLOW
        context.state = 'PENDING_OAUTH';
        context.pending_at = Math.floor(Date.now() / 1000);
        context.paused_at_station = station.id;
        
        // Guardar contexto para reanudar
        _workflow_saveContext(workflow_id, context);
        
        return SuccessResult({
          items: result.items,  // OAUTH_CHALLENGE desde oauth_handler
          metadata: {
            status: 'PENDING',
            workflow_id,
            workflow_state: 'PENDING_OAUTH',
            paused_at_station: station.id,
            message: 'Esperando autorización. Llamar WORKFLOW_RESUME con token.'
          }
        });
      }
      
      // Si error en step → detener
      if (result.error) {
        context.state = 'ERROR';
        context.error = result.error;
        break;
      }
    }
  } catch (e) {
    context.state = 'ERROR';
    context.error = {
      code: 'STEP_EXECUTION_ERROR',
      message: e.message,
      stack: e.stack
    };
  }
  
  // Guardar contexto final
  _workflow_saveContext(workflow_id, context);
  
  // Retornar resultado
  return SuccessResult({
    items: [],
    metadata: {
      status: context.state === 'ERROR' ? 'ERROR' : 'OK',
      workflow_id,
      workflow_state: context.state,
      steps_executed: Object.keys(context.$steps).length,
      error: context.error
    }
  });
}

/**
 * WORKFLOW_RESUME - Reanuda workflow pausado con token OAuth
 */
function _workflow_resume(uqo) {
  const { workflow_id, handshake_token, access_token, expires_in } = uqo.data;
  
  // 1. Validar handshake_token en Cache
  const cached = CacheService.getScriptCache().get(handshake_token);
  if (!cached) {
    return ErrorResult('OAUTH_TOKEN_EXPIRED', handshake_token);
  }
  
  const tokenPayload = JSON.parse(cached);
  const { provider } = tokenPayload;
  
  // 2. Cargar contexto pausado
  const context = _workflow_loadContext(workflow_id);
  if (!context || context.state !== 'PENDING_OAUTH') {
    return ErrorResult('WORKFLOW_NOT_PAUSED', workflow_id);
  }
  
  // 3. Inyectar token OAuth en contexto
  context.oauth_tokens[provider] = {
    access_token,
    token_type: 'Bearer',
    expires_at: Math.floor(Date.now() / 1000) + expires_in,
    injected_at: Math.floor(Date.now() / 1000)
  };
  
  // 4. Marcar handshake_token como resumido
  tokenPayload.resumed = true;
  tokenPayload.access_token = access_token;
  CacheService.getScriptCache().put(handshake_token, JSON.stringify(tokenPayload), 600);
  
  // 5. Reanudar desde next_station
  const workflow = _workflow_loadDefinition(workflow_id);
  const pausedStationIndex = workflow.stations.findIndex(
    s => s.id === context.paused_at_station
  );
  const nextStationIndex = pausedStationIndex + 1;
  
  // 6. Ejecutar stations restantes
  context.state = 'RUNNING';
  context.resumed_at = Math.floor(Date.now() / 1000);
  
  try {
    for (let i = nextStationIndex; i < workflow.stations.length; i++) {
      const station = workflow.stations[i];
      
      // ✓ Si step usa oauth_token, verificar que esté disponible
      if (station.use_oauth_token) {
        if (!context.oauth_tokens[station.use_oauth_token]) {
          context.state = 'ERROR';
          context.error = {
            code: 'OAUTH_TOKEN_MISSING',
            provider: station.use_oauth_token,
            station_id: station.id
          };
          break;
        }
      }
      
      const result = _workflow_executeStep(station, context);
      context.$steps[station.id] = result;
      
      if (result.error) {
        context.state = 'ERROR';
        context.error = result.error;
        break;
      }
    }
  } catch (e) {
    context.state = 'ERROR';
    context.error = { code: 'RESUME_ERROR', message: e.message };
  }
  
  // 7. Guardar contexto y retornar
  _workflow_saveContext(workflow_id, context);
  
  return SuccessResult({
    items: [],
    metadata: {
      status: context.state === 'ERROR' ? 'ERROR' : 'OK',
      workflow_id,
      workflow_state: context.state,
      resumed_from_station: context.paused_at_station,
      next_station_index: nextStationIndex,
      message: context.state === 'OK' 
        ? `Flujo reanudado. Continuando desde step ${workflow.stations[nextStationIndex].label}...`
        : `Error al reanudar: ${context.error.message}`
    }
  });
}

// ===== HELPERS =====

function _workflow_executeStep(station, context) {
  // Delegar al engine correspondiente (AEE_RUNNER, DRIVE_ENGINE, etc.)
  // Pasar contexto completo con oauth_tokens disponibles
  
  const stepUqo = {
    provider: station.engine.toLowerCase(),
    protocol: station.protocol,
    context: context,
    data: station.data
  };
  
  return route(stepUqo);
}

function _workflow_checkDependencies(station, context) {
  if (!station.depends_on) return true;
  
  for (const depId of station.depends_on) {
    if (!context.$steps[depId]) return false;
    if (context.$steps[depId].error) return false;
  }
  return true;
}

function _workflow_saveContext(workflow_id, context) {
  const cache = CacheService.getScriptCache();
  const key = `workflow_context_${workflow_id}`;
  cache.put(key, JSON.stringify(context), 3600);  // 1 hora
}

function _workflow_loadContext(workflow_id) {
  const cache = CacheService.getScriptCache();
  const key = `workflow_context_${workflow_id}`;
  const cached = cache.get(key);
  return cached ? JSON.parse(cached) : null;
}

function _workflow_loadDefinition(workflow_id) {
  // Cargar desde DB de workflow definitions
  // Por ahora: mock
  return WorkflowDb.get(workflow_id);
}
```

**Integración:**
- Actualizar `protocol_router.js` para reconocer `WORKFLOW_RESUME`
- Logs: `WORKFLOW_PAUSED`, `WORKFLOW_RESUMED`, `OAUTH_TOKEN_INJECTED`

**Testing:**
```javascript
function test_workflow_pauseResume() {
  // 1. Ejecutar workflow → detiene en OAUTH_HANDLER
  const executeResult = workflowExecutorRoute({
    protocol: 'WORKFLOW_EXECUTE',
    data: { workflow_id: 'wf_demo', schema_id: 'sch_1', payload: {...} }
  });
  
  // Debe retornar status: PENDING
  Logger.log('Execute:', executeResult.metadata.status);  // 'PENDING'
  
  // 2. Reanudar con token
  const resumeResult = workflowExecutorRoute({
    protocol: 'WORKFLOW_RESUME',
    data: {
      workflow_id: 'wf_demo',
      handshake_token: '...',
      access_token: 'ya29.a0AfH6SMBx...',
      expires_in: 3599
    }
  });
  
  // Debe retornar status: OK
  Logger.log('Resume:', resumeResult.metadata.status);  // 'OK'
}
```

---

### TAREA 1.4: Actualizar `provider_drive.js` (80-100 líneas)

**Ubicación:** `system_core/core/2_providers/provider_drive.js`

**Cambio:** Agregar soporte para `use_oauth_token`

**Pseudocódigo:**

```javascript
/**
 * DRIVE PROVIDER - Con soporte OAuth
 */

function driveHandlerRouter(uqo) {
  const { protocol, context } = uqo;
  
  // Pasar contexto (que incluye oauth_tokens) a todos los handlers
  switch (protocol) {
    case 'ATOM_CREATE':
      return _drive_handleAtomCreate(uqo, context);
    case 'ATOM_READ':
      return _drive_handleAtomRead(uqo, context);
    // ... más protocolos ...
    default:
      return ErrorResult('DRIVE_PROTOCOL_UNKNOWN', protocol);
  }
}

/**
 * ATOM_CREATE con soporte OAuth
 */
function _drive_handleAtomCreate(uqo, context) {
  const { data } = uqo;
  const hasOAuthToken = context?.oauth_tokens?.drive;
  
  if (hasOAuthToken) {
    // ✓ Usar token del usuario
    return _drive_handleAtomCreate_WithUserAuth(uqo, context.oauth_tokens.drive);
  } else {
    // ✓ Usar credenciales del owner (comportamiento actual)
    return _drive_handleAtomCreate_Default(uqo);
  }
}

/**
 * Crear atom en Drive usando token del usuario
 */
function _drive_handleAtomCreate_WithUserAuth(uqo, oauthToken) {
  const { data } = uqo;
  const { name, mimeType = 'application/vnd.google-apps.folder' } = data;
  
  // Usar Google Drive API v3 via UrlFetchApp
  const accessToken = oauthToken.access_token;
  
  try {
    const response = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'post',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        name,
        mimeType
      }),
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() !== 200) {
      const error = JSON.parse(response.getContentText());
      
      if (response.getResponseCode() === 401) {
        return ErrorResult('OAUTH_TOKEN_EXPIRED', error.error.message);
      } else if (response.getResponseCode() === 403) {
        return ErrorResult('OAUTH_INSUFFICIENT_SCOPES', error.error.message);
      } else {
        return ErrorResult('DRIVE_API_ERROR', error.error.message);
      }
    }
    
    const fileData = JSON.parse(response.getContentText());
    
    return SuccessResult({
      items: [{
        id: fileData.id,
        class: 'FOLDER',
        handle: { label: fileData.name, alias: fileData.id },
        payload: {
          drive_id: fileData.id,
          name: fileData.name,
          web_view_link: fileData.webViewLink,
          created_by: 'user_oauth'
        }
      }],
      metadata: {
        status: 'OK',
        source: 'user_drive',
        message: `Carpeta creada en Drive del usuario`
      }
    });
  } catch (e) {
    return ErrorResult('OAUTH_FETCH_ERROR', e.message);
  }
}

/**
 * Crear atom en Drive (default - owner credentials)
 */
function _drive_handleAtomCreate_Default(uqo) {
  // Código existente, sin cambios
  const { data } = uqo;
  const { name } = data;
  
  const folder = DriveApp.getFolderById(DriveApp.getRootFolder().getId())
    .createFolder(name);
  
  return SuccessResult({
    items: [{
      id: folder.getId(),
      class: 'FOLDER',
      handle: { label: folder.getName() },
      payload: { drive_id: folder.getId() }
    }]
  });
}
```

**Validación:**
- Si `context` no existe → usar default
- Si `oauth_tokens.drive` no existe pero `use_oauth_token: 'drive'` → ERROR
- Logs: `DRIVE_WITH_USER_AUTH`, `OAUTH_TOKEN_INVALID`, `OAUTH_INSUFFICIENT_SCOPES`

**Testing:**
```javascript
function test_drive_withUserAuth() {
  const context = {
    oauth_tokens: {
      drive: {
        access_token: 'ya29.a0AfH6SMBx...',
        expires_at: 1711011234
      }
    }
  };
  
  const result = driveHandlerRouter({
    protocol: 'ATOM_CREATE',
    context,
    data: { name: 'Mi carpeta' }
  });
  
  // Debe crear en Drive del usuario, no del owner
  Logger.log(result.metadata.source);  // 'user_drive'
}
```

---

### TAREA 1.5: Configuración de Propiedades (5 minutos)

**Ubicación:** `appsscript.json` + Google Cloud Console

**Pasos:**

1. **Crear OAuth 2.0 Credentials en Google Cloud:**
   - Ir a: https://console.cloud.google.com/apis/credentials
   - "Create Credentials" → "OAuth 2.0 Client ID"
   - Tipo: "Web application"
   - Authorized redirect URIs: `https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercallback`
   - Copiar: `Client ID` y `Client Secret`

2. **Guardar en Script Properties:**
   ```powershell
   clasp login  # Si no estás logueado
   clasp run setOAuthProperties  # Función helper
   ```

3. **Función helper en `core/0_gateway/api_gateway.js`:**
   ```javascript
   function setOAuthProperties() {
     const props = PropertiesService.getScriptProperties();
     props.setProperty('GOOGLE_CLIENT_ID', 'xxx.apps.googleusercontent.com');
     props.setProperty('GOOGLE_CLIENT_SECRET', 'xxx');
     Logger.log('OAuth properties set');
   }
   ```

4. **Verificar en Drive API:**
   - Project Settings → Enable "Google Drive API"

---

### 🎯 Checklist Fase 1

- [ ] `oauth_handler.js` creado (90-120 líneas)
  - [ ] `_oauth_handleHandshake()` funcional
  - [ ] Tokens guardados en CacheService con TTL 600s
  - [ ] Auth URL generadas correctamente
  - [ ] Tests pasan: `test_oauth_handleHandshake()`

- [ ] `provider_system_logic.js` actualizado
  - [ ] OAUTH_HANDSHAKE ruta a oauth_handler
  - [ ] Logs configurados

- [ ] `workflow_executor.js` actualizado
  - [ ] `_workflow_execute()` pausa en OAUTH_HANDLER
  - [ ] `_workflow_resume()` reanuda con token
  - [ ] Contexto guardado/cargado de Cache
  - [ ] Tests pasan: `test_workflow_pauseResume()`

- [ ] `provider_drive.js` actualizado
  - [ ] `_drive_handleAtomCreate_WithUserAuth()` usa Drive API v3
  - [ ] OAuth token inyectado correctamente
  - [ ] Tests pasan: `test_drive_withUserAuth()`

- [ ] OAuth credentials configuradas
  - [ ] Client ID en Script Properties
  - [ ] Google Drive API habilitada
  - [ ] Redirect URI válida

- [ ] Cobertura de tests
  - [ ] `test_oauth_*.gs` (oauth_handler)
  - [ ] `test_workflow_*.gs` (workflow_executor)
  - [ ] `test_drive_*.gs` (provider_drive)
  - [ ] Todos los tests verdes

- [ ] Cambios preparados para `clasp push`

---

## 🟡 FASE 2: FRONTEND REACT (4-5 días)

### Objetivo
Implementar popup de autorización y manejo de callback OAuthredirect.

### Archivos a Crear/Modificar

```
system_core/client/src/
├── components/
│   ├── OAuthPopup.jsx            ← CREAR (popup con auth_url)
│   └── WorkflowRunner.jsx         ← MODIFICAR (detectar OAUTH_CHALLENGE)
├── hooks/
│   ├── useWorkflow.js             ← MODIFICAR (agregar resumeWorkflow)
│   └── useOAuth.js                ← CREAR (manejo de tokens)
├── services/
│   └── workflowService.js         ← MODIFICAR (WORKFLOW_RESUME API call)
└── pages/
    └── OAuthCallback.jsx          ← CREAR (manejo de callback)
```

---

### TAREA 2.1: Crear `OAuthPopup.jsx` (60-80 líneas)

**Ubicación:** `system_core/client/src/components/OAuthPopup.jsx`

**Responsabilidad:** Abrir popup para que usuario autorice OAuth

**Pseudocódigo:**

```jsx
/**
 * OAuthPopup Component
 * Abre popup de OAuth, espera callback con authorization code
 * Intercambia code por access_token y reanuda workflow
 */

import React, { useEffect, useState } from 'react';
import { useWorkflow } from '../hooks/useWorkflow';

export function OAuthPopup({ challenge, onSuccess, onError }) {
  const { resumeWorkflow } = useWorkflow();
  const [popupWindow, setPopupWindow] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!challenge) return;
    
    // Extraer datos del challenge
    const { auth_url, handshake_token, provider, ttl } = challenge.payload;
    
    setLoading(true);
    
    // Abrir popup
    const popup = window.open(
      auth_url,
      'oauth_popup',
      'width=500,height=600,left=100,top=100'
    );
    
    setPopupWindow(popup);
    
    // Escuchar callback desde popup
    const handleCallback = async (event) => {
      // Validar origen (CSRF protection)
      if (event.origin !== window.location.origin) return;
      
      const { code, state, error } = event.data;
      
      if (error) {
        onError(error);
        setLoading(false);
        return;
      }
      
      if (code && state === handshake_token) {
        // Intercambiar code por access_token (backend)
        try {
          const response = await fetch('/api/auth/exchange-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, handshake_token, provider })
          });
          
          const { access_token, expires_in } = await response.json();
          
          // Reanudar workflow
          const resumeResult = await resumeWorkflow({
            handshake_token,
            access_token,
            expires_in
          });
          
          onSuccess(resumeResult);
          setLoading(false);
          popup.close();
          
        } catch (err) {
          onError(err.message);
          setLoading(false);
        }
      }
    };
    
    // Listener para postMessage desde popup
    window.addEventListener('message', handleCallback);
    
    return () => {
      window.removeEventListener('message', handleCallback);
      popup?.close();
    };
  }, [challenge]);
  
  return (
    <div className="oauth-popup-container">
      {loading && (
        <div className="oauth-loading">
          <p>Esperando autorización...</p>
          <small>Se abrirá un popup. No cierres esta ventana.</small>
        </div>
      )}
    </div>
  );
}
```

**Integración:**
- Importar en `WorkflowRunner.jsx`
- Mostrar cuando `response.metadata.status === 'PENDING'`
- CSS: overlay con spinner

---

### TAREA 2.2: Crear `OAuthCallback.jsx` (40-50 líneas)

**Ubicación:** `system_core/client/src/pages/OAuthCallback.jsx`

**Responsabilidad:** Página de callback que recibe authorization code

**Pseudocódigo:**

```jsx
/**
 * OAuthCallback
 * Página de callback para OAuth redirect
 * Recibe ?code=xxx&state=yyy
 * Envía message al popup opener
 */

import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export function OAuthCallback() {
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // Enviar datos al popup opener
    if (window.opener) {
      window.opener.postMessage(
        { code, state, error },
        window.location.origin
      );
    }
    
    // Cerrar popup
    setTimeout(() => window.close(), 1000);
  }, [searchParams]);
  
  return (
    <div className="oauth-callback-page">
      <p>Completando autenticación...</p>
      <p>Esta ventana se cerrará automáticamente.</p>
    </div>
  );
}
```

**Routing:**
- Agregar ruta en React Router: `/oauth/callback`
- Debe coincidir con `redirect_uri` en Google Console

---

### TAREA 2.3: Crear `useOAuth.js` Hook (50-60 líneas)

**Ubicación:** `system_core/client/src/hooks/useOAuth.js`

**Responsabilidad:** Lógica de intercambio code→token

**Pseudocódigo:**

```javascript
/**
 * useOAuth Hook
 * Maneja intercambio de authorization code por access_token
 */

import { useState, useCallback } from 'react';

export function useOAuth() {
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  /**
   * Intercambia authorization code por access_token
   * Llamada desde backend que tiene GOOGLE_CLIENT_SECRET
   */
  const exchangeCode = useCallback(async ({ code, handshake_token, provider }) => {
    setLoading(true);
    setError(null);
    
    try {
      // Llamar a backend endpoint (GAS)
      const response = await fetch('/api/oauth/exchange-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, handshake_token, provider })
      });
      
      if (!response.ok) {
        throw new Error(`Exchange failed: ${response.status}`);
      }
      
      const data = await response.json();
      setToken(data);
      
      return data;  // { access_token, expires_in, ... }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    token,
    error,
    loading,
    exchangeCode
  };
}
```

---

### TAREA 2.4: Modificar `WorkflowRunner.jsx` (80-100 líneas nuevas)

**Ubicación:** `system_core/client/src/components/WorkflowRunner.jsx`

**Cambios:**
1. Detectar respuesta con `status: 'PENDING'` y `class: 'OAUTH_CHALLENGE'`
2. Mostrar `OAuthPopup`
3. Al éxito → continuar workflow

**Pseudocódigo:**

```jsx
/**
 * WorkflowRunner Component
 * Ejecuta workflow, detecta OAUTH_CHALLENGE, muestra popup
 */

import React, { useState, useEffect } from 'react';
import { OAuthPopup } from './OAuthPopup';
import { useWorkflow } from '../hooks/useWorkflow';

export function WorkflowRunner({ workflowId, schemaData }) {
  const { executeWorkflow, resumeWorkflow } = useWorkflow();
  const [workflowState, setWorkflowState] = useState(null);
  const [oauthChallenge, setOauthChallenge] = useState(null);
  const [error, setError] = useState(null);
  
  /**
   * Ejecutar workflow
   */
  const handleExecuteWorkflow = async () => {
    try {
      const response = await executeWorkflow({
        workflow_id: workflowId,
        schema_id: schemaData.id,
        payload: schemaData.values
      });
      
      setWorkflowState(response.metadata);
      
      // ✓ Detectar OAUTH_CHALLENGE
      if (response.metadata.status === 'PENDING' &&
          response.items?.[0]?.class === 'OAUTH_CHALLENGE') {
        
        setOauthChallenge(response.items[0]);  // Mostrar popup
        
      } else if (response.metadata.status === 'OK') {
        // Workflow completó sin OAuth
        alert('✅ Workflow completado!');
      } else if (response.metadata.status === 'ERROR') {
        setError(response.metadata.error?.message || 'Error desconocido');
      }
    } catch (err) {
      setError(err.message);
    }
  };
  
  /**
   * Callback: OAuth completado exitosamente
   */
  const handleOAuthSuccess = async (resumeResult) => {
    setOauthChallenge(null);  // Cerrar popup
    setWorkflowState(resumeResult.metadata);
    
    if (resumeResult.metadata.status === 'ERROR') {
      setError(`Error después de OAuth: ${resumeResult.metadata.error?.message}`);
    } else {
      alert('✅ Flujo reanudado y completado!');
    }
  };
  
  /**
   * Callback: OAuth error
   */
  const handleOAuthError = (err) => {
    setError(`Error en autorización: ${err}`);
    setOauthChallenge(null);
  };
  
  return (
    <div className="workflow-runner">
      <button onClick={handleExecuteWorkflow} disabled={!workflowId}>
        Ejecutar Flujo
      </button>
      
      {error && <div className="error-message">{error}</div>}
      
      {oauthChallenge && (
        <OAuthPopup
          challenge={oauthChallenge}
          onSuccess={handleOAuthSuccess}
          onError={handleOAuthError}
        />
      )}
      
      {workflowState && (
        <div className="workflow-status">
          <p>Estado: {workflowState.status}</p>
          <p>Steps ejecutados: {workflowState.steps_executed}</p>
        </div>
      )}
    </div>
  );
}
```

---

### TAREA 2.5: Modificar `useWorkflow.js` Hook (50 líneas)

**Ubicación:** `system_core/client/src/hooks/useWorkflow.js`

**Cambios:**
1. Agregar función `resumeWorkflow()`
2. Llamar a `WORKFLOW_RESUME` en backend

**Pseudocódigo:**

```javascript
/**
 * useWorkflow Hook
 * Manejo de workflows (execute, resume, status)
 */

import { useCallback, useState } from 'react';

export function useWorkflow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  /**
   * Ejecutar workflow
   */
  const executeWorkflow = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol: 'WORKFLOW_EXECUTE',
          data: params
        })
      });
      
      if (!response.ok) throw new Error(`API responded with ${response.status}`);
      
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Reanudar workflow con token OAuth (NUEVO)
   */
  const resumeWorkflow = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/workflows/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol: 'WORKFLOW_RESUME',
          data: params
        })
      });
      
      if (!response.ok) throw new Error(`API responded with ${response.status}`);
      
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    executeWorkflow,
    resumeWorkflow,
    loading,
    error
  };
}
```

---

### TAREA 2.6: Crear endpoint backend `/api/oauth/exchange-code` (40 líneas)

**Ubicación:** `system_core/core/0_gateway/api_gateway.js`

**Responsabilidad:** Intercambiar authorization code por access_token

**Pseudocódigo:**

```javascript
/**
 * Endpoint: POST /api/oauth/exchange-code
 * Intercambia authorization code por access_token
 */

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const { code, handshake_token, provider } = data;
  
  if (!code || !handshake_token || !provider) {
    return HttpStatus(400, 'Missing parameters');
  }
  
  try {
    const accessTokenResponse = _oauth_exchangeCodeForToken({
      code,
      provider,
      redirect_uri: ScriptApp.getService().getUrl() + '?access=oauth_callback'
    });
    
    return HttpStatus(200, accessTokenResponse);
    
  } catch (err) {
    return HttpStatus(500, { error: err.message });
  }
}

/**
 * Intercambia authorization code por access_token
 */
function _oauth_exchangeCodeForToken({ code, provider, redirect_uri }) {
  const clientId = PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID');
  const clientSecret = PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_SECRET');
  
  const payload = {
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri
  };
  
  const response = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post',
    payload: payload,
    muteHttpExceptions: true
  });
  
  if (response.getResponseCode() !== 200) {
    throw new Error(`Token exchange failed: ${response.getContentText()}`);
  }
  
  const result = JSON.parse(response.getContentText());
  
  return {
    access_token: result.access_token,
    token_type: result.token_type,
    expires_in: result.expires_in,
    refresh_token: result.refresh_token
  };
}
```

---

### 🎯 Checklist Fase 2

- [ ] `OAuthPopup.jsx` creado
  - [ ] Abre popup con auth_url
  - [ ] Escucha postMessage desde callback
  - [ ] Llama a backend /api/oauth/exchange-code

- [ ] `OAuthCallback.jsx` creado
  - [ ] Recibe ?code=xxx&state=yyy
  - [ ] Envía postMessage al opener
  - [ ] Cierra popup automáticamente

- [ ] `useOAuth.js` hook creado
  - [ ] Intercambia code→token
  - [ ] Error handling

- [ ] `WorkflowRunner.jsx` actualizado
  - [ ] Detecta OAUTH_CHALLENGE
  - [ ] Muestra OAuthPopup
  - [ ] Maneja éxito/error

- [ ] `useWorkflow.js` actualizado
  - [ ] Función `resumeWorkflow()` agregada
  - [ ] Llamada POST a `/api/workflows/resume`

- [ ] Backend endpoint `/api/oauth/exchange-code` creado
  - [ ] Intercambia authorization code
  - [ ] Validación de parámetros
  - [ ] Error handling

- [ ] Routing actualizado
  - [ ] `/oauth/callback` mapea a `OAuthCallback.jsx`

- [ ] Tests
  - [ ] OAuthPopup abre y cierra correctamente
  - [ ] postMessage intercambia datos
  - [ ] Backend intercambia code→token

---

## 🟢 FASE 3: VALIDACIÓN E2E Y SEGURIDAD (2-3 días)

### Objetivo
Pruebas end-to-end, validaciones de seguridad, documentación.

### Checklist

- [ ] **Test E2E completo:**
  - [ ] Usuario rellena formulario
  - [ ] Workflow pausa en OAUTH_HANDLER
  - [ ] Frontend detecta OAUTH_CHALLENGE
  - [ ] Popup abre auth_url (Google)
  - [ ] Usuario autoriza
  - [ ] Callback redirige con code
  - [ ] Backend intercambia code→token
  - [ ] Workflow reanuda con token inyectado
  - [ ] Step s2 (Drive) usa token del usuario
  - [ ] Carpeta creada en Drive del usuario (no del owner)
  - [ ] Workflow completa, muestra éxito

- [ ] **Validaciones de Seguridad:**
  - [ ] CSRF token presente (state == handshake_token)
  - [ ] Validación de origen en postMessage
  - [ ] Access_token nunca guardado en localStorage
  - [ ] TTL de handshake_token expirado después de 10 min
  - [ ] Tokens encriptados en Cache (opcional)
  - [ ] Logs de auditoría: quién autorizó, cuándo, qué scope

- [ ] **Casos de Error:**
  - [ ] User rechaza OAuth → reintentar
  - [ ] Token expirado → error claro
  - [ ] Scopes insuficientes → error claro
  - [ ] Provider no soportado → error claro

- [ ] **Documentación:**
  - [ ] README en ADRs/ explicando flujo completo
  - [ ] Diagrama UML actualizado
  - [ ] Ejemplos con JSONs reales
  - [ ] Troubleshooting guide

- [ ] **Deployment:**
  - [ ] `clasp push` sin errores
  - [ ] Setup script ejecuta seedDemo
  - [ ] Prueba en Google Drive real

---

## 📋 Resumen Temporal

```
Inicio: Fase 1 (Backend)
├─ Día 1-2: oauth_handler.js + workflow_executor.js
├─ Día 2-3: provider_drive.js + configuración OAuth
├─ Día 4-5: Tests + validaciones
│
└─ Fin Fase 1 ──→ GATE: Tests verdes

Inicio: Fase 2 (Frontend)
├─ Día 1-2: OAuthPopup + OAuthCallback
├─ Día 2-3: Hooks (useOAuth, useWorkflow)
├─ Día 3-4: WorkflowRunner integration
├─ Día 4-5: Endpoint backend + routing
│
└─ Fin Fase 2 ──→ GATE: E2E funciona

Inicio: Fase 3 (Validación)
├─ Día 1: E2E completo (form → PDF → Drive)
├─ Día 1-2: Security validations
├─ Día 2-3: Documentación + troubleshooting
│
└─ Fin Fase 3 ──→ RELEASE
```

---

## 🚀 Kick-off

### Que hacer ahora:

1. **Aprueba este plan** (ajustes si es necesario)
2. **Startea FASE 1:** Comienzo con `oauth_handler.js`
3. **Feedback semanal:** Validar progreso con tests

### Preguntas pendientes:

- ¿Quieres encriptar tokens en Cache (seguridad extra)?
- ¿Agregar soporte para Notion (API key) en futuro?
- ¿Auditoría detallada de qué usuario autorizó a qué?

---

**Documento creado:** 2026-03-21  
**Última actualización:** [Ahora]  
**Status:** 📋 Listo para ejecución
