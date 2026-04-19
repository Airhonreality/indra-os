# ADR-024: Universal Media Resolver Strategy

**Estado:** VIGENTE  
**Fecha:** 19 de marzo de 2026  
**Supersede:** ADR-023 (respecto a DRIVE_FILE_URL como protocolo público)  
**Área:** Core (providers), Frontend (DataProjector, ImageBlock)

---

## 1. Contexto y Problema

Hoy, cada provider expone protocolos específicos para resolver media:
- **Drive**: `DRIVE_FILE_URL` (File ID → canonical_url)
- **Notion**: URLs temporales resueltas internamente en `TABULAR_STREAM`
- **Otros**: No tienen protocolo unificado

El frontend debe conocer qué protocolo usar según el provider — viola el **Axioma de Agnosticismo UI** (ADR-001).

**Violaciones Axiomáticas Actuales:**
1. ImageBlock.jsx invoca `protocol: 'DRIVE_FILE_URL'` directamente — acoplamiento a Drive
2. No existe estrategia universal para resolver by-name, by-id, direct-url
3. Notion URLs expiran pero no hay contrato de expiración público

---

## 2. Decisión Arquitectónica

### 2.1 Protocolo Universal: `MEDIA_RESOLVE`

Crear un protocolo **agnóstico a storage** que cada provider soporta según sus capacidades:

```json
{
  "provider": "drive" | "notion" | "system" | "opfs",
  "protocol": "MEDIA_RESOLVE",
  "data": {
    "strategy": "BY_ID" | "BY_NAME_IN_CONTAINER" | "DIRECT_URL",
    "asset_id": "file_id_optional",
    "container_ref": "folder_id_or_page_id_optional",
    "asset_name": "filename_optional",
    "mime_hint": "image/jpeg_optional"
  }
}
```

### 2.2 Salida Uniforme: `INDRA_MEDIA` (ADR-023)

Todos los providers emiten el mismo tipo canónico:

```json
{
  "items": [
    {
      "id": "FILE_ID",
      "handle": { "ns": "com.indra.media", "alias": "...", "label": "..." },
      "class": "MEDIA",
      "provider": "drive",
      "protocols": ["ATOM_READ"],
      "payload": {
        "media": {
          "type": "INDRA_MEDIA",
          "storage": "drive",
          "canonical_url": "https://lh3.googleusercontent.com/d/FILE_ID",
          "file_id": "FILE_ID",
          "mime_type": "image/jpeg",
          "expires_at": null,
          "width": null,
          "height": null,
          "alt": "optional description"
        }
      }
    }
  ],
  "metadata": { "status": "OK", "strategy_used": "BY_ID" }
}
```

---

## 3. Estrategias de Resolución

### 3.1 BY_ID
**Input:** `asset_id` (File ID o Page ID nativo del provider)  
**Output:** Una imagen con ese ID exacto, o error transparente si no existe o no es imagen

**Implementación Drive:** Resolver File ID → `_drive_handleAtomRead()` existente → emitir INDRA_MEDIA  
**Implementación Notion:** Resolve Page ID → lectura de propiedades imagen → resolver URL temporal

### 3.2 BY_NAME_IN_CONTAINER
**Input:** `container_ref` (Folder ID o Page ID) + `asset_name` (nombre del archivo/bloque)  
**Output:** La imagen más reciente con ese nombre exacto (determinismo: `modified_at DESC`)  
**Error Transparente:** Si cero matches, retornar `{ items: [], metadata: { error: 'NO_MATCH' } }`

**Implementación Drive:**
1. HIERARCHY_TREE(container_ref)
2. Filter: mime_type starts with "image/"
3. Filter: handle.label exact match (case-insensitive) con asset_name
4. Sort by modified_at DESC
5. Take primero
6. BY_ID resolución del file_id resultante

**Implementación Notion:**
1. TABULAR_STREAM o HIERARCHY_TREE(container_ref, search=asset_name)
2. Filter: mime_type image/* (si disponible en propiedades)
3. Sort by updated_at DESC
4. Take primero
5. Resolve URL temporal + marcar expires_at = now() + 3600000 (1 hora)

### 3.3 DIRECT_URL
**Input:** `asset_id` es en realidad una URL (http:// o https://)  
**Output:** Validar que sea URL válido; retornar como INDRA_MEDIA con storage="url"

**Validación:** Regex `^https?://` + HEAD request opcional para verificar accesibilidad  
**Error Transparente:** Si no es URL válido, error inmediato

---

## 4. Responsabilidades por Capa

| Capa | Responsabilidad |
|------|----------------|
| **Backend Provider** | Declara en `CONF_()` qué estrategias soporta en `protocol_meta['MEDIA_RESOLVE']`. Implementa handler `_drive_handleMediaResolve()` o `_notion_handleMediaResolve()` |
| **Protocol Router** | Registra MEDIA_RESOLVE como protocolo **NO lightweight** (requiere validación completa de INDRA_MEDIA saliente). Valida que `payload.media.canonical_url ≠ null` |
| **Frontend (DataProjector)** | Espera INDRA_MEDIA en payload; extrae `canonical_url` para `<img src>` |
| **Frontend (ImageBlock)** | Invoca MEDIA_RESOLVE agnóstico: sabe provider + strategy + container_ref, no sabe cómo resuelve |

---

## 5. Políticas de Calidad

### 5.1 Determinismo by Name
Si múltiples archivos with same name en carpeta:
- **Política:** Resolver al más recientemente modificado (`modified_at DESC`)
- **Caso Edge:** Archivos creados en mismo timestamp → error transparente (ambigüedad no resuelta)
- **Documento:** Registrar en logs cuál fue seleccionado y por qué

### 5.2 Validación Saliente (protocol_router)
Todo MEDIA_RESOLVE retorno debe pasar:
```javascript
if (result.payload?.media) {
  if (!result.payload.media.canonical_url) throwError('canonical_url REQUIRED');
  if (!result.payload.media.storage) throwError('storage REQUIRED');
  if (result.payload.media.type !== 'INDRA_MEDIA') throwError('type must be INDRA_MEDIA');
}
```

### 5.3 TTL y Expiración
- **Drive:** `expires_at: null` (URLs de archivos compartidos son permanentes)
- **Notion:** `expires_at: now() + 3600000` (URLs temporales expiran en 1 hora)
- **URL externo:** `expires_at: null` (asumimos que URLs externas son permanentes)
- **Cliente responsable:** Si `expires_at < now()`, reintentar MEDIA_RESOLVE (opcional para MVP)

### 5.4 Falla Transparente (Sin Fallback Automático)
- Si BY_NAME_IN_CONTAINER falla, **NO intentes BY_ID automáticamente**
- Cliente decide reintentar con otra estrategia
- Retorna error claro: `{ status: 'ERROR', code: 'NO_MATCH', strategy: 'BY_NAME_IN_CONTAINER' }`

---

## 6. Implementación Requerida

### 6.1 Backend (provider_drive.js)
- Eliminar `DRIVE_FILE_URL` de `protocols[]` y `CONF_DRIVE()`
- Retirar función `_drive_handleFileUrl()` (su lógica se integra en BY_ID de MEDIA_RESOLVE)
- Implementar `_drive_handleMediaResolve(uqo)` con casos BY_ID, BY_NAME_IN_CONTAINER, DIRECT_URL
- Agregar a `CONF_DRIVE()`: `MEDIA_RESOLVE` en `protocols[]` e `implements`

### 6.2 Backend (provider_notion.js)
- Implementar `_notion_handleMediaResolve(uqo)` análogo
- Incluir política de `expires_at = now() + 3600000`
- Agregar a `CONF_NOTION()`: `MEDIA_RESOLVE` en `protocols[]`

### 6.3 Backend (protocol_router.js)
- Remover `DRIVE_FILE_URL` de `LIGHTWEIGHT_PROTOCOLS`
- MEDIA_RESOLVE es protocolo **full validation** (no lightweight)

### 6.4 Frontend (ImageBlock.jsx)
- Eliminar `resolveFromDriveFolderByName()` y `resolveFromDriveFileId()` (invocaban DRIVE_FILE_URL)
- Refactor `useEffect` para invocar MEDIA_RESOLVE agnóstico:
  - Props: `provider`, `strategy`, `container_ref`, `asset_name`, `asset_id`
  - No props específicas de Drive (`driveFolderId`, `driveFileName`)

### 6.5 Frontend (inspectorManifests.js)
- IMAGE section:
  - Remover `sourceMode: { DRIVE_LATEST_BY_NAME, DRIVE_FILE_ID, DIRECT }`
  - Agregar: `strategy` dropdown (BY_ID | BY_NAME_IN_CONTAINER | DIRECT_URL)
  - Agregar: `provider` dropdown (drive | notion | ...)
  - Agregar: `container_ref` text field
  - Agregar: `asset_name` text field
  - Agregar: `asset_id` text field

### 6.6 Documentación (ADR-023)
- Actualizar: Reclasificar `DRIVE_FILE_URL` como "protocolo heredado eliminado"
- Actualizar: Elevar `MEDIA_RESOLVE` a "protocolo oficial universal"
- Actualizar: Referenciar ADR-024 para estrategias

---

## 7. Ejemplo de Uso

### 7.1 Frontend (ImageBlock invoca MEDIA_RESOLVE)
```jsx
// Nuevo agnóstico:
const result = await bridge.request({
  provider: p.provider,  // "drive" o "notion"
  protocol: 'MEDIA_RESOLVE',
  data: {
    strategy: 'BY_NAME_IN_CONTAINER',
    container_ref: p.container_ref,    // folder_id o page_id
    asset_name: p.asset_name
  }
});

const media = result.items[0]?.payload?.media;
if (media?.canonical_url) {
  setResolvedSrc(media.canonical_url);
  if (media.expires_at) setExpiration(media.expires_at);
} else {
  handleError(result.metadata.error);
}
```

### 7.2 Backend (provider_drive.js BY_NAME_IN_CONTAINER)
```javascript
function _drive_handleMediaResolve(uqo) {
  const strategy = uqo.data?.strategy || 'BY_ID';
  const data = uqo.data || {};

  switch (strategy) {
    case 'BY_ID':
      return _resolveByID_drive(data.asset_id);
    case 'BY_NAME_IN_CONTAINER':
      return _resolveByNameInContainer_drive(data.container_ref, data.asset_name);
    case 'DIRECT_URL':
      return _resolveDirectUrl(data.asset_id);
    default:
      return { items: [], metadata: { status: 'ERROR', error: 'Unknown strategy' } };
  }
}

function _resolveByNameInContainer_drive(folderId, fileName) {
  const tree = DriveApp.getFolderById(folderId).getFiles();
  const candidates = [];
  while (tree.hasNext()) {
    const file = tree.next();
    if (file.getMimeType().startsWith('image/') && file.getName().toLowerCase() === fileName.toLowerCase()) {
      candidates.push(file);
    }
  }
  
  if (candidates.length === 0) {
    return { items: [], metadata: { status: 'ERROR', error: 'NO_MATCH', strategy: 'BY_NAME_IN_CONTAINER' } };
  }

  // Sort by modified_at DESC
  candidates.sort((a, b) => b.getLastUpdated() - a.getLastUpdated());
  const file = candidates[0];
  
  // Retornar como INDRA_MEDIA
  return _buildMediaAtom_drive(file);
}
```

---

## 8. Validación de Implementación

**During:**
1. ✅ ADR-024 define MEDIA_RESOLVE con tres estrategias agnósticas
2. ✅ `_drive_handleMediaResolve()` soporta BY_ID, BY_NAME_IN_CONTAINER, DIRECT_URL
3. ✅ `_notion_handleMediaResolve()` análogo (con expires_at policy)
4. ✅ protocol_router.js: MEDIA_RESOLVE NO lightweight (validación completa)
5. ✅ INDRA_MEDIA saliente: canonical_url ≠ null, type = 'INDRA_MEDIA', storage ≠ null

**Post:**
1. ✅ ImageBlock.jsx: provider='drive' + strategy='BY_NAME_IN_CONTAINER' → imagen renderizada
2. ✅ ImageBlock.jsx: provider='notion' + strategy='BY_NAME_IN_CONTAINER' → imagen renderizada (expires_at visible)
3. ✅ DRIVE_FILE_URL: eliminado completamente (grep vacío)
4. ✅ Grep codebase: cero referencias a DRIVE_FILE_URL
5. ✅ DataProjector.js: consume INDRA_MEDIA correctamente

---

## 9. Decisiones Arquitectónicas

1. **Falla Transparente Obligatoria**: Sin fallback automático. Cliente controla reintentos.
2. **Determinismo Modified-At**: BY_NAME → último modificado (DESC).
3. **No Ambigüedad Silenciosa**: Si cero o múltiples matches sin resolver → error claro.
4. **Provider Agnóstico en UI**: Props de ImageBlock NO mencionan Drive, Notion, etc. Solo `provider`, `strategy`, `container_ref`.
5. **Validación en Router, No en Provider**: protocol_router valida INDRA_MEDIA; proveedor confía en que router rechazará malformaciones.

---

## 10. Futuro (Post-MVP)

1. **Rate Limiting en Gateway** para mismo asset (si cientos de requests)
2. **Caché local en App State** con TTL para Notion (refresh silencioso pre-expiración)
3. **Nuevos Providers**: OneDrive, OPFS siguiendo template MEDIA_RESOLVE
4. **Image Metadata Extraction**: Width, height, color palette en INDRA_MEDIA
5. **Soft Refresh para Expired Notion URLs**: Botón "Recargar" o automático pre-expiro

---

*Este ADR canoniza la transición de protocolos específicos de provider a protocolo universal agnóstico, alineado con Axioma de Independencia (Suh) y Teoría General de Sistemas.*
