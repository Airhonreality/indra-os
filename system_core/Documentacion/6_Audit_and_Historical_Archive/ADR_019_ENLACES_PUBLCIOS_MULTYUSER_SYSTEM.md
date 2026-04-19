**Contexto**: El sistema Indra actual opera en un modelo de usuario único y autenticado mediante `PropertiesService` y almacenamiento en Google Drive. No existe un mecanismo para compartir artefactos ejecutables (como formularios del AEE) con usuarios externos de forma soberana. Tras analizar la arquitectura real, se confirma que el sistema NO utiliza Google Sheets ni posee un registro central de usuarios, lo que exige una solución que respete la descentralización (modelo micelar).

**Decisión**: Se implementará un sistema de **Enlaces de Capacidad Autodescriptivos**. La implementación se dividirá en dos horizontes:

1. **Fase 1 (MVP - Lo Real)**: 
   - Se utilizarán URLs que contienen tanto la dirección del Core (`u`) como el ID del ticket de acceso (`id`). Ejemplo: `https://indra-ui.io/#/run?u=[CORE_URL]&id=[TICKET_ID]`.
   - La persistencia en el Core se realizará mediante archivos JSON en una nueva subcarpeta `shares/` dentro de `.core_system/` en Drive, evitando la dependencia de Google Sheets.
   - El componente `ManifestResolver.jsx` en la UI actuará como un proyector agnóstico que se configura dinámicamente con la URL recibida.

2. **Fase 2 (Investigación Futura)**:
   - Estudio de identidad federada (Core IDs) y resolución micelar mediante hashes o nombres de dominio personalizados para eliminar la necesidad de exponer la URL larga del script.

**Consecuencias**:
- **Positivas**: Implementación inmediata sin infraestructura central. Sigue el patrón de "Cascarón Vacío" (UI) y "Núcleo Soberano" (Core). No altera los contratos de los artefactos existentes.
- **Negativas**: Las URLs iniciales son largas y exponen la ubicación del script (ofuscación necesaria). La validez del enlace depende de que el propietario mantenga el script activo.

### Estructura del Ticket de Acceso (JSON en Drive)
Ubicación: `.core_system/shares/ticket_[id].json`

```json
{
  "version": "1.1",
  "owner_id": "hash_o_email",
  "artifact_id": "id-del-archivo-en-drive",
  "artifact_class": "AEE_FORM",
  "auth_mode": "public",
  "created_at": "2024-..."
}
```

### Flujo de Resolución (Agnóstico)
1. **Frontend**: Recibe `?u=...&id=...`.
2. **Handshake**: El frontend pide al Core en `u` el contenido del ticket `id` mediante una acción pública de `doGet`.
3. **Inyección**: Si el ticket es válido, el frontend configura el `ProtocolContext` y carga el artefacto.

### Modificaciones en el Core
- **`api_gateway.js`**: Habilitar un bypass en `doGet` para la acción `getShareTicket`.
- **`provider_system_infrastructure.js`**: Asegurar que los átomos sean "hidratados" con la identidad del core si es necesario para la federación futura.

**Crítica de Diseño (Horizonte Micelar)**:
Se ha decidido rechazar el "Directorio Central de Cores" propuesto inicialmente para evitar puntos centrales de falla y control. El sistema debe sobrevivir como una red de enlaces directos. La complejidad de la "URL fea" se acepta como un compromiso inicial en favor de la soberanía total.