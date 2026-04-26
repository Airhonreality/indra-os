Esta es la hoja de ruta técnica para elevar el sistema de login de un "parche" a una **Infraestructura de Soberanía Universal**. Vamos a inyectar lógica en el corazón del protocolo para que la sesión sea una capacidad nativa.

He preparado este artefacto con el detalle quirúrgico de los cambios y los vectores de entropía que debemos vigilar:

### [Plan de Infraestructura: Sovereign Auth Framework v1.0](file:///c:/Users/javir/Documents/DEVs/INDRA%20FRONT%20END/system_core/client/public/indra-satellite-protocol/docs/SOVEREIGN_AUTH_IMPLEMENTATION.md)

````carousel
```javascript
// 1. IndraBridge.js (Sesión Nativa)
// Inyectamos persistencia automática para que el dev no toque localStorage
setSessionToken(token) {
    this.sessionToken = token;
    // Axioma: El puente guarda su propio estado de usuario
    localStorage.setItem('indra_user_session', token);
    console.log("🔐 [Bridge] Sesión de usuario persistida.");
}

logout() {
    localStorage.removeItem('indra_user_session');
    this.restoreInfrastructureToken();
}
```
<!-- slide -->
```javascript
// 2. ContractCortex.js (Arranque Inteligente)
// Prioridad: Usuario > Empresa
async load(options = {}) {
    const sessionToken = localStorage.getItem('indra_user_session');
    if (sessionToken) {
        console.log("⚡ [Cortex] Detectada sesión activa. Saltando L0...");
        return { token: sessionToken, mode: 'USER' };
    }
    // Fallback al token de infraestructura (indra_identity.js)
    return await this._loadInfraConfig();
}
```
<!-- slide -->
```javascript
// 3. auth_service.gs (Core: Match Universal)
function SYSTEM_IDENTITY_SYNC(uqo) {
    const email = _validateExternalToken(uqo.data.id_token);
    // Busca en el Ledger de la Célula un átomo IDENTITY con ese email
    const userIdentity = _findIdentityByEmail(email, uqo.workspace_id);
    
    if (!userIdentity) throw createError('IDENTITY_NOT_FOUND', 'Usuario no registrado en la malla.');
    
    // Genera un token vinculado al ID del átomo
    return keychain_issue_session(userIdentity.id, { scopes: ['USER_ACCESS'] });
}
```
````

### ⚠️ Vectores de Entropía a Vigilar:

1.  **El "Token Zombi"**: Si el token en `localStorage` expira en el Core pero el Satélite sigue intentando usarlo en el arranque.
    *   *Solución*: El `ContractCortex` debe capturar el primer error de 401/403 y auto-limpiar el `localStorage` para forzar un nuevo login.
2.  **Colisión de Workspaces**: Si un usuario tiene sesión en el "Workspace A" pero abre el satélite del "Workspace B".
    *   *Solución*: El `indra_user_session` debe guardarse con un prefijo del `workspace_id` para que las sesiones no se mezclen.
3.  **La "Carrera de Ignición" (Race Condition)**: Si el Satélite intenta hacer `ignite()` antes de que el Bridge haya decidido si es Usuario o Infraestructura.
    *   *Solución*: `bridge.init()` debe ser estrictamente secuencial y bloquear la ejecución hasta que la identidad esté resuelta.

Vector A: La "Crisis de Personalidad" (Multiple Workspaces)
Riesgo: El usuario se loguea en el satélite de "Veta Max" y luego abre el satélite de "Indra Core". Si ambos usan el mismo localStorage genérico, uno podría intentar usar la sesión del otro.
Solución: El almacenamiento de sesión en el navegador debe estar "Namespaced". Cada satélite solo debe ver su propia sesión.
Prefijo: indra_session_[SATELLITE_ID].
Vector B: El "Usuario Fantasma" (Caché desincronizada)
Riesgo: El usuario cambia su nombre en el Core (vía Sheets), pero el satélite sigue mostrando el nombre viejo porque lo tiene guardado en el app_state del localStorage.
Solución: Axioma de "Sinceridad al Arranque". Cada vez que el Bridge se despierta con un token guardado, debe lanzar un ACCOUNT_RESOLVE ultra-rápido para refrescar los metadatos básicos (nombre, foto, rol).
Vector C: La "Puerta Trasera" del Desarrollador
Riesgo: El dev, por comodidad, deja una variable is_admin: true en el código del satélite para probar cosas y se le olvida quitarla.
Solución: El Satélite NUNCA debe decidir qué puede hacer el usuario. El Satélite pregunta al Core: "¿Qué botones puedo mostrar para este token?". El Core responde con una lista de Capabilities.