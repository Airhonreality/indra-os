# PILAR 1: SKINS/TEMPLATES - SUB-HOJA DE RUTA DETALLADA
> **Objetivo:** Definir la Capa de Usabilidad de INDRA OS
> **Duración Estimada:** 2-3 días
> **Estado:** En Progreso

---

## VISIÓN DEL PILAR 1

**Problema a resolver:**
"¿Cómo convertimos datos abstractos (Notion/Airtable) en interfaces visuales usables sin que el usuario necesite un manual de 500 páginas?"

**Solución:**
Un sistema de **Skins Inteligentes** que infiere automáticamente cómo mostrar los datos basándose en su perfil relacional (Yoneda).

---

## TAREA 1.1: DEFINIR CATÁLOGO DE 10 SKINS NATIVOS

### Objetivo
Establecer los 10 skins que INDRA renderizará nativamente en la Fase 1 (MVP).

### Criterios de Selección
Un skin se incluye si:
1. Resuelve un caso de uso empresarial común (>70% de usuarios)
2. No requiere lógica de negocio compleja
3. Puede renderizarse a 60 FPS con 1000+ registros

### Los 10 Skins Nativos

#### CATEGORÍA A: VISUALIZACIÓN DE DATOS

**1. TABLA (DataTable)**
- **Caso de Uso:** Mostrar registros estructurados
- **Compatibilidad:** Cualquier dataset con >2 campos
- **Capacidades:** Ordenar, filtrar, paginar
- **Límites:** No edición inline de fórmulas

**2. TARJETAS (CardGrid)**
- **Caso de Uso:** Mostrar entidades con imagen + texto
- **Compatibilidad:** Datasets con campo de imagen
- **Capacidades:** Vista grid/list, filtros visuales
- **Límites:** No diseño gráfico avanzado

**3. TIMELINE (EventTimeline)**
- **Caso de Uso:** Mostrar eventos en el tiempo
- **Compatibilidad:** Datasets con campo de fecha
- **Capacidades:** Zoom temporal, agrupación
- **Límites:** No edición de video

#### CATEGORÍA B: INTERACCIÓN

**4. FORMULARIO (DataForm)**
- **Caso de Uso:** Capturar inputs del usuario
- **Compatibilidad:** Cualquier esquema
- **Capacidades:** Validación básica, campos condicionales
- **Límites:** No validaciones complejas de negocio

**5. KANBAN (TaskBoard)**
- **Caso de Uso:** Gestión de tareas/estados
- **Compatibilidad:** Datasets con campo enum de estado
- **Capacidades:** Drag-and-drop, swimlanes
- **Límites:** No automatizaciones complejas

#### CATEGORÍA C: ANÁLISIS

**6. MAPA DE CALOR (HeatMap)**
- **Caso de Uso:** Visualizar densidad de datos
- **Compatibilidad:** Datasets con coordenadas o categorías
- **Capacidades:** Gradientes de color, zoom
- **Límites:** No análisis estadístico profundo

**7. GRAFO DE RELACIONES (RelationGraph)**
- **Caso de Uso:** Mostrar conexiones entre entidades
- **Compatibilidad:** Datasets con relaciones
- **Capacidades:** Layout automático, filtros
- **Límites:** No simulación física

**8. DASHBOARD (MetricsDashboard)**
- **Caso de Uso:** KPIs y métricas clave
- **Compatibilidad:** Datasets con campos numéricos
- **Capacidades:** Gráficos simples, agregaciones
- **Límites:** No análisis predictivo

#### CATEGORÍA D: DOCUMENTOS

**9. PDF PROFESIONAL (PDFTemplate)**
- **Caso de Uso:** Generar documentos formales
- **Compatibilidad:** Cualquier dataset
- **Capacidades:** Templates predefinidos, logos
- **Límites:** No diseño desde cero

**10. EMAIL DINÁMICO (EmailTemplate)**
- **Caso de Uso:** Enviar comunicaciones personalizadas
- **Compatibilidad:** Datasets con campo de email
- **Capacidades:** Variables dinámicas, adjuntos
- **Límites:** No campañas masivas (eso es Mailchimp)

### Entregable
- `docs/tecnica/skin_library_catalog.md` (Catálogo completo con ejemplos)

---

## TAREA 1.2: ESPECIFICAR MOTOR DE INFERENCIA DE SKINS

### Objetivo
Diseñar el algoritmo que sugiere automáticamente los 3 skins más relevantes para un dataset.

### Algoritmo de Inferencia

```javascript
class SkinInferenceEngine {
  inferSkins(dataProfile) {
    const candidates = SKIN_LIBRARY.filter(skin => 
      skin.isCompatible(dataProfile)
    );
    
    const scored = candidates.map(skin => ({
      skin: skin,
      score: this.calculateRelevance(skin, dataProfile)
    }));
    
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.skin);
  }
  
  calculateRelevance(skin, profile) {
    let score = 0;
    
    // Factor 1: Tipo de datos (40%)
    if (skin.preferredTypes.includes(profile.primaryType)) {
      score += 0.4;
    }
    
    // Factor 2: Relaciones (30%)
    if (skin.requiresRelations && profile.hasRelations) {
      score += 0.3;
    }
    
    // Factor 3: Volumen de datos (20%)
    if (profile.recordCount >= skin.minRecords && 
        profile.recordCount <= skin.maxRecords) {
      score += 0.2;
    }
    
    // Factor 4: Campos especiales (10%)
    if (profile.hasImages && skin.supportsImages) {
      score += 0.1;
    }
    
    return score;
  }
}
```

### Perfil de Datos (Data Profile)

```typescript
interface DataProfile {
  recordCount: number;
  primaryType: 'TEXT' | 'NUMBER' | 'DATE' | 'RELATION';
  hasImages: boolean;
  hasRelations: boolean;
  hasGeolocation: boolean;
  hasEnum: boolean;
  fieldCount: number;
  relationTargets: string[];
}
```

### Entregable
- `docs/tecnica/skin_engine_specification.md` (Algoritmo completo con tests)

---

## TAREA 1.3: DISEÑAR FORMATO CANÓNICO DE LAYOUT (.layout.json)

### Objetivo
Definir el esquema JSON que representa cualquier diseño visual en INDRA.

### Esquema del Layout

```json
{
  "$schema": "https://indra.os/schemas/layout.v1.json",
  "id": "invoice_professional_v1",
  "name": "Factura Profesional",
  "type": "DOCUMENT",
  "metadata": {
    "author": "user@example.com",
    "created": "2026-01-02T20:00:00Z",
    "version": "1.0.0",
    "tags": ["invoice", "pdf", "professional"]
  },
  "canvas": {
    "width": 210,
    "height": 297,
    "units": "mm",
    "dpi": 96
  },
  "slots": [
    {
      "id": "slot_logo",
      "type": "IMAGE",
      "position": { "x": 10, "y": 10 },
      "size": { "w": 50, "h": 20 },
      "style": {
        "objectFit": "contain"
      },
      "binding": {
        "source": "STATIC",
        "value": "https://drive.google.com/logo.png"
      }
    },
    {
      "id": "slot_client_name",
      "type": "TEXT",
      "position": { "x": 10, "y": 40 },
      "size": { "w": 100, "h": 10 },
      "style": {
        "fontSize": 16,
        "fontWeight": "bold",
        "color": "#000000"
      },
      "binding": {
        "source": "DYNAMIC",
        "path": "$.cliente.nombre",
        "filter": null,
        "transform": "uppercase"
      }
    },
    {
      "id": "slot_products_table",
      "type": "TABLE",
      "position": { "x": 10, "y": 80 },
      "size": { "w": 190, "h": 150 },
      "style": {
        "borderWidth": 1,
        "borderColor": "#CCCCCC"
      },
      "binding": {
        "source": "DYNAMIC",
        "path": "$.productos",
        "filter": {
          "type": "EXPRESSION",
          "value": "item.stock > 0"
        }
      },
      "columns": [
        { "field": "nombre", "header": "Producto", "width": 100 },
        { "field": "precio", "header": "Precio", "width": 45, "format": "currency" },
        { "field": "cantidad", "header": "Cant.", "width": 45 }
      ]
    }
  ],
  "variables": {
    "company_color": "#0066CC",
    "font_family": "Arial, sans-serif"
  }
}
```

### Tipos de Slots Soportados

| Tipo | Descripción | Binding |
|------|-------------|---------|
| TEXT | Texto simple o formateado | STATIC, DYNAMIC |
| IMAGE | Imagen desde URL o base64 | STATIC, DYNAMIC |
| TABLE | Tabla de datos | DYNAMIC (array) |
| CHART | Gráfico simple (bar, line, pie) | DYNAMIC (array) |
| SHAPE | Rectángulo, círculo, línea | STATIC |
| CONTAINER | Agrupación de otros slots | - |

### Entregable
- `docs/tecnica/layout_json_schema.md` (Esquema completo con validación)

---

## TAREA 1.4: CREAR BIBLIOTECA DE COMPONENTES VISUALES

### Objetivo
Implementar los componentes React que renderizan cada tipo de slot.

### Arquitectura de Componentes

```
/src/crust/skins
  /renderers
    TextSlotRenderer.tsx
    ImageSlotRenderer.tsx
    TableSlotRenderer.tsx
    ChartSlotRenderer.tsx
  /skins
    DataTableSkin.tsx
    CardGridSkin.tsx
    TimelineSkin.tsx
    DataFormSkin.tsx
    KanbanSkin.tsx
    HeatMapSkin.tsx
    RelationGraphSkin.tsx
    DashboardSkin.tsx
    PDFTemplateSkin.tsx
    EmailTemplateSkin.tsx
  SkinEngine.ts
  SkinRegistry.ts
```

### Ejemplo de Implementación

```typescript
// TextSlotRenderer.tsx
interface TextSlotProps {
  slot: LayoutSlot;
  data: any;
}

export const TextSlotRenderer: React.FC<TextSlotProps> = ({ slot, data }) => {
  const value = resolveBinding(slot.binding, data);
  const transformed = applyTransform(value, slot.binding.transform);
  
  return (
    <div
      style={{
        position: 'absolute',
        left: slot.position.x,
        top: slot.position.y,
        width: slot.size.w,
        height: slot.size.h,
        fontSize: slot.style.fontSize,
        fontWeight: slot.style.fontWeight,
        color: slot.style.color
      }}
    >
      {transformed}
    </div>
  );
};
```

### Entregable
- Código fuente de los 10 skins + renderers de slots

---

## TAREA 1.5: DOCUMENTAR SKIN ENGINE SPECIFICATION

### Objetivo
Crear la documentación técnica completa del motor de skins.

### Contenido del Documento

1. **Introducción**
   - Qué es un Skin
   - Por qué usamos este enfoque

2. **Arquitectura**
   - Diagrama del flujo de datos
   - Relación con el Kernel

3. **API del Skin Engine**
   - `inferSkins(dataProfile): Skin[]`
   - `renderSkin(skinId, data, layout): ReactElement`

4. **Catálogo de Skins**
   - Descripción de cada skin
   - Casos de uso
   - Limitaciones

5. **Formato Layout.json**
   - Esquema completo
   - Ejemplos

6. **Guía de Extensión**
   - Cómo crear un skin personalizado
   - Cómo registrarlo

### Entregable
- `docs/tecnica/skin_engine_specification.md` (Documento completo)

---

## CRITERIOS DE COMPLETITUD DEL PILAR 1

El Pilar 1 se considera **completado** cuando:

1. ✅ Los 10 skins están definidos y documentados
2. ✅ El algoritmo de inferencia está especificado
3. ✅ El formato `.layout.json` está validado
4. ✅ Los componentes React están implementados (o especificados para el Builder)
5. ✅ La documentación técnica está completa
6. ✅ El Auditor ha validado la coherencia con los Axiomas SUH

---

## PRÓXIMA ACCIÓN

**Iniciar Tarea 1.1:** Definir Catálogo de 10 Skins Nativos

**¿Desea que proceda a generar el documento `skin_library_catalog.md` con el catálogo completo?**
