# VADE MÉCUM: Gestión Multi-usuario y Soberanía

> **"Indra es una red de voluntades, no una base de datos de usuarios."**

Este documento detalla cómo Indra gestiona la identidad, los permisos y el acceso público en un entorno de Satélites. A diferencia de un sistema tradicional con una tabla `users`, Indra utiliza un modelo de **Delegación de Capacidad** basado en Llaveros (Keychains) y Tickets.

---

## 1. Jerarquía de Llaveros (The Chain of Command)

El sistema opera en tres niveles de autoridad, definidos por el token que se presenta en el Gateway.

### Nivel 0: El Propietario (Core Owner)
- **Identidad**: El dueño de la cuenta de Google donde reside el GAS script.
- **Acceso**: Total e irrevocable.
- **Método**: Login vía OAuth (Google One Tap).
- **Uso**: Configuración del Core, creación de Silos maestros y gestión de Llaveros.

### Nivel 1: El Satélite Maestro (Service Master)
- **Identidad**: Una instancia de software autorizada. Ej: "App Panadería SaaS".
- **Acceso**: Definido por el Administrador. Generalmente opera sobre todos los esquemas del satélite.
- **Token**: `satellite_token` (Generado vía `SYSTEM_KEYCHAIN_GENERATE`).
- **Bootstrap**: Al instalar Indra, existe el token `indra_satellite_omega` para pruebas iniciales. **Cámbialo en producción.**

### Nivel 2: El Perfil de Servicio (Restricted Profile)
- **Identidad**: Un fragmento de la organización. Ej: "Sede Norte".
- **Acceso**: Filtrado por `core_id` o `scopes` específicos.
- **Jurisdicción**: El Gateway inyecta el `effective_owner` automáticamente, impidiendo que la "Sede Norte" vea datos de la "Sede Sur" aunque compartan el mismo Google Sheet.

---

## 2. Enlaces Públicos (Share Tickets)

¿Qué pasa si quieres que un cliente externo vea el estado de su pedido sin tener una cuenta?

### El Mecanismo (ADR-019)
1. El Satélite solicita un ticket: `SYSTEM_SHARE_TICKET_GENERATE`.
2. El Core guarda un archivo JSON en `.core_system/shares/`.
3. El Satélite genera una URL: `?u=[CORE_URL]&id=[TICKET_ID]`.

### Invariantes del Ticket
- **Modo Espejo (Mirror)**: Cualquier acceso vía ticket obliga al sistema a entrar en modo solo lectura (`resonance_mode: MIRROR`).
- **Seguridad**: El ticket está vinculado a un átomo o silo específico. No permite "navegar" por el resto de la base de datos.
- **Exposición de Infraestructura**: Actualmente, la URL del ticket expone la URL del script de Google Apps Script. Úsalo con discreción en entornos de alta sensibilidad.

---

## 3. Seguridad en Producción (El Patrón Proxy)

> [!CAUTION]
> **NUNCA expongas tu `satellite_token` maestro en el código frontend de una web pública.**

Si tu satélite es una web accesible por cualquiera (como una landing):
1. No pongas el token en el Javascript.
2. Crea un **Backend Intermedio** (Vercel, Cloudflare Workers, etc.).
3. El Satélite habla con tu backend.
4. Tu backend añade el token y habla con el Core de Indra.
5. Esto protege tu llave maestra de ser extraída vía DevTools.

---

## 4. Axioma de Desconexión
Si un usuario revoca tu acceso o el Core es dado de baja, el Satélite debe comportarse con **Dignidad Sistémica**:
1. El `IndraBridge` reportará `AUTH_REQUIRED`.
2. El Satélite debe permitir al usuario descargar una copia local de sus datos (si los tiene en cache) antes de cerrar la sesión.
3. La Materia (tus Sheets) nunca se borra; el usuario siempre podrá acceder a sus datos manualmente en su Google Drive.

---
*Indra garantiza que los datos pertenecen a quien los genera, no a la aplicación que los proyecta.*
