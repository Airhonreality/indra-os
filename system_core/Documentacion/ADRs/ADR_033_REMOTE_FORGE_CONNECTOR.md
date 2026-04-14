# ADR_033: REMOTE_FORGE_CONNECTOR (El Satélite)

> **Versión:** 1.5 (Arquitectura de Control Headless - v4.1)
> **Estado:** VIGENTE — Implementación de Producción
> **Alcance:** Integración de Indra en frontends externos (NOMON, Sitios de Clientes, etc.) mediante inyección agnóstica.

---

## 1. Contexto y Problema
Un Arquitecto de Indra diseña UIs personalizadas (Soberanas) fuera del ecosistema base. Necesita un enlace "Cero Fricción" que conecte su código local con el Core en la nube sin hardcodear URLs ni tokens sensibles, permitiendo la **Sinceridad de Datos** en tiempo real.

## 2. Decisión Arquitectónica
Se implementa el **Indra Satellite HUD**, un motor inyectable que dota a cualquier frontend de capacidades de "Forja".

### 2.1 El Mecanismo de Inyección (The Bridge)
El proyecto anfitrión inyecta la librería `IndraBridge.js` o el componente `IndraHUD`. La librería es agnóstica al framework.

### 2.2 Autodescubrimiento (Handshake Soberano)
Se elimina la configuración manual de archivos `json`. El flujo es:
1.  **Google One Tap / OAuth**: El usuario se identifica con su cuenta de Google.
2.  **Core Discovery Protocol**: El Satélite envía el `id_token` a la `window.INDRA_DISCOVERY_URL`.
3.  **Resolución de Core**: El servicio de descubrimiento valida el token y retorna:
    *   `core_url`: La URL del Google Apps Script del usuario.
    *   `session_secret`: Una llave temporal para la sesión actual.
4.  **Auto-Conexión**: El Satélite se configura automáticamente y está listo para operar.

### 2.3 El Patrón "Vigilante" (Drift Detection)
- **Local Schema Scan**: El HUD escanea `window.INDRA_SCHEMAS`.
- **Remote Schema Fetch**: Consulta al Core el estado real de los modelos de datos.
- **Diff Engine**: Si el código local difiere de la infraestructura física, el HUD ofrece:
    *   **SYNC ADN**: Actualiza el esquema en el Core.
    *   **IGNITE MATERIA**: Crea la tabla física (Google Sheets/Notion) basada en el esquema local.

### 2.4 Seguridad y Aislamiento
- **Shadow DOM**: El HUD se renderiza en un Shadow DOM para evitar colisiones de CSS.
- **Dev-Only**: Por defecto, solo se activa en `localhost` o mediante un `SovereignToken`.
- **Modo Espejo (Mirror)**: Si el acceso es vía `share_ticket`, el Satélite entra en modo solo lectura de forma forzada.

---

## 3. Artefactos del Ecosistema
- `lib/IndraBridge.js`: El corazón de la comunicación.
- `hud/Index.jsx`: La interfaz de control (Luma HUD).
- `services/core_discovery.gs`: Endpoint nativo en el Core para validación de identidad.

---
*Este ADR canoniza a Indra como un Servicio Ubicuo, agnóstico al soporte físico de la interfaz e integrado nativamente con la identidad de Google.*
