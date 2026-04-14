# ADR 041: Infraestructura de Llaveros de Satélite (Indra Keychains)

> **Versión:** 1.2 (Sincronización v4.1 - Producción)
> **Estado:** VIGENTE — Implementación Centralizada
> **Contexto:** Establece el mecanismo soberano para que sistemas externos (Satélites) operen sobre el Core mediante identidades de máquina sin requerir OAuth humano constante.

---

## 1. Visión Holística (Soberanía de Máquina)

En la Teoría de Sistemas de Indra, un **Satélite** es una célula periférica que requiere autorización persistente. Los **Keychains** actúan como el Registro Civil del ecosistema, permitiendo la delegación de capacidades master a aplicaciones autorizadas.

---

## 2. Marco Axiomático de los Llaveros

*   **Axioma I (Identidad Delegada):** El `satellite_token` identifica a la **Instancia de Software**, no al usuario.
*   **Axioma II (Persistencia de Sesión):** Una llave `ACTIVE` permite la ejecución 24/7 sin caducidad, ideal para servicios de fondo (Peristálticos).
*   **Axioma III (Revocación Atómica):** El Core puede anular una sola llave sin degradar el resto del ecosistema.

---

## 3. Arquitectura del Engine (KeyChainEngine)

### A. Registro de Identidades (The Ledger)
El sistema utiliza un almacén de datos persistente en `ScriptProperties` bajo la clave maestra:
**`INDRA_KEYCHAIN_LEDGER`**

El Ledger es un diccionario JSON de tokens donde cada entrada contiene:
- `name`: Alias humano del satélite.
- `status`: `ACTIVE`, `REVOKED` o `PAUSED`.
- `class`: `MASTER` (Acceso total) o `RESTRICTED`.
- `scopes`: Array de protocolos permitidos (v2).
- `created_at`: Marca de tiempo de ignición.

### B. Protocolos de Gestión Real (Capa 2)
El `provider_system_infrastructure.gs` implementa los siguientes protocolos:
1.  **`SYSTEM_KEYCHAIN_GENERATE`**: Registra un nuevo satélite y devuelve su token.
2.  **`SYSTEM_KEYCHAIN_REVOKE`**: Inactiva un token de forma inmediata.
3.  **`SYSTEM_KEYCHAIN_AUDIT`**: Lista todas las llaves y su estado actual.

### C. El Protocolo Omega (Bootstrap Token)
Para permitir la autoinstalación ("Zero-Day Ignition"), el motor ejecuta un `_keychain_bootstrap_` si el Ledger no existe:
*   **Token de Emergencia:** `indra_satellite_omega`
*   **Alcance:** Acceso Master total.
*   **Nota:** Se recomienda generar llaves personalizadas para cada satélite productivo y revocar la llave omega tras la estabilización.

---

## 4. Validación en el Gateway (Aduana)

El `api_gateway.js` realiza la validación multimodal en cada petición:

```javascript
// Validación centralizada vía Keychain Engine
const satelliteContext = _keychain_validate(payload.satellite_token);
const isAuthenticated = verifyPassword(payload.password) || !!satelliteContext;
```

---

## 5. El IndraBridge (SDK Semilla)

Para interactuar con este motor, el satélite utiliza el `IndraBridge`, que se encarga de:
1.  Adjuntar el `satellite_token` en todas las peticiones.
2.  Manejar el header `Content-Type: text/plain` para bypass de CORS.
3.  Implementar la arquitectura de 3 capas (Materia, Espíritu, Forma).

---
*Este ADR formaliza la seguridad de máquina en Indra, permitiendo un ecosistema multitenant escalable y robusto.*
