# ADR-009: Separación Radical de Responsabilidades (Renderer Node vs. Eidos)

> **Fecha:** 2026-01-04  
> **Estado:** ACEPTADO (Crítico - Rediseño Arquitectónico)  
> **Autores:** Equipo INDRA OS  
> **Contexto:** Refactorización post-implementación de Nodos Interactivos V6.0

---

## 📋 RESUMEN EJECUTIVO

**Decisión:** Eidos NO renderiza nodos del grafo. Eidos es EXCLUSIVAMENTE un runtime de formularios `.layout`. TODO el diseño visual (PDFs y Formularios) se realiza dentro del **Renderer Node**, un nodo especializado con un canvas interno tipo Figma que se abre con doble-click.

**Impacto:** Refactorización completa de 5 documentos de nivel 1, eliminación de conceptos contradictorios sobre "Eidos como panel de diseño", y clarificación radical de la arquitectura del sistema.

---

## 🔴 CONTEXTO: EL PROBLEMA DETECTADO

### Situación Inicial (2026-01-04, 20:00 hrs)

Durante la implementación del sistema de **Nodos Interactivos V6.0**, se detectó una **inconsistencia arquitectónica fundamental** en la conceptualización de los paneles de INDRA OS.

**Síntomas:**
1. Documentación contradictoria sobre qué se renderiza en Eidos
2. Confusión sobre si "todos los nodos" o "solo el Renderer" aparecen en Eidos
3. Referencias mezcladas a "diseño en Eidos" vs "diseño en Renderer Node"
4. Ambigüedad sobre el propósito de Eidos (¿INPUT Layer? ¿OUTPUT Layer? ¿Ambos?)

### La Conversación Crítica

**Usuario (Step 2187):**
> "el eidos es INUTIL, nunca debio haberse conceptualizado asi, porque le eidos no debe renderizar nodos, unicamente debe renderizar diagramaciones con entrada de datos (formularios interactivos)"

**Revelación Arquitectónica:**
El usuario identificó que Eidos tenía **dos personalidades contradictorias**:
- **INPUT Layer:** Formularios interactivos (propósito original)
- **OUTPUT Layer:** Renderizado de PDFs/documentos (invasión conceptual)

Esta dualidad violaba el **Principio de ÚNICA Responsabilidad** y generaba confusión en la documentación.

---

## 💡 ANÁLISIS DEL DILEMA

### Pregunta Fundamental
**¿Dónde se diseña visualmente el contenido en INDRA OS?**

**Respuestas Incorrectas Previas:**
1. ❌ "En Eidos, que tiene controles de diseño (grids, fonts, colors)"
2. ❌ "En Reality, con StylePanel contextual"
3. ❌ "En ambos, dependiendo del tipo de contenido"

**Respuesta Correcta Descubierta:**
✅ **ÚNICAMENTE dentro del canvas interno del Renderer Node**, que funciona como un motor de diseño tipo Figma embebido.

### La Analogía Reveladora (Step 2190)

**Usuario:**
> "claro que si los peudo ver el nodo renderer es como un figam con un leinzo 2d porque carajos no podria ver ocmo se va a renderizar? acaso en figma tuno modelas el puto frame? acaso no diagramas? para que necesitas un previsualizador si el mismo previsualizador es el momenot mismo de diagramar."

**Insight Clave:** 
En Figma, no hay "modo diseño" vs "modo preview". **Diseñas MIENTRAS ves el resultado**. El Renderer Node debe funcionar igual: al abrirlo (doble-click), ves un canvas WYSIWYG donde diseñas y simultáneamente visualizas el output final con datos reales.

---

## 🎯 DECISIÓN ARQUITECTÓNICA

### Arquitectura Final Adoptada

#### 1. REALITY (Graph Editor)
**Responsabilidad:** Orquestación de flujo lógico

**Contiene DOS tipos de nodos:**

**A. Nodos de Lógica/Procesamiento**
- notionAdapter, driveAdapter, errorHandler, flowRegistry, configurator
- Apariencia: Cajas con campos editables y puertos
- Interacción: Click para seleccionar, editar campos
- **NO se "abren" en ningún modo especial**

**B. Renderer Node (Único y Especial)**
- Apariencia en canvas: Caja normal con puertos
- Interacción especial: **Doble-click → Abre canvas interno tipo Figma**
- Dentro del canvas:
  - Sistema de capas jerárquico
  - Herramientas: Text, Input, Shape, Image, Table
  - Auto-layout engine
  - Data binding (`{{expression}}`)
  - Reglas milimétricas, guías magnéticas
  - Paginación automática
  - **Preview en vivo con datos reales**

#### 2. EIDOS (Live Preview)
**Responsabilidad:** EXCLUSIVAMENTE runtime de formularios

**Estado por defecto:** Vacío

**Se activa SOLO cuando:**
Usuario hace click en un archivo `.layout` del Source Explorer

**Lo que hace:**
- Renderiza el formulario diseñado en el Renderer Node
- Permite interacción real (llenar campos, seleccionar, etc.)
- Captura datos → Amnesia → Alimentan el flujo en Reality

**Lo que NO hace:**
- ❌ NO diseña formularios
- ❌ NO renderiza PDFs generados
- ❌ NO muestra nodos del grafo
- ❌ NO tiene controles de diseño (grids, fonts, colors)

#### 3. RENDERER NODE - Capacidad Dual

**Modo 1: Diseño de Formularios (INPUT Layer)**
```
1. Usuario abre Renderer Node (doble-click)
2. Diseña formulario "RegistroCliente"
   - Input (Nombre)
   - Input (Email)
   - Select (País)
   - Button (Enviar)
3. Guarda como "RegistroCliente.layout"
4. Aparece en Source Explorer
5. Usuario hace click en "RegistroCliente.layout"
   ↓
6. EIDOS se activa mostrando el formulario
7. Usuario llena datos → Capturados en Amnesia
```

**Modo 2: Diseño de Documentos (OUTPUT Layer)**
```
1. Usuario abre Renderer Node (doble-click)
2. Diseña PDF "Factura"
   - Header con logo
   - Sección de cliente: {{clientData.name}}
   - Tabla de items: {{invoiceItems}}
   - Footer con total
3. Click "Export PDF"
   ↓
4. PDF generado con datos reales → Drive
5. Eidos NO participa en este proceso
```

---

## 📐 REGLAS DE ORO ESTABLECIDAS

### Regla #1: Monopolio del Diseño Visual
**TODO el diseño visual** (grids, flexbox, fonts, colors, spacing, paginación) vive **ÚNICAMENTE** dentro del canvas del Renderer Node.

- Reality NO tiene lógica de diseño gráfico
- Eidos NO diseña; solo ejecuta formularios ya diseñados
- StylePanel queda obsoleto (o se mueve dentro del Renderer canvas)

### Regla #2: Eidos es Puro Runtime
Eidos es como un "navegador" que **interpreta** archivos `.layout` ya diseñados.

### Regla #3: Renderer es WYSIWYG Total
Dentro del Renderer, **lo que ves es lo que obtienes**. No hay "modo preview" separado porque el diseño YA ES el preview.

---

## 🔄 CONSECUENCIAS Y CAMBIOS APLICADOS

### Documentación Refactorizada

**Archivos Modificados (2026-01-04):**

1. **logica_fundacional.md**
   - Axioma 6 reescrito completamente
   - Eliminadas referencias a "Eidos renderiza nodos"
   - Añadido flujo de trabajo detallado del Renderer

2. **ux_interaction_spec.md**
   - Panel 3 redefinido: "Runtime de Formularios"
   - Añadido caso de uso completo: "Modelar un PDF de Factura"
   - Sección "Lo Que Eidos NO Hace" añadida
   - Eliminadas 3 subsecciones obsoletas sobre diseño en Eidos

3. **system_structure.spec.md**
   - Añadido componente: `RendererCanvas.jsx`
   - Eidos redefinido: "RUNTIME" (antes "ESPEJO")
   - Eliminado: `AutoLayout.js`, `StylePanel.jsx` de live-preview/

4. **contratos_tecnicos.md**
   - Sección 3.1 renombrada: "Renderer Canvas Engine" (antes "Eidos Engine")
   - Aclaración añadida: límites aplican al canvas del Renderer, no a Eidos

5. **blueprint.md**
   - (Pendiente actualización menor)

### Componentes a Implementar

**Nuevos:**
- `RendererCanvas.jsx` - Canvas tipo Figma con sistema de capas
- `LayerEditor.jsx` - Panel de jerarquía de capas
- `DataBinder.js` - Motor de resolución de `{{expressions}}`
- `FormRenderer.js` - Intérprete de `.layout` para Eidos

**Obsoletos/Movidos:**
- `StylePanel.jsx` → Se integra dentro de RendererCanvas
- `AutoLayout.js` → Se integra dentro de RendererCanvas

---

## 🎓 LECCIONES APRENDIDAS

### 1. El Peligro de la Ambigüedad Conceptual

**Problema:** Usar términos vagos como "renderiza" sin especificar exactamente QUÉ se renderiza y DÓNDE.

**Solución:** Definiciones ultra-precisas:
- "Eidos ejecuta formularios `.layout`"
- "Renderer Node contiene un canvas de diseño"
- "Reality orquesta flujo lógico"

### 2. La Importancia de la Analogía Correcta

**Analogía Incorrecta Anterior:**
"Eidos es como un panel de preview de Figma"
→ Implica que hay un "modo diseño" en otro lado

**Analogía Correcta Adoptada:**
"Renderer Node ES Figma. Eidos es un navegador."
→ Clarifica que diseño y preview son lo mismo dentro del Renderer

### 3. El Valor de la Conversación Socrática

El usuario NO dio la solución directamente. Hizo preguntas retóricas:
> "acaso en figma tuno modelas el puto frame?"

Esto forzó el replanteamiento radical de la arquitectura, más efectivo que un documento de requerimientos.

### 4. Documentación como Contrato Vivo

Los 5 documentos de nivel 1 NO eran "documentación histórica". Eran **contratos activos** que definían la realidad del sistema. La inconsistencia en ellos generaba bugs conceptuales antes de escribir código.

---

## ⚠️ RIESGOS Y MITIGACIÓN

### Riesgo 1: Complejidad del Renderer Node
**Descripción:** El Renderer Node ahora es un **mini-Figma completo**. Esto es técnicamente complejo.

**Mitigación:**
- Implementación incremental: Empezar con componentes básicos (Text, Input)
- Reutilizar bibliotecas existentes (fabric.js, konva.js para canvas)
- Documentar exhaustivamente en `contrato_renderer.md`

### Riesgo 2: Confusión de Usuarios Nuevos
**Descripción:** Usuarios podrían no entender por qué Eidos está "vacío" al inicio.

**Mitigación:**
- Placeholder en Eidos: "Selecciona un formulario .layout en el Source Explorer"
- Tutorial interactivo que guía: Crear Renderer → Diseñar formulario → Ejecutar en Eidos

### Riesgo 3: Migración de Código Antiguo
**Descripción:** Si había código que asumía que Eidos renderiza nodos, debe refactorizarse.

**Mitigación:**
- Auditoría de código: `grep -r "Eidos.*render" src/`
- Plan de migración documentado

---

## 📊 ANTES vs DESPUÉS

### Arquitectura Antigua (Incorrecta)

```
Reality: [Nodos de lógica] + [Renderer Node]
          ↓
Eidos: Renderiza todos los nodos (?)
       + Diseña formularios (?)
       + Muestra PDFs (?)
       
🔴 Problema: Eidos tiene 3 responsabilidades contradictorias
```

### Arquitectura Nueva (Correcta)

```
Reality: 
  - [Nodos de lógica] (cajas simples)
  - [Renderer Node] → Doble-click → Canvas Figma interno
                      → Diseña formularios
                      → Diseña PDFs
                      
Source Explorer:
  - Muestra archivos .layout guardados

Eidos: 
  - Vacío por defecto
  - Click en .layout → Ejecuta formulario
  - Captura datos → Amnesia
  
✅ Cada componente tiene UNA responsabilidad clara
```

---

## 🔮 FUTURO Y EVOLUCIÓN

### Próximos Pasos Inmediatos

1. **Implementar RendererCanvas.jsx**
   - Canvas básico con drag & drop de componentes
   - Sistema de capas simple

2. **Actualizar Discovery.js**
   - Blueprint del Renderer Node con campos especiales
   - Definir estructura de `.layout`

3. **Crear contrato_renderer.md**
   - Axiomas del canvas interno
   - Protocolo de data binding
   - Algoritmos de auto-layout

### Evolución a Largo Plazo

**Versión 2.0 (Futuro):**
- Templates de Renderer preconstruidos
- Marketplace de componentes para el Renderer
- Renderer colaborativo (múltiples usuarios diseñando)

---

## ✅ APROBACIÓN Y CIERRE

**Estado:** ACEPTADO - Implementación Obligatoria

**Firma Axiomática:** Este ADR reemplaza cualquier documentación anterior que contradiga estas definiciones. Es ahora la **fuente única de verdad** sobre la arquitectura de presentación de INDRA OS.

**Fecha de Cierre:** 2026-01-04 20:51 hrs

---

## 📚 REFERENCIAS

- ADR-001: Principios Axiomáticos SUH
- ADR-004: Estándar Milimétrico Thorne
- ADR-005: Arquitectura de Perspectivas Sinestésicas
- `logica_fundacional.md` (Axioma 6)
- `ux_interaction_spec.md` (Secciones 2.2, 3.1-3.3)

---

**Epílogo:** Este ADR documenta uno de los momentos más críticos en la evolución de INDRA OS. La claridad arquitectónica alcanzada no vino de más planificación inicial, sino de la valentía de **cuestionar y rediseñar** cuando la inconsistencia se hizo evidente. Esta es la esencia del diseño iterativo riguroso.

*Fin del ADR-009 - Sellado como Ley Arquitectónica*
