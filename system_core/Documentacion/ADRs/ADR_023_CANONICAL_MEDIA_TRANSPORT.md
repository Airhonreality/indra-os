# ADR-023: Transporte Canónico de Medios (Ley de Aduanas Visual)

**Estado:** APROBADO  
**Fecha:** 2026-03-19  
**Área:** Core (provider_drive, provider_notion) + Frontend (DataProjector, ComponentMapper)

---

## Contexto y Problema

Los providers actuales (Drive, Notion) devuelven imágenes de formas incompatibles:

- **Notion** → URLs temporales firmadas (expiran en ~1 hora). Formato: `https://prod-files-secure.s3.us-west-2.amazonaws.com/...?X-Amz-Expires=3600`
- **Drive** → File IDs sin URL de visualización directa. Para ver la imagen hay que construir `https://drive.google.com/uc?id=FILE_ID`
- **URLs externas** → Cualquier formato arbitrario

El frontend no sabe cómo renderizar una imagen porque no sabe de qué provider viene ni si la URL es temporal o permanente. Esto viola el **Axioma de Agnosticismo UI** (ADR-001): el frontend nunca debe conocer la lógica interna de un provider.

Hoy mismo, pasar una imagen de Drive a través de un Bridge al AEE requiere que el usuario entienda que debe usar una URL concreta de Drive. Esto no es soberanía — es deuda tecnológica exportada al usuario.

---

## Decisión

### 1. Tipo Canónico: `INDRA_MEDIA`

Todo campo o payload que contenga un recurso visual (imagen, video, archivo binario) debe expresarse en el **tipo canónico `INDRA_MEDIA`** antes de cruzar la frontera del provider hacia el Core:

```json
{
  "type": "INDRA_MEDIA",
  "storage": "drive" | "notion" | "url" | "opfs",
  "canonical_url": "https://...",
  "file_id": "1BxiMVs0XCkDFG...",
  "mime_type": "image/jpeg",
  "width": null,
  "height": null,
  "expires_at": null,
  "alt": "Descripción opcional"
}
```

**Campos obligatorios:** `type`, `storage`, `canonical_url`  
**Campos opcionales:** `file_id` (para refrescar si expira), `mime_type`, `width`, `height`, `expires_at`, `alt`

### 2. Responsabilidad por capa

| Capa | Responsabilidad |
|------|----------------|
| `provider_drive.js` | Cuando un campo es de tipo imagen (mime_type `image/*`), construir `canonical_url` = `https://lh3.googleusercontent.com/d/FILE_ID` (thumbnail público) o URL de exportación. Marcar `storage: 'drive'`. |
| `provider_notion.js` | Cuando un bloque o propiedad es de tipo imagen, resolver la URL temporal y emitirla como `canonical_url`. Incluir `expires_at` si se puede determinar. Marcar `storage: 'notion'`. |
| `DataProjector.js` (frontend) | Detectar campos `INDRA_MEDIA` en el payload y proyectarlos para renderizado. Nunca manipular URLs directamente. |
| `ComponentMapper.jsx` (AEE) | Al detectar un campo de tipo `IMAGE` en el Schema, renderizar el widget de imagen que produce/consume un `INDRA_MEDIA`. |
| `FormRunner.jsx` | El campo IMAGE del formulario acepta un File ID de Drive o URL, y lo empaqueta como `INDRA_MEDIA` antes de enviar al Bridge. |

### 3. Nuevos Protocolos del provider `drive`

Se añaden dos protocolos al `CONF_DRIVE()`:

- **`DRIVE_FILE_URL`** → Dado un `context_id` (File ID), retorna un átomo con `payload.media` de tipo `INDRA_MEDIA` con la `canonical_url` resuelta. Para uso del Bridge.
- **`DRIVE_DOCUMENT_FILL`** → Dado un `context_id` (ID de un Google Doc template) y `data.variables` (mapa `{{campo}}` → valor), duplica el documento, rellena las variables y retorna el ID del nuevo documento. Si `data.export_pdf: true`, lo convierte a PDF y retorna la URL del PDF.

### 4. Nuevo Protocolo del provider `system` (para automatizaciones nocturnas)

- **`SYSTEM_PDF_EXPORT`** → Dado un `context_id` (ID de un Google Doc o del átomo DOCUMENT de Indra), exporta a PDF usando `DriveApp.getFileById(id).getAs(MimeType.PDF)`, lo guarda en Drive y retorna el `INDRA_MEDIA` del PDF resultante. Invocable desde un Workflow Executor nocturno.

### 5. Exportación PDF desde el Frontend

Para exportación PDF de alta fidelidad desde el frontend (Document Designer, AEE result panel), se usará el **mecanismo CSS Print**:

```js
// Protocolo: FRONTEND_PDF_EXPORT (invocado por trigger de UI)
// No requiere backend. Usa window.print() con @media print CSS.
// El Document Designer ya tiene un layout que puede aislarse con print-only classes.
```

Esto respeta la **soberanía del dispositivo**: el PDF de alta fidelidad lo genera el motor de rendering del navegador del usuario, que ya tiene la fuente, los estilos y los assets cargados.

---

## Consecuencias

### Positivas
- El frontend queda completamente agnóstico al origen de las imágenes.
- Un Bridge puede recibir una imagen de Notion y escribirla en un Doc de Drive sin saber que son plataformas distintas.
- Las URLs temporales de Notion se resuelven en el Core, donde hay acceso a las APIs — no en el cliente.
- El AEE puede aceptar imágenes de Drive como input de formulario sin lógica especial.

### Negativas / Riesgos
- Las URLs de Drive construidas como `https://lh3.googleusercontent.com/d/FILE_ID` solo funcionan si el archivo está compartido al menos como "cualquiera con el enlace". Para archivos privados, el Core deberá usar un endpoint de proxy temporal.
- Las URLs de Notion expiran. Si el átomo se guarda en el Core con la URL temporal y no se refresca, la imagen quedará rota en horas. **Mitigación:** El campo `expires_at` permite al Bridge o al Workflow detectar si necesita refrescar antes de usar.

---

## Implementación (este ADR)

### Core (provider_drive.js)
- Añadir `DRIVE_FILE_URL` y `DRIVE_DOCUMENT_FILL` a `CONF_DRIVE()`
- Implementar `_drive_handleFileUrl()` y `_drive_handleDocumentFill()`
- En `_drive_fileToAtom()`: si `mime_type` empieza con `image/`, añadir `payload.media` con tipo `INDRA_MEDIA`

### Core (provider_system_infrastructure.js o nuevo provider_media.js)
- Añadir `SYSTEM_PDF_EXPORT`

### Frontend (DataProjector.js)
- Añadir `projectMedia(field)` — detecta `INDRA_MEDIA` y retorna URL canónica lista para `<img src>`

### Frontend (ComponentMapper.jsx)
- El campo tipo `IMAGE` en el AEE acepta un texto (Drive File ID o URL) y lo empaqueta como `INDRA_MEDIA`

### Frontend (ResultPanel.jsx / DocumentDesigner)  
- Botón `EXPORTAR_PDF` que invoca `window.print()` con clase CSS `indra-print-scope` aislando el contenido relevante
