# ADR-041: Keychain Identity Engine & Scoped Sovereignty

## Estado
**APROBADO // IMPLEMENTADO (v2.5)**

## Contexto
Históricamente, Indra dependía de la delegación de identidad de Google (OAuth) para todas las operaciones. Esto presentaba tres fallos críticos de entropía:
1.  **Fragilidad Browser**: Los bloqueos de cookies y redirecciones de Google dificultaban la resonancia automática.
2.  **Falta de Granularidad**: Un usuario logueado tenía acceso a TODO su Core. No existía el concepto de "Socio Limitado" o "Satélite de una sola misión".
3.  **Headless Operations**: Las automatizaciones externas (Bots, Scripts) no podían operar sin una ventana de navegador humana.

## Decisión
Implementar un **Keychain Engine (Llavero)** persistente en la capa de servicios del Core (`keychain_service.gs`) que gestione una tabla de **Tokens de Sinceridad** soberanos.

### Características del Diseño:
*   **Independencia de OAuth**: Una vez emitido un token, el satélite puede hablar directamente con el API Gateway usando ese token, sin pasar por los diálogos de Google (una vez firmado el pacto inicial).
*   **Jerarquía de Clases**:
    *   `MASTER`: Tokens con acceso total (Bootstrap: `indra_satellite_omega`).
    *   `SCOPED`: Tokens limitados a uno o más `context_id` (Workspaces).
*   **Aduana en el Gateway**: El `api_gateway.gs` valida cada petición. Si un token `SCOPED` intenta tocar un átomo fuera de su ámbito, se emite una sentencia de denegación **Error 403**.
*   **Persistencia Doble**:
    *   **Core**: Guarda el Ledger en `PropertiesService`.
    *   **Satélite**: Guarda el pacto en `localStorage`.

## Consecuencias
*   **Positivas**:
    *   Soporte real para arquitecturas multi-usuario y multi-satélite.
    *   Aislamiento de seguridad (Sandboxing de Workspaces).
    *   Resonancia manual indestructible ante fallos de enrutamiento web.
*   **Negativas**:
    *   Añade una pequeña latencia de validación en el Gateway.
    *   Requiere una gestión manual de limpieza de "Basura Espacial" (tokens antiguos).

## Enlaces Relacionados
*   [keychain_service.js (Implementación)](../../core/3_services/keychain_service.js)
*   [api_gateway.js (Aduana)](../../core/0_gateway/api_gateway.js)
*   [KeychainManager.jsx (Interfaz)](../../client/src/components/shell/KeychainManager.jsx)
