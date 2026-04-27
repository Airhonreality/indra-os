# 🏛️ MANUAL MAESTRO: IDENTIDAD SOBERANA Y SISTEMAS MULTI-USUARIO (v1.3 OMEGA)
> **Dharma**: Separar la materia de conexión (Infra) de la autoridad del sujeto (User) para garantizar soberanía fractal y evitar la entropía de acceso.

---

## 🧬 1. LOS TRES PILARES DE LA IDENTIDAD

En la arquitectura SUH de Indra, la identidad es jerárquica y delegada. Nunca se deben mezclar estas capas:

| Capa | Identidad | Alcance | Origen | Persistencia Física |
| :--- | :--- | :--- | :--- | :--- |
| **L0** | **Infraestructura** | Nodo / Satélite | `indra_identity.js` | Inmutable en disco. Representa a la empresa o dueño del hardware. |
| **L1** | **Social (Handshake)** | Validación | Google OAuth (JWT) | Volátil. Solo sirve para demostrar posesión de un email ante el Core. |
| **L2** | **Sovereign (Session)** | Sujeto Humano | `SYSTEM_IDENTITY_SYNC` | **Persistente en Malla Local** (`localStorage`). Representa la autoridad del usuario. |

---

## 🚀 2. RUTA DE IMPLEMENTACIÓN (PASO A PASO)

### Paso 1: El Registro Atómico y Santuarios Tabulares (En el Core)
Para que un usuario pueda loguearse, debe existir previamente un átomo de clase `IDENTITY` en el Ledger del Core. Tras la reforma v18.0, las identidades **no se mezclan** con la infraestructura.
- **Santuario Tabular**: El usuario debe estar registrado en la pestaña **`Entidades`** del Workspace.
- **Campos Vitales**: 
    - **`id` (Anclaje Soberano)**: Es el identificador único del usuario (ej: su email). Tras la v19.0, Indra descubre este campo automáticamente.
    - **`handle`**: Etiqueta visual y alias para la malla lógica.
    - **`class`**: Siempre `IDENTITY`.
    - **`payload`**: JSON con detalles extendidos (rol, bio, etc.).
- **Hidratación de Rango**: El rol definido en el `payload` (ej: `AUDITOR_REAL`) es inyectado directamente en el Ticket de Sesión L2.

#### 📄 Átomo Canónico de Usuario (Template v19.0)
Si necesitas sembrar un usuario manualmente en la Sheet `Entidades`, usa esta estructura limpia:
```json
{
  "id": "usuario@indra-os.com",
  "handle": { "alias": "usuario", "label": "Nombre Visible" },
  "class": "IDENTITY",
  "payload": {
    "email": "usuario@indra-os.com", 
    "role": "GUEST",        
    "name": "Nombre Completo"
  }
}
```

### Paso 2: El Intercambio de Soberanía (Login)
El Satélite no "loguea" al usuario; facilita el intercambio de un token social por uno soberano usando el módulo `indra_auth.js`.

```javascript
// Implementación recomendada usando el kit de identidad
import { IndraAuth } from './indra_auth';

const auth = new IndraAuth(bridge);

async function handleLogin(googleIdToken) {
    try {
        const profile = await auth.login(googleIdToken);
        console.log("Bienvenido:", profile.name);
        // El puente ya tiene la sesión guardada para el próximo F5
    } catch (e) {
        console.error("Error de soberanía:", e.message);
    }
}
```

### Paso 2.5: Manejo del Registro Condicional (v18.0 OMEGA)
Indra no registra usuarios "en silencio". Si un usuario se autentica con Google pero no existe en la pestaña `Entidades`, el sistema devuelve un objeto con el flag `needsRegistration: true`. 

El desarrollador del satélite debe capturar esto para invitar al usuario a unirse al Workspace:

```javascript
ui.renderButton('login-container', {
    clientId: '...',
    onSuccess: (result) => {
        if (result.needsRegistration) {
            // EL USUARIO ES VÁLIDO EN GOOGLE PERO NO EN INDRA
            const googleProfile = result.profile;
            console.log("🎟️ Invitación pendiente para:", googleProfile.email);
            
            // Aquí el desarrollador puede mostrar un formulario de registro
            // o usar el protocolo SYSTEM_IDENTITY_CREATE para darlo de alta.
            showWelcomeMessage(googleProfile); 
        } else {
            // LOGIN EXITOSO Y REGISTRADO
            console.log("🎯 Bienvenido:", result.name);
        }
    }
});
```

### Paso 3: Proyección del Botón (Agnóstico)
Para facilitar la integración en entornos Vanilla JS sin imponer estilos, el protocolo incluye el módulo `IndraAuthUI`. Este se encarga de cargar la API de Google y renderizar el botón estándar.

```javascript
import { bridge } from './indra-satellite-protocol';
import { IndraAuth }   from './indra-satellite-protocol/indra_auth.js';
import { IndraAuthUI } from './indra-satellite-protocol/indra_ui_auth.js';

const auth = new IndraAuth(bridge);
const ui   = new IndraAuthUI(auth);

// Renderizado en un contenedor vacío
ui.renderButton('login-container', {
    clientId: 'TU_CLIENT_ID_DE_GOOGLE',
    onSuccess: (profile) => {
        console.log("Soberanía confirmada:", profile.name);
        // El satélite ya puede acceder a datos protegidos
    }
});
```
> **Nota de Agnosticidad**: Este módulo no inyecta CSS. El botón resultante es el estándar oficial de Google, permitiendo que el Satélite mantenga su propia identidad visual.

### Paso 4: Gestión de la "Amnesia Post-Refresco"
Gracias a la mutación en `ContractCortex.js`, el Satélite ya no olvida quién es el usuario al pulsar F5.
- **Mecánica**: El `ContractCortex` busca la clave `indra_session_[SATELLITE_ID]` antes de autorizar la conexión. Si la encuentra, el Satélite despierta directamente en Capa L2.

---

## 🔐 3. VECTORES DE ESQUIZOFRENIA (ERRORES A EVITAR)

### ⚠️ Vector A: La Ilusión del Rol en el Cliente
- **Error Común**: El desarrollador guarda `user.role` en un JSON local y lo usa para permitir acciones (ej: `if(user.role == 'admin') deleteItem()`).
- **Consecuencia**: El usuario puede editar su `localStorage`, cambiarse el rol y hackear la UI.
- **Sinceridad Indra**: La seguridad **siempre ocurre en el Core**. El Core ignora el rol del satélite y usa el `subject_id` vinculado al token para validar permisos en el Ledger. El rol en el satélite es SOLO para estética (mostrar/ocultar botones).

### ⚠️ Vector B: El "Token Zombi" (Expiración)
- **Error Común**: Sesiones que duran para siempre sin validación.
- **Sinceridad Indra**: Las sesiones L2 tienen una caducidad de 30 días configurada en el Llavero (`keychain_service.gs`). El `AuthService` purga automáticamente cualquier token que exceda su fecha de vida.

### ⚠️ Vector C: El "Crisis de Personalidad" (Multi-Satélite)
- **Error Común**: Usar una clave de `localStorage` genérica como `"token"`.
- **Consecuencia**: Si el usuario tiene dos satélites Indra abiertos en el mismo dominio, uno podría sobreescribir la sesión del otro.
- **Sinceridad Indra**: El sistema usa **Namespacing Atómico** basado en el `id` del satélite del manifiesto. Cada nodo es una isla de identidad independiente.

---

## 📋 4. CHECKLIST DE INTEGRACIÓN FINAL

1. **Core**: Asegurarse de que `SYSTEM_IDENTITY_SYNC` esté registrado en el router.
2. **Core**: Crear los átomos `IDENTITY` para los usuarios permitidos.
3. **Satélite**: Asegurarse de que `satellite.manifest.json` tenga un `id` único.
4. **Satélite**: Usar `bridge.setSessionToken(token)` para el login y `bridge.logout()` para el cierre.
5. **Satélite**: **NUNCA** manipular `localStorage` directamente para temas de identidad.

---

## 🏛️ 4. AXIOMAS DE SOBERANÍA L2 (LEYES DEL CORE)

Para mantener la homeostasis, el desarrollador debe respetar estas cuatro leyes fundamentales:

### ⚖️ Ley A: Jerarquía de la Verdad (El Anclaje)
El Core ignora las etiquetas de infraestructura para la identidad humana. La fuente de verdad absoluta es el campo **`id`** (Anclaje Soberano) y el campo **`payload.name`** dentro de la pestaña `Entidades`. 
*   **Consecuencia**: El ID que recibe el satélite ya no es un puntero físico (`row_x`), sino la identidad real del sujeto. Si cambias el nombre en el payload, el Satélite lo reflejará tras el próximo sync.

### ☢️ Ley B: La Extinción Física (Logout Asíncrono)
El método `auth.logout()` no es solo amnesia local; es una **orden de ejecución** que viaja al Core para invalidar el token en el Llavero (`SYSTEM_SESSION_REVOKE`).
*   **Consecuencia**: Siempre debe tratarse como una operación asíncrona (`await`). Si el Core no confirma la revocación, el token sigue técnicamente vivo aunque el satélite lo haya "olvidado".

### 🛡️ Ley C: El Rango como Escudo (Scopes)
El campo `role` definido en la Spreadsheet (ej: `ADMIN`, `AUDITOR`) se cristaliza automáticamente como un **Scope de Sesión** dentro del token.
*   **Consecuencia**: El Satélite puede usar `auth.hasRole('ADMIN')` para la UI, pero el Core validará cada UQO contra ese mismo sello, garantizando que el usuario no pueda "escalar privilegios" editando su cliente.

### ⏳ Ley D: Soberanía de Larga Duración (UX Industrial)
Las sesiones L2 tienen una caducidad por defecto de **30 días**.
*   **Consecuencia**: El sistema está diseñado para entornos industriales donde el operario no debe re-autenticarse con Google diariamente si el hardware es de confianza. La revocación física es el único método para terminar esta soberanía antes de tiempo.

---
*Indra OS — Estándar de Identidad Soberana v18.0 | Sincerity Architecture* 🛰️🔐🏛️💎🔥
