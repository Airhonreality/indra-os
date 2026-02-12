---
title: "SLOT NODE BLUEPRINT - V1.0"
date: "2026-02-06"
description: "Canonización del Artefacto de Proyección Multifacetica (SLOT_NODE)."
---

# SLOT_NODE: El Artefacto de Proyección
> *Axioma: "Un Slot no es una ventana, es un Cristal de Realidad con Múltiples Caras."*

Este documento define la ley canónica para el `SLOT_NODE`, el componente estructural que permite proyectar datos del Grafo aInterfaces de Usuario (Dashboards, Documentos, Formularios) de manera desacoplada.

---

## 1. Definición Conceptual
El `SLOT_NODE` es un **Contenedor de Vistas Soberanas**. 
No es un simple `iframe` o un `div` estático. Es un nodo inteligente capaz de contener múltiples "Perspectivas" (Pestañas/Vistas) alimentadas por una entrada de datos común pero renderizadas de forma independiente.

### Metáfora
Imagina un "Cuaderno Multi-materia" en una mesa:
- **La Entrada de Datos:** El bolígrafo y la tinta (Vienen del grafo).
- **El Slot:** El cuaderno físico.
- **Las Vistas:**
    - Hoja 1: Resumen Ejecutivo (Dashboard de KPI).
    - Hoja 2: Detalle de Facturación (Tabla detallada).
    - Hoja 3: PDF para Cliente (Documento Paginado A4).
Cada hoja usa la misma tinta (datos), pero la presenta diferente.

---

## 2. Capacidades Funcionales (The Capabilities)

El Slot expone puertos específicos en el Grafo paara su configuración dinámica.

### Entradas (Inputs)
1.  **DATA_STREAM:** [Doblaje Neuronal]
    - Recibe el JSON crudo de cualquier nodo conectado (Notion, Drive, SQL).
    - Puede recibir múltiples streams que se fusionan en un `Contexto de Datos`.
2.  **STYLE_DNA:** [Estética]
    - Recibe un nodo de "Paleta" o "Design Tokens" para aplicar branding automáticamente a todas las vistas internas.
3.  **CONTROL_SIGNAL:** [Automatización]
    - Recibe señales de trigger (ej: "Generar PDF ahora", "Actualizar Vista").

### Salidas (Outputs)
1.  **ARTIFACT_EXPORT:**
    - Emite el resultado binario de una vista (ej: el archivo PDF generado, el screenshot del dashboard).

---

## 3. Jerarquía Visual y Ergonomía (Sphere Attention Model)

El despliegue del Slot obedece a la **Ley de Atención** de la Sovereign Sphere.

### Estado 1: Representación Nodal (En el Graph Editor)
- Se ve como un "Nodo Contenedor" en el canvas infinito.
- Muestra indicadores de cuántas vistas activas tiene.
- Permite conectar cables de datos.

### Estado 2: Despliegue Soberano (Layout Mode)
- **Ocultamiento del Grafo:** Al entrar en el Slot (Doble Click o "Focus"), el Grafo desaparece.
- **Canvas de Diseño (Figma-like):** El Slot toma toda la pantalla.
    - **Barra de Vistas (Tabs):** Permite navegar entre "Dashboard Ventas", "Reporte PDF", etc.
    - **Panel de Herramientas Interno:** Herramientas de layout, tipografía, y mapeo de campos *específicas para esa vista*.
- **Aislamiento Semántico:** El usuario no ve "cables". Ve campos de dragging (e.g., "Precio Unitario") que puede soltar sobre el lienzo del documento.

---

## 4. Estructura de Datos y Multi-Origen (Sumidero Semántico)
- **Mapping Multiorigen:** El Slot permite conexiones ilimitadas de entrada. El sistema genera un `Context_Binding_Map` donde el usuario asigna visualmente qué campo de qué nodo alimenta cada componente del layout.
- **Bimodalidad de Renderizado:**
    - **Modo Proyección (HiFi):** Renderizado en tiempo real vía Browser (Chromium) para alta fidelidad visual.
    - **Modo Sombra (LoFi):** Ejecución en segundo plano (Core) para automatizaciones masivas sin UI.

## 5. El Nodo Compuesto (Herramientas como Puertos)
El Slot no tiene menús de configuración clásicos. Sus "Herramientas de Diseño" (Color, Tipografía) se comportan como puertos de entrada.
- **Entrada Local:** Valor fijo definido en el panel de herramientas del Slot.
- **Entrada Global:** Cable conectado desde un nodo `AXIOM` en el Grafo (ej: Marca corporativa). El puerto global siempre tiene prioridad sobre el local.

## 5. Casos de Uso Críticos

### A. Centralización Departamental
Un solo Slot ("Slot Ventas") contiene:
- Vista 1: Dashboard para Gerente (Gráficos).
- Vista 2: Formulario de Ingreso para Vendedores.
- Vista 3: Reporte PDF Mensual automátizado.
**Beneficio:** Reducción drástica de ruido visual en el Grafo (de 30 nodos a 1).

### B. Link Público (Externalización)
El usuario puede hacer click derecho en la "Vista 2" dentro del Slot -> "Generar Link Soberano".
- Indra genera una URL única.
- El destinatario entra y solo ve ESA vista, renderizada por el motor de Indra, alimentada en vivo por los cables del grafo (que el usuario externo no ve).

---

## 6. Siguientes Pasos de Implementación

1.  **Registrar Archetype:** Añadir `SLOT_NODE` al `Archetype_Registry.js`.
2.  **Engine Dual:** Crear `SlotEngine.jsx`.
    - Detectar si está en modo "Nodo" (pequeño) o "Proyección" (FullScreen).
3.  **Gestor de Vistas:** Implementar la lógica de tabs/pestañas dentro del objeto de datos del nodo.
