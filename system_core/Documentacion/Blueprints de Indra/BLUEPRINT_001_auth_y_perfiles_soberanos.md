# 🔵 BLUEPRINT_001 — Autenticación Soberana y Proyección de Perfiles
**Categoría:** Identidad & Datos  
**Versión:** 1.0 — Marzo 2026  
**Autor:** Antigravity para el Ecosistema NOMON + INDRA OS  
**Compatibilidad:** Indra OS v4.x en adelante

> **¿Qué resuelve este Blueprint?**  
> El patrón completo para que una web estática de React se convierta en una plataforma con usuarios reales: Login seguro con Google, una base de datos de perfiles soberana (Google Sheets), y autoproyección de datos en componentes de UI (cards, bandejas, dashboards).

---

## 🏗️ ARQUITECTURA GENERAL

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND (React / Next.js)                             │
│  ┌───────────┐  POST + id_token  ┌───────────────────┐  │
│  │GoogleLogin│ ──────────────▶   │  INDRA GATEWAY    │  │
│  └───────────┘                   │  (api_gateway.gs) │  │
│                                  └────────┬──────────┘  │
│                                           │ valida token │
│                                  ┌────────▼──────────┐  │
│                                  │  OAUTH_VALIDATOR  │  │
│                                  │  (verifica con    │  │
│                                  │   Google API)     │  │
│                                  └────────┬──────────┘  │
│                                           │ extrae email │
│                                  ┌────────▼──────────┐  │
│                                  │  WORKSPACE_USERS  │  │
│                                  │  (Google Sheet:   │  │
│                                  │  TB_ALIADOS)      │  │
│                                  └────────┬──────────┘  │
│                                           │ retorna Átomos│
│  ┌───────────────────────────────────────▼───────────┐  │
│  │  DASHBOARD NOMON (cards auto-proyectadas por class)│  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 PARTE 1: SCHEMAS (Las Bases de Datos)

Los Schemas son los contratos de datos. Se crean en el Workspace Designer de Indra.

### Schema A: `ALIADOS` (Registro de Usuarios)
**Propósito:** Fuente de verdad de identidades del ecosistema.

| Campo         | Alias          | Tipo     | Notas                                      |
|:--------------|:---------------|:---------|:-------------------------------------------|
| UID           | `uid`          | `TEXT`   | UUID único. Clave primaria.                |
| Email Google  | `google_email` | `TEXT`   | 🔑 Clave de match con OAuth. Único.       |
| Nombre        | `display_name` | `TEXT`   | Nombre público del aliado.                 |
| Status        | `status`       | `SELECT` | `PENDING` / `VALIDATED` / `SUSPENDED`      |
| Roles         | `roles`        | `TEXT`   | Roles separados por coma: `ALLY, ARCH`     |
| Especialidades| `specialties`  | `TEXT`   | Texto libre o JSON array.                  |
| Bio           | `bio`          | `TEXT`   | Descripción pública.                       |
| LinkedIn URL  | `linkedin_url` | `TEXT`   | URL de perfil.                             |
| Avatar URL    | `avatar_url`   | `TEXT`   | URL de imagen (Drive o externa).           |
| Fecha Registro| `created_at`   | `DATE`   | ISO 8601. Auto-generado en el Workflow.    |
| Badges IDs    | `badges`       | `TEXT`   | JSON array de IDs. Ej: `["LEY_BIC"]`     |

> **Configuración de Sistema (Una sola vez):**  
> Registrar el ID del Google Sheet de `ALIADOS` en  
> `Indra System Settings → Workspace de Identidad → USERS_REGISTRY_SHEET_ID`

---

### Schema B: `PROYECTOS` (Banco de Proyectos)
**Propósito:** Repositorio de proyectos gestionados por los aliados.

| Campo         | Alias          | Tipo     | Notas                                      |
|:--------------|:---------------|:---------|:-------------------------------------------|
| UID Proyecto  | `project_uid`  | `TEXT`   | UUID único del proyecto.                   |
| Aliado UID    | `author_uid`   | `TEXT`   | FK → `ALIADOS.uid`. Dueño del proyecto.    |
| Título        | `title`        | `TEXT`   | Nombre del proyecto.                       |
| Descripción   | `description`  | `TEXT`   | Descripción corta (< 280 chars).           |
| Tags          | `tags`         | `TEXT`   | JSON array. Ej: `["biotech", "ley_bic"]`  |
| Status        | `status`       | `SELECT` | `DRAFT` / `ACTIVE` / `CLOSED`             |
| Imagen URL    | `cover_url`    | `TEXT`   | URL de imagen de portada.                  |
| Fecha Inicio  | `started_at`   | `DATE`   | ISO 8601.                                  |
| Visibilidad   | `visibility`   | `SELECT` | `PUBLIC` / `ALLIES_ONLY` / `PRIVATE`      |

---

### Schema C: `BADGES` (Insignias de Validación)
**Propósito:** Catálogo de reconocimientos que se otorgan a aliados.

| Campo         | Alias        | Tipo   | Notas                                      |
|:--------------|:-------------|:-------|:-------------------------------------------|
| Badge ID      | `badge_id`   | `TEXT` | Clave única. Ej: `LEY_BIC`.               |
| Nombre        | `name`       | `TEXT` | Nombre legible. Ej: "Especialista LEY BIC" |
| Descripción   | `description`| `TEXT` | Qué valida esta insignia.                  |
| Icono URL     | `icon_url`   | `TEXT` | URL del ícono SVG o PNG.                   |

---

## ⚙️ PARTE 2: WORKFLOWS (La Lógica de Negocio)

### Workflow A: `REGISTRO_NUEVO_ALIADO`
**Trigger:** `WEBHOOK` — Conectado al formulario de registro del front.  
**Descripción:** Crea un nuevo aliado en la Sheet cuando el formulario es enviado.

```
GATILLO (WEBHOOK)
   ↓
   [Contrato de Datos: Schema ALIADOS]
   
PASO 1 — VALIDAR_UNICIDAD (PROTOCOL: TABULAR_STREAM → buscar por email)
   ↓ SI ya existe → ruta FALSE → Responder error "EMAIL_DUPLICADO"
   ↓ SI no existe → ruta TRUE

PASO 2 — CREAR_ALIADO (PROTOCOL: ATOM_CREATE)
   ↓ Escribe la nueva fila en el Sheet ALIADOS con status: PENDING
   
PASO 3 — NOTIFICACION_BIENVENIDA (PROTOCOL: EMAIL_SEND)
   ↓ Envía email de bienvenida al email registrado
   
FIN → Retorna átomo del aliado creado con clase ALLY_PROFILE
```

---

### Workflow B: `LOGIN_OAUTH_MATCH`
**Trigger:** `WEBHOOK` — Disparado por el front al recibir un `id_token` de Google.  
**Descripción:** El puente entre el mundo de Google y el mundo de NOMON.

```
GATILLO (WEBHOOK)
   │── Input esperado: { id_token: "...", google_email: "..." }
   
PASO 1 — BUSCAR_ALIADO (PROTOCOL: TABULAR_STREAM → filtrar por google_email)
   ↓ SI no encontrado → ruta FALSE → Responder UNAUTHORIZED
   ↓ SI encontrado → ruta TRUE

PASO 2 — VERIFICAR_STATUS (ROUTER)
   │── Evaluar: aliado.status == "VALIDATED"
   ↓ FALSE → Responder { status: PENDING_APPROVAL }
   ↓ TRUE

PASO 3 — EMITIR_SESION (PROTOCOL: SYSTEM_SESSION_GENERATE)
   ↓ Genera Session Ticket (UUID, 24h TTL)
   
FIN → Retorna { session_ticket: "...", aliado: {...} }
       Con clase: ALLY_SESSION
```

> **⚠️ Nota Técnica:** El `PASO 1` es el "match". Indra sabe qué Sheet consultar porque el Schema `ALIADOS` ya está registrado en System Settings con su Sheet ID.

---

### Workflow C: `CARGAR_DASHBOARD_ALIADO`
**Trigger:** `WEBHOOK` — Disparado por el front al cargar el dashboard.  
**Descripción:** Carga todos los datos de un aliado y sus proyectos.

```
GATILLO (WEBHOOK)
   │── Input esperado: { session_ticket: "...", aliado_uid: "..." }

PASO 1 — LEER_PERFIL (PROTOCOL: ATOM_READ → Schema ALIADOS)
   ↓ Retorna átomo con clase: ALLY_PROFILE

PASO 2 — LEER_PROYECTOS (PROTOCOL: TABULAR_STREAM → filtrar por author_uid)
   ↓ Retorna array de átomos con clase: PROJECT_CARD

PASO 3 — LEER_BADGES (PROTOCOL: TABULAR_STREAM → filtrar por badge_ids)
   ↓ Retorna array de átomos con clase: VALIDATED_BADGE

FIN → Retorna colección mixta de átomos para hidratación del dashboard
```

---

## 🖥️ PARTE 3: FRONT-END (Las Pantallas de React)

### 3.1 El Botón de Login
```jsx
// Componente: NomonLogin.jsx
// Dependencia: @react-oauth/google

import { GoogleLogin } from '@react-oauth/google';

export function NomonLogin() {
  const handleSuccess = async (credentialResponse) => {
    // 1. El id_token llega directo de Google
    const { credential: idToken } = credentialResponse;
    
    // 2. Lo enviamos al Core de Indra via Webhook (Workflow B)
    const res = await fetch(INDRA_CORE_URL, {
      method: 'POST',
      body: JSON.stringify({
        protocol:     'WORKFLOW_EXECUTE',  // o WEBHOOK trigger
        data: {
          id_token:     idToken,
          google_email: parseJwt(idToken).email // decodificamos localmente
        }
      })
    });
    
    const { items, metadata } = await res.json();
    const session = items[0]; // Átomo de clase ALLY_SESSION
    
    // 3. Guardamos el ticket y redirigimos al dashboard
    localStorage.setItem('indra_ticket', session.payload.session_ticket);
    localStorage.setItem('aliado_uid',   session.payload.aliado.uid);
  };

  return <GoogleLogin onSuccess={handleSuccess} onError={() => alert('Login fallido')} />;
}
```

### 3.2 El Mapa de Proyección de Componentes
```jsx
// Componente: NomonRenderer.jsx
// AXIOMA: La `class` del átomo decide el componente. Nunca al revés.

const COMPONENT_MAP = {
  'ALLY_PROFILE':    AllyProfileCard,    // La card de perfil del aliado
  'PROJECT_CARD':    ProjectCard,        // Una card de proyecto
  'VALIDATED_BADGE': BadgeChip,          // Un chip de insignia
  'INBOX_MESSAGE':   MailRow,            // Una fila de bandeja de entrada
};

export function NomonRenderer({ atoms }) {
  return (
    <div className="nomon-grid">
      {atoms.map(atom => {
        const Component = COMPONENT_MAP[atom.class];
        if (!Component) return null; // Clase desconocida → invisible
        return <Component key={atom.id} data={atom.payload} meta={atom.handle} />;
      })}
    </div>
  );
}
```

### 3.3 El Hook de Sesión (Protección de Rutas)
```jsx
// Hook: useIndraSession.js
// Protege cualquier pantalla que requiera login.

export function useIndraSession() {
  const ticket = localStorage.getItem('indra_ticket');
  const alidadoUid = localStorage.getItem('aliado_uid');
  const isAuthenticated = !!ticket;
  
  // Todas las peticiones al Core llevan el ticket como credencial.
  // Indra lo valida en el Gateway automáticamente.
  const dispatch = async (uqo) => {
    return fetch(INDRA_CORE_URL, {
      method: 'POST',
      body: JSON.stringify({ ...uqo, password: ticket }) // ticket = password de sesión
    }).then(r => r.json());
  };

  return { isAuthenticated, dispatch, alidadoUid };
}
```

---

## 🔐 PARTE 4: CONFIGURACIÓN DEL CORE (Una sola vez)

Estos valores se registran en el panel de **System Settings** de Indra antes de lanzar:

| Setting                   | Valor                                       |
|:--------------------------|:--------------------------------------------|
| `USERS_REGISTRY_SHEET_ID` | ID del Google Sheet de `ALIADOS`            |
| `GOOGLE_CLIENT_ID`        | Client ID de tu proyecto en Google Cloud    |
| `CORE_BASE_URL`           | URL del despliegue de Indra (GAS Web App)   |

---

## 🗺️ PARTE 5: HOJA DE RUTA DE IMPLEMENTACIÓN

```
Fase 1 — Fundamentos (Semana 1)
├── [ ] Crear Google Sheet con la estructura de ALIADOS
├── [ ] Crear Google Sheet de PROYECTOS
├── [ ] Registrar los Sheet IDs en System Settings de Indra
└── [ ] Crear los Schemas A, B y C en Indra Workspace Designer

Fase 2 — Lógica (Semana 1-2)
├── [ ] Construir Workflow A (Registro)
├── [ ] Construir Workflow B (OAuth Match)
└── [ ] Construir Workflow C (Cargar Dashboard)

Fase 3 — Front-End (Semana 2)
├── [ ] Configurar Google OAuth (Client ID en Google Cloud)
├── [ ] Implementar NomonLogin.jsx
├── [ ] Implementar useIndraSession.js
├── [ ] Implementar NomonRenderer.jsx con el COMPONENT_MAP
└── [ ] Diseñar los 4 componentes hoja: AllyProfileCard, ProjectCard,
        BadgeChip, MailRow

Fase 4 — Pruebas (Semana 3)
├── [ ] Prueba de flujo completo E2E
├── [ ] Prueba de seguridad (ticket expirado, email no registrado)
└── [ ] Prueba de carga con múltiples aliados
```

---

## 💡 NOTAS SOBRE EL FUTURO: BIBLIOTECA DE ASSETS

> Esta carpeta `Blueprints de Indra` es el embrión de algo más grande.  
> La visión es: una biblioteca pública donde cualquier instalación de Indra  
> pueda importar un Blueprint y desplegar un sistema complejo en minutos.

**Formato de un Blueprint distribuible:**
```json
{
  "blueprint_id": "NOMON_AUTH_V1",
  "name": "Autenticación Soberana con Google OAuth",
  "version": "1.0.0",
  "author": "Javier / NOMON",
  "schemas": ["ALIADOS", "PROYECTOS", "BADGES"],
  "workflows": ["REGISTRO_NUEVO_ALIADO", "LOGIN_OAUTH_MATCH", "CARGAR_DASHBOARD_ALIADO"],
  "front_components": ["NomonLogin.jsx", "NomonRenderer.jsx", "useIndraSession.js"]
}
```

**El lugar donde guardar para que sea accesible por todos:**  
→ Un repositorio público en GitHub bajo la organización `Airhonreality/indra-blueprints`  
→ Con un índice `registry.json` que Indra pueda consultar para ofrecer  
  un "Marketcell" de Blueprints desde dentro de la propia interfaz.

---
*Documento generado: 2026-03-26 | Ecosistema Indra OS v4.x*
