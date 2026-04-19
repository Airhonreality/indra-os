# ✅ Checklist de Aprobación: ADR-020 Implementation

**Uso:** Usa este checklist para validar cada fase ANTES de pasar a la siguiente.

---

## 🔴 PRE-REQUISITOS (Antes de Fase 1)

- [ ] ADR-020 completamente leído y entendido
- [ ] IMPLEMENTATION_PLAN.md revisado (al menos secciones Fase 1)
- [ ] Google Cloud Project creado con OAuth 2.0 credentials
- [ ] Google Drive API habilitada en proyecto
- [ ] Credenciales (Client ID + Secret) guardadas en nota privada
- [ ] `clasp` instalado y funcionando (`clasp --version`)

---

## 🟡 FASE 1: BACKEND COMPLETION

### oauth_handler.js Submission

**Archivo:** `system_core/core/2_providers/oauth_handler.js`

**Validación:**
- [ ] Archivo creado en ubicación correcta
- [ ] Sintaxis GAS válida (sin errores en editor)
- [ ] Función `oauthHandlerRouter()` definida (entry point)
- [ ] Función `_oauth_generateToken()` genera tokens con formato `oauth_<UUID>_<TS>`
- [ ] Función `_oauth_buildAuthUrl()` construye URLs OAuth válidas
- [ ] Función `_oauth_handleHandshake()` retorna `OAUTH_CHALLENGE` con auth_url
- [ ] Tokens guardados en `CacheService` con TTL 600 segundos
- [ ] Error handling: `PROVIDER_OAUTH_UNSUPPORTED`, `OAUTH_CONFIG_MISSING`
- [ ] Comentarios/logs en código es claro

**Test Execution:**
```javascript
function runPhase1Tests() {
  const results = [];
  
  results.push({
    name: 'test_oauth_generateToken',
    pass: test_oauth_generateToken()
  });
  
  results.push({
    name: 'test_oauth_handleHandshake', 
    pass: test_oauth_handleHandshake()
  });
  
  results.push({
    name: 'test_oauth_buildAuthUrl',
    pass: test_oauth_buildAuthUrl()
  });
  
  const allPass = results.every(r => r.pass);
  Logger.log('Phase 1 Tests:', allPass ? '✅ ALL PASS' : '❌ FAILURES');
  
  return results;
}
```

- [ ] `test_oauth_generateToken()` ✅ GREEN
- [ ] `test_oauth_handleHandshake()` ✅ GREEN
- [ ] `test_oauth_buildAuthUrl()` ✅ GREEN

---

### provider_system_logic.js Update

**Archivo:** `system_core/core/1_logic/provider_system_logic.js`

**Validación:**
- [ ] Cases agregados para OAUTH_HANDSHAKE, OAUTH_STATUS
- [ ] Delega a `oauthHandlerRouter()` correctamente
- [ ] Sin romper casos existentes
- [ ] Logs añadidos: `OAUTH_PROTOCOL_ROUTED`

---

### workflow_executor.js Update

**Archivo:** `system_core/core/1_logic/workflow_executor.js`

**Validación:**
- [ ] Función `_workflow_execute()` detecta OAUTH_HANDLER steps
- [ ] Si `on_success: 'PAUSE_FOR_USER_AUTH'` → pausa workflow
- [ ] Función `_workflow_resume()` implementada
- [ ] Resume inyecta `access_token` en `$context.oauth_tokens[provider]`
- [ ] Helpers `_workflow_saveContext()` y `_workflow_loadContext()` funcionan
- [ ] Estados soportados: RUNNING, PENDING_OAUTH
- [ ] Error handling: `WORKFLOW_NOT_FOUND`, `WORKFLOW_NOT_PAUSED`, `OAUTH_TOKEN_EXPIRED`

**Test Execution:**
- [ ] `test_workflow_execute()` ✅ GREEN (pausa en OAUTH_HANDLER)
- [ ] `test_workflow_resume()` ✅ GREEN (reanuda con token)
- [ ] `test_workflow_contextInjection()` ✅ GREEN (token inyectado)

---

### provider_drive.js Update

**Archivo:** `system_core/core/2_providers/provider_drive.js`

**Validación:**
- [ ] Función `_drive_handleAtomCreate_WithUserAuth()` implementada
- [ ] Usa Google Drive API v3 (`googleapis.com/drive/v3/files`)
- [ ] Autenticación: `Authorization: Bearer <access_token>`
- [ ] Si `context.oauth_tokens.drive` existe → WithUserAuth
- [ ] Si no existe → fallback a DriveApp (default)
- [ ] Error handling: `OAUTH_TOKEN_EXPIRED`, `OAUTH_INSUFFICIENT_SCOPES`

**Test Execution:**
- [ ] `test_drive_withUserAuth()` ✅ GREEN (usa Drive API)
- [ ] `test_drive_withoutUserAuth()` ✅ GREEN (fallback OK)

---

### OAuth Credentials Setup

**Ubicación:** Script Properties + Google Cloud

**Validación:**
- [ ] `GOOGLE_CLIENT_ID` guardado en Script Properties
- [ ] `GOOGLE_CLIENT_SECRET` guardado en Script Properties
- [ ] Google Cloud Project tiene Google Drive API habilitada
- [ ] Redirect URI en OAuth app: `https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercallback`
- [ ] Credenciales testadas: `clasp run test_oauth_getAuthConfig()` retorna config válida

---

### Integration Test E2E (Backend only)

**Procedimiento:**
```javascript
// Simular flujo completo en backend
function test_phase1_e2e() {
  // 1. Ejecutar workflow con OAUTH_HANDLER step
  const executeResult = workflowExecutorRoute({
    protocol: 'WORKFLOW_EXECUTE',
    data: { workflow_id: 'wf_test', payload: {...} }
  });
  
  // Verificar:
  const challenge = executeResult.items[0];
  assert(challenge.class === 'OAUTH_CHALLENGE', 'Challenge generado');
  assert(challenge.payload.auth_url.includes('accounts.google.com'), 'Auth URL válida');
  assert(executeResult.metadata.status === 'PENDING', 'Workflow pausado');
  
  // 2. Reanudar con token (mock)
  const resumeResult = workflowExecutorRoute({
    protocol: 'WORKFLOW_RESUME',
    data: {
      workflow_id: 'wf_test',
      handshake_token: challenge.payload.handshake_token,
      access_token: 'ya29.mock_token',
      expires_in: 3599
    }
  });
  
  // Verificar:
  assert(resumeResult.metadata.status === 'OK', 'Workflow reanudado');
  Logger.log('✅ Phase 1 E2E test PASS');
}
```

- [ ] `test_phase1_e2e()` ✅ GREEN

---

### Phase 1 Documentation

- [ ] Comentarios en código explicando lógica compleja
- [ ] Logs configurados: `OAUTH_HANDSHAKE_GENERATED`, `WORKFLOW_PAUSED`, `TOKEN_INJECTED`
- [ ] README.md actualizado con overview de cambios
- [ ] No hay errores de compilación: `clasp push` sin warnings

---

### Phase 1 Deployment

- [ ] `clasp push` ejecutado exitosamente
- [ ] No hay errores en deployment
- [ ] Script ejecutable vía `clasp run`
- [ ] Cambios compartidos/merged a rama principal

---

## 🟢 FASE 2: FRONTEND COMPLETION

### Frontend Components Created

**Archivos:**
- [ ] `OAuthPopup.jsx` (60-80 líneas) → Popup + postMessage
- [ ] `OAuthCallback.jsx` (40-50 líneas) → Callback handler

**Validación OAuthPopup.jsx:**
- [ ] Abre popup con `auth_url`
- [ ] Escucha `message` event del popup
- [ ] Valida `event.origin` (CSRF protection)
- [ ] Intercambia code→token llamando `/api/oauth/exchange-code`
- [ ] Callback `onSuccess` llamado al completar
- [ ] Callback `onError` llamado en error
- [ ] Popup se cierra automáticamente

**Validación OAuthCallback.jsx:**
- [ ] Ruta `/oauth/callback` apunta a este componente
- [ ] Extrae `?code=XXX&state=YY` de URL
- [ ] Envía `postMessage` al popup opener
- [ ] Se cierra automáticamente después de 1s

---

### Frontend Hooks Created

**Archivos:**
- [ ] `useOAuth.js` (50-60 líneas) → Intercambio de código
- [ ] Modificación `useWorkflow.js` → `resumeWorkflow()` agregado

**Validación useOAuth.js:**
- [ ] Función `exchangeCode()` implementada
- [ ] Llama POST `/api/oauth/exchange-code`
- [ ] Retorna `{ access_token, expires_in }`
- [ ] Error handling completo

**Validación useWorkflow.js:**
- [ ] Función `resumeWorkflow()` agregada
- [ ] Llama POST `/api/workflows/resume`
- [ ] Pasa `handshake_token`, `access_token`, `expires_in`

---

### Frontend Components Updated

**Archivo:** `WorkflowRunner.jsx` (80-100 líneas nuevas)

**Validación:**
- [ ] Detecta respuesta con `status: 'PENDING'` y `class: 'OAUTH_CHALLENGE'`
- [ ] Extrae `challenge.payload.auth_url`
- [ ] Renderiza `<OAuthPopup challenge={...} onSuccess={...} />`
- [ ] Callback `onSuccess` reanuda con token
- [ ] Callback `onError` muestra mensaje claro
- [ ] Workflow state actualizado post-resume

---

### Backend Endpoint Created

**Ubicación:** `system_core/core/0_gateway/api_gateway.js`

**Validación:**
- [ ] Endpoint POST `/api/oauth/exchange-code` existe
- [ ] Parámetros: `code`, `handshake_token`, `provider`
- [ ] Intercambia code→token usando Google OAuth API
- [ ] Guarda `GOOGLE_CLIENT_SECRET` desde Script Properties
- [ ] Retorna: `{ access_token, token_type, expires_in }`
- [ ] Error handling: 400 (invalid params), 401 (bad code), 500 (server error)

---

### Frontend Routing Updated

**Archivo:** `src/Router.jsx` o `App.jsx`

**Validación:**
- [ ] Ruta `/oauth/callback` mapeada a `OAuthCallback.jsx`
- [ ] URL coincide con `redirect_uri` en Google Cloud OAuth app

---

### Phase 2 Integration Test

**Procedimiento (Frontend + Backend):**
```javascript
// En browser console o Cypress
function test_phase2_e2e() {
  // 1. Ejecutar workflow
  const triggerButton = document.querySelector('[data-testid="execute-workflow"]');
  triggerButton.click();
  
  // Esperar OAUTH_CHALLENGE
  await waitFor(() => {
    const popup = document.querySelector('.oauth-popup');
    assert(popup !== null, 'OAuthPopup renderizado');
  });
  
  // 2. Simular auth callback (en test environment)
  window.opener?.postMessage({
    code: 'MOCK_CODE',
    state: 'MOCK_HANDSHAKE_TOKEN'
  }, window.location.origin);
  
  // 3. Esperar WORKFLOW_RESUME
  await waitFor(() => {
    const status = document.querySelector('[data-testid="workflow-status"]');
    assert(status.textContent.includes('OK'), 'Workflow completado');
  });
  
  // 4. Verificar que popup se cerró
  assert(document.querySelector('.oauth-popup') === null, 'Popup cerrado');
  
  Logger.log('✅ Phase 2 E2E test PASS');
}
```

- [ ] Test E2E completo ✅ GREEN

---

### Phase 2 Deployment

- [ ] `npm run build` ejecuta sin errores
- [ ] No hay warnings en consola
- [ ] Cambios committed + pushed

---

## 🔵 FASE 3: VALIDATION COMPLETION

### E2E Test Completo (User → Output)

**Procedimiento:**
```
1. Usuario accede a INDRA, selecciona "Mi Flujo Demo"
2. Abre form (AEE_RUNNER)
3. Rellena: nombre, email, etc.
4. Pulsa "Enviar"
5. ✅ SCHEMA_SUBMIT → workflow iniciado
6. Workflow ejecuta s1 (AEE)
7. Workflow pausa en s_oauth (OAUTH_HANDLER)
8. ✅ Frontend detecta OAUTH_CHALLENGE
9. Popup abre Google OAuth
10. Usuario autoriza "Ver/crear/editar archivos en Drive"
11. ✅ Backend intercambia authorization code
12. Workflow reanuda con access_token en contexto
13. ✅ Step s2 (DRIVE_ENGINE) crea carpeta en DRIVE DEL USUARIO
   (Verificar: Carpeta existe en https://drive.google.com/drive/u/0/home)
14. Step s3 (DOCUMENT_ENGINE) genera PDF
15. Step s4 (DRIVE_ENGINE) guarda PDF en carpeta
   (Verificar: PDF existe en carpeta usuario)
16. Workflow completa, status=OK
17. ✅ Frontend muestra "Completado! PDF en tu Drive"
```

- [ ] E2E test ejecutado exitosamente
- [ ] Carpeta evidencia creada en Drive del usuario (no owner)
- [ ] PDF generado con datos del formulario
- [ ] No hay errores técnicos en logs

---

### Security Validation

**CSRF Protection:**
- [ ] `state` parameter en OAuth URL = `handshake_token`
- [ ] Frontend valida `state === handshake_token` antes de intercambiar
- [ ] Todos los endpoints validan `origin` en postMessage

**Token Security:**
- [ ] Access token nunca guardado en localStorage
- [ ] Token solo en transit (postMessage, HTTP Bearer)
- [ ] Handshake token TTL 600s (expirado después)
- [ ] Expired token rechazado: OAUTH_TOKEN_EXPIRED error

**Scope Validation:**
- [ ] Google OAuth pedido es: `drive.file` (no full drive)
- [ ] Drive permissions limitadas a recursos del usuario

**Audit Logging:**
- [ ] Logs registran: quién autorizó, timestamp, scopes
- [ ] Logs guardados para auditoría posterior

- [ ] Security review completado ✅

---

### Error Scenarios

**Scenario 1: User rechaza OAuth**
- [ ] Mensaje claro: "Autorización rechazada"
- [ ] Opción untuk reintentar
- [ ] Workflow no se llena de errores

- [ ] ✅ TEST: test_oauth_rejected()

**Scenario 2: Token expirado (>10 min sin reanudar)**
- [ ] Mensaje: "Autorización expirada, intenta de nuevo"
- [ ] Usuario puede reiniciar desde s_oauth
- [ ] No hay estado corrupto

- [ ] ✅ TEST: test_oauth_expired()

**Scenario 3: Scopes insuficientes**
- [ ] Google error: `insufficient_scope` o similar
- [ ] Frontend captura error de Google
- [ ] Mensaje: "Permisos insuficientes. Intenta autorizar de nuevo"

- [ ] ✅ TEST: test_oauth_insufficient_scopes()

**Scenario 4: Provider no soportado (ej: OAUTH_HANDLER con `provider: 'notion'`)**
- [ ] Backend error: `PROVIDER_OAUTH_UNSUPPORTED`
- [ ] Frontend muestra: "Proveedor no soportado"

- [ ] ✅ TEST: test_oauth_provider_unsupported()

---

### Documentation & Training

**Archivos:**
- [ ] ADR-020 completamente documentado
- [ ] IMPLEMENTATION_PLAN.md con ejemplos reales
- [ ] README en `/seeds/` explica seed system
- [ ] Troubleshooting guide en `/docs/`
- [ ] Video o screenshots de flujo completo

**Validación:**
- [ ] Nuevo dev puede entender arquitectura en 30 min
- [ ] Todos los protocolos documentados
- [ ] Casos de error documentados con soluciones

- [ ] ✅ Documentation review completado

---

### Performance & Load Testing (Optional)

**Si time permite:**
- [ ] Workflow con 10 steps ejecuta sin memory leaks
- [ ] Cache de tokens no crece infinitamente
- [ ] Payload de context es < 1MB
- [ ] API endpoints responden < 500ms

- [ ] ⚠️ OPTIONAL: Performance testing

---

### Final Sign-Off

**Responsable:** Tech Lead + Security Lead

- [ ] Code review: ADR-020 implementation ✅
- [ ] Performance review: Benchmarks OK ✅
- [ ] Security review: No vulnerabilities ✅
- [ ] QA: E2E tests 100% pass ✅
- [ ] Documentation: Complete y claro ✅

**Aprobación Final:** 🚀 READY FOR PRODUCTION

---

## 🎯 Summary Table

| Phase | Component | Status | Approver |
|-------|-----------|--------|----------|
| **Phase 1** | oauth_handler.js | ⏳ | Backend Dev |
| | workflow_executor.js | ⏳ | Backend Dev |
| | provider_drive.js | ⏳ | Backend Dev |
| | OAuth Credentials | ⏳ | Devops |
| | Tests + Deployment | ⏳ | QA |
| **Phase 2** | OAuthPopup.jsx | ⏳ | Frontend Dev |
| | OAuthCallback.jsx | ⏳ | Frontend Dev |
| | Hooks + Integration | ⏳ | Frontend Dev |
| | Backend Endpoint | ⏳ | Backend Dev |
| | Tests + Build | ⏳ | QA |
| **Phase 3** | E2E Test Complete | ⏳ | QA |
| | Security Validation | ⏳ | Security Lead |
| | Documentation | ⏳ | Tech Writer |
| | **FINAL APPROVAL** | ⏳ | Tech Lead |

---

**Uso:** Checkea boxes ANTES de pasar a siguiente phase  
**Última actualización:** 2026-03-21  
**Status:** 📋 Ready for Phase 1 kick-off
