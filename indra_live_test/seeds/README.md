# Seeds — Artefactos de Demostración

Carpeta que contiene los JSONs que serán cargados automáticamente durante `first-time-setup.ps1`.

## Estructura

```
seeds/
├── demo_schema.json       # Descriptor del formulario interactivo (DATA_SCHEMA)
├── demo_document.json     # Plantilla de PDF (DOCUMENT)
├── demo_workflow.json     # Orquestación completa (WORKFLOW)
└── README.md             # Este archivo
```

## Cómo Funciona

1. **Setup:** El usuario ejecuta `first-time-setup.ps1`
2. **Compilación:** Los 3 JSONs se inyectan como constantes globales en GAS
3. **Seed:** Se ejecuta `clasp run seedDemo`
4. **Resultado:** Los 3 átomos se crean y se anclan al workspace
5. **Demo:** El frontend mostrará este flujo en el dashboard inicial

## Protocolo de Cambios

Para reemplazar la demo:

1. **Editar los JSONs** en esta carpeta (máximo 1 JSON por cambio)
2. **Validar estructura** (usa los validadores en `seed_loader.gs`)
3. **No cambiar nombres de archivo** (hardcodeados en setup)
4. **No cambiar IDs de placeholders** (`=PLACEHOLDER_SCHEMA_ID`, etc.)

## Estructura de los JSONs

### `demo_schema.json`

Define un formulario con campos.

**Campos soportados:**
- `id`: Identificador único del campo
- `handle.label`: Texto visible para el usuario
- `handle.alias`: Nombre técnico para referencias
- `type`: TEXT, LONG_TEXT, EMAIL, NUMBER, DATE, etc.
- `required`: boolean
- `hint`: Texto de ayuda

**Ejemplo:**
```json
{
  "handle": { "label": "Mi Formulario" },
  "payload": {
    "fields": [
      { "id": "f1", "handle": { "alias": "email", "label": "Tu email" }, "type": "EMAIL", "required": true }
    ]
  }
}
```

### `demo_document.json`

Define una plantilla de PDF con elementos y variables.

**Elementos soportados:**
- `HEADER`: Encabezado
- `TITLE`: Título (puede usar alias de campos)
- `BODY`: Contenido (puede usar alias de campos)
- `DIVIDER`: Línea separadora
- `SPACER`: Espacio en blanco
- `FOOTER`: Pie de página

**Variables:**
Se reemplazan al renderizar. Sintaxis:
- `=payload.field_name` - Valor del formulario
- `=$steps.s1.items[0].id` - Salida de un step anterior
- `=new Date().toISOString()` - Expresiones en JavaScript

**Ejemplo:**
```json
{
  "handle": { "label": "Mi Plantilla" },
  "payload": {
    "elements": [
      { "type": "TITLE", "content_alias": "title_field" },
      { "type": "BODY", "content_alias": "content_field" }
    ]
  }
}
```

### `demo_workflow.json`

Define la orquestación (DAG) de steps.

**Estructura:**
```json
{
  "handle": { "label": "Mi Flujo" },
  "payload": {
    "trigger": { "type": "SCHEMA_SUBMIT" },
    "stations": [
      {
        "id": "s1",
        "label": "Paso 1",
        "engine": "AEE_RUNNER",
        "schema_id": "=PLACEHOLDER_SCHEMA_ID",
        "depends_on": []
      }
    ]
  }
}
```

**Engines soportados:**
- `AEE_RUNNER` - Formulario interactivo
- `OAUTH_HANDLER` - Autorización OAuth (pausa el flujo)
- `DRIVE_ENGINE` - Operaciones en Google Drive
- `DOCUMENT_ENGINE` - Renderizado de PDFs
- `WORKFLOW_EXECUTOR` - Flujos anidados

**Placeholders:**
- `=PLACEHOLDER_SCHEMA_ID` → Se reemplaza por el ID real del schema
- `=PLACEHOLDER_DOCUMENT_ID` → Se reemplaza por el ID real del documento

## Proceso de Seed

### 1. Parseo

```javascript
const schemaJson = JSON.parse(SEED_DEMO_SCHEMA);
const documentJson = JSON.parse(SEED_DEMO_DOCUMENT);
const workflowJson = JSON.parse(SEED_DEMO_WORKFLOW);
```

### 2. Creación de Átomos

```javascript
// Crear SCHEMA
const schemaResult = route({
  provider: 'system',
  protocol: 'ATOM_CREATE',
  data: { class: 'DATA_SCHEMA', ...schemaJson }
});

// Crear DOCUMENT
const documentResult = route({...});

// Crear WORKFLOW (con IDs resueltos)
const workflowResult = route({...});
```

### 3. Anclaje

```javascript
route({
  provider: 'system',
  protocol: 'SYSTEM_PIN',
  workspace_id: 'default_workspace',
  data: { atom: schemaAtom }
});
```

## Validación

Antes de hacer seed, el loader valida:

- ✅ JSONs parseables (JSON válido)
- ✅ Estructura mínima (handle + payload)
- ✅ Campos requeridos no vacíos
- ✅ Placeholders coinciden

Si alguna validación falla → Error legible en logs y el seed se detiene.

## Logs

El comando `clasp run seedDemo` genera:

```
✅ JSONs parseados correctamente
✅ SCHEMA creado: atom_abc123
✅ DOCUMENT creado: atom_def456
✅ WORKFLOW creado: atom_ghi789
✅ SCHEMA anclado
✅ DOCUMENT anclado
✅ WORKFLOW anclado

🚀 SEED DEMO COMPLETADO EXITOSAMENTE
```

Si falla:

```
❌ SEED DEMO FALLÓ
Error: ...
Code: SCHEMA_CREATE_FAILED
```

## Próximos Pasos

Cuando recibas los JSONs finales del usuario:

1. Reemplaza los 3 archivos
2. Ejecuta `clasp push` desde la carpeta del proyecto
3. Corre `clasp run seedDemo` para validar
4. Si OK → incluye en la rama de producción
5. Si ERROR → muestra logs al usuario

## Referencia

- **Protocolo:** DATA_CONTRACTS §7.1
- **ADR:** ADR-003 (Soberanía Glandular), ADR-020 (OAuth Handshake)
- **Loader:** `../seed_loader.gs`
