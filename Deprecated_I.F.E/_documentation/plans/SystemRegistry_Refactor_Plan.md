# 🔧 Refactorización: SystemRegistry → Artifact Launcher

> **Fecha:** 2026-01-12  
> **Problema Identificado:** Redundancia axiomática entre IndraAdapter y SystemRegistry  
> **Solución:** Redefinir SystemRegistry como "Artifact Launcher" con acciones contextuales

---

## 1. Diagnóstico del Problema

### 1.1 Error Actual
```javascript
// ❌ INCORRECTO
await Neutron.callCore('PublicAPI', 'scanArtifacts', flowsFolderId);

// ✅ CORRECTO
await Neutron.callCore('PublicAPI', 'scanArtifacts', { folderId: flowsFolderId });
```

**Causa:** `scanArtifacts` espera un objeto `{ folderId: string }`, no un string directo.

### 1.2 Redundancia Axiomática
- **IndraAdapter:** Ya clasifica y categoriza artefactos (Sensing Cognitivo)
- **SystemRegistry:** Solo muestra lo que IndraAdapter ya procesó
- **Resultado:** Capa de UI sin valor agregado

---

## 2. Nuevo Dharma: Artifact Launcher

### 2.1 Propósito Redefinido
**SystemRegistry** debe ser un **"Quick Launch Pad"** para artefactos del sistema:

| Categoría | Acción Contextual | Icono |
|-----------|-------------------|-------|
| **Flows** | ▶️ Execute Flow | Play |
| **Projects** | 🎨 Open in Canvas | Eye |
| **Forms** | 📝 Preview Form | FileCode |
| **Templates** | 📋 Clone Template | Copy |
| **Configs** | ⚙️ Edit Config | Settings |

### 2.2 Valor Agregado
1. **Acciones Rápidas:** Click derecho → menú contextual
2. **Búsqueda Inteligente:** Filtro difuso por nombre/tipo
3. **Metadata Display:** Mostrar `lastUpdated`, `indraType`, etc.
4. **Integration Bridge:** Conectar con MethodInvoker para ejecutar flows

---

## 3. Plan de Implementación

### Fase 1: Fix Inmediato (5 min)
```javascript
// src/components/SystemRegistry.jsx - líneas 27 y 36

// ANTES:
const indraFlows = await Neutron.callCore('PublicAPI', 'scanArtifacts', flowsFolderId);

// DESPUÉS:
const indraFlows = await Neutron.callCore('PublicAPI', 'scanArtifacts', { 
    folderId: flowsFolderId 
});
```

### Fase 2: Agregar Acciones Contextuales (30 min)
```javascript
const getContextActions = (item, category) => {
    switch (category) {
        case 'flows':
            return [
                { label: '▶️ Execute', action: () => executeFlow(item) },
                { label: '📋 View Details', action: () => setSelectedItem(item) }
            ];
        case 'templates':
            return [
                { label: '📋 Clone', action: () => cloneTemplate(item) },
                { label: '👁️ Preview', action: () => previewTemplate(item) }
            ];
        case 'configs':
            return [
                { label: '⚙️ Edit', action: () => editConfig(item) },
                { label: '🔄 Reset', action: () => resetConfig(item) }
            ];
        default:
            return [];
    }
};
```

### Fase 3: Integración con MethodInvoker (1 hora)
```javascript
const executeFlow = async (flowArtifact) => {
    // 1. Cargar el flow desde Drive
    const flowContent = await Neutron.callCore('IndraAdapter', 'loadArtifact', {
        fileId: flowArtifact.id
    });
    
    // 2. Navegar a MethodInvoker con el flow pre-cargado
    navigate('/invoker', {
        state: {
            executor: 'PublicAPI',
            method: 'processNextJobInQueue',
            prefilledData: {
                flowId: flowArtifact.id,
                flowName: flowArtifact.name
            }
        }
    });
};
```

---

## 4. Arquitectura Actualizada

### 4.1 Flujo de Datos
```
User Action (SystemRegistry)
    ↓
Context Menu → Execute Flow
    ↓
Load Artifact (IndraAdapter)
    ↓
Navigate to MethodInvoker
    ↓
Pre-fill Form with Flow Data
    ↓
User Clicks "Execute"
    ↓
PublicAPI.processNextJobInQueue
```

### 4.2 Separación de Responsabilidades

| Componente | Responsabilidad |
|------------|-----------------|
| **IndraAdapter** | Sensing, Clasificación, Validación |
| **SystemRegistry** | UI, Acciones Contextuales, Quick Launch |
| **MethodInvoker** | Ejecución de Métodos, Form Generation |
| **Neutron** | Comunicación HTTP, Protocol Layer |

---

## 5. Beneficios de la Refactorización

### 5.1 Axiomático
- ✅ **Single Responsibility:** Cada componente tiene un dharma claro
- ✅ **No Redundancia:** SystemRegistry agrega valor con acciones
- ✅ **Composabilidad:** Los componentes se integran sin duplicar lógica

### 5.2 UX
- ✅ **Eficiencia:** Ejecutar flows en 2 clicks en lugar de 5
- ✅ **Descubrimiento:** Ver qué artefactos están disponibles
- ✅ **Contexto:** Acciones relevantes según el tipo de artefacto

### 5.3 Mantenibilidad
- ✅ **Menos Código:** Eliminar lógica duplicada
- ✅ **Más Claro:** Cada componente tiene un propósito obvio
- ✅ **Extensible:** Fácil agregar nuevos tipos de artefactos

---

## 6. Checklist de Implementación

### Inmediato (Fix del Bug)
- [ ] Corregir llamadas a `scanArtifacts` en líneas 27 y 36
- [ ] Probar que el Registry carga correctamente

### Corto Plazo (Acciones Contextuales)
- [ ] Implementar menú contextual con click derecho
- [ ] Agregar acción "Execute Flow" para flows
- [ ] Agregar acción "Preview" para templates

### Mediano Plazo (Integración)
- [ ] Conectar SystemRegistry con MethodInvoker
- [ ] Implementar navegación con estado pre-cargado
- [ ] Agregar breadcrumbs para tracking de flujo

### Largo Plazo (Optimización)
- [ ] Caché inteligente de artefactos
- [ ] Búsqueda difusa con Fuse.js
- [ ] Drag & Drop para organizar artefactos

---

## 7. Decisión Final

### ¿Mantener SystemRegistry?
**SÍ**, pero con un dharma redefinido:

**ANTES:**
```
SystemRegistry = "Explorador de Archivos Genérico"
```

**DESPUÉS:**
```
SystemRegistry = "Artifact Launcher + Quick Actions Hub"
```

### Justificación
1. **Skeleton Console necesita un punto de entrada visual** para artefactos
2. **IndraAdapter es backend** (sensing/clasificación), **SystemRegistry es frontend** (acciones/UI)
3. **La redundancia se elimina** al agregar acciones contextuales que IndraAdapter NO provee

---

**Próximo Paso:** Implementar el fix inmediato y luego decidir si avanzar con las acciones contextuales.
