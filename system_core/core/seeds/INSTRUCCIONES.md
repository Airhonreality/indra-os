# 📋 Guía: Próximos Pasos del Sistema de Seeding

## ✅ Lo que acabamos de crear

### 1. **ADR-020: Protocolo de Autenticación Escalonada**
📍 Ubicación: [system_core/Documentacion/ADRs/ADR-020_OAUTH_HANDSHAKE_STEPWISE.md](../../system_core/Documentacion/ADRs/ADR-020_OAUTH_HANDSHAKE_STEPWISE.md)

Define a nivel arquitectónico:
- Cómo los workflows pueden **pausarse** esperando autorización OAuth
- Flujo de tokens temporales (`handshake_token`)
- Protocolos `OAUTH_HANDSHAKE` y `WORKFLOW_RESUME`
- DAG de ejemplo con step de login

**Leer si:** Quieres entender cómo funciona el flujo de autenticación a nivel técnico.

---

### 2. **seed_loader.gs: Script de Carga Automática**
📍 Ubicación: [system_core/core/seed_loader.gs](../../system_core/core/seed_loader.gs)

Función: `seedDemo()`
- Lee los 3 JSONs de `seeds/`
- Crea átomos SCHEMA, DOCUMENT, WORKFLOW
- Los ancla al workspace
- Genera logs detallados

**Ejecución:** Corre automáticamente en `first-time-setup.ps1` (PASO 4.5)

---

### 3. **Archivo de Plantillas (vacías pero funcionales)**
📍 Ubicación: `system_core/core/seeds/`

```
seeds/
├── demo_schema.json      ← Reemplazar con TU formulario
├── demo_document.json    ← Reemplazar con TU plantilla PDF
├── demo_workflow.json    ← Reemplazar con TU orquestación
└── README.md            ← Guía técnica de estructura
```

**Estado actual:** Templates genéricos de ejemplo (flujo "Formulario → PDF en Drive")

---

## 🎯 Qué Necesitas Hacer

### PASO 1: Envía los 3 JSONs

Cuando tengas definidos:
1. **Formulario** (campos que quieres capturar)
2. **Plantilla PDF** (cómo debe verse el documento)
3. **Flujo** (pasos, conexiones, lógica)

**Envíame en este formato:**

```json
// demo_schema.json
{
  "handle": { "label": "...", "alias": "..." },
  "payload": {
    "fields": [
      { "id": "f1", "handle": {...}, "type": "STRING", ... }
    ]
  }
}
```

**O más simplemente:** Dame una descripción textual como:
- "Quiero un formulario con: email, nombre, edad"
- "El PDF debe tener: encabezado con logo, título, contenido, firma"
- "El flujo es: form → crea carpeta en drive → genera PDF → lo guarda"

Yo convertiré eso a JSONs válidos.

---

### PASO 2: Yo actualizo los archivos

Haré pull de tus JSONs y:
1. Reemplaceré los 3 archivos en `seeds/`
2. Validaré la estructura
3. Ejecutaré `clasp run seedDemo` para probar
4. Confirmaré que funciona

---

### PASO 3: Integración Automática

Una vez validado:
1. El setup automático cargará la demo en cada instalación nueva
2. Usuarios verán tu flujo completo en el dashboard inicial
3. Al hacer click → abre el formulario → completan → genera PDF en su Drive

---

## 📐 Estructura Esperada de JSONs

### `demo_schema.json` (Formulario)

```json
{
  "handle": {
    "label": "Nombre visible del formulario",
    "alias": "nombre_tecnico"
  },
  "payload": {
    "fields": [
      {
        "id": "f1",
        "handle": {
          "alias": "email_field",
          "label": "¿Cuál es tu email?"
        },
        "type": "EMAIL",
        "required": true
      },
      {
        "id": "f2",
        "handle": {
          "alias": "message",
          "label": "Tu mensaje"
        },
        "type": "LONG_TEXT",
        "required": false
      }
    ]
  }
}
```

**Tipos soportados:**
- `TEXT` - Texto corto
- `LONG_TEXT` - Párrafo
- `EMAIL` - Correo electrónico
- `NUMBER` - Número
- `DATE` - Fecha
- `PHONE` - Teléfono
- `URL` - Página web
- `select` - Dropdown (con opciones)

---

### `demo_document.json` (Plantilla PDF)

```json
{
  "handle": {
    "label": "Nombre de la plantilla",
    "alias": "plantilla_tecnica"
  },
  "payload": {
    "elements": [
      {
        "type": "HEADER",
        "content": "ENCABEZADO FIJO"
      },
      {
        "type": "TITLE",
        "content_alias": "titulo_del_documento"  // Viene del formulario
      },
      {
        "type": "BODY",
        "content_alias": "contenido_principal"
      },
      {
        "type": "FOOTER",
        "content": "Pie de página automático"
      }
    ]
  }
}
```

**Elementos soportados:**
- `HEADER` - Encabezado
- `TITLE` - Título (puede usar alias)
- `BODY` - Contenido (puede usar alias)
- `DIVIDER` - Línea separadora
- `SPACER` - Espacio en blanco
- `FOOTER` - Pie de página
- `IMAGE` - Imagen
- `TABLE` - Tabla

---

### `demo_workflow.json` (Flujo/Orquestación)

```json
{
  "handle": {
    "label": "Flujo Demo: De Formulario a PDF",
    "alias": "workflow_demo"
  },
  "payload": {
    "trigger": {
      "type": "SCHEMA_SUBMIT"  // Se dispara cuando se llena el form
    },
    "stations": [
      {
        "id": "s1",
        "label": "Captura de datos",
        "engine": "AEE_RUNNER",
        "schema_id": "=PLACEHOLDER_SCHEMA_ID"  // Se rellena automáticamente
      },
      {
        "id": "s2",
        "label": "Generar PDF",
        "engine": "DOCUMENT_ENGINE",
        "protocol": "NATIVE_DOCUMENT_RENDER",
        "context_id": "=PLACEHOLDER_DOCUMENT_ID",
        "depends_on": ["s1"]
      },
      {
        "id": "s3",
        "label": "Guardar en Drive",
        "engine": "DRIVE_ENGINE",
        "protocol": "ATOM_CREATE",
        "context_id": "ROOT",
        "depends_on": ["s2"]
      }
    ]
  }
}
```

**Motores (engines):**
- `AEE_RUNNER` - Ejecuta un formulario
- `OAUTH_HANDLER` - Pide autorización (pausa)
- `DOCUMENT_ENGINE` - Genera PDF
- `DRIVE_ENGINE` - Opera en Google Drive
- `LOGIC_ENGINE` - Ejecuta lógica/fórmulas

---

## 🔄 Flujo Completo Final

```
Usuario visita INDRA
    ↓
Frontend detecta workspace "demo"
    ↓
Muestra tarjeta "Flujo Demo"
    ↓
Usuario hace click × "Abrir Flujo"
    ↓
AEE abre → formulario visible
    ↓
Usuario rellena:
  - Email: user@example.com
  - Mensaje: "Hola INDRA"
    ↓
Usuario pulsa "Enviar"
    ↓
SCHEMA_SUBMIT dispara workflow
    ↓
s1: Captura datos ✓
    ↓
s2: Genera PDF ✓
    ↓
s3: Guarda en Drive ✓
    ↓
Frontend muestra: "✅ PDF generado en tu Drive"
```

---

## 📖 Documentación Técnica

- [ADR-020: OAuth Handshake](../../system_core/Documentacion/ADRs/ADR-020_OAUTH_HANDSHAKE_STEPWISE.md)
- [Seeds README](../../system_core/core/seeds/README.md)
- [seed_loader.gs](../../system_core/core/seed_loader.gs)

---

## 🚀 Próximos Pasos (Orden)

1. **TÚ** → Decides qué demo quieres (form, PDF, flujo)
2. **TÚ** → Envías JSONs o descripción
3. **YO** → Creo/actualizo JSONs en `seeds/`
4. **YO** → Valido con `clasp run seedDemo`
5. **YO** → Confirmación de que funciona
6. **SETUP** → Automático en nuevas instalaciones

---

## ❓ Preguntas Frecuentes

### ¿Puedo tener varias demos?
Sí, pero el loader actual solo carga una (the "default demo"). Futuro: agregar selector de demos.

### ¿Dónde se guardan los artefactos creados?
En Google Drive, en una carpeta `INDRA/` de la cuenta del dueño del deployment.

### ¿Los usuarios verán la demo?
Sí, como un flujo más en el dashboard. Si quieres "onboarding forzado", avísame y lo hacemos.

### ¿Puedo cambiar la demo sin re-instalar?
Sí: actualiza los JSONs en `seeds/`, haz `clasp push`, luego `clasp run seedDemo` manualmente.

### ¿Los JSONs se usan solo en setup o siempre?
Solo en setup. Una vez creados los átomos, los JSONs son "histórico".

---

## ✍️ Cómo Contactar

Cuando tengas los JSONs, envíame:

```
// Opción A: Archivos JSON completos
Adjunta: demo_schema.json, demo_document.json, demo_workflow.json

// Opción B: Descripción textual
"Quiero un formulario que pida: nombre, email, edad.
El PDF debe mostrar esos datos en una tabla.
El flujo: form → validar email → crear carpeta en Drive → PDF → guardar"
```

---

**Estado actual:** ✅ Infraestructura lista. Esperando tus JSONs.
