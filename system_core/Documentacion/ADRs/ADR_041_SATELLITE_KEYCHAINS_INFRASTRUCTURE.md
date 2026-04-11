# ADR 041: Infraestructura de Llaveros de Satélite (Indra Keychains)

**Estado: IMPLEMENTADO (FASE BOOTSTRAP) / EVOLUCIÓN A LEDGER**  
**Contexto:** Necesidad de permitir que sistemas externos (Satélites) operen de forma soberana sobre el Core sin requerir login humano (Google OAuth) ni comprometer la seguridad mediante bypasses.

---

## 1. Visión Holística (Soberanía de Máquina)

En la Teoría de Sistemas de Indra, un **Satélite** es una célula periférica que necesita interactuar con el Core. Para que esta interacción sea segura, el sistema debe pasar de una "Confianza Implícita" (bypass) a una **"Autorización de Identidad de Máquina"**.

Los **Keychains** actúan como el Registro Civil de los Satélites, permitiendo que el Core reconozca a un sistema aliado y le otorgue permisos totales de ejecución sin intervención humana.

---

## 2. Marco Axiomático de los Llaveros

*   **Axioma I (Identidad Delegada):** Un Token de Satélite no representa a un usuario, sino a una **Instancia de Software** autorizada por el Propietario del Core.
*   **Axioma II (Persistencia Asíncrona):** El Satélite debe poder operar 24/7 sin caducidad de sesión, mientras su llave esté marcada como `ACTIVE` en el registro.
*   **Axioma III (Revocación Atómica):** El Core debe ser capaz de "desactivar" un solo satélite sin afectar la integridad o conexión de los demás.

---

## 3. Arquitectura del Engine (KeyChainEngine)

### A. Registro de Identidades (The Ledger)
El sistema utiliza un almacén de datos (inicialmente `ScriptProperties`, evolucionando a una Google Sheet oculta llamada `LEDGER_SATELLITE_KEYS`) con la siguiente estructura:

| Campo | Tipo | Función |
|---|---|---|
| `key_id` | `UUID` | El token secreto que viaja en el UQO. |
| `alias` | `STRING` | Nombre legible (ej: "Montechico_Ingest", "Nomón_ERP"). |
| `status` | `ENUM` | `ACTIVE` | `REVOKED` | `PAUSED`. |
| `scope` | `ARRAY` | Protocolos permitidos (ej: `['ATOM_CREATE', 'DRIVE_INGEST']`). |
| `created_at` | `DATE` | Fecha de ignición de la llave. |

### B. Protocolos de Gestión
1.  **`SYSTEM_SATELLITE_KEY_GENERATE`**: Crea una nueva llave y la registra en el Ledger.
2.  **`SYSTEM_SATELLITE_KEY_REVOKE`**: Invalida un token de forma inmediata.

### C. El Protocolo Omega (Bootstrap Token)
Para garantizar la velocidad de despliegue en núcleos nuevos, el sistema nace con un **Token de Emergencia Predeterminado**:
*   **Token:** `indra_satellite_omega`
*   **Uso:** Inmediato tras la instalación, permitiendo la subida de archivos sin configuración previa.
*   **Recomendación:** Los administradores deben cambiar este token en `ScriptProperties > SATELLITE_TOKEN` tras el despliegue inicial.

---

## 4. Implementación Técnica en el Gateway

El `api_gateway.js` ahora implementa la validación multimodal:

```javascript
const storedToken = PropertiesService.getScriptProperties().getProperty('SATELLITE_TOKEN') || 'indra_satellite_omega';
const isSatelliteSystem = payload.satellite_token === storedToken;
const isAuthenticated = verifyPassword(payload.password) || isSatelliteSystem;
```

---

## 5. Hoja de Ruta (Keychains v2)

- [ ] **Fase 1:** Implementar vista de Administrador en el Dashboard para ver / revocar llaves activas.
- [ ] **Fase 2:** Migrar el almacenamiento de `ScriptProperties` a una hoja de cálculo protegida para auditoría extensiva.
- [ ] **Fase 3:** Implementar "Scopes" para que un satélite solo pueda crear archivos en una carpeta específica y no en todo el Drive.

---

## 7. Implementación del Singleton (Bootstrapping)

Para evitar dependencias del ciclo de vida de UI (React Hooks), el sistema adopta un Singleton puramente agnóstico:

```javascript
// IngestBridge.js (Singleton)
class IngestBridge {
  init(config) { ... }
  getBridge() { ... }
}
```

Este modelo garantiza que los servicios de fondo (`PeristalticUploadService`) siempre tengan acceso al canal de comunicación sin importar el estado del renderizado.

---

## 8. Conclusión

La arquitectura de Keychains y el Singleton Bridge permiten que Indra escale de un simple script a una **Plataforma de Operaciones Multitenant**, donde cada empresa gestiona su propio ecosistema de satélites con seguridad de nivel industrial y rapidez de despliegue "Lightning-Fast".
