# INDRA STRUCTURAL BLUEPRINTS: DNA & NEURONS (v17.5)
> **Axiomatic Mandate**: Business logic and data structures must reside in `src/score/` and be imported as external modules. **Zero logic in HTML.**

## 1. CANONICAL SCHEMA (The DNA)
**Storage**: `src/score/schemas/ProjectSchema.js`
**Purpose**: Defines the shape of the matter.

```javascript
/**
 * @indra_schema ProjectSchema
 * This file is recognized by the SchemaDesigner for DNA projections.
 */
export const ProjectSchema = {
    class: 'INDRA_PROJECT',
    handle: {
        ns: 'com.indra.project',
        alias: 'project',
        label: 'Gestión de Proyectos',
        icon: 'RESONANCE_SCAN'
    },
    payload: {
        fields: [
            { id: 'name', label: 'Nombre del Proyecto', type: 'string', required: true },
            { id: 'budget', label: 'Presupuesto Local', type: 'number', alias: 'budget_usd' },
            { id: 'deadline', label: 'Resonancia Final', type: 'date' },
            { id: 'status', label: 'Estado', type: 'enum', options: ['IGNITING', 'STABLE', 'OMEGA'] }
        ]
    }
};
```

## 2. CANONICAL WORKFLOW (The Neurons)
**Storage**: `src/score/logic/ProjectWorkflows.js`
**Purpose**: Defines how the satellite acts upon the matter.

```javascript
/**
 * @indra_logic ProjectWorkflows
 * Centralized logic accessible via the WorkflowDesigner.
 */
export const ProjectWorkflows = {
    ignite_project: {
        trigger: 'BUTTON_CLICK',
        steps: [
            { 
                station: 'VALIDATE_DATA', 
                action: (data) => data.name.length > 3 
            },
            { 
                station: 'CORE_EMISSION', 
                protocol: 'TABULAR_UPDATE', // 🚀 CANON v17.6: Uso de Tabular para datos
                schema_id: 'project',
                data: (data) => ({ 
                    actions: [{ type: 'CREATE', data: data }] 
                }) 
            }
        ]
    },
    
    archive_old_projects: {
        trigger: 'CRON_JOB', 
        steps: [
            { 
                protocol: 'TABULAR_UPDATE', 
                schema_id: 'project',
                data: { 
                    query: { status: 'OLD' },
                    actions: [{ type: 'UPDATE', data: { status: 'ARCHIVED' } }]
                } 
            }
        ]
    }
};
```

## 3. CANONICAL HTML INTEGRATION
The skin remains clean and reactive.

```html
<head>
    <!-- 1. The DNA -->
    <script type="module">
        import { ProjectSchema } from './src/score/schemas/ProjectSchema.js';
        console.log("ADN Cargado:", ProjectSchema.handle.label);
    </script>

    <!-- 2. The Neurons -->
    <script type="module">
        import { ProjectWorkflows } from './src/score/logic/ProjectWorkflows.js';
        
        // Example binding: The HTML doesn't have logic, it just "hooks" it.
        document.getElementById('btn-ignite').onclick = () => {
            ProjectWorkflows.ignite_project.steps.execute(); 
        };
    </script>
</head>
```

---
### 🏛️ WHY THIS IS AXIOMATIC?
- **Portability**: You can move `ProjectSchema.js` to another satellite and it works immediately.
- **AI-Readability**: As an AI, I can scan your `/schemas` and `/logic` folders and understand your entire business without reading 20 HTML files.
- **Zero Collision**: Layout changes in CSS/HTML won't break your data validation or Core protocols.

---

## 4. CANONICAL DATA RETRIEVAL (Reading from the Core)

**The Critical Pattern**: Cómo traer datos de una tabla del Core con nombres humanos y campos reales.

> ⚠️ **Ley Verificada en Depuración**: El Core exige `context_id` (no `id` ni `atom_id`). Los datos reales siempre vienen en `items[0]`.

### 4a. Leer la estructura de un Esquema (Sus campos/columnas)

```javascript
// PASO 1: Traer el esquema del Core (la definición, no los datos)
const res = await bridge.execute({
    protocol: 'ATOM_READ',
    context_id: 'ID_DEL_ESQUEMA'  // ⚠️ SIEMPRE context_id
});

const esquema = res.items[0];

// PASO 2: Extraer con nombres humanos
const nombreHumano = esquema.handle.label;       // "Inventario Maestro"
const alias        = esquema.handle.alias;       // "inventario_maestro"
const campos       = esquema.payload.fields;     // [{id, label, type, alias, ...}]
const tablaFisica  = esquema.payload.target_silo_id; // ID de la Spreadsheet real

// PASO 3: Renderizar el formulario con etiquetas humanas
campos.forEach(campo => {
    console.log(`Campo: ${campo.label} (tipo: ${campo.type})`); // "Campo: Nombre Producto (tipo: TEXT)"
});
```

### 4b. Leer registros de datos de la tabla física

```javascript
// Una vez tienes el target_silo_id del esquema...
const datos = await bridge.execute({
    provider: 'sheets',                          // Proveedor físico del silo
    protocol: 'TABULAR_STREAM',
    context_id: esquema.payload.target_silo_id, // ID de la Spreadsheet
    data: { limit: 100 }
});

const filas       = datos.items;                // Array de registros
const estructura  = datos.metadata.schema.fields; // Columnas con nombres reales
```

### 4c. Blueprint Puro (Destilación de Materia para persistencia local)

Al guardar un esquema localmente (en src/score/schemas/), **solo** se persiste la esencia:

```javascript
// ✅ GUARDAR SOLO ESTO (Blueprint Soberano):
export const SCHEMA = {
    id:      'ID_DEL_ESQUEMA',
    handle:  { label: 'Inventario Maestro', alias: 'inventario_maestro' },
    class:   'DATA_SCHEMA',
    payload: {
        fields:          [...],         // Los campos reales
        target_silo_id:  'ID_SHEETS',   // Vínculo físico
        target_provider: 'sheets'
    }
};

// ❌ NUNCA persistir: core_id, created_at, updated_at, protocols, raw, provider
```

### 4d. Patrón Bidireccional (PULL → Editar → PUSH)

```javascript
// PULL: Core → Local (importar)
// Protocolo: ATOM_READ + context_id → Destilar → Guardar en src/score/schemas/

// PUSH (Actualizar existente): Local → Core
await bridge.execute({
    protocol: 'ATOM_UPDATE',       // Si tiene ID → UPDATE
    context_id: schema.id,
    data: { handle: schema.handle, payload: schema.payload }
});

// PUSH (Crear nuevo): Local → Core  
await bridge.execute({
    protocol: 'ATOM_CREATE',       // Si no tiene ID → CREATE
    context_id: workspaceId,
    data: { class: 'DATA_SCHEMA', handle: schema.handle, payload: schema.payload }
});
```

### 4e. El Takeover del DOM (Modo Soberano)
En producción, la aplicación de negocio debe reclamar el espacio total de la ventana.

```javascript
// src/app.js: Patrón de Takeover
export async function ignite(bridge, kernel) {
    const root = document.getElementById('app-root');
    // La app materializa su Piel sobre el nodo raíz, 
    // ignorando cualquier interfaz técnica preexistente.
    InventarioMaterializer.render(root, InventarioWorkflows, bridge);
}
```

---
### 🏛️ LA DOBLE RESIDENCIA
Todo Satélite Indra debe mantener dos puertas:

1.  **`/index.html` (Sandbox)**: El taller donde el Arquitecto configura el Bridge y hace PULL de esquemas.
2.  **`/app.html` (Portal)**: El producto terminado. Sin ruido, sin HUD, solo el valor del negocio resonando con el Core.

---
*Indra OS - Estructura y Vínculo v17.5* 🛰️🏛️💎🔥
